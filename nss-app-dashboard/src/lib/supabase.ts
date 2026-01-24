import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables.
    NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Missing'}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Found' : 'Missing'}

    Please ensure your .env.local file contains:
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`)
}

/**
 * Browser Supabase Client (Singleton)
 *
 * Note: We use Drizzle ORM for database queries via Server Actions.
 * This client is primarily used for authentication.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type SupabaseClient = typeof supabase