export type Sample = { u: number; v: number; lum: number; kind: 0 | 1 };

export type Rect4 = [number, number, number, number];

export type LogoBox = { x: number; y: number; size: number };

export const FLOATS = 16;

export const STAR_VERT = `
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
uniform vec4 u_copy0;
uniform vec4 u_copy1;
uniform vec4 u_copy2;
varying vec3 v_color;
varying float v_alpha;

float copyMask(vec2 pos, vec4 r) {
  return step(r.x, pos.x) * step(pos.x, r.z) * step(r.y, pos.y) * step(pos.y, r.w);
}

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

  float tw = 0.85 + 0.15 * sin(u_time * (0.7 + twinkle * 0.9) + twinkle * 12.0);
  float perspective = mix(0.75, 1.2, depth);
  float point = size * perspective * tw * u_dpr;
  point *= mix(1.0, 1.15, layer);
  point *= mix(1.0, 0.55, t * pull);
  gl_PointSize = clamp(point, 1.0, u_maxSize);

  float contentDim = 1.0;
  if (u_horizontal > 0.5) {
    contentDim = smoothstep(0.54, 0.64, pos.x / u_res.x);
  }
  float masked = max(
    copyMask(pos, u_copy0),
    max(copyMask(pos, u_copy1), copyMask(pos, u_copy2))
  );
  if (masked > 0.5 || contentDim < 0.05) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 1.0;
    v_color = color;
    v_alpha = 0.0;
    return;
  }

  float fadeFar = mix(1.0, 0.45, t * (1.0 - pull));
  v_color = color;
  v_alpha = bright * tw * contentDim * fadeFar * mix(0.5, 1.0, layer);
}
`;

export const STAR_FRAG = `
precision mediump float;
varying vec3 v_color;
varying float v_alpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  float glow = max(0.0, 1.0 - d);
  glow *= glow;
  float alpha = v_alpha * glow;
  gl_FragColor = vec4(v_color * alpha, alpha);
}
`;

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function smoothstep(value: number) {
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

function budgets(width: number) {
  if (width < 951) {
    return { far: 280, spiral: 360, near: 40, logo: 140 };
  }
  return { far: 340, spiral: 420, near: 40, logo: 160 };
}

function starColor(rand: () => number, accent: boolean): [number, number, number] {
  if (accent) return [0.87, 0.28, 0.15];
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

export function assembleT(journey: number) {
  const t = clamp(journey);
  const mapped =
    t < 0.18
      ? (t / 0.18) * 0.04
      : t < 0.62
        ? 0.04 + ((t - 0.18) / 0.44) * 0.36
        : 0.4 + ((t - 0.62) / 0.38) * 0.6;
  return smoothstep(mapped);
}

export function logoRect(
  width: number,
  height: number,
  dock: { left: number; top: number; width: number } | null,
  canvasBox: { left: number; top: number } | null,
  horizontal: boolean,
): LogoBox {
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

export function buildField(samples: Sample[], width: number, seed: number) {
  const rand = mulberry32(seed);
  const { far, spiral, near, logo } = budgets(width);
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
      size: core ? 2.6 + rand() * 2.2 : 1.2 + rand() * 1.8,
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
      size: 1.6 + rand() * 2.2,
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
          size: sample.kind === 1 ? 1.4 + sample.lum * 1.4 : 1.1,
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

export function compile(
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

export function program(
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
