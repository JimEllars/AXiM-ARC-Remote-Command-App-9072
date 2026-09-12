import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './HitlQueueFilters.css';

const { FiFilter, FiSearch, FiX } = FiIcons;

function HitlQueueFilters({ filters, sources, onChange, resultCount, totalCount }) {
  const hasFilters = filters.query || filters.priority !== 'all' || filters.source !== 'all';

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({ query: '', priority: 'all', source: 'all' });
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
          placeholder="Search actions"
          aria-label="Search actions"
        />
      </label>

      <div className="hitl-filter-row">
        <select
          value={filters.priority}
          onChange={(event) => updateFilter('priority', event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

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
      </div>
    </section>
  );
}

export default HitlQueueFilters;