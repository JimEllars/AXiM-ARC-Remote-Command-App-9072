import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './CircuitBreakerRecoveryModal.css';

const {
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiX
} = FiIcons;

const fallbackServices = [
  { service_key: 'global', label: 'Global operations', is_halted: false },
  { service_key: 'coding_lab_merges', label: 'Coding Lab merges', is_halted: false },
  { service_key: 'support_auto_patch', label: 'Support auto-patching', is_halted: false },
  { service_key: 'ace_publishing', label: 'ACE publishing', is_halted: false }
];

function CircuitBreakerRecoveryModal({
  open,
  previewMode,
  localServices,
  onClose,
  onLocalRecover,
  onNotify
}) {
  const [services, setServices] = useState(localServices || fallbackServices);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [selectedService, setSelectedService] = useState('global');
  const [confirmation, setConfirmation] = useState('');

  const selected = services.find((service) => (
    service.service_key === selectedService
  ));

  useEffect(() => {
    if (previewMode) {
      setServices(localServices || fallbackServices);
      return undefined;
    }

    if (!open) return undefined;

    let active = true;
    setLoading(true);

    fetch('/api/remote/circuit-breaker', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) throw new Error('Circuit breaker status unavailable.');
        return response.json();
      })
      .then((data) => {
        if (active && Array.isArray(data.services)) {
          setServices(data.services);
        }
      })
      .catch(() => {
        if (active) {
          onNotify?.(
            'Recovery status could not be synchronized with the edge.',
            'error'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, previewMode, localServices, onNotify]);

  const recoverOperations = async () => {
    if (!selected || confirmation !== 'RESUME AXIM' || recovering) return;

    setRecovering(true);

    try {
      if (previewMode) {
        onLocalRecover?.(selected.service_key);
        setConfirmation('');
        onNotify?.(`${selected.label} recovered in local preview mode.`, 'success');
        onClose();
        return;
      }

      const response = await fetch('/api/remote/circuit-breaker', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selected.service_key,
          action: 'recover',
          reason: 'Executive circuit breaker recovery from ARC'
        })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          if (data.fallbackMode || data.error?.fallback) {
              throw new TypeError('Failed to fetch');
          }
      }

      if (!response.ok) {
        if (response.status === 404) throw new TypeError('Failed to fetch');
        throw new Error('The edge rejected the recovery request.');
      }

      setServices((current) => current.map((service) => (
        service.service_key === selected.service_key
          ? { ...service, is_halted: false }
          : service
      )));
      setConfirmation('');
      onNotify?.(`${selected.label} recovery request dispatched securely.`, 'success');
      onClose();
    } catch (error) {
      onNotify?.(error.message, 'error');
    } finally {
      setRecovering(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            className="recovery-modal"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
            aria-labelledby="recovery-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              aria-label="Close recovery control"
            >
              <SafeIcon icon={FiX} />
            </button>

            <div className="recovery-icon">
              <SafeIcon icon={FiRefreshCw} />
            </div>
            <p className="eyebrow">Circuit breaker recovery</p>
            <h2 id="recovery-title">Resume halted operations</h2>
            <p className="recovery-copy">
              Re-enable an operational lane only after the underlying incident
              has been reviewed and mitigated.
            </p>

            <div className="recovery-status">
              <div className="recovery-status-heading">
                <span>Protected service lanes</span>
                <small>
                  {previewMode
                    ? 'Local state'
                    : loading
                      ? 'Syncing…'
                      : 'Edge status'}
                </small>
              </div>

              {services.map((service) => (
                <button
                  className={`recovery-service ${
                    selectedService === service.service_key ? 'selected' : ''
                  }`}
                  type="button"
                  key={service.service_key}
                  onClick={() => {
                    setSelectedService(service.service_key);
                    setConfirmation('');
                  }}
                >
                  <SafeIcon
                    icon={service.is_halted ? FiAlertTriangle : FiCheckCircle}
                  />
                  <span>{service.label}</span>
                  <b className={service.is_halted ? 'halted' : 'ready'}>
                    {service.is_halted ? 'Halted' : 'Ready'}
                  </b>
                </button>
              ))}
            </div>

            {selected?.is_halted ? (
              <>
                <label htmlFor="resume-confirmation">
                  Type <b>RESUME AXIM</b> to confirm
                </label>
                <input
                  id="resume-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="RESUME AXIM"
                  autoComplete="off"
                />
                <button
                  className="recover-button"
                  type="button"
                  disabled={
                    confirmation !== 'RESUME AXIM' ||
                    recovering
                  }
                  onClick={recoverOperations}
                >
                  <SafeIcon icon={FiRefreshCw} />
                  {recovering ? 'Recovering…' : 'Resume selected lane'}
                </button>
              </>
            ) : (
              <div className="recovery-clear">
                <SafeIcon icon={FiCheckCircle} />
                <span>The selected service lane is already operational.</span>
              </div>
            )}

            <small className="recovery-security">
              <SafeIcon icon={FiShield} />
              <SafeIcon icon={FiLock} />
              {previewMode
                ? 'Local preview state is stored on this device'
                : 'Requires an authenticated executive edge session'}
            </small>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CircuitBreakerRecoveryModal;