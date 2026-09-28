import {
  assembleT,
  buildField,
  FLOATS,
  program,
  STAR_FRAG,
  STAR_VERT,
  type LogoBox,
  type Rect4,
  type Sample,
} from "./logo-galaxy-core";

export type WorkerIn =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      dpr: number;
    }
  | { type: "resize"; width: number; height: number; dpr: number }
  | {
      type: "frame";
      now: number;
      journey: number;
      horizontal: boolean;
      logo: LogoBox;
      copy0: Rect4;
      copy1: Rect4;
      copy2: Rect4;
    }
  | { type: "samples"; samples: Sample[] }
  | { type: "pause"; paused: boolean }
  | { type: "destroy" };

let canvas: OffscreenCanvas | null = null;
let gl: WebGLRenderingContext | null = null;
let starProg: WebGLProgram | null = null;
let stars: WebGLBuffer | null = null;
let starLoc: {
  a0: number;
  a1: number;
  a2: number;
  a3: number;
  res: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  assemble: WebGLUniformLocation | null;
  spin: WebGLUniformLocation | null;
  dpr: WebGLUniformLocation | null;
  horizontal: WebGLUniformLocation | null;
  logo: WebGLUniformLocation | null;
  center: WebGLUniformLocation | null;
  maxSize: WebGLUniformLocation | null;
  copy0: WebGLUniformLocation | null;
  copy1: WebGLUniformLocation | null;
  copy2: WebGLUniformLocation | null;
} | null = null;
let samples: Sample[] = [];
let cssW = 0;
let cssH = 0;
let dpr = 1;
let starCount = 0;
let maxPointSize = 28;
let attribsBound = false;
let paused = false;
let start = 0;

function uploadStars() {
  if (!gl || !stars || !cssW) return;
  const field = buildField(samples, cssW, 90210 + Math.round(cssW));
  starCount = field.count;
  gl.bindBuffer(gl.ARRAY_BUFFER, stars);
  gl.bufferData(gl.ARRAY_BUFFER, field.data, gl.STATIC_DRAW);
  attribsBound = false;
}

function fit(width: number, height: number, nextDpr: number) {
  if (!canvas || !gl) return;
  if (width === cssW && height === cssH && nextDpr === dpr) return;
  cssW = width;
  cssH = height;
  dpr = nextDpr;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  uploadStars();
}

function render(
  now: number,
  journey: number,
  horizontal: boolean,
  logo: LogoBox,
  copy0: Rect4,
  copy1: Rect4,
  copy2: Rect4,
) {
  if (!gl || !starProg || !starLoc || !stars || !starCount || paused) return;
  const time = (now - start) / 1000;
  const assemble = assembleT(journey);
  const cx = horizontal ? 0.64 : 0.5;
  const cy = 0.48;
  gl.viewport(0, 0, canvas!.width, canvas!.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.useProgram(starProg);
  gl.bindBuffer(gl.ARRAY_BUFFER, stars);
  const stride = FLOATS * 4;
  if (!attribsBound) {
    const bind = (loc: number, offset: number) => {
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, 4, gl!.FLOAT, false, stride, offset * 4);
    };
    bind(starLoc.a0, 0);
    bind(starLoc.a1, 4);
    bind(starLoc.a2, 8);
    bind(starLoc.a3, 12);
    attribsBound = true;
  }
  gl.uniform2f(starLoc.res, cssW, cssH);
  gl.uniform1f(starLoc.time, time);
  gl.uniform1f(starLoc.assemble, assemble);
  gl.uniform1f(starLoc.spin, time * 0.045);
  gl.uniform1f(starLoc.dpr, dpr);
  gl.uniform1f(starLoc.horizontal, horizontal ? 1 : 0);
  gl.uniform4f(starLoc.logo, logo.x, logo.y, logo.size, 1);
  gl.uniform2f(starLoc.center, cx, cy);
  gl.uniform1f(starLoc.maxSize, maxPointSize);
  gl.uniform4f(starLoc.copy0, copy0[0], copy0[1], copy0[2], copy0[3]);
  gl.uniform4f(starLoc.copy1, copy1[0], copy1[1], copy1[2], copy1[3]);
  gl.uniform4f(starLoc.copy2, copy2[0], copy2[1], copy2[2], copy2[3]);
  gl.drawArrays(gl.POINTS, 0, starCount);
}

function init(offscreen: OffscreenCanvas, width: number, height: number, nextDpr: number) {
  canvas = offscreen;
  gl = offscreen.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  }) as WebGLRenderingContext | null;
  if (!gl) {
    postMessage({ type: "ready", ok: false });
    return;
  }
  const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as
    | Float32Array
    | number[];
  maxPointSize = Math.min(28, range?.[1] || 24);
  starProg = program(gl, STAR_VERT, STAR_FRAG);
  stars = gl.createBuffer();
  starLoc =
    starProg && gl
      ? {
          a0: gl.getAttribLocation(starProg, "a0"),
          a1: gl.getAttribLocation(starProg, "a1"),
          a2: gl.getAttribLocation(starProg, "a2"),
          a3: gl.getAttribLocation(starProg, "a3"),
          res: gl.getUniformLocation(starProg, "u_res"),
          time: gl.getUniformLocation(starProg, "u_time"),
          assemble: gl.getUniformLocation(starProg, "u_assemble"),
          spin: gl.getUniformLocation(starProg, "u_spin"),
          dpr: gl.getUniformLocation(starProg, "u_dpr"),
          horizontal: gl.getUniformLocation(starProg, "u_horizontal"),
          logo: gl.getUniformLocation(starProg, "u_logo"),
          center: gl.getUniformLocation(starProg, "u_center"),
          maxSize: gl.getUniformLocation(starProg, "u_maxSize"),
          copy0: gl.getUniformLocation(starProg, "u_copy0"),
          copy1: gl.getUniformLocation(starProg, "u_copy1"),
          copy2: gl.getUniformLocation(starProg, "u_copy2"),
        }
      : null;
  start = performance.now();
  fit(width, height, nextDpr);
  postMessage({ type: "ready", ok: Boolean(starProg && stars && starLoc) });
}

addEventListener("message", (event: MessageEvent<WorkerIn>) => {
  const msg = event.data;
  if (msg.type === "init") {
    init(msg.canvas, msg.width, msg.height, msg.dpr);
    return;
  }
  if (msg.type === "resize") {
    fit(msg.width, msg.height, msg.dpr);
    return;
  }
  if (msg.type === "samples") {
    samples = msg.samples;
    uploadStars();
    return;
  }
  if (msg.type === "pause") {
    paused = msg.paused;
    return;
  }
  if (msg.type === "destroy") {
    if (gl) {
      if (stars) gl.deleteBuffer(stars);
      if (starProg) gl.deleteProgram(starProg);
    }
    canvas = null;
    gl = null;
    close();
    return;
  }
  if (msg.type === "frame") {
    render(
      msg.now,
      msg.journey,
      msg.horizontal,
      msg.logo,
      msg.copy0,
      msg.copy1,
      msg.copy2,
    );
  }
});
