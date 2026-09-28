import { precomputedLogoSamples } from "@/lib/logo-mark-samples";

type Sample = { u: number; v: number; lum: number; kind: 0 | 1 };

let cachedSamples: Sample[] | null = null;
function logoSamples(): Sample[] {
  if (!cachedSamples) cachedSamples = precomputedLogoSamples();
  return cachedSamples;
}

export type LogoGalaxy = {
  draw: (journey: number, horizontal: boolean) => void;
  setReduced: (reduced: boolean) => void;
  setPaused: (paused: boolean) => void;
  resize: () => void;
  destroy: () => void;
};

const FLOATS = 16;

const STAR_VERT = `
attribute vec4 a0;
attribute vec4 a1;
attribute vec4 a2;
attribute vec4 a3;
uniform vec2 u_res;
uniform float u_time;
uniform float u_assemble;
uniform float u_spin;
uniform float u_dpr;
uniform float u_horizontal;
uniform vec4 u_logo;
uniform vec2 u_center;
uniform float u_maxSize;
varying vec3 v_color;
varying float v_alpha;

void main() {
  float theta = a0.x;
  float radius = a0.y;
  float depth = a0.z;
  float size = a0.w;
  vec2 logoUV = a1.xy;
  float bright = a1.z;
  float delay = a1.w;
  vec3 color = a2.xyz;
  float twinkle = a2.w;
  float layer = a3.x;
  float pull = a3.y;

  float t = clamp((u_assemble - delay) / max(0.18, 1.0 - delay), 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  float layerPull = pull * t;
  float farKeep = 1.0 - smoothstep(0.7, 1.0, layer);
  float spin = u_spin * mix(0.15, 1.0, layer) * (1.0 - t * 0.85);
  float swirl = (1.0 - t) * (0.35 + depth * 0.4);
  float ang = theta + spin + swirl;
  float maxR = length(u_res) * 0.5;
  vec2 origin = u_center * u_res;
  vec2 spiral = origin + vec2(cos(ang), sin(ang) * 0.86) * radius * maxR * mix(0.92, 1.18, depth);
  vec2 far = vec2(a3.z, a3.w) * u_res;
  far += vec2(
    sin(u_time * 0.017 + theta) * 6.0,
    cos(u_time * 0.013 + radius * 8.0) * 4.0
  ) * (1.0 - t * 0.3);
  vec2 field = mix(far, spiral, clamp(layer, 0.0, 1.0));
  vec2 logoPos = u_logo.xy + logoUV * u_logo.z;
  vec2 pos = mix(field, logoPos, layerPull);
  pos = mix(pos, field, farKeep * 0.92);

  vec2 clip = (pos / u_res) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);

  float tw = 0.72 + 0.28 * sin(u_time * (1.1 + twinkle * 1.8) + twinkle * 12.0);
  float perspective = mix(0.7, 1.35, depth);
  float point = size * perspective * tw * u_dpr;
  point *= mix(1.0, 1.25, layer);
  point *= mix(1.0, 0.55, t * pull);
  gl_PointSize = clamp(point, 1.0, u_maxSize);

  float contentDim = 1.0;
  if (u_horizontal > 0.5) {
    float k = smoothstep(0.34, 0.62, pos.x / u_res.x);
    contentDim = mix(0.28, 1.0, k);
  } else {
    contentDim = mix(0.42, 1.0, t);
  }

  float fadeFar = mix(1.0, 0.55, t * (1.0 - pull));
  v_color = color;
  v_alpha = bright * tw * contentDim * fadeFar * mix(0.55, 1.0, layer);
}
`;

const STAR_FRAG = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float glow = exp(-d * 2.6);
  float core = exp(-d * 16.0);
  vec3 col = v_color * (0.5 * glow + 1.35 * core);
  float alpha = v_alpha * glow;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assembleT(journey: number) {
  const t = clamp(journey);
  const mapped =
    t < 0.18
      ? (t / 0.18) * 0.04
      : t < 0.62
        ? 0.04 + ((t - 0.18) / 0.44) * 0.36
        : 0.4 + ((t - 0.62) / 0.38) * 0.6;
  return smoothstep(mapped);
}

function budgets(width: number, dpr: number) {
  const mobile = width < 951;
  const low = dpr <= 1.25 || (mobile && dpr < 2);
  if (mobile) {
    return low
      ? { far: 700, spiral: 900, near: 160, logo: 420 }
      : { far: 1000, spiral: 1300, near: 220, logo: 560 };
  }
  return low
    ? { far: 2600, spiral: 3200, near: 480, logo: 1200 }
    : { far: 3800, spiral: 5200, near: 720, logo: 1800 };
}

