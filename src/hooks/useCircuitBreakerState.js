import { useCallback, useEffect, useState } from 'react';
import { supabaseClient, hasSupabaseConfiguration } from '../services/supabaseClient';

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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    if (previewMode || !hasSupabaseConfiguration) return undefined;

    let active = true;
    let channel;

    const fetchState = async () => {
        try {
            const { data, error } = await supabaseClient
                .from('emergency_switches')
                .select('*');
            if (active && !error && data) {
                // If real data exists, update our services. Otherwise we rely on local fallback.
                setServices(current => current.map(service => {
                    const remote = data.find(s => s.service_key === service.service_key);
                    return remote ? { ...service, is_halted: remote.is_halted } : service;
                }));
            }
        } catch(e) {
            // Fallback to local storage
        }
    };

    fetchState();

    channel = supabaseClient
      .channel('arc-circuit-breaker')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_switches' },
        ({ new: nextItem }) => {
           if (nextItem && nextItem.service_key) {
               setServices(current => current.map(service =>
                   service.service_key === nextItem.service_key ? { ...service, is_halted: nextItem.is_halted } : service
               ));
           }
        }
      )
      .subscribe((status) => {
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
             // Let local storage maintain last known state
          }
      });

    return () => {
      active = false;
      if (channel) {
          supabaseClient.removeChannel(channel).catch(() => null);
      }
    };
  }, [previewMode]);

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
