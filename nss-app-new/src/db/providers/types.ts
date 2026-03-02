import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../schema'

/** A configured Drizzle instance */
export type DbInstance = PostgresJsDatabase<typeof schema>

/** Provider name — plain string so adding/removing providers needs no type changes */
export type DbProviderName = string

/** Configuration for a single database provider */
export interface DbProviderConfig {
  name: string
  displayName: string
  db: DbInstance
}