function starColor(rand: () => number, accent: boolean): [number, number, number] {
  if (accent) return [1, 0.42 + rand() * 0.16, 0.24];
  const roll = rand();
  if (roll < 0.12) return [0.7, 0.84, 1];
  if (roll < 0.28) return [1, 0.78, 0.52];
  const w = 0.86 + rand() * 0.14;
  return [w, w, 0.94 + rand() * 0.06];
}

function writeStar(
  data: Float32Array,
  i: number,
  star: {
    theta: number;
    radius: number;
    z: number;
    size: number;
    u: number;
    v: number;
    bright: number;
    delay: number;
    color: [number, number, number];
    twinkle: number;
    layer: number;
    pull: number;
    farX: number;
    farY: number;
  },
) {
  const o = i * FLOATS;
  data[o] = star.theta;
  data[o + 1] = star.radius;
  data[o + 2] = star.z;
  data[o + 3] = star.size;
  data[o + 4] = star.u;
  data[o + 5] = star.v;
  data[o + 6] = star.bright;
  data[o + 7] = star.delay;
  data[o + 8] = star.color[0];
  data[o + 9] = star.color[1];
  data[o + 10] = star.color[2];
  data[o + 11] = star.twinkle;
  data[o + 12] = star.layer;
  data[o + 13] = star.pull;
  data[o + 14] = star.farX;
  data[o + 15] = star.farY;
}

function buildField(
  samples: Sample[],
  width: number,
  dpr: number,
  seed: number,
) {
  const rand = mulberry32(seed);
  const { far, spiral, near, logo } = budgets(width, dpr);
  const count = far + spiral + near + (samples.length ? logo : 0);
  const data = new Float32Array(count * FLOATS);
  let i = 0;
  const push = (
    layer: number,
    pull: number,
    extras: Partial<Parameters<typeof writeStar>[2]> & {
      theta: number;
      radius: number;
    },
  ) => {
    writeStar(data, i, {
      z: extras.z ?? rand(),
      size: extras.size ?? 2,
      u: extras.u ?? 0.5,
      v: extras.v ?? 0.5,
      bright: extras.bright ?? 0.6,
      delay: extras.delay ?? 0,
      color: extras.color ?? starColor(rand, false),
      twinkle: extras.twinkle ?? rand(),
      farX: extras.farX ?? rand(),
      farY: extras.farY ?? rand(),
      ...extras,
      layer,
      pull,
    });
    i += 1;
  };

  for (let n = 0; n < far; n += 1) {
    push(0, 0, {
      theta: rand() * Math.PI * 2,
      radius: 0.2 + rand() * 0.95,
      z: rand() * 0.45,
      size: 1.1 + rand() * 2.2,
      bright: 0.16 + rand() * 0.35,
      delay: 0.4 + rand() * 0.4,
      farX: rand(),
      farY: rand(),
      color: starColor(rand, rand() < 0.04),
    });
  }

  for (let n = 0; n < spiral; n += 1) {
    const arm = n % 3;
    const along = rand() ** 0.62;
    const theta =
      along * 5.6 + arm * 2.094395 + (rand() - 0.5) * (0.05 + along * 0.14);
    const radius = 0.028 * Math.exp(2.15 * along) + (rand() - 0.5) * 0.03;
    const core = along < 0.16;
    push(1, samples.length ? 0.22 + rand() * 0.2 : 0, {
      theta,
      radius,
      z: 0.35 + rand() * 0.5,
      size: core ? 6 + rand() * 6 : 1.8 + rand() * 3.4,
      bright: core ? 1 : 0.35 + rand() * 0.5,
      delay: along * 0.18 + rand() * 0.08,
      u: 0.5 + (rand() - 0.5) * 0.3,
      v: 0.52 + (rand() - 0.5) * 0.3,
      color: starColor(rand, rand() < 0.1),
      farX: 0.5 + Math.cos(theta) * radius * 0.5,
      farY: 0.48 + Math.sin(theta) * radius * 0.42,
    });
  }

  for (let n = 0; n < near; n += 1) {
    const arm = n % 3;
    const along = rand() ** 0.7;
    push(2, 0.12, {
      theta: along * 5.2 + arm * 2.094395 + (rand() - 0.5) * 0.2,
      radius: 0.12 + along * 0.85,
      z: 0.7 + rand() * 0.3,
      size: 3.2 + rand() * 5.5,
      bright: 0.45 + rand() * 0.5,
      delay: 0.08 + rand() * 0.2,
      color: starColor(rand, rand() < 0.16),
      farX: rand(),
      farY: rand(),
    });
  }

  if (samples.length) {
    const stroke = samples.filter((s) => s.kind === 1);
    const field = samples.filter((s) => s.kind === 0);
    const strokeN = Math.round(logo * 0.78);
    const take = (pool: Sample[], n: number) => {
      if (!pool.length) return;
      const stride = Math.max(1, pool.length / n);
      for (let s = 0; s < n; s += 1) {
        const sample = pool[Math.min(pool.length - 1, Math.floor(s * stride))];
        const lx = sample.u - 0.5;
        const ly = sample.v - 0.52;
        const ang = Math.atan2(ly, lx);
        const rad = Math.hypot(lx, ly);
        const arm = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 3) % 3;
        const along = clamp(rad / 0.48);
        push(1, 1, {
          theta: along * 5.6 + arm * 2.094395 + (rand() - 0.5) * 0.1,
          radius: 0.028 * Math.exp(2.15 * along) + (rand() - 0.5) * 0.02,
          z: 0.45 + rand() * 0.4,
          size: sample.kind === 1 ? 2.2 + sample.lum * 2.4 : 1.6,
          bright: 0.55 + sample.lum * 0.45,
          delay: along * 0.12 + rand() * 0.06,
          u: sample.u,
          v: sample.v,
          color:
            sample.kind === 1
              ? ([0.96, 0.97, 1] as [number, number, number])
              : ([0.08, 0.09, 0.12] as [number, number, number]),
          farX: 0.5 + Math.cos(ang) * 0.4,
          farY: 0.48 + Math.sin(ang) * 0.34,
        });
      }
    };
    take(stroke, strokeN);
    take(field, logo - strokeN);
  }

  return { data, count: i };
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function program(
  gl: WebGLRenderingContext,
  vert: string,
  frag: string,
) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function logoRect(
  width: number,
  height: number,
  dock: DOMRect | null,
  canvasBox: DOMRect | null,
  horizontal: boolean,
) {
  if (!horizontal && dock && canvasBox) {
    return {
      x: dock.left - canvasBox.left,
      y: dock.top - canvasBox.top,
      size: Math.max(64, dock.width),
    };
  }
  const stageLeft = width * 0.56;
  const stageWidth = width * 0.44;
  const size = Math.min(stageWidth * 0.72, (height - 52) * 0.48, 350);
  return {
    x: stageLeft + (stageWidth - size) / 2,
    y: (height - 52 - size) / 2,
    size,
  };
}

