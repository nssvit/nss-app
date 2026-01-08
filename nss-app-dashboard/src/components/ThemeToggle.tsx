"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="pwa-button group relative h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-400 focus:outline-none focus-visible"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <i
          className={`fas fa-sun absolute inset-0 transform transition-all duration-500 ${theme === "light"
            ? "rotate-0 opacity-100 text-yellow-500 group-hover:text-black"
            : "rotate-90 opacity-0"
            }`}
        ></i>
        <i
          className={`fas fa-moon absolute inset-0 transform transition-all duration-500 ${theme === "dark"
            ? "rotate-0 opacity-100 text-indigo-400 group-hover:text-black"
            : "-rotate-90 opacity-0"
            }`}
        ></i>
      </div>
    </button>
  );
}
