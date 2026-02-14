'use client'

import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="pwa-button group focus-visible relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 hover:bg-gray-400 focus:outline-none"
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5">
        <i
          className={`fas fa-sun absolute inset-0 transform transition-all duration-500 ${
            theme === 'light'
              ? 'rotate-0 text-yellow-500 opacity-100 group-hover:text-black'
              : 'rotate-90 opacity-0'
          }`}
        ></i>
        <i
          className={`fas fa-moon absolute inset-0 transform transition-all duration-500 ${
            theme === 'dark'
              ? 'rotate-0 text-indigo-400 opacity-100 group-hover:text-black'
              : '-rotate-90 opacity-0'
          }`}
        ></i>
      </div>
    </button>
  )
}
