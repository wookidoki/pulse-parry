const LAYER_COUNT = 5;
const layerImages: HTMLImageElement[] = [];
let initialized = false;

export function preloadParallax(): void {
  if (initialized || typeof window === "undefined") return;
  for (let i = 1; i <= LAYER_COUNT; i++) {
    const img = new Image();
    img.src = `/assets/bg/layer${i}.png`;
    layerImages.push(img);
  }
  initialized = true;
}

export function drawParallaxLayers(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
): void {
  if (layerImages.length === 0) return;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;

  for (let i = 0; i < layerImages.length; i++) {
    const img = layerImages[i];
    if (!img.complete || img.naturalWidth === 0) continue;

    const speed = 0.012 + i * 0.018;
    const scale = h / img.naturalHeight;
    const scaledW = img.naturalWidth * scale;
    const scroll = (nowMs * speed) % scaledW;

    const yOffset = (LAYER_COUNT - 1 - i) * 4;
    let x = -scroll;
    while (x < w + scaledW) {
      c.drawImage(img, Math.floor(x), -yOffset, scaledW, h + yOffset);
      x += scaledW;
    }
  }
  c.imageSmoothingEnabled = prev;
}
