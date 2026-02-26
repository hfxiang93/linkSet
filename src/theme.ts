/*
 * @Descripttion:
 * @Author: xianghaifeng
 * @Date: 2026-02-26 14:46:43
 * @LastEditors: xianghaifeng
 * @LastEditTime: 2026-02-26 14:48:05
 */
export type ThemeMode = "system" | "light" | "dark" | "custom";

export type ThemeVars = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

export type ThemeConfig = {
  mode: ThemeMode;
  custom?: ThemeVars;
};

const KEY = "linkset:theme";

const LIGHT: ThemeVars = {
  bg: "#f6f7f9",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  accent: "#4f71ff",
};

const DARK: ThemeVars = {
  bg: "#0f1115",
  card: "#1a1f29",
  border: "#2a2f3a",
  text: "#e6e8eb",
  muted: "#9aa0a6",
  accent: "#4f71ff",
};

export function loadTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { mode: "system" };
    const cfg = JSON.parse(raw);
    return { mode: cfg.mode || "system", custom: cfg.custom };
  } catch {
    return { mode: "system" };
  }
}

export function saveTheme(cfg: ThemeConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

function systemPrefersDark(): boolean {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function pickVars(cfg: ThemeConfig): ThemeVars {
  if (cfg.mode === "custom" && cfg.custom) return cfg.custom;
  if (cfg.mode === "light") return LIGHT;
  if (cfg.mode === "dark") return DARK;
  return systemPrefersDark() ? DARK : LIGHT;
}

export function applyTheme(cfg: ThemeConfig) {
  const v = pickVars(cfg);
  const root = document.documentElement;
  root.style.setProperty("--bg", v.bg);
  root.style.setProperty("--card", v.card);
  root.style.setProperty("--border", v.border);
  root.style.setProperty("--text", v.text);
  root.style.setProperty("--muted", v.muted);
  root.style.setProperty("--accent", v.accent);
}

export function exportTheme(cfg: ThemeConfig) {
  const blob = new Blob([JSON.stringify(cfg, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "linkset-theme.json";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importTheme(file: File): Promise<ThemeConfig | null> {
  const text = await file.text();
  try {
    const obj = JSON.parse(text);
    if (!obj || typeof obj !== "object") return null;
    if (!obj.mode) obj.mode = "custom";
    return obj as ThemeConfig;
  } catch {
    return null;
  }
}
