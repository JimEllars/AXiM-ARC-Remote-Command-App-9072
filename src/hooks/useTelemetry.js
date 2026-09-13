import { useEffect, useState, useCallback } from 'react';
import { localPreviewMetrics, localPulseData } from '../services/localDemoData';
import { supabaseClient, hasSupabaseConfiguration } from '../services/supabaseClient';

export function useTelemetry(previewMode = false) {
  const [metrics, setMetrics] = useState(previewMode ? localPreviewMetrics : []);
  const [pulses, setPulses] = useState(previewMode ? localPulseData : {
    edge: null,
    database: null,
    onyx: null
  });
  const [edgeFingerprint, setEdgeFingerprint] = useState(null);
  const [loading, setLoading] = useState(!previewMode);

  useEffect(() => {
    let active = true;

    const fetchEdgeFingerprint = async () => {
      try {
        const response = await fetch('/api/remote/telemetry/edge', {
          credentials: 'omit',
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Edge metadata unavailable.');
        const data = await response.json();
        if (active) setEdgeFingerprint(data);
      } catch (err) {
        if (active) setEdgeFingerprint({ colo: 'Local', region: 'Unknown' });
      }
    };

    fetchEdgeFingerprint();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (previewMode) {
      setMetrics(localPreviewMetrics);
      setPulses(localPulseData);
      setLoading(false);
      return undefined;
    }

    let active = true;
    let pollInterval = null;
    let reconnectTimeout = null;
    let channel = null;

    const loadTelemetrySummary = async () => {
      try {
        const response = await fetch('/api/remote/telemetry/summary', {
          credentials: 'include',
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('Telemetry unavailable.');
        const summary = await response.json();

        if (active) {
          setMetrics(summary.metrics || []);
          setPulses(summary.pulses || localPulseData);
        }
      } catch {
        if (active) {
          setMetrics(localPreviewMetrics);
          setPulses(localPulseData);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const subscribeToRealtime = (attempt = 0) => {
      if (!hasSupabaseConfiguration) {
        pollInterval = setInterval(loadTelemetrySummary, 15000);
        return;
      }

      channel = supabaseClient.channel('arc-telemetry');

      channel
        .on('broadcast', { event: 'telemetry_update' }, (payload) => {
           if (active && payload.metrics) {
             setMetrics(payload.metrics);
           }
           if (active && payload.pulses) {
             setPulses(payload.pulses);
           }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            attempt = 0; // reset attempts
          }
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
             if (channel) {
                supabaseClient.removeChannel(channel).catch(() => null);
             }
             if (active) {
                const backoff = Math.min(1000 * Math.pow(2, attempt), 10000); // 1s, 2s, 4s, 8s, 10s
                reconnectTimeout = setTimeout(() => {
                  subscribeToRealtime(attempt + 1);
                }, backoff);
             }
          }
        });
    };

    loadTelemetrySummary();
    subscribeToRealtime();

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (channel) supabaseClient.removeChannel(channel).catch(() => null);
    };
  }, [previewMode]);

  return {
    metrics,
    pulses,
    edgeFingerprint,
    loading,
    isPreviewData: previewMode
  };
}
