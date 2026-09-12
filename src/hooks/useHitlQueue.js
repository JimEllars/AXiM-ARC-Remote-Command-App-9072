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

  return {
    queue,
    setQueue,
    loading,
    error,
    isPreviewData: previewMode || !hasSupabaseConfiguration
  };
}