import { useEffect, useState } from 'react';
import { localPreviewMetrics, localPulseData } from '../services/localDemoData';

export function useTelemetry(previewMode = false) {
  const [metrics, setMetrics] = useState(previewMode ? localPreviewMetrics : []);
  const [pulses, setPulses] = useState(previewMode ? localPulseData : {
    edge: null,
    database: null,
    onyx: null
  });
  const [loading, setLoading] = useState(!previewMode);

  useEffect(() => {
    if (previewMode) {
      setMetrics(localPreviewMetrics);
      setPulses(localPulseData);
      setLoading(false);
      return undefined;
    }

    let active = true;
    let pollInterval = null;

    const loadTelemetry = async () => {
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
        // Fallback for offline or local demo mode
        if (active) {
          setMetrics(localPreviewMetrics);
          setPulses(localPulseData);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTelemetry();

    // Simulate real-time fallback updates when API isn't a websocket
    pollInterval = setInterval(loadTelemetry, 15000);

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [previewMode]);

  return {
    metrics,
    pulses,
    loading,
    isPreviewData: previewMode
  };
}
