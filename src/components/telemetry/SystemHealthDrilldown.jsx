import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './SystemHealthDrilldown.css';

const { FiActivity, FiAlertTriangle, FiCheckCircle, FiClock, FiDatabase, FiX } = FiIcons;

const serviceDetails = {
  edge: {
    label: 'Cloudflare Edge',
    icon: FiActivity,
    region: 'Global edge network',
    uptime: '99.99%',
    checks: [
      ['Request routing', 'Operational'],
      ['TLS termination', 'Operational'],
      ['Rate limiting', 'Operational']
    ],
    events: ['No elevated error rate detected', 'Last configuration sync completed 4 min ago']
  },
  database: {
    label: 'Supabase Vault',
    icon: FiDatabase,
    region: 'Primary data region',
    uptime: '99.97%',
    checks: [
      ['Connection pool', 'Operational'],
      ['Row-level security', 'Operational'],
      ['Realtime updates', 'Operational']
    ],
    events: ['Replication is within normal range', 'No failed writes reported']
  },
  onyx: {
    label: 'Onyx Bridge',
    icon: FiActivity,
    region: 'Cognitive command service',
    uptime: '99.95%',
    checks: [
      ['Command intake', 'Operational'],
      ['Token streaming', 'Operational'],
      ['Voice transcription', 'Monitoring']
    ],
    events: ['Streaming channel is accepting commands', 'Voice latency is slightly above baseline']
  }
};

function SystemHealthDrilldown({ serviceKey, latency, onClose }) {
  const detail = serviceDetails[serviceKey];
  if (!detail) return null;

  const Icon = detail.icon;
  const isDegraded = detail.checks.some((check) => check[1] === 'Monitoring');

  return (
    <AnimatePresence>
      <motion.div
        className="health-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.section
          className="health-drilldown"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          onClick={(event) => event.stopPropagation()}
          aria-labelledby="health-drilldown-title"
        >
          <button className="health-close" type="button" onClick={onClose}>
            <SafeIcon icon={FiX} />
          </button>

          <div className="health-title">
            <div className="health-service-icon">
              <SafeIcon icon={Icon} />
            </div>
            <div>
              <p className="eyebrow">System health</p>
              <h2 id="health-drilldown-title">{detail.label}</h2>
              <span>{detail.region}</span>
            </div>
          </div>

          <div className="health-summary">
            <div>
              <small>Current latency</small>
              <strong>{latency === null ? '—' : `${latency} ms`}</strong>
            </div>
            <div>
              <small>30-day uptime</small>
              <strong>{detail.uptime}</strong>
            </div>
            <span className={isDegraded ? 'health-monitoring' : 'health-operational'}>
              <i />
              {isDegraded ? 'Monitoring' : 'Operational'}
            </span>
          </div>

          <div className="health-checks">
            <h3>Component checks</h3>
            {detail.checks.map(([label, status]) => (
              <div className="health-check" key={label}>
                <SafeIcon icon={status === 'Operational' ? FiCheckCircle : FiClock} />
                <span>{label}</span>
                <b className={status === 'Operational' ? '' : 'monitoring'}>{status}</b>
              </div>
            ))}
          </div>

          <div className="health-events">
            <h3>Recent observations</h3>
            {detail.events.map((event, index) => (
              <p key={event}>
                <SafeIcon icon={index === 0 && isDegraded ? FiAlertTriangle : FiCheckCircle} />
                {event}
              </p>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

export default SystemHealthDrilldown;