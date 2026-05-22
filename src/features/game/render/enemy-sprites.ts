import type { EnemyKind } from "../types";

interface SpriteCache {
  silhouette: HTMLImageElement | null;
  tinted: Map<string, HTMLCanvasElement>;
}

const SVG_URLS: Record<EnemyKind, string> = {
  shooter: "/assets/enemies/omnic.svg",
  sniper: "/assets/enemies/sniper.svg",
  spreader: "/assets/enemies/spreader.svg",
  phantom: "/assets/enemies/phantom.svg",
  burster: "/assets/enemies/virus.svg",
  spiraler: "/assets/enemies/spiraler.svg",
  charger: "/assets/enemies/drone.svg",
  mortar: "/assets/enemies/mortar.svg",
  boss: "/assets/enemies/core.svg",
  bomber: "/assets/enemies/mortar.svg",
  splitter: "/assets/enemies/virus.svg",
  shard: "/assets/enemies/virus.svg",
};

const cache: Map<EnemyKind, SpriteCache> = new Map();
let initialized = false;

export function preloadEnemySprites(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  (Object.keys(SVG_URLS) as EnemyKind[]).forEach((kind) => {
    const img = new Image();
    img.src = SVG_URLS[kind];
    cache.set(kind, { silhouette: img, tinted: new Map() });
  });
}

const SPRITE_SIZE = 128;

function getTinted(kind: EnemyKind, color: string): HTMLCanvasElement | null {
  const entry = cache.get(kind);
  if (!entry) return null;
  const img = entry.silhouette;
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  const existing = entry.tinted.get(color);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const c = canvas.getContext("2d");
  if (!c) return null;
  c.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  c.drawImage(img, 0, 0, SPRITE_SIZE, SPRITE_SIZE);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = color;
  c.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  c.globalCompositeOperation = "source-over";
  entry.tinted.set(color, canvas);
  return canvas;
}

export function drawEnemySprite(
  c: CanvasRenderingContext2D,
  kind: EnemyKind,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  opacity: number,
  glowAmount: number,
): boolean {
  const tinted = getTinted(kind, color);
  if (!tinted) return false;
  const size = radius * 2.4;
  c.save();
  c.globalAlpha = opacity;
  c.shadowColor = color;
  c.shadowBlur = glowAmount;
  c.drawImage(tinted, cx - size / 2, cy - size / 2, size, size);
  c.restore();
  return true;
}
