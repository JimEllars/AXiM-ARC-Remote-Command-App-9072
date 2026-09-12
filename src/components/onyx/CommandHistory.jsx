import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiCheckCircle, FiClock, FiTrash2, FiXCircle } = FiIcons;

function CommandHistory({ history, onClear }) {
  if (!history.length) return null;

  return (
    <section className="command-history">
      <div className="command-history-heading">
        <div>
          <p className="eyebrow">Local audit trail</p>
          <h2>Recent commands</h2>
        </div>
        <button type="button" onClick={onClear}>
          <SafeIcon icon={FiTrash2} />
          Clear
        </button>
      </div>

      <div className="command-history-list">
        {history.map((entry) => {
          const isError = entry.status === 'error';
          const Icon = isError ? FiXCircle : FiCheckCircle;

          return (
            <article className="command-history-item" key={entry.id}>
              <SafeIcon icon={Icon} />
              <div>
                <strong>{entry.command}</strong>
                <small>
                  <SafeIcon icon={FiClock} />
                  {formatDistanceToNow(new Date(entry.createdAt), {
                    addSuffix: true
                  })}
                </small>
              </div>
              <span className={isError ? 'history-error' : 'history-success'}>
                {entry.status === 'preview' ? 'Preview' : isError ? 'Failed' : 'Sent'}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CommandHistory;