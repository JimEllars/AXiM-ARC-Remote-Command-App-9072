import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiAlertCircle, FiCheckCircle, FiInfo, FiX } = FiIcons;

const icons = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo
};

function Toast({ message, tone = 'info', onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className={`toast toast-${tone}`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          role="status"
        >
          <SafeIcon icon={icons[tone] || FiInfo} />
          <span>{message}</span>
          <button type="button" onClick={onDismiss} aria-label="Dismiss message">
            <SafeIcon icon={FiX} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;