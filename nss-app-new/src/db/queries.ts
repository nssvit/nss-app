/**
 * Drizzle ORM Type-Safe Queries
 *
 * This file re-exports from the modular queries directory.
 * For new code, prefer importing directly from '@/db/queries' or specific modules:
 *
 * ```typescript
 * import { getDashboardStats } from '@/db/queries/dashboard'
 * import { getVolunteerById } from '@/db/queries/volunteers'
 * ```
 *
 * The `queries` namespace is maintained for backward compatibility.
 */

export * from './queries/index'
export { queries, default } from './queries/index'
