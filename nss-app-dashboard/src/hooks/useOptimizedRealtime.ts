/**
 * Optimized Realtime Hook using Supabase Broadcast
 *
 * Performance: <10ms latency (vs 40-50ms with postgres_changes)
 *
 * Based on Supabase recommendations:
 * - Broadcast is faster than postgres_changes for high-throughput scenarios
 * - Postgres_changes uses single-threaded processing
 * - Broadcast delivers messages directly to nearby clients
 *
 * Sources:
 * - https://supabase.com/docs/guides/realtime/benchmarks
 * - https://github.com/orgs/supabase/discussions/28853
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface BroadcastPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record?: any
  old_record?: any
}

interface UseOptimizedRealtimeOptions {
  tables: string[]
  enabled?: boolean
  onUpdate: () => void
  debounceMs?: number
}

/**
 * High-performance realtime hook using Broadcast instead of postgres_changes
 *
 * Why Broadcast is faster:
 * - Direct delivery to clients (no single-threaded queue)
 * - No Row Level Security (RLS) checks per event
 * - Optimized for low latency (<10ms vs 40-50ms)
 * - Better scaling for multiple concurrent users
 */
export function useOptimizedRealtime({
  tables,
  enabled = true,
  onUpdate,
  debounceMs = 500,
}: UseOptimizedRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    console.log('[useOptimizedRealtime] Setting up Broadcast subscriptions for:', tables)

    // Create a single channel for all table broadcasts
    const channel = supabase.channel('optimized-realtime')

    // Subscribe to broadcast events for each table
    tables.forEach((table) => {
      channel.on(
        'broadcast',
        { event: `${table}-change` },
        (payload) => {
          if (!isMountedRef.current) return

          console.log(`[useOptimizedRealtime] Broadcast received for ${table}:`, payload)

          // Debounce updates to prevent excessive re-renders
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
          }

          debounceTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onUpdate()
            }
          }, debounceMs)
        }
      )
    })

    channel.subscribe((status) => {
      console.log('[useOptimizedRealtime] Subscription status:', status)
    })

    channelRef.current = channel

    return () => {
      console.log('[useOptimizedRealtime] Cleaning up subscriptions')
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [tables, enabled, onUpdate, debounceMs])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    channel: channelRef.current,
  }
}

/**
 * Server-side trigger function to broadcast changes
 *
 * Add this to your database:
 *
 * CREATE OR REPLACE FUNCTION broadcast_changes()
 * RETURNS TRIGGER AS $$
 * DECLARE
 *   payload json;
 * BEGIN
 *   IF (TG_OP = 'DELETE') THEN
 *     payload = json_build_object(
 *       'type', TG_OP,
 *       'table', TG_TABLE_NAME,
 *       'old_record', row_to_json(OLD)
 *     );
 *   ELSE
 *     payload = json_build_object(
 *       'type', TG_OP,
 *       'table', TG_TABLE_NAME,
 *       'record', row_to_json(NEW)
 *     );
 *   END IF;
 *
 *   PERFORM pg_notify(TG_TABLE_NAME || '-change', payload::text);
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * -- Then create triggers for each table:
 * CREATE TRIGGER events_broadcast_trigger
 *   AFTER INSERT OR UPDATE OR DELETE ON events
 *   FOR EACH ROW EXECUTE FUNCTION broadcast_changes();
 */
