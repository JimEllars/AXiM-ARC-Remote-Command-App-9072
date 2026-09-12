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
        if (active) {
          setMetrics(localPreviewMetrics);
          setPulses(localPulseData);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTelemetry();
    return () => {
      active = false;
    };
  }, [previewMode]);

  return {
    metrics,
    pulses,
    loading,
    isPreviewData: previewMode
  };
}