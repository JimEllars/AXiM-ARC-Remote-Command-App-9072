import { useCallback, useEffect, useState } from 'react';
import {
  hasSupabaseConfiguration,
  supabaseClient
} from '../services/supabaseClient';
import { localHitlQueue } from '../services/localDemoData';

export function useHitlQueue(previewMode = false) {
  const [queue, setQueue] = useState(
    previewMode ? localHitlQueue : []
  );
  const [loading, setLoading] = useState(
    !previewMode && hasSupabaseConfiguration
  );
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchQueue = useCallback(async () => {
    if (previewMode) {
      setQueue(localHitlQueue);
      setLoading(false);
      return;
    }

    if (!hasSupabaseConfiguration) {
      setQueue(localHitlQueue);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: queryError } = await supabaseClient
      .from('hitl_audit_logs')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setQueue(localHitlQueue);
    } else {
      setQueue(data || []);
    }

    setLoading(false);
  }, [previewMode]);

  useEffect(() => {
    fetchQueue();

    if (previewMode || !hasSupabaseConfiguration) return undefined;

    const channel = supabaseClient
      .channel('arc-hitl-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hitl_audit_logs' },
        ({ eventType, new: nextItem, old: previousItem }) => {
          if (eventType === 'INSERT' && nextItem.status === 'Pending') {
            setQueue((current) => [nextItem, ...current]);
          }

          if (eventType === 'UPDATE' && nextItem.status !== 'Pending') {
            setQueue((current) => current.filter((item) => item.id !== nextItem.id));
          }

          if (eventType === 'DELETE') {
            setQueue((current) => current.filter(
              (item) => item.id !== previousItem.id
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [fetchQueue, previewMode]);

  useEffect(() => {
    const handleOnline = async () => {
      const cached = localStorage.getItem('arc_offline_actions');
      if (cached) {
        try {
          const actions = JSON.parse(cached);
          if (actions.length > 0) {
            setSyncing(true);

            for (const action of actions) {
                await fetch('/api/remote/hitl-resolve', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(action)
                }).catch(() => null); // suppress errors during background sync
            }

            localStorage.removeItem('arc_offline_actions');
            setSyncing(false);

            // Re-fetch queue to make sure it's accurate
            fetchQueue();

            // Dispatch a custom event so AppShell can show a toast
            window.dispatchEvent(new CustomEvent('arc-offline-sync-complete', { detail: actions.length }));
          }
        } catch (e) {
          console.error("Failed to sync offline actions", e);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchQueue]);

  return {
    queue,
    setQueue,
    loading,
    error,
    syncing,
    isPreviewData: previewMode || !hasSupabaseConfiguration
  };
}
