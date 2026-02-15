'use client'

import { useState, useEffect } from 'react'

/**
 * Hook that returns whether a CSS media query matches.
 * Returns false during SSR to avoid hydration mismatch.
 *
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 767px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
