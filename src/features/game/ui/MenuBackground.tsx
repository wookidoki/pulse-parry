"use client";

import { useEffect, useRef } from "react";
import styles from "./MenuBackground.module.css";

export function MenuBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();

    const draw = (t: number) => {
      const nowMs = t - start;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#05030a";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radial = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, Math.max(w, h) * 0.7);
      radial.addColorStop(0, "rgba(255, 43, 214, 0.18)");
      radial.addColorStop(0.5, "rgba(28, 240, 255, 0.08)");
      radial.addColorStop(1, "rgba(5, 3, 10, 0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);

      const drift = (nowMs * 0.01) % 40;
      ctx.strokeStyle = "rgba(28, 240, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = -drift; x <= w + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -drift; y <= h + 40; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const lineCount = 14;
      const phase = (nowMs * 0.035) % 1;
      ctx.strokeStyle = "rgba(247, 255, 58, 0.06)";
      for (let i = 0; i < lineCount; i++) {
        const a = (i / lineCount) * Math.PI * 2;
        const r0 = 100 + phase * 200;
        const r1 = r0 + 40;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }

      const pulse = 0.4 + Math.sin(nowMs / 800) * 0.2;
      const ringR = 180 + pulse * 30;
      ctx.strokeStyle = `rgba(28, 240, 255, ${0.08 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.bg} />;
}
