/**
 * Resolve the database connection URL for standalone scripts.
 *
 * Reads the DATABASE env var to pick the right URL:
 *   DATABASE=neon      → NEON_DATABASE_URL
 *   DATABASE=supabase  → DATABASE_URL
 *   (not set)          → whichever is available
 */
export function resolveDatabaseUrl(): string {
  const preference = process.env.DATABASE?.toLowerCase()

  if (preference === 'neon') {
    const url = process.env.NEON_DATABASE_URL
    if (url) return url
  }

  if (preference === 'supabase') {
    const url = process.env.DATABASE_URL
    if (url) return url
  }

  // No preference or preferred URL not set — use whichever is available
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'No database URL found. Set DATABASE_URL or NEON_DATABASE_URL in .env.local'
    )
  }
  return url
}
