import {
  assembleT,
  logoRect,
  smoothstep,
  type LogoBox,
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
  let reduced = false;
  let hidden = typeof document !== "undefined" ? document.hidden : false;
  let offscreen = false;
  let destroyed = false;
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let lastJourney = 0;
  let lastHorizontal = false;
  let raf = 0;
  let drawn = false;
  let canvasBox: DOMRect | null = null;
  let dockBox: DOMRect | null = null;
  let intro = true;
  let markRequested = false;
  let workerReady = false;
  let copy0: Rect4 = [0, 0, -1, -1];
  let copy1: Rect4 = [0, 0, -1, -1];
  let copy2: Rect4 = [0, 0, -1, -1];
  const start = performance.now();
  const introUntil = start + 2400;
  const empty: Rect4 = [0, 0, -1, -1];

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

  const isPaused = () => hidden || offscreen || reduced;

  let overlaySrc = "";
  let overlayAssigned = false;
  let lastMark = "";
  let lastLogo = "";

  const worker = new Worker(new URL("./logo-galaxy-worker.ts", import.meta.url));

  const post = (msg: Record<string, unknown>, transfer?: Transferable[]) => {
    if (destroyed) return;
    if (transfer) worker.postMessage(msg, transfer);
    else worker.postMessage(msg);
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
    const padX = 32;
    const padY = 28;
    return [
      r.left - canvasBox.left - padX,
      r.top - canvasBox.top - padY,
      r.right - canvasBox.left + padX,
      r.bottom - canvasBox.top + padY,
    ];
  };

  const refreshCopy = () => {
    if (!canvasBox) return;
    copy0 = copyRect(copyTitle);
    copy1 = copyRect(copyBottom);
    copy2 = copyRect(copySocials);
  };

  const sizeFromBox = () => {
    const next = canvasBox ?? canvas.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(next.width));
    const h = Math.max(1, Math.round(next.height));
    return { w, h, nextDpr };
  };

  const applyLogoCss = (logo: LogoBox, assemble: number) => {
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
  };

  const requestMark = () => {
    if (markRequested) return;
    markRequested = true;
    markImage.src = MARK_SRC;
  };

  const sendFrame = (now: number) => {
    if (!workerReady || isPaused()) return;
    drawn = true;
    const assemble = assembleT(lastJourney);
    if (assemble > 0.42 || lastJourney > 0.55 || reduced) {
      requestMark();
      ensureOverlay();
    }
    const logo = logoRect(cssW, cssH, dockBox, canvasBox, lastHorizontal);
    applyLogoCss(logo, assemble);
    post({
      type: "frame",
      now,
      journey: lastJourney,
      horizontal: lastHorizontal,
      logo,
      copy0,
      copy1,
      copy2,
    });
  };

  const tick = (now: number) => {
    raf = 0;
    if (destroyed || isPaused()) return;
    sendFrame(now);
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

  const bootSize = () => {
    measure();
    const { w, h, nextDpr } = sizeFromBox();
    cssW = w;
    cssH = h;
    dpr = nextDpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    return { w, h, nextDpr };
  };

  worker.addEventListener("message", (event: MessageEvent) => {
    if (event.data?.type === "ready") {
      workerReady = Boolean(event.data.ok);
      if (workerReady && !isPaused()) play();
    }
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      offscreen = !entry.isIntersecting;
      post({ type: "pause", paused: isPaused() });
      if (isPaused()) stop();
      else play();
    },
    { threshold: 0 },
  );
  observer.observe(host);

  const onVisibility = () => {
    hidden = document.hidden;
    post({ type: "pause", paused: isPaused() });
    if (isPaused()) stop();
    else play();
  };
  document.addEventListener("visibilitychange", onVisibility);

  markImage.addEventListener("load", () => {
    if (destroyed) return;
    const finish = () => {
      if (destroyed) return;
      post({ type: "samples", samples: sampleOfficialMark(markImage) });
      overlaySrc = knockOutMark();
      if (reduced) ensureOverlay();
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(finish, { timeout: 2500 });
    } else {
      setTimeout(finish, 0);
    }
  });

  const { w, h, nextDpr } = bootSize();
  const offscreenCanvas = canvas.transferControlToOffscreen();
  post(
    { type: "init", canvas: offscreenCanvas, width: w, height: h, dpr: nextDpr },
    [offscreenCanvas],
  );

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
      post({ type: "pause", paused: isPaused() });
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
      post({ type: "pause", paused: isPaused() });
      if (isPaused()) stop();
      else play();
    },
    resize() {
      measure();
      const size = sizeFromBox();
      cssW = size.w;
      cssH = size.h;
      dpr = size.nextDpr;
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      post({
        type: "resize",
        width: size.w,
        height: size.h,
        dpr: size.nextDpr,
      });
    },
    destroy() {
      destroyed = true;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      markImage.src = "";
      post({ type: "destroy" });
      worker.terminate();
      host.style.removeProperty("--logo-resolved");
      host.style.removeProperty("--logo-x");
      host.style.removeProperty("--logo-y");
      host.style.removeProperty("--logo-size");
    },
  };
}
