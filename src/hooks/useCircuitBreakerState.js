import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'axim-circuit-breaker-state';

const defaultServices = [
  {
    service_key: 'global',
    label: 'Global operations',
    is_halted: false
  },
  {
    service_key: 'coding_lab_merges',
    label: 'Coding Lab merges',
    is_halted: false
  },
  {
    service_key: 'support_auto_patch',
    label: 'Support auto-patching',
    is_halted: false
  },
  {
    service_key: 'ace_publishing',
    label: 'ACE publishing',
    is_halted: false
  }
];

function readServices() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultServices;
  } catch {
    return defaultServices;
  }
}

export function useCircuitBreakerState(previewMode = false) {
  const [services, setServices] = useState(readServices);

  useEffect(() => {
    if (!previewMode) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [previewMode, services]);

  const haltService = useCallback((serviceKey = 'global') => {
    setServices((current) => current.map((service) => (
      service.service_key === serviceKey
        ? { ...service, is_halted: true }
        : service
    )));
  }, []);

  const recoverService = useCallback((serviceKey) => {
    setServices((current) => current.map((service) => (
      service.service_key === serviceKey
        ? { ...service, is_halted: false }
        : service
    )));
  }, []);

  const resetServices = useCallback(() => {
    setServices(defaultServices);
  }, []);

  return {
    services,
    haltService,
    recoverService,
    resetServices
  };
}