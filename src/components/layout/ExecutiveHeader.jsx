import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { isPasskeySupported } from '../../services/passkeyService';

const { FiBell, FiBellOff, FiPower, FiRadio, FiRefreshCw, FiKey } = FiIcons;

function ExecutiveHeader({
  queueCount,
  onEmergency,
  onRecovery,
  onNotifications,
  connectionStatus
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

  const isSsoSession = sessionStorage.getItem('arc_sso_session') !== null;

  return (
    <header className="executive-header">
      <div className="header-brand">
        <div className="mini-mark">AX</div>
        <div>
          <p>Executive Remote</p>
          <span><i className={connectionStatus && connectionStatus.includes('Degraded') ? 'degraded' : ''} /> Edge: {connectionStatus || 'Connecting'}</span>
        </div>
      </div>

      <div className="header-actions">
        {isSsoSession && isPasskeySupported() && (
           <button
            type="button"
            className="icon-button"
            title="Link Biometric Passkey"
            aria-label="Link Biometric Passkey"
            onClick={() => {
                window.dispatchEvent(new CustomEvent('arc-toast', {
                   detail: { message: 'Biometric link requested. Navigate to Passport to register device.', tone: 'info' }
                }));
            }}
          >
            <SafeIcon icon={FiKey} />
          </button>
        )}
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
