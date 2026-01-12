/**
 * Supabase Real-Time Subscription Utilities
 * Provides reusable functions for setting up real-time subscriptions
 */

import { supabase } from './supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Subscribe to changes in a specific table
 */
export function subscribeToTable<T = any>(
  tableName: string,
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void,
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void,
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel {
  const channel = supabase.channel(`${tableName}_changes`)

  if (onInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
      },
      onInsert
    )
  }

  if (onUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: tableName,
      },
      onUpdate
    )
  }

  if (onDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: tableName,
      },
      onDelete
    )
  }

  channel.subscribe()

  return channel
}

/**
 * Subscribe to multiple tables with a single callback
 */
export function subscribeToTables(
  tableNames: string[],
  onChange: () => void
): RealtimeChannel[] {
  return tableNames.map((tableName) => {
    const channel = supabase.channel(`${tableName}_multi_changes`)

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        onChange
      )
      .subscribe()

    return channel
  })
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel)
}

/**
 * Unsubscribe from multiple channels
 */
export async function unsubscribeAll(
  channels: RealtimeChannel[]
): Promise<void> {
  await Promise.all(channels.map((channel) => supabase.removeChannel(channel)))
}

/**
 * Subscribe to specific row changes using filters
 */
export function subscribeToRow<T = any>(
  tableName: string,
  filter: string, // e.g., 'id=eq.123'
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel {
  const channel = supabase.channel(`${tableName}_row_${filter}`)

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter,
      },
      onChange
    )
    .subscribe()

  return channel
}

/**
 * Hook-friendly real-time subscription setup
 * Returns cleanup function for useEffect
 */
export function setupRealtimeSubscription(
  tables: string[],
  onDataChange: () => void
): () => void {
  const channels = subscribeToTables(tables, onDataChange)

  // Return cleanup function
  return () => {
    unsubscribeAll(channels)
  }
}

/**
 * Debounced real-time updates
 * Useful for preventing too many re-renders
 */
export function setupDebouncedSubscription(
  tables: string[],
  onDataChange: () => void,
  debounceMs: number = 500
): () => void {
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedCallback = () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(onDataChange, debounceMs)
  }

  const channels = subscribeToTables(tables, debouncedCallback)

  // Return cleanup function
  return () => {
    if (timeoutId) clearTimeout(timeoutId)
    unsubscribeAll(channels)
  }
}
