import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiBell, FiBellOff, FiPower, FiRadio, FiRefreshCw } = FiIcons;

function ExecutiveHeader({
  queueCount,
  onEmergency,
  onRecovery,
  onNotifications
}) {
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, []);

  const handlePushToggle = async () => {
    await onNotifications();
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  };

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
          className={`icon-button ${pushEnabled ? 'active' : ''}`}
          onClick={handlePushToggle}
          aria-label={pushEnabled ? 'Notifications enabled' : 'Enable notifications'}
          title={pushEnabled ? '🔔 Enabled' : '🔕 Disabled'}
        >
          <SafeIcon icon={pushEnabled ? FiBell : FiBellOff} />
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
