export interface ThemePreset {
  label: string;
  hue: number;
}

export const THEME_PRESETS: ThemePreset[] = [
  { label: "抹茶", hue: 155 },
  { label: "空", hue: 220 },
  { label: "山吹", hue: 70 },
  { label: "桜", hue: 350 },
  { label: "藤", hue: 290 },
  { label: "珊瑚", hue: 25 },
];

export const THEME_HUE_KEY = "theme-hue";

export function applyThemeHue(hue: number, save = true) {
  const r = document.documentElement;
  r.style.setProperty("--primary", `oklch(0.55 0.08 ${hue})`);
  r.style.setProperty("--primary-foreground", `oklch(0.98 0.005 ${hue})`);
  r.style.setProperty("--ring", `oklch(0.55 0.08 ${hue})`);
  r.style.setProperty("--accent", `oklch(0.92 0.02 ${hue})`);
  r.style.setProperty("--accent-foreground", `oklch(0.3 0.04 ${hue})`);
  r.style.setProperty("--sage", `oklch(0.55 0.08 ${hue})`);
  r.style.setProperty("--sidebar-primary", `oklch(0.55 0.08 ${hue})`);
  r.style.setProperty("--sidebar-ring", `oklch(0.55 0.08 ${hue})`);
  if (save) localStorage.setItem(THEME_HUE_KEY, String(hue));
}

/** hue (0-360) → CSS-usable hex string for <input type="color"> */
export function hueToHex(hue: number): string {
  const h = hue / 360;
  const s = 0.65;
  const l = 0.5;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** hex → hue (0-360) */
export function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round((h / 6) * 360);
}

export function loadSavedTheme() {
  const saved = localStorage.getItem(THEME_HUE_KEY);
  if (saved !== null) {
    applyThemeHue(Number(saved), false);
  }
}
