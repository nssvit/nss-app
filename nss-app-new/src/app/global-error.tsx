'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  const isDbError = error.message?.includes('database') || error.message?.includes('DATABASE_URL')

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '28rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{ fontSize: '3rem' }}>500</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              {isDbError ? 'Database Connection Failed' : 'Server Error'}
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              {isDbError
                ? 'Could not connect to the database. Please check that DATABASE_URL or NEON_DATABASE_URL is set in your environment variables.'
                : 'An unexpected error occurred. Please try again or contact the administrator if this persists.'}
            </p>
            {error.digest && (
              <p style={{ color: '#52525b', fontSize: '0.75rem', margin: 0 }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid #27272a',
                backgroundColor: 'transparent',
                color: '#fafafa',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
