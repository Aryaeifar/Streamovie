export const themes = ["midnight", "aurora", "ocean", "sunset", "candy", "noir"] as const;

export type ThemeId = (typeof themes)[number];

export const defaultTheme: ThemeId = "midnight";

/** Preview colors used by the settings swatches (kept in sync with globals.css). */
export const themeSwatches: Record<ThemeId, { from: string; to: string; surface: string }> = {
  midnight: { from: "#a78bfa", to: "#d946ef", surface: "#06060b" },
  aurora: { from: "#34d399", to: "#22d3ee", surface: "#04090a" },
  ocean: { from: "#38bdf8", to: "#6366f1", surface: "#04070f" },
  sunset: { from: "#fb923c", to: "#f43f5e", surface: "#0b0704" },
  candy: { from: "#f472b6", to: "#a855f7", surface: "#0b050c" },
  noir: { from: "#a1a1aa", to: "#71717a", surface: "#0a0a0a" },
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (themes as readonly string[]).includes(value);
}
