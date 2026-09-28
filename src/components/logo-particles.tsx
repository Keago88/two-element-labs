"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type LogoParticlesHandle = { setProgress: (progress: number) => void };
type Particle = {
  x: number;
  y: number;
  angle: number;
  radius: number;
  depth: number;
  delay: number;
  brightness: number;
  warm: boolean;
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const random = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/** Samples the supplied logo itself. No generated artwork or replacement mark. */
export const LogoParticles = forwardRef<LogoParticlesHandle>(
  function LogoParticles(_, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const progress = useRef(0);
    const render = useRef<() => void>(() => {});
    useImperativeHandle(
      ref,
      () => ({
        setProgress(value) {
          progress.current = clamp(value);
          render.current();
        },
      }),
      [],
    );

    useEffect(() => {
      const element = canvas.current;
      if (!element) return;
      const context = element.getContext("2d", { alpha: false });
      if (!context) return;
      const source = new window.Image();
      let disposed = false;
      let particles: Particle[] = [];
      let width = 0,
        height = 0,
        frame = 0;
      let pointerX = 0,
        pointerY = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      const stamp = document.createElement("canvas");
      stamp.width = stamp.height = 384;
      const ink = stamp.getContext("2d", { willReadFrequently: true });
      const glow = document.createElement("canvas");
      glow.width = glow.height = 32;
      const glowContext = glow.getContext("2d");
      if (glowContext) {
        const gradient = glowContext.createRadialGradient(
          16,
          16,
          0,
          16,
          16,
          16,
        );
        gradient.addColorStop(0, "rgba(255,255,255,.65)");
        gradient.addColorStop(0.2, "rgba(208,227,240,.18)");
        gradient.addColorStop(1, "rgba(208,227,240,0)");
        glowContext.fillStyle = gradient;
        glowContext.fillRect(0, 0, 32, 32);
      }
      const draw = () => {
        frame = 0;
        if (!width || !height || !particles.length || disposed) return;
        const p = reduced.matches ? 1 : progress.current;
        const finish = smooth((p - 0.94) / 0.06);
        const mobile = height < 300;
        const size = Math.min(width * 0.74, height * (mobile ? 0.59 : 0.72));
        const cx = width / 2,
          cy = height * (mobile ? 0.42 : 0.46);
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = 1;
        context.fillStyle = "#05080b";
        context.fillRect(0, 0, width, height);

        const step = mobile ? 2 : 1;
        for (let i = 0; i < particles.length && finish < 1; i += step) {
          const part = particles[i];
          const t = smooth((p - part.delay) / (1 - part.delay));
          const spread = 1 - t;
          const angle = part.angle + p * (1.2 + part.depth * 0.7);
          const perspective = 1 / (1 + part.depth * 0.55 * spread);
          const sx = Math.cos(angle) * part.radius * width * 0.45;
          const sy = Math.sin(angle) * part.radius * height * 0.44;
          const arc = Math.sin(t * Math.PI) * part.depth;
          const x =
            cx +
            (sx * spread + part.x * size * t + arc * size * 0.23) *
              perspective +
            pointerX * part.depth * spread;
          const y =
            cy +
            (sy * spread + part.y * size * t - arc * size * 0.17) *
              perspective +
            pointerY * part.depth * spread;
          const pixel = mobile ? 0.65 : 0.8 + (part.depth + 0.6) * 0.75;
          const shardSize = pixel * perspective * (1 - t) + (size / 192) * t;
          context.globalAlpha = (0.35 + part.brightness * 0.65) * (1 - finish);
          context.fillStyle = part.warm && p < 0.82 ? "#f6aa83" : "#eaf3fa";
          context.fillRect(
            x - shardSize / 2,
            y - shardSize / 2,
            shardSize,
            shardSize * (1 + spread * 0.35),
          );
          if (i % 19 === 0 && spread > 0.02) {
            context.globalAlpha = spread * 0.45 * (1 - finish);
            const diameter = shardSize * 9;
            context.drawImage(
              glow,
              x - diameter / 2,
              y - diameter / 2,
              diameter,
              diameter,
            );
          }
        }
        if (finish > 0) {
          context.globalAlpha = finish;
          context.globalCompositeOperation = "screen";
          context.drawImage(stamp, cx - size / 2, cy - size / 2, size, size);
        }
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
        element.dataset.progress = p.toFixed(3);
        element.dataset.particles = String(Math.ceil(particles.length / step));
      };
      const queue = () => {
        if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
      };
      render.current = queue;
      const resize = () => {
        const bounds = element.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        element.width = Math.round(width * dpr);
        element.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        queue();
      };
      const pointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || reduced.matches) return;
        pointerX = (event.clientX / window.innerWidth - 0.5) * 20;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 20;
        queue();
      };
      source.onload = () => {
        if (!ink || disposed) return;
        // Find the white mark's bounds, excluding the empty black source margins.
        const scan = document.createElement("canvas");
        scan.width = 512;
        scan.height = Math.round((512 * source.height) / source.width);
        const scanContext = scan.getContext("2d", { willReadFrequently: true });
        if (!scanContext) return;
        scanContext.drawImage(source, 0, 0, scan.width, scan.height);
        const data = scanContext.getImageData(
          0,
          0,
          scan.width,
          scan.height,
        ).data;
        let minX = scan.width,
          minY = scan.height,
          maxX = 0,
          maxY = 0;
        for (let y = 0; y < scan.height; y++)
          for (let x = 0; x < scan.width; x++) {
            const at = (y * scan.width + x) * 4;
            if (data[at] > 65 && data[at + 3] > 128) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        const ratio = source.width / scan.width;
        const cropW = (maxX - minX + 2) * ratio,
          cropH = (maxY - minY + 2) * ratio;
        const scale = 350 / Math.max(cropW, cropH);
        ink.fillStyle = "#000";
        ink.fillRect(0, 0, 384, 384);
        ink.drawImage(
          source,
          (minX - 1) * ratio,
          (minY - 1) * ratio,
          cropW,
          cropH,
          (384 - cropW * scale) / 2,
          (384 - cropH * scale) / 2,
          cropW * scale,
          cropH * scale,
        );
        const pixels = ink.getImageData(0, 0, 384, 384).data;
        particles = [];
        for (let y = 0; y < 384; y += 2)
          for (let x = 0; x < 384; x += 2) {
            const at = (y * 384 + x) * 4;
            const brightness =
              Math.max(pixels[at], pixels[at + 4], pixels[at + 384 * 4] || 0) /
              255;
            if (brightness < 0.16) continue;
            const i = particles.length + 1;
            const radius = 0.15 + Math.sqrt(random(i + 2)) * 0.94;
            particles.push({
              x: x / 384 - 0.5,
              y: y / 384 - 0.5,
              angle: i * 2.399963 + radius * 4,
              radius,
              depth: random(i + 9) * 1.2 - 0.6,
              delay: random(i + 5) * 0.22,
              brightness,
              warm: random(i + 16) > 0.87,
            });
          }
        resize();
      };
      source.onerror = () => {
        if (!disposed) element.dataset.failed = "true";
      };
      source.src = "/images/two-element-official.png";
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      window.addEventListener("pointermove", pointer, { passive: true });
      document.addEventListener("visibilitychange", queue);
      reduced.addEventListener("change", queue);
      resize();
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        render.current = () => {};
        source.onload = null;
        source.onerror = null;
        window.removeEventListener("pointermove", pointer);
        document.removeEventListener("visibilitychange", queue);
        reduced.removeEventListener("change", queue);
      };
    }, []);

    return (
      <canvas ref={canvas} className="logo-particles" aria-hidden="true" />
    );
  },
);
