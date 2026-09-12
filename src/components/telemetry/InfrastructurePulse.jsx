import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import SystemHealthDrilldown from './SystemHealthDrilldown';

const { FiCloud, FiCpu, FiDatabase } = FiIcons;

const services = [
  { key: 'edge', label: 'Cloudflare Edge', icon: FiCloud },
  { key: 'database', label: 'Supabase Vault', icon: FiDatabase },
  { key: 'onyx', label: 'Onyx Bridge', icon: FiCpu }
];

function InfrastructurePulse({ pulses, previewMode }) {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <>
      <section className="surface-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Infrastructure</p>
            <h2>Live pulse</h2>
          </div>
          <span className="status-pill"><i /> Operational</span>
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
                <i className={latency === null ? 'offline' : ''} />
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