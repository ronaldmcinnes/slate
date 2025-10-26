/**
 * Theme utilities for detecting and applying theme preferences
 */

export type Theme = "light" | "dark";

/**
 * Detects the system theme preference
 */
export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resolves a theme preference to an actual theme
 * "system" -> actual system preference
 * "light" or "dark" -> returns as-is
 */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Applies theme class to document root
 */
export function applyTheme(theme: "light" | "dark"): void {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Sets up system theme change listener
 * Returns cleanup function
 */
export function watchSystemTheme(
  callback: (theme: "light" | "dark") => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleChange);

  // Return cleanup function
  return () => mediaQuery.removeEventListener("change", handleChange);
}

/**
 * Gets the current theme from the DOM
 */
export function getCurrentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
