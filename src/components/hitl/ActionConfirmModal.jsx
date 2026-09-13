import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import { triggerHaptic } from '../../utils/haptics';
import SafeIcon from '../../common/SafeIcon';

const { FiCheckCircle, FiEdit3, FiShield, FiX } = FiIcons;

function ActionConfirmModal({
  item,
  decision,
  open,
  submitting,
  onConfirm,
  onClose
}) {
  const [comment, setComment] = useState('');
  const isApproval = decision === 'APPROVED';

  useEffect(() => {
    if (open) {
      setComment('');
    }
  }, [open, item?.id, decision]);

  const submit = () => {
    if (!isApproval) triggerHaptic('warning');
    onConfirm(comment.trim());
  };

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
            aria-labelledby="action-confirm-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close confirmation"
            >
              <SafeIcon icon={FiX} />
            </button>

            <div className={`confirm-icon ${isApproval ? 'approve' : 'revise'}`}>
              <SafeIcon icon={isApproval ? FiCheckCircle : FiShield} />
            </div>

            <p className="eyebrow">Executive confirmation</p>
            <h2 id="action-confirm-title">
              {isApproval ? 'Approve this action?' : 'Request a revision?'}
            </h2>

            <p className="confirm-copy">
              {isApproval
                ? 'This will authorize the queued operation and dispatch it to the connected edge service.'
                : 'This will return the queued operation to its originating system for additional review.'}
            </p>

            <div className="confirm-summary">
              <span>
                {item.source_app} · {item.action_type}
              </span>
              <strong>{item.task_title}</strong>
            </div>

            <label className="approval-comment-label" htmlFor="approval-comment">
              <span>
                <SafeIcon icon={FiEdit3} />
                Executive comment <small>Optional</small>
              </span>
              <textarea
                id="approval-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={
                  isApproval
                    ? 'Add context for the audit trail…'
                    : 'Explain what needs to be reviewed…'
                }
                maxLength={500}
                disabled={submitting}
                rows={3}
              />
              <small className="comment-count">{comment.length}/500</small>
            </label>

            <button
              className={isApproval ? 'confirm-approve' : 'confirm-revise'}
              type="button"
              disabled={submitting}
              onClick={submit}
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