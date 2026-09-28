import {
  assembleT,
  buildField,
  FLOATS,
  logoRect,
  program,
  smoothstep,
  STAR_FRAG,
  STAR_VERT,
  type Rect4,
  type Sample,
} from "./logo-galaxy-core";

export type LogoGalaxy = {
  draw: (journey: number, horizontal: boolean) => void;
  setReduced: (reduced: boolean) => void;
  setPaused: (paused: boolean) => void;
  resize: () => void;
  destroy: () => void;
};

const MARK_SRC = "/logo-mark.png";
const SAMPLE = 80;
const TRI = {
  ax: 0.498,
  ay: 0.13,
  bx: 0.103,
  by: 0.863,
  cx: 0.899,
  cy: 0.863,
};

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
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
      const u = x / (SAMPLE - 1);
      const v = y / (SAMPLE - 1);
      if (lum > 0.16) samples.push({ u, v, lum, kind: 1 });
      else if (inLogoTriangle(u, v) && x % 2 === 0 && y % 2 === 0) {
        samples.push({ u, v, lum, kind: 0 });
      }
    }
  }
  return samples;
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
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });

  let samples: Sample[] = [];
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
  let drawn = false;
  let maxPointSize = 28;
  let canvasBox: DOMRect | null = null;
  let dockBox: DOMRect | null = null;
  let attribsBound = false;
  let intro = true;
  let markRequested = false;
  let copy0: Rect4 = [0, 0, -1, -1];
  let copy1: Rect4 = [0, 0, -1, -1];
  let copy2: Rect4 = [0, 0, -1, -1];
  const start = performance.now();
  const introUntil = start + 2400;
  const empty: Rect4 = [0, 0, -1, -1];

  const starProg = gl ? program(gl, STAR_VERT, STAR_FRAG) : null;
  const stars = gl?.createBuffer() ?? null;
  if (gl) {
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as
      | Float32Array
      | number[];
    maxPointSize = Math.min(28, range?.[1] || 24);
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
          copy0: gl.getUniformLocation(starProg, "u_copy0"),
          copy1: gl.getUniformLocation(starProg, "u_copy1"),
          copy2: gl.getUniformLocation(starProg, "u_copy2"),
        }
      : null;

  const markImage = new Image();
  markImage.decoding = "async";
  markImage.alt = "";
  const lockImg = host.querySelector<HTMLImageElement>(".logo-galaxy-lock");
  const staticImg = host.querySelector<HTMLImageElement>(".logo-galaxy-static");
  const copyTitle = host.querySelector<HTMLElement>(
    ".scene-contact .editorial-title",
  );
  const copyBottom = host.querySelector<HTMLElement>(
    ".scene-contact .contact-bottom",
  );
  const copySocials = host.querySelector<HTMLElement>(
    ".scene-contact .contact-socials",
  );

  const isPaused = () => hidden || offscreen || reduced || !gl;

  const uploadStars = () => {
    if (!gl || !stars || !cssW) return;
    const field = buildField(samples, cssW, 90210 + Math.round(cssW));
    starCount = field.count;
    gl.bindBuffer(gl.ARRAY_BUFFER, stars);
    gl.bufferData(gl.ARRAY_BUFFER, field.data, gl.STATIC_DRAW);
    attribsBound = false;
  };

  const knockOutMark = () => {
    if (!markImage.naturalWidth) return "";
    const c = document.createElement("canvas");
    const size = 160;
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(markImage, 0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = Math.max(d[i], d[i + 1], d[i + 2]);
      d[i + 3] = lum <= 10 ? 0 : lum;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  };

  let overlaySrc = "";
  let overlayAssigned = false;
  let lastMark = "";
  let lastLogo = "";
  const ensureOverlay = () => {
    if (overlayAssigned || !overlaySrc) return;
    overlayAssigned = true;
    if (lockImg) lockImg.src = overlaySrc;
    if (staticImg) staticImg.src = overlaySrc;
  };

  const measure = () => {
    canvasBox = canvas.getBoundingClientRect();
    dockBox = dock?.getBoundingClientRect() ?? null;
  };

  const copyRect = (el: HTMLElement | null): Rect4 => {
    if (!el || !canvasBox) return empty;
    const r = el.getBoundingClientRect();
    return [
      r.left - canvasBox.left - 32,
      r.top - canvasBox.top - 28,
      r.right - canvasBox.left + 32,
      r.bottom - canvasBox.top + 28,
    ];
  };

  const refreshCopy = () => {
    if (!canvasBox) return;
    copy0 = copyRect(copyTitle);
    copy1 = copyRect(copyBottom);
    copy2 = copyRect(copySocials);
  };

  const fit = () => {
    measure();
    const next = canvasBox ?? canvas.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

  const requestMark = () => {
    if (markRequested) return;
    markRequested = true;
    markImage.src = MARK_SRC;
  };

  const render = (now: number) => {
    if (!gl || destroyed || reduced || hidden || offscreen) return;
    if (!starProg || !starLoc || !stars || !starCount) return;
    const time = (now - start) / 1000;
    drawn = true;
    const assemble = assembleT(lastJourney);
    if (assemble > 0.42 || lastJourney > 0.55 || reduced) {
      requestMark();
      ensureOverlay();
    }
    const logo = logoRect(cssW, cssH, dockBox, canvasBox, lastHorizontal);
    const markAlpha = smoothstep((assemble - 0.8) / 0.18);
    const markStr = markAlpha.toFixed(3);
    if (markStr !== lastMark) {
      lastMark = markStr;
      host.style.setProperty("--logo-resolved", markStr);
    }
    const logoKey = `${Math.round(logo.x)}:${Math.round(logo.y)}:${Math.round(logo.size)}`;
    if (logoKey !== lastLogo) {
      lastLogo = logoKey;
      host.style.setProperty("--logo-x", `${Math.round(logo.x)}px`);
      host.style.setProperty("--logo-y", `${Math.round(logo.y)}px`);
      host.style.setProperty("--logo-size", `${Math.round(logo.size)}px`);
    }
    const cx = lastHorizontal ? 0.64 : 0.5;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(starProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, stars);
    const stride = FLOATS * 4;
    if (!attribsBound) {
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
    gl.uniform2f(starLoc.center, cx, 0.48);
    gl.uniform1f(starLoc.maxSize, maxPointSize);
    gl.uniform4f(starLoc.copy0, copy0[0], copy0[1], copy0[2], copy0[3]);
    gl.uniform4f(starLoc.copy1, copy1[0], copy1[1], copy1[2], copy1[3]);
    gl.uniform4f(starLoc.copy2, copy2[0], copy2[1], copy2[2], copy2[3]);
    gl.drawArrays(gl.POINTS, 0, starCount);
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

  markImage.addEventListener("load", () => {
    if (destroyed) return;
    const finish = () => {
      if (destroyed) return;
      samples = sampleOfficialMark(markImage);
      uploadStars();
      overlaySrc = knockOutMark();
      if (reduced) ensureOverlay();
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(finish, { timeout: 2500 });
    } else {
      setTimeout(finish, 0);
    }
  });

  const boot = requestAnimationFrame(() => {
    if (destroyed) return;
    fit();
    play();
  });

  return {
    draw(journey, horizontal) {
      const same =
        drawn && journey === lastJourney && horizontal === lastHorizontal;
      lastJourney = journey;
      lastHorizontal = horizontal;
      if (!same && journey > 0.35) {
        refreshCopy();
        if (journey > 0.5) measure();
      }
      if (same && !intro) return;
      if (!raf && !isPaused()) play();
    },
    setReduced(next) {
      if (reduced === next) return;
      reduced = next;
      if (reduced) {
        stop();
        intro = false;
        requestMark();
        host.style.setProperty("--logo-resolved", "1");
        ensureOverlay();
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
      markImage.src = "";
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
