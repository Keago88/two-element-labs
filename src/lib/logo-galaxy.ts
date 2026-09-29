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
uniform vec3 u_trail[8];
uniform float u_trailCount;
uniform float u_hoverRadius;
uniform float u_scatterDistance;
uniform float u_pointerSpeed;
varying vec3 v_color;
varying float v_alpha;

void main() {
  float theta = a0.x;
  float radius = a0.y;
  float depth = a0.z;
  float size = a0.w;
  vec2 logoUV = a1.xy;
  float bright = a1.z;
  vec3 color = a2.xyz;
  float twinkle = a2.w;
  float layer = a3.x;
  float pull = a3.y;

  float t = clamp(u_assemble, 0.0, 1.0);
  float spin = u_spin * mix(0.15, 1.0, layer) * (1.0 - t);
  float swirl = (1.0 - t) * (0.35 + depth * 0.4);
  float ang = theta + spin + swirl;
  float maxR = length(u_res) * 0.5;
  vec2 origin = u_center * u_res;
  vec2 spiral = origin + vec2(cos(ang), sin(ang) * 0.86) * radius * maxR * mix(0.92, 1.18, depth);
  vec2 far = vec2(a3.z, a3.w) * u_res;
  far += vec2(
    sin(u_time * 0.017 + theta) * 6.0,
    cos(u_time * 0.013 + radius * 8.0) * 4.0
  ) * (1.0 - t);
  vec2 field = mix(far, spiral, clamp(layer, 0.0, 1.0));
  vec2 logoPos = u_logo.xy + logoUV * u_logo.z;
  vec2 pos = mix(field, logoPos, t * pull);

  // Cursor physics stay entirely on the GPU. Each trail sample is a screen-space
  // attractor with a fading strength; once it expires, pos is the untouched
  // galaxy position again, which gives the interaction its spring-back motion.
  vec2 displacement = vec2(0.0);
  float interaction = 0.0;
  for (int i = 0; i < 8; i++) {
    float enabled = step(float(i) + 0.5, u_trailCount);
    vec2 delta = pos - u_trail[i].xy;
    float distanceToPointer = length(delta);
    float influence = (1.0 - smoothstep(0.0, u_hoverRadius, distanceToPointer));
    influence *= u_trail[i].z * enabled;
    vec2 away = delta / max(distanceToPointer, 0.001);
    vec2 tangent = vec2(-away.y, away.x);
    float pulse = 0.82 + 0.18 * sin(u_time * 4.0 + distanceToPointer * 0.045);
    float swirlStrength = 0.34 + min(0.5, u_pointerSpeed * 0.012);
    displacement += (away * 0.68 + tangent * swirlStrength * pulse) * influence;
    interaction = max(interaction, influence);
  }
  float assemblyRestraint = mix(1.0, 0.48, t);
  float scatterLength = length(displacement);
  vec2 scatter = displacement * min(1.0, 1.5 / max(scatterLength, 0.001));
  pos += scatter * u_scatterDistance * assemblyRestraint;

  vec2 clip = (pos / u_res) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);

  float tw = 0.72 + 0.28 * sin(u_time * (1.1 + twinkle * 1.8) + twinkle * 12.0);
  float perspective = mix(0.7, 1.35, depth);
  float point = size * perspective * tw * u_dpr;
  point *= mix(1.0, 1.25, layer);
  point *= mix(1.0, 0.55, t);
  gl_PointSize = clamp(point, 1.0, u_maxSize);

  float contentDim = 1.0;
  if (u_horizontal > 0.5) {
    float k = smoothstep(0.34, 0.62, pos.x / u_res.x);
    contentDim = mix(0.28, 1.0, k);
  } else {
    contentDim = mix(0.42, 1.0, t);
  }

  v_color = mix(color, vec3(0.96, 0.97, 1.0), t);
  v_color = mix(v_color, v_color * vec3(1.15, 0.82, 0.68), interaction * 0.34);
  v_alpha = bright * tw * contentDim * mix(mix(0.55, 1.0, layer), 1.0, t);
  v_alpha *= 1.0 + interaction * 0.32;
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

function censusOf(data: Float32Array, count: number) {
  let unfinished = 0;
  let stray = 0;
  let maxDelay = 0;
  for (let i = 0; i < count; i += 1) {
    const o = i * FLOATS;
    const delay = data[o + 7];
    const pull = data[o + 13];
    const u = data[o + 4];
    const v = data[o + 5];
    maxDelay = Math.max(maxDelay, delay);
    if (pull < 0.999) unfinished += 1;
    if (pull < 0.999 || u < 0 || u > 1 || v < 0 || v > 1) stray += 1;
  }
  return {
    total: count,
    inMark: count - stray,
    stray,
    unfinished,
    maxDelay: Number(maxDelay.toFixed(4)),
  };
}

export type GatherCensus = ReturnType<typeof censusOf>;

