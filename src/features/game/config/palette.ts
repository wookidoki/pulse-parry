export const PALETTE = {
  bg: "#05030a",
  fg: "#f0f6ff",
  magenta: "#ff2bd6",
  cyan: "#1cf0ff",
  yellow: "#f7ff3a",
  red: "#ff3863",
  purple: "#b14bff",
} as const;

export type PaletteKey = keyof typeof PALETTE;
