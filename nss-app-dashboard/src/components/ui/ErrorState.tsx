/**
 * Error State Component
 * Displays helpful error messages with actionable instructions
 */

interface ErrorStateProps {
  error: string
  retry?: () => void
}

export function ErrorState({ error, retry }: ErrorStateProps) {
  const isFunctionNotFound =
    error.includes('Database functions not found') || error.includes('does not exist')

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="card-glass w-full max-w-2xl rounded-xl p-8 text-center">
        {/* Error Icon */}
        <div className="mb-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <i className="fas fa-exclamation-triangle text-3xl text-red-400"></i>
          </div>
        </div>

        {/* Error Title */}
        <h3 className="text-heading-3 mb-3 text-red-400">
          {isFunctionNotFound ? 'Database Setup Required' : 'Error Loading Data'}
        </h3>

        {/* Error Message */}
        <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>

        {/* Instructions for function not found */}
        {isFunctionNotFound && (
          <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-left">
            <h4 className="mb-2 text-sm font-semibold text-blue-400">
              <i className="fas fa-info-circle mr-2"></i>
              Setup Instructions
            </h4>
            <ol className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>1. Open your Supabase Dashboard</li>
              <li>2. Go to SQL Editor (left sidebar)</li>
              <li>
                3. Copy the contents of{' '}
                <code className="rounded bg-gray-800 px-2 py-1 text-xs">
                  db/supabase_functions.sql
                </code>
              </li>
              <li>4. Paste and click "Run"</li>
              <li>5. Refresh this page</li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {retry && (
            <button onClick={retry} className="btn btn-md btn-primary">
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>
          )}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-md btn-secondary"
          >
            <i className="fas fa-external-link-alt mr-2"></i>
            Open Supabase
          </a>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 border-t border-gray-700/30 pt-6">
          <p className="text-caption mb-2">Need help? Check the integration guide:</p>
          <code className="rounded bg-gray-800 px-3 py-1 text-xs">
            DATABASE_INTEGRATION_COMPLETE.md
          </code>
        </div>
      </div>
    </div>
  )
}
