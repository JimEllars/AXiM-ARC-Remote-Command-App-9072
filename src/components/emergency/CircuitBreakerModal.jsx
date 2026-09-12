import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const {
  FiAlertTriangle,
  FiCheckCircle,
  FiPower,
  FiX
} = FiIcons;

const fallbackServices = [
  {
    service_key: 'global',
    label: 'Global operations',
    description: 'Freeze every autonomous lane',
    is_halted: false
  },
  {
    service_key: 'coding_lab_merges',
    label: 'Coding Lab merges',
    description: 'Pause pull request merge automation',
    is_halted: false
  },
  {
    service_key: 'support_auto_patch',
    label: 'Support auto-patching',
    description: 'Pause automated support fixes',
    is_halted: false
  },
  {
    service_key: 'ace_publishing',
    label: 'ACE publishing',
    description: 'Pause content and release publishing',
    is_halted: false
  }
];

function CircuitBreakerModal({
  open,
  previewMode,
  services = fallbackServices,
  onClose,
  onLocalHalt,
  onNotify
}) {
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState('global');

  const selected = services.find((service) => (
    service.service_key === selectedService
  )) || fallbackServices[0];

  const expectedConfirmation = selected.service_key === 'global'
    ? 'HALT AXIM'
    : 'HALT LANE';

  const canHalt = confirmation === expectedConfirmation && !submitting;

  const haltOperations = async () => {
    if (!canHalt) return;

    setSubmitting(true);

    try {
      if (previewMode) {
        onLocalHalt?.(selected.service_key);
        onNotify?.(
          `${selected.label} halted in local preview mode.`,
          'success'
        );
        setConfirmation('');
        onClose();
        return;
      }

      const response = await fetch('/api/remote/circuit-breaker', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_key: selected.service_key,
          halt: true,
          reason: `Executive ${selected.label} halt from ARC`
        })
      });

      if (!response.ok) {
        throw new Error('Circuit breaker request failed.');
      }

      onNotify?.(`${selected.label} halted securely.`, 'success');
      setConfirmation('');
      onClose();
    } catch (error) {
      onNotify?.(error.message, 'error');
    } finally {
      setSubmitting(false);
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
            className="emergency-modal"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            aria-labelledby="halt-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              aria-label="Close emergency control"
            >
              <SafeIcon icon={FiX} />
            </button>

            <div className="emergency-icon">
              <SafeIcon icon={FiAlertTriangle} />
            </div>
            <p className="eyebrow">Emergency control</p>
            <h2 id="halt-title">Halt an operational lane</h2>
            <p>
              Select the smallest affected lane first. A global halt freezes
              every autonomous operation and routes buffered events to the
              dead-letter queue.
            </p>

            <div className="halt-lane-list" aria-label="Operational lanes">
              {services.map((service) => (
                <button
                  className={`halt-lane ${
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
                  <span>
                    <b>{service.label}</b>
                    <small>{service.description}</small>
                  </span>
                  <em>{service.is_halted ? 'Halted' : 'Ready'}</em>
                </button>
              ))}
            </div>

            {selected.is_halted ? (
              <div className="halt-already-active">
                <SafeIcon icon={FiAlertTriangle} />
                <span>This lane is already halted. Use recovery to resume it.</span>
              </div>
            ) : (
              <>
                <label htmlFor="halt-confirmation">
                  Type <b>{expectedConfirmation}</b> to confirm
                </label>
                <input
                  id="halt-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder={expectedConfirmation}
                  autoComplete="off"
                />

                <button
                  className="halt-button"
                  type="button"
                  disabled={!canHalt}
                  onClick={haltOperations}
                >
                  <SafeIcon icon={FiPower} />
                  {submitting ? 'Halting…' : `Halt ${selected.label}`}
                </button>
              </>
            )}

            {previewMode && (
              <small>
                Preview mode simulates lane halts locally and persists them on
                this device only.
              </small>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CircuitBreakerModal;