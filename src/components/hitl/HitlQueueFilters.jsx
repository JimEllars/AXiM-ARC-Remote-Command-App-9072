import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './HitlQueueFilters.css';

const { FiFilter, FiSearch, FiX } = FiIcons;

function HitlQueueFilters({
  filters,
  sources,
  priorityCounts,
  onChange,
  resultCount,
  totalCount
}) {
  const hasFilters =
    filters.query ||
    filters.priority !== 'all' ||
    filters.source !== 'all' ||
    filters.sort !== 'newest';

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      query: '',
      priority: 'all',
      source: 'all',
      sort: 'newest'
    });
  };

  return (
    <section className="hitl-filters" aria-label="Action queue filters">
      <div className="hitl-filter-heading">
        <div>
          <p className="eyebrow">Queue controls</p>
          <span>
            <SafeIcon icon={FiFilter} />
            Showing {resultCount} of {totalCount} actions
          </span>
        </div>
        {hasFilters && (
          <button type="button" onClick={clearFilters}>
            <SafeIcon icon={FiX} />
            Clear
          </button>
        )}
      </div>

      <label className="hitl-search">
        <SafeIcon icon={FiSearch} />
        <input
          value={filters.query}
          onChange={(event) => updateFilter('query', event.target.value)}
          placeholder="Search actions, systems, or summaries"
          aria-label="Search actions"
        />
        {filters.query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => updateFilter('query', '')}
            aria-label="Clear action search"
          >
            <SafeIcon icon={FiX} />
          </button>
        )}
      </label>

      <div className="hitl-filter-row">
        <label>
          <span>Priority</span>
          <select
            value={filters.priority}
            onChange={(event) => updateFilter('priority', event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="critical">
              Critical ({priorityCounts.critical || 0})
            </option>
            <option value="high">High ({priorityCounts.high || 0})</option>
            <option value="medium">
              Medium ({priorityCounts.medium || 0})
            </option>
            <option value="low">Low ({priorityCounts.low || 0})</option>
          </select>
        </label>

        <label>
          <span>System</span>
          <select
            value={filters.source}
            onChange={(event) => updateFilter('source', event.target.value)}
            aria-label="Filter by source"
          >
            <option value="all">All systems</option>
            {sources.map((source) => (
              <option value={source} key={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Order</span>
          <select
            value={filters.sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
            aria-label="Sort action queue"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Highest priority</option>
          </select>
        </label>
      </div>
    </section>
  );
}

export default HitlQueueFilters;