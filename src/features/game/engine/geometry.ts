export function normalizeAngle(a: number): number {
  if (!Number.isFinite(a)) return 0;
  const twoPi = Math.PI * 2;
  let v = a % twoPi;
  if (v > Math.PI) v -= twoPi;
  else if (v < -Math.PI) v += twoPi;
  return v;
}

export function angleBetween(x: number, y: number): number {
  return Math.atan2(y, x);
}

export function magnitude(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function unitVector(x: number, y: number): { ux: number; uy: number } {
  const d = Math.hypot(x, y) || 1;
  return { ux: x / d, uy: y / d };
}
