import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiBell, FiPower, FiRadio, FiRefreshCw } = FiIcons;

function ExecutiveHeader({
  queueCount,
  onEmergency,
  onRecovery,
  onNotifications
}) {
  return (
    <header className="executive-header">
      <div className="header-brand">
        <div className="mini-mark">AX</div>
        <div>
          <p>Executive Remote</p>
          <span><i /> Core connected</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onNotifications}
          aria-label="Enable notifications"
        >
          <SafeIcon icon={FiBell} />
          {queueCount > 0 && <b>{queueCount}</b>}
        </button>
        <button
          type="button"
          className="icon-button recovery-trigger"
          onClick={onRecovery}
          aria-label="Open circuit breaker recovery"
        >
          <SafeIcon icon={FiRefreshCw} />
        </button>
        <button
          type="button"
          className="icon-button danger"
          onClick={onEmergency}
          aria-label="Open emergency circuit breaker"
        >
          <SafeIcon icon={FiPower} />
        </button>
      </div>

      <div className="connection-strip">
        <span><SafeIcon icon={FiRadio} /> Live command channel</span>
        <span>256-bit edge session</span>
      </div>
    </header>
  );
}

export default ExecutiveHeader;