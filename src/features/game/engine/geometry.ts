export function normalizeAngle(a: number): number {
  let v = a;
  while (v > Math.PI) v -= Math.PI * 2;
  while (v < -Math.PI) v += Math.PI * 2;
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
