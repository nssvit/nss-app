"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR
    return (
      <button
        className="pwa-button action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible"
        aria-label="Toggle theme"
        disabled
      >
        <i className="fas fa-sun text-base"></i>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="pwa-button action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <i className="fas fa-sun text-base"></i>
      ) : (
        <i className="fas fa-moon text-base"></i>
      )}
    </button>
  );
}
