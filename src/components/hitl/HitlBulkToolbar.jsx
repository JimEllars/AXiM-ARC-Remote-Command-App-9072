import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './HitlBulkToolbar.css';

const { FiCheck, FiFlag, FiMinus, FiRotateCcw, FiSquare } = FiIcons;

function HitlBulkToolbar({
  selectedCount,
  totalCount,
  highPriorityCount,
  allVisibleSelected,
  onSelectAll,
  onSelectHighPriority,
  onClear,
  onResolve
}) {
  if (!totalCount) return null;

  return (
    <div className="hitl-bulk-toolbar">
      <button
        type="button"
        className="bulk-select-button"
        onClick={onSelectAll}
        aria-label={
          allVisibleSelected ? 'Clear all visible selections' : 'Select all visible actions'
        }
      >
        <SafeIcon icon={allVisibleSelected ? FiMinus : FiSquare} />
        <span>{allVisibleSelected ? 'Clear visible' : 'Select visible'}</span>
      </button>

      {highPriorityCount > 0 && (
        <button
          type="button"
          className="bulk-priority-button"
          onClick={onSelectHighPriority}
          aria-label={`Select ${highPriorityCount} high priority actions`}
        >
          <SafeIcon icon={FiFlag} />
          <span>High priority ({highPriorityCount})</span>
        </button>
      )}

      {selectedCount > 0 && (
        <>
          <span className="bulk-selected-count">
            {selectedCount} selected
          </span>
          <button
            type="button"
            className="bulk-approve-button"
            onClick={() => onResolve('APPROVED')}
          >
            <SafeIcon icon={FiCheck} />
            Approve
          </button>
          <button
            type="button"
            className="bulk-revise-button"
            onClick={() => onResolve('REVISION_REQUESTED')}
          >
            <SafeIcon icon={FiRotateCcw} />
            Revise
          </button>
          <button
            type="button"
            className="bulk-clear-button"
            onClick={onClear}
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
}

export default HitlBulkToolbar;