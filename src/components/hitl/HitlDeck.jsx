import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import CompactDiffViewer from './CompactDiffViewer';
import HitlQueueFilters from './HitlQueueFilters';

const { FiCheck, FiClock, FiRotateCcw, FiShield } = FiIcons;

const initialFilters = {
  query: '',
  priority: 'all',
  source: 'all'
};

function HitlDeck({ queue, loading, previewMode, onResolve }) {
  const [filters, setFilters] = useState(initialFilters);

  const sources = useMemo(
    () => [...new Set(queue.map((item) => item.source_app).filter(Boolean))].sort(),
    [queue]
  );

  const filteredQueue = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return queue.filter((item) => {
      const searchable = [
        item.task_title,
        item.summary,
        item.source_app,
        item.action_type
      ].join(' ').toLowerCase();

      const matchesQuery = !query || searchable.includes(query);
      const matchesPriority =
        filters.priority === 'all' ||
        item.priority?.toLowerCase() === filters.priority;
      const matchesSource =
        filters.source === 'all' || item.source_app === filters.source;

      return matchesQuery && matchesPriority && matchesSource;
    });
  }, [filters, queue]);

  if (loading) {
    return <div className="loading-panel">Loading action queue…</div>;
  }

  return (
    <>
      <HitlQueueFilters
        filters={filters}
        sources={sources}
        onChange={setFilters}
        resultCount={filteredQueue.length}
        totalCount={queue.length}
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
          {filteredQueue.map((item, index) => (
            <motion.article
              className="hitl-card"
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07 }}
            >
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
                  disabled={previewMode}
                  onClick={() => onResolve(item, 'APPROVED')}
                >
                  <SafeIcon icon={FiCheck} />
                  Approve
                </button>
                <button
                  type="button"
                  className="revision-button"
                  disabled={previewMode}
                  onClick={() => onResolve(item, 'REVISION_REQUESTED')}
                >
                  <SafeIcon icon={FiRotateCcw} />
                  Revise
                </button>
              </div>
              <p className="signed-label">
                <SafeIcon icon={FiShield} />
                Secure edge confirmation required
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </>
  );
}

export default HitlDeck;