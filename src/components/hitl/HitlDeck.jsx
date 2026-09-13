import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import { triggerHaptic } from '../../utils/haptics';
import SafeIcon from '../../common/SafeIcon';
import CompactDiffViewer from './CompactDiffViewer';
import HitlBulkToolbar from './HitlBulkToolbar';
import HitlQueueFilters from './HitlQueueFilters';

const { FiCheck, FiClock, FiRotateCcw, FiShield } = FiIcons;

const initialFilters = {
  query: '',
  priority: 'all',
  source: 'all',
  sort: 'newest'
};

const priorityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

function HitlDeck({ queue, loading, previewMode, onResolve, onResolveBulk }) {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState([]);

  const sources = useMemo(
    () =>
      [...new Set(queue.map((item) => item.source_app).filter(Boolean))].sort(),
    [queue]
  );

  const priorityCounts = useMemo(
    () =>
      queue.reduce((counts, item) => {
        const priority = item.priority?.toLowerCase();

        if (priority) {
          counts[priority] = (counts[priority] || 0) + 1;
        }

        return counts;
      }, {}),
    [queue]
  );

  const filteredQueue = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    const matchingItems = queue.filter((item) => {
      const searchable = [
        item.task_title,
        item.summary,
        item.source_app,
        item.action_type
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (filters.priority === 'all' ||
          item.priority?.toLowerCase() === filters.priority) &&
        (filters.source === 'all' || item.source_app === filters.source)
      );
    });

    return matchingItems.sort((first, second) => {
      if (filters.sort === 'priority') {
        return (
          (priorityRank[second.priority?.toLowerCase()] || 0) -
          (priorityRank[first.priority?.toLowerCase()] || 0)
        );
      }

      const firstDate = new Date(first.created_at).getTime();
      const secondDate = new Date(second.created_at).getTime();

      return filters.sort === 'oldest'
        ? firstDate - secondDate
        : secondDate - firstDate;
    });
  }, [filters, queue]);

  useEffect(() => {
    const availableIds = new Set(queue.map((item) => item.id));

    setSelectedIds((current) =>
      current.filter((id) => availableIds.has(id))
    );
  }, [queue]);

  const selectedItems = useMemo(
    () => queue.filter((item) => selectedIds.includes(item.id)),
    [queue, selectedIds]
  );

  const visibleIds = filteredQueue.map((item) => item.id);
  const highPriorityIds = filteredQueue
    .filter((item) => ['critical', 'high'].includes(item.priority?.toLowerCase()))
    .map((item) => item.id);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  };

  const selectHighPriority = () => {
    setSelectedIds((current) => [
      ...new Set([...current, ...highPriorityIds])
    ]);
  };

  const handleBulkResolve = (decision) => {
    if (selectedItems.length) {
      onResolveBulk(selectedItems, decision);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading action queue…</div>;
  }

  return (
    <>
      <HitlQueueFilters
        filters={filters}
        sources={sources}
        priorityCounts={priorityCounts}
        onChange={setFilters}
        resultCount={filteredQueue.length}
        totalCount={queue.length}
      />

      <HitlBulkToolbar
        selectedCount={selectedItems.length}
        totalCount={filteredQueue.length}
        highPriorityCount={highPriorityIds.length}
        allVisibleSelected={allVisibleSelected}
        onSelectAll={toggleAllVisible}
        onSelectHighPriority={selectHighPriority}
        onClear={() => setSelectedIds([])}
        onResolve={handleBulkResolve}
      />

      {!filteredQueue.length ? (
        <div className="empty-panel">
          <SafeIcon icon={FiCheck} />
          <span>
            {queue.length
              ? 'No actions match the current filters.'
              : 'No executive actions pending.'}
          </span>
        </div>
      ) : (
        <div className="hitl-deck">
          {filteredQueue.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <motion.article
                className={`hitl-card ${isSelected ? 'hitl-card-selected' : ''}`}
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <label className="hitl-select-row">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={`Select ${item.task_title}`}
                  />
                  <span>Select for bulk action</span>
                </label>

                <div className="hitl-meta">
                  <span className={`priority ${item.priority?.toLowerCase()}`}>
                    {item.priority || 'PENDING'}
                  </span>
                  <small>
                    <SafeIcon icon={FiClock} />
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true
                    })}
                  </small>
                </div>

                <p className="source-label">
                  {item.source_app} / {item.action_type}
                </p>
                <h3>{item.task_title}</h3>
                <p className="hitl-summary">{item.summary}</p>
                <CompactDiffViewer item={item} />

                <div className="action-row">
                  <button
                    type="button"
                    className="approve-button"
                    onClick={() => onResolve(item, 'APPROVED')}
                  >
                    <SafeIcon icon={FiCheck} />
                    Approve
                  </button>
                  <button
                    type="button"
                    className="revision-button"
                    onClick={() =>
                      onResolve(item, 'REVISION_REQUESTED')
                    }
                  >
                    <SafeIcon icon={FiRotateCcw} />
                    Revise
                  </button>
                </div>

                <p className="signed-label">
                  <SafeIcon icon={FiShield} />
                  {previewMode
                    ? 'Preview action · simulated locally'
                    : 'Secure edge confirmation required'}
                </p>
              </motion.article>
            );
          })}
        </div>
      )}
    </>
  );
}

export default HitlDeck;