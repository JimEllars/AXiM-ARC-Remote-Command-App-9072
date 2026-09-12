import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiArrowUpRight, FiMinus, FiZap } = FiIcons;

function ExecutiveMetricsGrid({ metrics, loading }) {
  if (loading) {
    return <div className="loading-panel">Synchronizing ecosystem telemetry…</div>;
  }

  if (!metrics.length) {
    return <div className="empty-panel">Telemetry is temporarily unavailable.</div>;
  }

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <motion.article
          className={`metric-card ${metric.tone || 'neutral'}`}
          key={metric.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="metric-top">
            <span>{metric.label}</span>
            <SafeIcon icon={index === 0 ? FiZap : FiArrowUpRight} />
          </div>
          <strong>{metric.value}</strong>
          <small>
            <SafeIcon icon={metric.tone === 'neutral' ? FiMinus : FiArrowUpRight} />
            {metric.delta}
          </small>
        </motion.article>
      ))}
    </div>
  );
}

export default ExecutiveMetricsGrid;