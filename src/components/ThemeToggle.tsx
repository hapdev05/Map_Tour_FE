"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-[200] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-lg shadow-md backdrop-blur-sm transition hover:scale-105 dark:border-white/15 dark:bg-slate-900/90"
      title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
      aria-label={theme === "dark" ? "Bật giao diện sáng" : "Bật giao diện tối"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
