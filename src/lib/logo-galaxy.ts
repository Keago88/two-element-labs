type Kind = 0 | 1 | 2 | 3; // field, stroke, ambient, accent

type Sample = { u: number; v: number; lum: number; kind: Kind };

type Particle = {
  u: number;
  v: number;
  lum: number;
  kind: Kind;
  theta: number;
  radius: number;
  delay: number;
  z: number;
  size: number;
};

export type LogoGalaxy = {
  draw: (journey: number, horizontal: boolean) => void;
  setReduced: (reduced: boolean) => void;
  setPaused: (paused: boolean) => void;
  resize: () => void;
  destroy: () => void;
};

const MARK_SRC = "/logo-mark.png";
const SAMPLE = 144;
const TRI = {
  ax: 0.498,
  ay: 0.13,
  bx: 0.103,
  by: 0.863,
  cx: 0.899,
  cy: 0.863,
};

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

function orient(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function inLogoTriangle(u: number, v: number) {
  const { ax, ay, bx, by, cx, cy } = TRI;
  const pad = 0.03;
  const mx = (ax + bx + cx) / 3;
  const my = (ay + by + cy) / 3;
  const expand = (x: number, y: number) => {
    const dx = x - mx;
    const dy = y - my;
    const n = Math.hypot(dx, dy) || 1;
    return [x + (dx / n) * pad, y + (dy / n) * pad] as const;
  };
  const [ax2, ay2] = expand(ax, ay);
  const [bx2, by2] = expand(bx, by);
  const [cx2, cy2] = expand(cx, cy);
  const b1 = orient(u, v, ax2, ay2, bx2, by2) < 0;
  const b2 = orient(u, v, bx2, by2, cx2, cy2) < 0;
  const b3 = orient(u, v, cx2, cy2, ax2, ay2) < 0;
  return b1 === b2 && b2 === b3;
}

function assembleT(journey: number) {
  const t = clamp(journey);
  const mapped =
    t < 0.2
      ? (t / 0.2) * 0.06
      : t < 0.66
        ? 0.06 + ((t - 0.2) / 0.46) * 0.4
        : 0.46 + ((t - 0.66) / 0.34) * 0.54;
  return smoothstep(mapped);
}

function sampleOfficialMark(image: HTMLImageElement): Sample[] {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
  const samples: Sample[] = [];
  for (let y = 0; y < SAMPLE; y += 1) {
    for (let x = 0; x < SAMPLE; x += 1) {
      const i = (y * SAMPLE + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3 / 255;
      const u = x / (SAMPLE - 1);
      const v = y / (SAMPLE - 1);
      const inside = inLogoTriangle(u, v);
      if (lum > 0.16) {
        samples.push({ u, v, lum, kind: 1 });
      } else if (inside && x % 2 === 0 && y % 2 === 0) {
        samples.push({ u, v, lum, kind: 0 });
      }
    }
  }
  return samples;
}

function particleBudget(width: number, dpr: number) {
  const mobile = width < 951;
  const low = dpr <= 1.25 || (mobile && dpr < 2);
  if (mobile) return low ? 280 : 420;
  return low ? 860 : 1320;
}

function buildParticles(
  samples: Sample[],
  count: number,
  seed: number,
): Particle[] {
  const rand = mulberry32(seed);
  const stroke = samples.filter((s) => s.kind === 1);
  const field = samples.filter((s) => s.kind === 0);
  const logoCount = Math.round(count * 0.74);
  const ambientCount = count - logoCount;
  const particles: Particle[] = [];
  const take = (pool: Sample[], n: number) => {
    if (!pool.length || n <= 0) return;
    const stride = Math.max(1, pool.length / n);
    for (let i = 0; i < n; i += 1) {
      const sample = pool[Math.min(pool.length - 1, Math.floor(i * stride))];
      const lx = sample.u - 0.5;
      const ly = sample.v - 0.52;
      const ang = Math.atan2(ly, lx);
      const rad = Math.hypot(lx, ly);
      const arm = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 3) % 3;
      const along = clamp(rad / 0.48);
      const theta =
        along * 5.15 + arm * 2.094395 + (rand() - 0.5) * (0.08 + along * 0.12);
      const radius = 0.1 * Math.exp(2.05 * along) + (rand() - 0.5) * 0.04;
      particles.push({
        u: sample.u,
        v: sample.v,
        lum: sample.lum,
        kind: sample.kind,
        theta,
        radius,
        delay: along * 0.14 + rand() * 0.07,
        z: 0.5 + rand() * 1,
        size:
          sample.kind === 1
            ? 1.7 + sample.lum * 1.8 + rand() * 0.6
            : 1.3 + rand() * 0.7,
      });
    }
  };
  const strokeN = Math.round(logoCount * 0.74);
  take(stroke, strokeN);
  take(field, logoCount - strokeN);
  for (let i = 0; i < ambientCount; i += 1) {
    const arm = i % 3;
    const along = rand() ** 0.78;
    const theta = along * 5.15 + arm * 2.094395 + (rand() - 0.5) * 0.16;
    const radius = 0.1 * Math.exp(2.05 * along) + (rand() - 0.5) * 0.05;
    const accent = rand() < 0.12;
    particles.push({
      u: 0.5 + (rand() - 0.5) * 0.18,
      v: 0.52 + (rand() - 0.5) * 0.18,
      lum: accent ? 0.7 : 0.2,
      kind: accent ? 3 : 2,
      theta,
      radius: Math.min(1.18, radius + (rand() < 0.18 ? rand() * 0.28 : 0)),
      delay: 0.04 + rand() * 0.18,
      z: 0.4 + rand() * 1.2,
      size: accent ? 2 + rand() * 1.4 : 1.2 + rand() * 1.1,
    });
  }
  const order: Record<Kind, number> = { 2: 0, 0: 1, 3: 2, 1: 3 };
  particles.sort((a, b) => order[a.kind] - order[b.kind] || a.z - b.z);
  return particles;
}

function logoRect(
  canvas: HTMLCanvasElement,
  dock: HTMLElement | null,
  horizontal: boolean,
) {
  const box = canvas.getBoundingClientRect();
  if (!horizontal && dock) {
    const dockBox = dock.getBoundingClientRect();
    const size = Math.max(64, dockBox.width);
    return {
      x: dockBox.left - box.left,
      y: dockBox.top - box.top,
      size,
    };
  }
  const width = box.width;
  const height = box.height;
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
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  let samples: Sample[] = [];
  let particles: Particle[] = [];
  let mark: HTMLImageElement | null = null;
  let reduced = false;
  let hidden = typeof document !== "undefined" ? document.hidden : false;
  let offscreen = false;
  let destroyed = false;
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let lastJourney = 0;
  let lastHorizontal = false;

  const markImage = new Image();
  markImage.decoding = "async";
  markImage.alt = "";

  const isPaused = () => hidden || offscreen;

  const rebuild = () => {
    if (!cssW) return;
    const count = particleBudget(cssW, dpr);
    particles = samples.length
      ? buildParticles(samples, count, 7701 + Math.round(cssW))
      : [];
  };

  const fit = () => {
    const next = canvas.getBoundingClientRect();
    const nextDpr = Math.min(
      window.devicePixelRatio || 1,
      next.width < 951 ? 1.5 : 2,
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
    rebuild();
  };

  const paint = (journey: number, horizontal: boolean) => {
    if (!ctx || destroyed || isPaused() || reduced) return;
    lastJourney = journey;
    lastHorizontal = horizontal;
    fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!particles.length) return;

    const assemble = assembleT(journey);
    const logo = logoRect(canvas, dock, horizontal);
    const maxR = Math.hypot(cssW, cssH) * 0.5;
    const cx = cssW * (horizontal ? 0.66 : 0.52);
    const cy = cssH * 0.48;
    const markAlpha = smoothstep((assemble - 0.82) / 0.16);
    const particleKeep = 1 - smoothstep((assemble - 0.9) / 0.1);
    host.style.setProperty("--logo-resolved", markAlpha.toFixed(3));

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const t = smoothstep((assemble - p.delay) / Math.max(0.18, 1 - p.delay));
      const swirl = (1 - t) * (0.55 + p.z * 0.35);
      const scatterX =
        cx + Math.cos(p.theta + swirl) * p.radius * maxR * (0.72 + p.z * 0.18);
      const scatterY =
        cy +
        Math.sin(p.theta + swirl) * p.radius * maxR * (0.58 + p.z * 0.12);
      const tx = logo.x + p.u * logo.size;
      const ty = logo.y + p.v * logo.size;
      const x = scatterX + (tx - scatterX) * t;
      const y = scatterY + (ty - scatterY) * t;
      const ambientFade = p.kind >= 2 ? 1 - smoothstep((t - 0.35) / 0.55) : 1;
      if (ambientFade <= 0.02) continue;

      let alpha: number;
      let fill: string;
      if (p.kind === 1) {
        const light = 22 + (240 - 22) * markAlpha;
        alpha = (0.32 + t * 0.5) * particleKeep;
        fill = `rgb(${light},${light},${Math.max(18, light - 8)})`;
      } else if (p.kind === 3) {
        alpha = (0.28 + t * 0.18) * ambientFade * particleKeep;
        fill = "#ff643d";
      } else if (p.kind === 2) {
        alpha = (0.2 + (1 - t) * 0.18) * ambientFade * particleKeep;
        fill = "#1a1a17";
      } else {
        alpha = (0.28 + t * 0.42) * particleKeep;
        fill = "#111";
      }

      if (horizontal && x < cssW * 0.54) {
        const k = clamp(x / (cssW * 0.54));
        alpha *= 0.28 + k * 0.55;
      } else if (!horizontal) {
        alpha *= 0.42 + t * 0.58;
      }

      if (alpha < 0.03) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      const size = p.size * (1.15 - t * 0.25) * (p.z > 1 ? 1.15 : 1);
      const r = Math.max(0.6, size * 0.55);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (horizontal && mark && markAlpha > 0.02 && mark.naturalWidth) {
      ctx.globalAlpha = markAlpha;
      ctx.drawImage(mark, logo.x, logo.y, logo.size, logo.size);
      ctx.globalAlpha = 1;
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      offscreen = !entry.isIntersecting;
      if (!isPaused() && !reduced) paint(lastJourney, lastHorizontal);
    },
    { threshold: 0 },
  );
  observer.observe(host);

  const onVisibility = () => {
    hidden = document.hidden;
    if (!isPaused() && !reduced) paint(lastJourney, lastHorizontal);
  };
  document.addEventListener("visibilitychange", onVisibility);

  markImage.addEventListener("load", () => {
    if (destroyed) return;
    mark = markImage;
    samples = sampleOfficialMark(markImage);
    rebuild();
    if (!isPaused() && !reduced) paint(lastJourney, lastHorizontal);
  });
  markImage.src = MARK_SRC;
  if (markImage.complete && markImage.naturalWidth) {
    mark = markImage;
    samples = sampleOfficialMark(markImage);
    rebuild();
  }

  fit();

  return {
    draw: paint,
    setReduced(next) {
      if (reduced === next) return;
      reduced = next;
      if (reduced && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        host.style.setProperty("--logo-resolved", "1");
      }
    },
    setPaused(next) {
      offscreen = next;
    },
    resize() {
      fit();
    },
    destroy() {
      destroyed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      markImage.src = "";
      particles = [];
      samples = [];
      host.style.removeProperty("--logo-resolved");
    },
  };
}
