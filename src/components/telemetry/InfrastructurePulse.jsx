import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import SystemHealthDrilldown from './SystemHealthDrilldown';

import { triggerHaptic } from '../../utils/haptics';

const { FiCloud, FiCpu, FiDatabase, FiMapPin, FiActivity, FiRefreshCw } = FiIcons;

const services = [
  { key: 'edge', label: 'Cloudflare Edge', icon: FiCloud },
  { key: 'core', label: 'AXiM Core API', icon: FiDatabase },
  { key: 'adt', label: 'ADT Lead Routing', icon: FiActivity },
  { key: 'onyx', label: 'Onyx Action Node', icon: FiCpu }
];

function InfrastructurePulse({ pulses, previewMode, edgeFingerprint, onPingAll }) {
  const [selectedService, setSelectedService] = useState(null);

  const popLabel = edgeFingerprint ? `${edgeFingerprint.colo}-Edge` : (previewMode ? 'Local-Edge' : 'Connecting...');

  return (
    <>
      <section className="surface-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Infrastructure</p>
            <h2>Live pulse</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <SafeIcon icon={FiMapPin} /> {popLabel}
            </p>
          </div>

          <button
             type="button"
             className="status-pill pulse-trigger"
             style={{cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
             onClick={(e) => {
                 e.stopPropagation();
                 triggerHaptic('light');
                 if (onPingAll) onPingAll();
             }}
          >
             <SafeIcon icon={FiRefreshCw} /> Ping All
          </button>
        </div>

        <div className="pulse-list">
          {services.map((service, index) => {
            const latency = previewMode ? [18, 42, 31][index] : pulses[service.key];

            return (
              <button
                className="pulse-row pulse-row-button"
                type="button"
                key={service.key}
                onClick={() => setSelectedService(service.key)}
                aria-label={`View ${service.label} health`}
              >
                <SafeIcon icon={service.icon} />
                <span>{service.label}</span>
                <b>{latency === null ? '—' : `${latency} ms`}</b>
                <i className={latency === null ? 'offline' : latency > 750 ? 'offline' : latency > 200 ? 'degraded' : 'operational'} style={{ background: latency === null || latency > 750 ? 'var(--red)' : latency > 200 ? 'var(--yellow)' : 'var(--green)' }} />
              </button>
            );
          })}
        </div>
      </section>

      {selectedService && (
        <SystemHealthDrilldown
          serviceKey={selectedService}
          latency={previewMode
            ? [18, 42, 31][services.findIndex((service) => service.key === selectedService)]
            : pulses[selectedService]}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}

export default InfrastructurePulse;
