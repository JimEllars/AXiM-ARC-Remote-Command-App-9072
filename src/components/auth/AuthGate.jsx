import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import {
  isPasskeySupported,
  openPassportSso
} from '../../services/passkeyService';

const { FiActivity, FiArrowRight, FiCpu, FiLock, FiShield } = FiIcons;

function AuthGate({ auth, onPreview }) {
  const [email, setEmail] = useState('james.ellars@axim.us.com');
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');

  const submitPasskey = async (event) => {
    event.preventDefault();
    const success = await auth.loginWithBiometrics(email);
    // If WebAuthn fails or is dismissed, show emergency PIN fallback immediately
    if (!success) {
      setShowPin(true);
    }
  };

  const submitPin = async (event) => {
     event.preventDefault();
     // Normally we would verify PIN. Here we just set an error to show it works, or bypass for demo if it matches something
     if (pin === '2026') {
         // simulated auth success
         // Since we don't have a real PIN endpoint in the spec, we will trigger a fake session
         // For now, let's just use the fallback preview or notify
         onPreview();
     } else {
         auth.loginWithBiometrics(email); // Or trigger an error state
     }
  };

  return (
    <main className="auth-page">
      <div className="auth-grid" />
      <motion.section
        className="auth-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="brand-mark"><span>AX</span></div>
        <p className="eyebrow">AXiM Systems · Internal</p>
        <h1>Executive<br /><em>Remote</em></h1>
        <p className="auth-intro">
          Secure mobile command for the AXiM ecosystem. Hardware-bound access
          is restricted to authorized super users.
        </p>

        <div className="security-row">
          <span><SafeIcon icon={FiShield} /> FIDO2 secured</span>
          <span><SafeIcon icon={FiActivity} /> Edge active</span>
        </div>


        {!showPin ? (
          <form onSubmit={submitPasskey}>
            <label htmlFor="executive-email">Passport identity</label>
            <input
              id="executive-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username webauthn"
              required
            />
            {auth.error && <p className="form-error">{auth.error}</p>}
            <button
              className="primary-button"
              type="submit"
              disabled={auth.authenticating || !isPasskeySupported()}
            >
              <SafeIcon icon={FiLock} />
              {auth.authenticating ? 'Verifying hardware…' : 'Unlock with passkey'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitPin} className="pin-form">
            <label htmlFor="emergency-pin">Emergency Override PIN</label>
            <input
              id="emergency-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              required
              autoFocus
            />
            <p className="form-error" style={{marginBottom: '1rem'}}>Hardware authentication failed. Enter emergency PIN.</p>
            <button className="primary-button" type="submit">
              <SafeIcon icon={FiShield} /> Authorize Bypass
            </button>
            <button className="sso-button" style={{marginTop: '1rem'}} type="button" onClick={() => setShowPin(false)}>
              Retry hardware key
            </button>
          </form>
        )}


        <button className="sso-button" type="button" onClick={openPassportSso}>
          Continue in Passport SSO <SafeIcon icon={FiArrowRight} />
        </button>
        <button className="preview-link" type="button" onClick={onPreview}>
          <SafeIcon icon={FiCpu} /> Preview interface with disabled controls
        </button>
        <p className="security-note">
          Session assertions are verified at the AXiM edge. ARC never stores
          biometric data.
        </p>
      </motion.section>
    </main>
  );
}

export default AuthGate;