import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import { triggerHaptic } from '../../utils/haptics';
import SafeIcon from '../../common/SafeIcon';

const {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiLoader,
  FiRefreshCw,
  FiShield,
  FiX
} = FiIcons;

function BulkActionConfirmModal({
  items,
  decision,
  open,
  submitting,
  progress,
  result,
  onConfirm,
  onRetry,
  onClose
}) {
  const [comment, setComment] = useState('');
  const isApproval = decision === 'APPROVED';
  const itemCount = items.length;
  const completed = progress?.completed || 0;
  const total = progress?.total || itemCount;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const hasResult = Boolean(result);
  const failedCount = result?.failedItems?.length || 0;

  useEffect(() => {
    if (open && !result) {
      setComment('');
    }
  }, [open, result]);

  const submit = () => {
    if (!isApproval) triggerHaptic('warning');
    onConfirm(comment.trim());
  };

  return (
    <AnimatePresence>
      {open && itemCount > 0 && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !submitting && onClose()}
        >
          <motion.section
            className="action-confirm-modal"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
            aria-labelledby="bulk-confirm-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close bulk confirmation"
            >
              <SafeIcon icon={FiX} />
            </button>

            <div className={`confirm-icon ${isApproval ? 'approve' : 'revise'}`}>
              <SafeIcon icon={hasResult ? FiCheckCircle : FiShield} />
            </div>

            <p className="eyebrow">
              {hasResult ? 'Bulk action report' : 'Bulk executive action'}
            </p>

            <h2 id="bulk-confirm-title">
              {hasResult
                ? failedCount
                  ? 'Resolution partially completed'
                  : 'Resolution completed'
                : isApproval
                  ? 'Approve selected actions?'
                  : 'Request revisions?'}
            </h2>

            {!hasResult && (
              <p className="confirm-copy">
                {isApproval
                  ? `This will authorize ${itemCount} queued operations and dispatch them to the connected edge service.`
                  : `This will return ${itemCount} queued operations to their originating systems for additional review.`}
              </p>
            )}

            {submitting && (
              <div className="bulk-progress" aria-live="polite">
                <div className="bulk-progress-heading">
                  <span>Dispatching selected actions</span>
                  <strong>
                    {completed}/{total}
                  </strong>
                </div>
                <div
                  className="bulk-progress-track"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax={total}
                  aria-valuenow={completed}
                  aria-label="Bulk dispatch progress"
                >
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                  />
                </div>
                <small>
                  <SafeIcon icon={FiLoader} />
                  Keep this window open while the edge confirms each action.
                </small>
              </div>
            )}

            {hasResult && (
              <div className="bulk-result-summary">
                <div className="bulk-result-success">
                  <SafeIcon icon={FiCheckCircle} />
                  <span>
                    <strong>{result.resolvedIds.length}</strong>
                    <small>resolved successfully</small>
                  </span>
                </div>
                <div
                  className={
                    failedCount
                      ? 'bulk-result-failed'
                      : 'bulk-result-success'
                  }
                >
                  <SafeIcon icon={failedCount ? FiAlertCircle : FiCheckCircle} />
                  <span>
                    <strong>{failedCount}</strong>
                    <small>failed to dispatch</small>
                  </span>
                </div>
              </div>
            )}

            <div className="bulk-confirm-list">
              {items.slice(0, 5).map((item) => {
                const failedItem = result?.failedItems?.find(
                  (failed) => failed.id === item.id
                );

                return (
                  <div
                    key={item.id}
                    className={failedItem ? 'bulk-item-failed' : ''}
                  >
                    <span>{item.source_app}</span>
                    <strong>{item.task_title}</strong>
                    {failedItem && (
                      <small>
                        Dispatch failed after {failedItem.dispatchAttempts || 1}{' '}
                        attempt
                        {failedItem.dispatchAttempts === 1 ? '' : 's'}
                        {failedItem.dispatchError
                          ? ` · ${failedItem.dispatchError}`
                          : ''}
                      </small>
                    )}
                  </div>
                );
              })}
              {itemCount > 5 && (
                <small>+ {itemCount - 5} more selected actions</small>
              )}
            </div>

            {!hasResult && (
              <>
                <label
                  className="approval-comment-label"
                  htmlFor="bulk-approval-comment"
                >
                  <span>
                    <SafeIcon icon={FiEdit3} />
                    Comment for selected actions <small>Optional</small>
                  </span>
                  <textarea
                    id="bulk-approval-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={
                      isApproval
                        ? 'Add shared approval context to the audit trail…'
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
                      ? `Confirm ${itemCount} approvals`
                      : `Confirm ${itemCount} revisions`}
                </button>
              </>
            )}

            {hasResult && failedCount > 0 && (
              <button
                className="confirm-retry"
                type="button"
                disabled={submitting}
                onClick={onRetry}
              >
                <SafeIcon icon={FiRefreshCw} />
                {submitting
                  ? 'Retrying failed dispatches…'
                  : `Retry ${failedCount} failed dispatch${
                      failedCount === 1 ? '' : 'es'
                    }`}
              </button>
            )}

            {hasResult && failedCount === 0 && (
              <button
                className="confirm-approve"
                type="button"
                onClick={onClose}
              >
                <SafeIcon icon={FiCheckCircle} />
                Close resolution report
              </button>
            )}

            {hasResult && failedCount > 0 && (
              <button
                className="confirm-secondary"
                type="button"
                disabled={submitting}
                onClick={onClose}
              >
                Close and leave failed actions pending
              </button>
            )}

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

export default BulkActionConfirmModal;