function assembleT(journey: number) {
  return clamp(journey);
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
  const stroke = samples.filter((s) => s.kind === 1);
  const markOf = (n: number): Sample =>
    stroke.length
      ? stroke[n % stroke.length]
      : { u: 0.5, v: 0.5, lum: 1, kind: 1 };
  let i = 0;
  let markIndex = 0;
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
    const mark = markOf(markIndex++);
    push(0, 1, {
      theta: rand() * Math.PI * 2,
      radius: 0.2 + rand() * 0.95,
      z: rand() * 0.45,
      size: 1.1 + rand() * 2.2,
      bright: 0.16 + rand() * 0.35,
      delay: 0.22 + rand() * 0.4,
      u: mark.u,
      v: mark.v,
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
    const mark = markOf(markIndex++);
    push(1, 1, {
      theta,
      radius,
      z: 0.35 + rand() * 0.5,
      size: core ? 6 + rand() * 6 : 1.8 + rand() * 3.4,
      bright: core ? 1 : 0.35 + rand() * 0.5,
      delay: 0.08 + along * 0.28 + rand() * 0.08,
      u: mark.u,
      v: mark.v,
      color: starColor(rand, rand() < 0.1),
      farX: 0.5 + Math.cos(theta) * radius * 0.5,
      farY: 0.48 + Math.sin(theta) * radius * 0.42,
    });
  }

  for (let n = 0; n < near; n += 1) {
    const arm = n % 3;
    const along = rand() ** 0.7;
    const mark = markOf(markIndex++);
    push(2, 1, {
      theta: along * 5.2 + arm * 2.094395 + (rand() - 0.5) * 0.2,
      radius: 0.12 + along * 0.85,
      z: 0.7 + rand() * 0.3,
      size: 3.2 + rand() * 5.5,
      bright: 0.45 + rand() * 0.5,
      delay: 0.1 + rand() * 0.32,
      u: mark.u,
      v: mark.v,
      color: starColor(rand, rand() < 0.16),
      farX: rand(),
      farY: rand(),
    });
  }

  if (samples.length) {
    const strokeN = logo;
    for (let s = 0; s < strokeN; s += 1) {
      const sample = markOf(markIndex++);
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
        size: 2.2 + sample.lum * 2.4,
        bright: 0.55 + sample.lum * 0.45,
        delay: along * 0.12 + rand() * 0.06,
        u: sample.u,
        v: sample.v,
        color: [0.96, 0.97, 1] as [number, number, number],
        farX: 0.5 + Math.cos(ang) * 0.4,
        farY: 0.48 + Math.sin(ang) * 0.34,
      });
    }
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
  let glReady = false;
  let lastMark = "";
  let lastLogoX = "";
  let lastLogoY = "";
  let lastLogoSize = "";
  let lastAssembleCss = "";
  let cachedLogo: { x: number; y: number; size: number } | null = null;
  let heroFast = false;
  const live: {
    journey: number;
    assemble: number;
    target: number;
    starCount: number;
    horizontal: boolean;
    census: ReturnType<typeof censusOf> | null;
  } = {
    journey: 0,
    assemble: 0,
    target: 0,
    starCount: 0,
    horizontal: false,
    census: null,
  };
  const start = performance.now();
  let shownAssemble = 0;
  let lastNow = start;
  let settleTarget = 0;
  let settleStarted = start;
  let pointerX = 0;
  let pointerY = 0;
  let pointerSpeed = 0;
  let pointerInside = false;
  let lastPointerAt = start;
  const trail: Array<{ x: number; y: number; strength: number }> = [];
  const trailUniform = new Float32Array(8 * 3);

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
          trail: gl.getUniformLocation(starProg, "u_trail[0]"),
          trailCount: gl.getUniformLocation(starProg, "u_trailCount"),
          hoverRadius: gl.getUniformLocation(starProg, "u_hoverRadius"),
          scatterDistance: gl.getUniformLocation(starProg, "u_scatterDistance"),
          pointerSpeed: gl.getUniformLocation(starProg, "u_pointerSpeed"),
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
    const census = censusOf(field.data, field.count);
    live.census = census;
    live.starCount = field.count;
    const debug = window as Window & {
      __gatherCensus?: ReturnType<typeof censusOf>;
      __gatherLive?: typeof live;
    };
    debug.__gatherCensus = census;
    debug.__gatherLive = live;
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
    glReady = false;
    heroFast = false;
    cachedLogo = null;
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
    const target = assembleT(lastJourney);
    const dt = Math.min(32, Math.max(0, now - lastNow));
    lastNow = now;
    const decay = Math.exp(-dt / 430);
    for (let i = trail.length - 1; i >= 0; i -= 1) {
      trail[i].strength *= decay;
      if (trail[i].strength < 0.025) trail.splice(i, 1);
    }
    if (pointerInside) {
      const head = trail[0];
      if (!head || Math.hypot(head.x - pointerX, head.y - pointerY) > 3) {
        trail.unshift({ x: pointerX, y: pointerY, strength: 1 });
        if (trail.length > 8) trail.length = 8;
      } else {
        head.x = pointerX;
        head.y = pointerY;
        head.strength = 1;
      }
    }
    trailUniform.fill(0);
    trail.forEach((point, index) => {
      const offset = index * 3;
      trailUniform[offset] = point.x;
      trailUniform[offset + 1] = point.y;
      trailUniform[offset + 2] = point.strength;
    });
    pointerSpeed *= Math.exp(-dt / 110);
    if (target !== settleTarget) {
      settleTarget = target;
      settleStarted = now;
    }
    const follow = 1 - Math.exp(-dt / 90);
    shownAssemble += (target - shownAssemble) * follow;
    if (Math.abs(target - shownAssemble) < 0.002 || now - settleStarted >= 140) {
      shownAssemble = target;
    }
    const assemble = shownAssemble;
    if (!lastHorizontal) {
      measure();
      cachedLogo = logoRect(cssW, cssH, dockBox, canvasBox, false);
    } else if (!cachedLogo || assemble > 0.55) {
      cachedLogo = logoRect(cssW, cssH, dockBox, canvasBox, true);
    }
    const logo = cachedLogo;
    writeLogoVars(logo, smoothstep((assemble - 0.8) / 0.18).toFixed(3));
    const assembleCss = assemble.toFixed(3);
    if (assembleCss !== lastAssembleCss) {
      lastAssembleCss = assembleCss;
      host.style.setProperty("--assemble", assembleCss);
    }
    live.journey = lastJourney;
    live.assemble = assemble;
    live.target = target;
    live.horizontal = lastHorizontal;
    const cx = lastHorizontal ? 0.64 : 0.5;
    const cy = 0.48;

    if (!glReady) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(starProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, stars);
      glReady = true;
      heroFast = false;
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!attribsBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, stars);
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
    if (!heroFast) {
      gl.uniform2f(starLoc.res, cssW, cssH);
      gl.uniform1f(starLoc.assemble, assemble);
      gl.uniform1f(starLoc.dpr, dpr);
      gl.uniform1f(starLoc.horizontal, lastHorizontal ? 1 : 0);
      gl.uniform4f(starLoc.logo, logo.x, logo.y, logo.size, 1);
      gl.uniform2f(starLoc.center, cx, cy);
      gl.uniform1f(starLoc.maxSize, maxPointSize);
      heroFast = target <= 0 && assemble <= 0;
    }
    gl.uniform1f(starLoc.time, time);
    gl.uniform1f(starLoc.spin, time * 0.045);
    gl.uniform3fv(starLoc.trail, trailUniform);
    gl.uniform1f(starLoc.trailCount, trail.length);
    gl.uniform1f(starLoc.hoverRadius, cssW < 951 ? 14.8 : 23.6);
    gl.uniform1f(starLoc.scatterDistance, cssW < 951 ? 22 : 35);
    gl.uniform1f(starLoc.pointerSpeed, pointerSpeed);
    gl.drawArrays(gl.POINTS, 0, starCount);
  };

  const tick = (now: number) => {
    raf = 0;
    if (destroyed || isPaused()) return;
    render(now);
    if (!isPaused()) raf = requestAnimationFrame(tick);
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

  const onPointerMove = (event: PointerEvent) => {
    const box = canvasBox ?? canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const inside = x >= 0 && x <= box.width && y >= 0 && y <= box.height;
    if (!inside) {
      pointerInside = false;
      return;
    }
    const now = performance.now();
    const elapsed = Math.max(8, now - lastPointerAt);
    const distance = pointerInside ? Math.hypot(x - pointerX, y - pointerY) : 0;
    pointerSpeed = Math.min(48, (distance / elapsed) * 16.67);
    pointerX = x;
    pointerY = y;
    pointerInside = true;
    lastPointerAt = now;
    play();
  };
  const onPointerLeave = () => {
    pointerInside = false;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave, {
    passive: true,
  });
  window.addEventListener("blur", onPointerLeave);

  const boot = requestAnimationFrame(() => {
    if (destroyed) return;
    fit();
    render(performance.now());
    play();
  });

  return {
    draw(journey, horizontal) {
      const same = journey === lastJourney && horizontal === lastHorizontal;
      lastJourney = journey;
      lastHorizontal = horizontal;
      if (!same) {
        heroFast = false;
        cachedLogo = null;
        if (assembleT(journey) > 0) measure();
      }
      if (same && raf) return;
      if (!raf && !isPaused() && cssW) play();
    },
    setReduced(next) {
      if (reduced === next) return;
      reduced = next;
      if (reduced) {
        stop();
        host.style.setProperty("--logo-resolved", "1");
        host.style.setProperty("--assemble", "1");
        lastAssembleCss = "1";
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
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      if (gl) {
        if (stars) gl.deleteBuffer(stars);
        if (starProg) gl.deleteProgram(starProg);
      }
      host.style.removeProperty("--logo-resolved");
      host.style.removeProperty("--logo-x");
      host.style.removeProperty("--logo-y");
      host.style.removeProperty("--logo-size");
      host.style.removeProperty("--assemble");
    },
  };
}
