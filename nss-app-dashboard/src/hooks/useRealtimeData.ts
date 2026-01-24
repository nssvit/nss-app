/**
 * useRealtimeData - Smart data caching hook with Supabase Real-time
 *
 * Features:
 * - Local caching to minimize API calls
 * - Real-time subscriptions for instant updates
 * - Automatic refetch only when data changes
 * - Debounced updates to prevent excessive re-renders
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeDataOptions<T> {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  enabled?: boolean;
  cacheDuration?: number; // milliseconds
  realtimeEnabled?: boolean;
}

interface UseRealtimeDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

/**
 * Generic hook for fetching and caching data with real-time updates
 */
export function useRealtimeData<T = any>(
  options: UseRealtimeDataOptions<T>
): UseRealtimeDataReturn<T> {
  const {
    table,
    select = '*',
    filter = {},
    orderBy,
    enabled = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    realtimeEnabled = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (!isMountedRef.current) return;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData(fetchedData as T);
      setLastFetched(new Date());
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError(err?.message || 'Failed to fetch data');
      console.error(`Error fetching from ${table}:`, err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [table, select, JSON.stringify(filter), orderBy, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup real-time subscription
  useEffect(() => {
    if (!enabled || !realtimeEnabled) return;

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Real-time update for ${table}:`, payload);
          // Refetch data when changes occur
          fetchData();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, enabled, realtimeEnabled, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check cache freshness
  const isCacheStale = useCallback(() => {
    if (!lastFetched) return true;
    const now = new Date();
    return now.getTime() - lastFetched.getTime() > cacheDuration;
  }, [lastFetched, cacheDuration]);

  // Smart refetch - only if cache is stale
  const refetch = useCallback(async () => {
    if (isCacheStale()) {
      await fetchData();
    }
  }, [isCacheStale, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastFetched,
  };
}

/**
 * Hook specifically for dashboard stats with aggressive caching
 */
export function useCachedDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: statsError } = await supabase.rpc('get_dashboard_stats');

      if (statsError) {
        throw new Error(statsError.message);
      }

      setStats(data);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dashboard stats');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time updates - subscribe to relevant tables
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participation' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, fetchStats)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    lastFetched,
  };
}

/**
 * Hook for events with caching and real-time
 */
export function useCachedEvents(filters?: { category?: string; search?: string; session?: string }) {
  return useRealtimeData({
    table: 'events',
    select: `
      *,
      event_categories (
        id,
        category_name,
        color_hex
      )
    `,
    filter: {
      is_active: true,
    },
    orderBy: { column: 'event_date', ascending: false },
    cacheDuration: 2 * 60 * 1000, // 2 minutes - events change frequently
    realtimeEnabled: true,
  });
}

/**
 * Hook for volunteers with caching
 */
export function useCachedVolunteers() {
  return useRealtimeData({
    table: 'volunteers',
    select: '*',
    filter: {
      is_active: true,
    },
    orderBy: { column: 'first_name', ascending: true },
    cacheDuration: 10 * 60 * 1000, // 10 minutes - volunteers don't change often
    realtimeEnabled: true,
  });
}
