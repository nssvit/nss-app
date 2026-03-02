import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema'
import { registerProvider } from './registry'

const url = process.env.NEON_DATABASE_URL
if (url) {
  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
    max_lifetime: 60 * 5,
    prepare: false,
    connection: { application_name: 'nss-app-neon' },
  })
  registerProvider({
    name: 'neon',
    displayName: 'Neon',
    db: drizzle(client, { schema }),
  })
}
