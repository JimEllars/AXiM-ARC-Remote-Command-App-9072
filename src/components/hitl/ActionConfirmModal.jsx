import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiCheckCircle, FiShield, FiX } = FiIcons;

function ActionConfirmModal({
  item,
  decision,
  open,
  submitting,
  onConfirm,
  onClose
}) {
  const isApproval = decision === 'APPROVED';

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="action-confirm-modal"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
          >
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              aria-label="Close confirmation"
            >
              <SafeIcon icon={FiX} />
            </button>

            <div className={`confirm-icon ${isApproval ? 'approve' : 'revise'}`}>
              <SafeIcon icon={isApproval ? FiCheckCircle : FiShield} />
            </div>

            <p className="eyebrow">Executive confirmation</p>
            <h2>{isApproval ? 'Approve this action?' : 'Request a revision?'}</h2>
            <p className="confirm-copy">
              {isApproval
                ? 'This will authorize the queued operation and dispatch it to the connected edge service.'
                : 'This will return the queued operation to its originating system for additional review.'}
            </p>

            <div className="confirm-summary">
              <span>{item.source_app} · {item.action_type}</span>
              <strong>{item.task_title}</strong>
            </div>

            <button
              className={isApproval ? 'confirm-approve' : 'confirm-revise'}
              type="button"
              disabled={submitting}
              onClick={onConfirm}
            >
              <SafeIcon icon={isApproval ? FiCheckCircle : FiShield} />
              {submitting
                ? 'Dispatching securely…'
                : isApproval
                  ? 'Confirm approval'
                  : 'Confirm revision request'}
            </button>

            <small className="confirm-security">
              <SafeIcon icon={FiShield} />
              Protected by the current Passport edge session
            </small>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ActionConfirmModal;