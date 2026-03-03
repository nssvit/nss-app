/**
 * Error Sanitization Utility
 *
 * Prevents leaking internal DB/SQL details to the user.
 * Server actions throw raw errors (including Postgres/Drizzle messages);
 * this utility detects those and replaces them with safe, generic messages.
 *
 * Usage in components:
 *   catch (err) {
 *     toast.error(getErrorMessage(err))
 *   }
 */

/** Patterns that indicate an internal/database error that must NOT be shown to the user */
const INTERNAL_ERROR_PATTERNS = [
  // Postgres / SQL errors
  /relation ".*" does not exist/i,
  /column ".*" (does not exist|of relation)/i,
  /duplicate key value violates unique constraint/i,
  /violates foreign key constraint/i,
  /violates not-null constraint/i,
  /violates check constraint/i,
  /syntax error at or near/i,
  /unterminated quoted string/i,
  /invalid input syntax/i,
  /deadlock detected/i,
  /could not serialize access/i,
  /canceling statement due to/i,
  /prepared statement .* already exists/i,
  /current transaction is aborted/i,

  // Connection / network errors
  /connection refused/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /timeout exceeded/i,
  /too many connections/i,
  /connection terminated/i,
  /SSL connection/i,
  /remaining connection slots/i,

  // Drizzle / ORM internals
  /DrizzleError/i,
  /NeonDbError/i,
  /PostgresError/i,

  // Raw SQL fragments (SELECT/INSERT/UPDATE/DELETE as standalone keywords at word boundaries)
  /\bSELECT\b.*\bFROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\b.*\bSET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bCREATE\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,

  // Stack trace fragments
  /at\s+\w+\s+\(.*:\d+:\d+\)/,
  /node_modules\//,
]

/** Known safe prefixes — these are intentional user-facing messages */
const SAFE_PREFIXES = [
  'Unauthorized',
  'Not found',
  'Already',
  'Invalid status transition',
  'Cannot',
  'Event not found',
  'User account not found',
  'Failed to create volunteer',
  'Volunteer not found',
  'No active volunteer',
]

/**
 * Extract a user-safe error message from any thrown value.
 *
 * - Database / SQL errors → generic "Server error" message
 * - Known safe errors (auth, validation, business logic) → original message
 * - Unknown long messages → generic fallback (likely stack traces)
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof Error)) return fallback

  const msg = error.message

  // Empty message
  if (!msg || msg.trim().length === 0) return fallback

  // Check if it's a known safe message
  if (SAFE_PREFIXES.some((prefix) => msg.startsWith(prefix))) {
    return msg
  }

  // Check for internal/DB error patterns → hide from user
  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg))) {
    console.error('[sanitized error]', msg)
    return 'A server error occurred. Please try again later.'
  }

  // Very long messages are likely internal (stack traces, SQL dumps)
  if (msg.length > 300) {
    console.error('[sanitized error - long message]', msg)
    return 'A server error occurred. Please try again later.'
  }

  // Otherwise, allow the message through (business logic errors)
  return msg
}
