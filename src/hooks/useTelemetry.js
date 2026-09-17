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
  const [connectionStatus, setConnectionStatus] = useState(previewMode ? 'Local Cache' : 'Connecting');
  const [loading, setLoading] = useState(!previewMode);

  const smoothMetrics = (prev, next) => {
    if (!prev || prev.length === 0) return next;

    return next.map(newItem => {
        const prevItem = prev.find(p => p.label === newItem.label);
        if (!prevItem) return newItem;

        const prevVal = parseFloat(prevItem.value.toString().replace(/[^0-9.]/g, ''));
        const nextVal = parseFloat(newItem.value.toString().replace(/[^0-9.]/g, ''));

        if (!isNaN(prevVal) && !isNaN(nextVal)) {
            const alpha = 0.3;
            const smoothed = (prevVal * (1 - alpha)) + (nextVal * alpha);

            const suffixMatch = newItem.value.toString().match(/[^0-9.]+$/);
            const suffix = suffixMatch ? suffixMatch[0] : '';

            const decimalsMatch = newItem.value.toString().match(/\.([0-9]+)/);
            const decimals = decimalsMatch ? decimalsMatch[1].length : 0;

            return {
                ...newItem,
                value: smoothed.toFixed(decimals) + suffix
            };
        }
        return newItem;
    });
  };

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
          setMetrics(prev => smoothMetrics(prev, summary.metrics || []));
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
        if (active) setConnectionStatus('Degraded: Local Cache');
        return;
      }

      channel = supabaseClient.channel('arc-telemetry');

      channel
        .on('broadcast', { event: 'telemetry_update' }, (payload) => {
           if (active && payload.metrics) {
             setMetrics(prev => smoothMetrics(prev, payload.metrics));
           }
           if (active && payload.pulses) {
             setPulses(payload.pulses);
           }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            attempt = 0;
            if (active) setConnectionStatus('Cloudflare Global');
          }
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
             if (active) setConnectionStatus('Degraded: Polling / Cache');
             if (channel) {
                supabaseClient.removeChannel(channel).catch(() => null);
             }
             if (active) {
                const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
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


  const pingNode = async (url) => {
      const start = Date.now();
      try {
          const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          return Date.now() - start;
      } catch (e) {
          return null; // unreachable
      }
  };

  const pingAll = useCallback(async () => {
       const [core, adt, onyx, edge] = await Promise.all([
           pingNode('https://core.axim.us.com'),
           pingNode('https://support.axim.us.com'), // representing ADT
           pingNode('https://onyx.axim.us.com'),
           pingNode('/api/remote/telemetry/edge')
       ]);

       setPulses(prev => ({
           ...prev,
           core: core,
           adt: adt,
           onyx: onyx,
           edge: edge
       }));
  }, []);

  useEffect(() => {
     let interval = setInterval(pingAll, 15000);
     pingAll();
     return () => clearInterval(interval);
  }, [pingAll]);

  return {
    metrics,
    pulses,
    edgeFingerprint,
    loading,
    connectionStatus,
    isPreviewData: previewMode,
    pingAll
  };
}