export function createLogoGalaxy({
  canvas,
  dock,
  host,
}: {
  canvas: HTMLCanvasElement;
  dock: HTMLElement | null;
  host: HTMLElement;
}): LogoGalaxy {
  const gl = (canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  }) ||
    canvas.getContext("experimental-webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    })) as WebGLRenderingContext | null;

  const samples = logoSamples();
  let reduced = false;
  let hidden = typeof document !== "undefined" ? document.hidden : false;
  let offscreen = false;
  let destroyed = false;
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let lastJourney = 0;
  let lastHorizontal = false;
  let starCount = 0;
  let raf = 0;
  let maxPointSize = 64;
  let canvasBox: DOMRect | null = null;
  let dockBox: DOMRect | null = null;
  let attribsBound = false;
  let intro = true;
  let lastMark = "";
  let lastLogoX = "";
  let lastLogoY = "";
  let lastLogoSize = "";
  let lastDrawnJourney = Number.NaN;
  let lastDrawnHorizontal = false;
  const start = performance.now();
  const introUntil = start + 2400;

  const starProg = gl ? program(gl, STAR_VERT, STAR_FRAG) : null;
  const stars = gl?.createBuffer() ?? null;
  if (gl) {
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as
      | Float32Array
      | number[];
    maxPointSize = Math.min(72, range?.[1] || 64);
  }

  const starLoc =
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
        }
      : null;

  const isPaused = () => hidden || offscreen || reduced || !gl;

  const uploadStars = () => {
    if (!gl || !stars || !cssW) return;
    const field = buildField(samples, cssW, dpr, 90210 + Math.round(cssW));
    starCount = field.count;
    gl.bindBuffer(gl.ARRAY_BUFFER, stars);
    gl.bufferData(gl.ARRAY_BUFFER, field.data, gl.STATIC_DRAW);
    attribsBound = false;
  };

  const measure = () => {
    canvasBox = canvas.getBoundingClientRect();
    dockBox = dock?.getBoundingClientRect() ?? null;
  };

  const fit = () => {
    measure();
    const next = canvasBox ?? canvas.getBoundingClientRect();
    const nextDpr = Math.min(
      window.devicePixelRatio || 1,
      next.width < 951 ? 1.25 : 1.5,
    );
    const w = Math.max(1, Math.round(next.width));
    const h = Math.max(1, Math.round(next.height));
    if (w === cssW && h === cssH && nextDpr === dpr) return;
    cssW = w;
    cssH = h;
    dpr = nextDpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    gl?.viewport(0, 0, canvas.width, canvas.height);
    uploadStars();
  };

  const writeLogoVars = (logo: { x: number; y: number; size: number }, mark: string) => {
    if (mark !== lastMark) {
      lastMark = mark;
      host.style.setProperty("--logo-resolved", mark);
    }
    const x = `${Math.round(logo.x)}px`;
    const y = `${Math.round(logo.y)}px`;
    const size = `${Math.round(logo.size)}px`;
    if (x !== lastLogoX) {
      lastLogoX = x;
      host.style.setProperty("--logo-x", x);
    }
    if (y !== lastLogoY) {
      lastLogoY = y;
      host.style.setProperty("--logo-y", y);
    }
    if (size !== lastLogoSize) {
      lastLogoSize = size;
      host.style.setProperty("--logo-size", size);
    }
  };

  const render = (now: number) => {
    if (!gl || destroyed || reduced || hidden || offscreen) return;
    if (!starProg || !starLoc || !stars || !starCount) return;
    const time = (now - start) / 1000;
    const assemble = assembleT(lastJourney);
    const logo = logoRect(cssW, cssH, dockBox, canvasBox, lastHorizontal);
    writeLogoVars(logo, smoothstep((assemble - 0.8) / 0.18).toFixed(3));
    const cx = lastHorizontal ? 0.64 : 0.5;
    const cy = 0.48;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(starProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, stars);
    if (!attribsBound) {
      const stride = FLOATS * 4;
      const bind = (loc: number, offset: number) => {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, stride, offset * 4);
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
    gl.uniform1f(starLoc.horizontal, lastHorizontal ? 1 : 0);
    gl.uniform4f(starLoc.logo, logo.x, logo.y, logo.size, 1);
    gl.uniform2f(starLoc.center, cx, cy);
    gl.uniform1f(starLoc.maxSize, maxPointSize);
    gl.drawArrays(gl.POINTS, 0, starCount);
    lastDrawnJourney = lastJourney;
    lastDrawnHorizontal = lastHorizontal;
  };

  const tick = (now: number) => {
    raf = 0;
    if (destroyed || isPaused()) return;
    render(now);
    if (intro && now < introUntil && !isPaused()) {
      raf = requestAnimationFrame(tick);
    } else {
      intro = false;
    }
  };

  const play = () => {
    if (destroyed || isPaused() || raf) return;
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      offscreen = !entry.isIntersecting;
      if (isPaused()) stop();
      else play();
    },
    { threshold: 0 },
  );
  observer.observe(host);

  const onVisibility = () => {
    hidden = document.hidden;
    if (isPaused()) stop();
    else play();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const boot = requestAnimationFrame(() => {
    if (destroyed) return;
    fit();
    play();
  });

  return {
    draw(journey, horizontal) {
      const same = journey === lastJourney && horizontal === lastHorizontal;
      lastJourney = journey;
      lastHorizontal = horizontal;
      if (assembleT(journey) > 0.55 && !same) measure();
      if (
        same &&
        !intro &&
        journey === lastDrawnJourney &&
        horizontal === lastDrawnHorizontal
      ) {
        return;
      }
      if (!raf && !isPaused() && cssW) play();
    },
    setReduced(next) {
      if (reduced === next) return;
      reduced = next;
      if (reduced) {
        stop();
        intro = false;
        host.style.setProperty("--logo-resolved", "1");
      } else {
        play();
      }
    },
    setPaused(next) {
      offscreen = next;
      if (isPaused()) stop();
      else play();
    },
    resize() {
      cssW = 0;
      fit();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(boot);
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (gl) {
        if (stars) gl.deleteBuffer(stars);
        if (starProg) gl.deleteProgram(starProg);
      }
      host.style.removeProperty("--logo-resolved");
      host.style.removeProperty("--logo-x");
      host.style.removeProperty("--logo-y");
      host.style.removeProperty("--logo-size");
    },
  };
}
