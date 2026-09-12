import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiArrowUpRight, FiCheckCircle, FiClock, FiExternalLink } = FiIcons;

function SystemCard({ system, index, previewMode, onOpen }) {
  const Icon = system.icon;

  return (
    <motion.article
      className={`system-card system-card-${system.tone}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="system-card-top">
        <div className="system-icon">
          <SafeIcon icon={Icon} />
        </div>
        <span className={`system-status ${system.statusTone}`}>
          <i />
          {system.status}
        </span>
      </div>

      <div className="system-card-copy">
        <p>{system.category}</p>
        <h3>{system.name}</h3>
        <span>{system.description}</span>
      </div>

      <div className="system-card-footer">
        <small>
          <SafeIcon icon={system.activity ? FiCheckCircle : FiClock} />
          {system.activity || 'No recent activity'}
        </small>
        <button
          type="button"
          onClick={() => onOpen(system)}
          disabled={previewMode}
        >
          Open
          <SafeIcon icon={system.external ? FiExternalLink : FiArrowUpRight} />
        </button>
      </div>
    </motion.article>
  );
}

export default SystemCard;