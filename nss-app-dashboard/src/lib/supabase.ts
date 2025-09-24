import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Use NEXT_PUBLIC_ prefixed variables for client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabase configuration loaded

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables.
    NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Missing'}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Found' : 'Missing'}

    Please ensure your .env.local file contains:
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type SupabaseClient = typeof supabase