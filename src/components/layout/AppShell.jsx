import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import Toast from '../common/Toast';
import { useHitlQueue } from '../../hooks/useHitlQueue';
import { useOnyxStream } from '../../hooks/useOnyxStream';
import { useTelemetry } from '../../hooks/useTelemetry';
import { useCircuitBreakerState } from '../../hooks/useCircuitBreakerState';
import { enablePushNotifications } from '../../services/pushNotificationService';
import ActionConfirmModal from '../hitl/ActionConfirmModal';
import CircuitBreakerModal from '../emergency/CircuitBreakerModal';
import CircuitBreakerRecoveryModal from '../emergency/CircuitBreakerRecoveryModal';
import HitlDeck from '../hitl/HitlDeck';
import StreamingTerminal from '../onyx/StreamingTerminal';
import ExecutiveMetricsGrid from '../telemetry/ExecutiveMetricsGrid';
import InfrastructurePulse from '../telemetry/InfrastructurePulse';
import BottomNav from './BottomNav';
import ExecutiveHeader from './ExecutiveHeader';
import SystemDirectory from './SystemDirectory';

const { FiArrowRight, FiEye, FiLayers, FiRefreshCw } = FiIcons;

function AppShell({ previewMode, onExitPreview }) {
  const [activeView, setActiveView] = useState('telemetry');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState(null);

  const hitl = useHitlQueue(previewMode);
  const telemetry = useTelemetry(previewMode);
  const onyx = useOnyxStream(previewMode);
  const circuitBreaker = useCircuitBreakerState(previewMode);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const requestedView = window.location.hash.replace('#', '').split('?')[0];
    if (['telemetry', 'hitl', 'onyx'].includes(requestedView)) {
      setActiveView(requestedView);
    }
  }, []);

  const showToast = (message, tone = 'info') => {
    setToast({ message, tone });
  };

  const requestResolve = (item, decision) => {
    setConfirmingAction({ item, decision });
  };

  const resolveItem = async () => {
    if (!confirmingAction) return;

    const { item, decision } = confirmingAction;
    setSubmittingAction(true);

    try {
      if (previewMode) {
        hitl.setQueue((current) =>
          current.filter((entry) => entry.id !== item.id)
        );
        setConfirmingAction(null);
        showToast(
          decision === 'APPROVED'
            ? 'Action approved in local preview mode.'
            : 'Revision request recorded locally.',
          'success'
        );
        return;
      }

      const response = await fetch('/api/remote/hitl-resolve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: item.id,
          decision,
          source_app: item.source_app,
          action_payload: item.action_payload,
          comment: 'Resolved via AXiM Executive Remote'
        })
      });

      if (!response.ok) {
        throw new Error('The edge service rejected this action.');
      }

      hitl.setQueue((current) =>
        current.filter((entry) => entry.id !== item.id)
      );
      setConfirmingAction(null);
      showToast(
        decision === 'APPROVED'
          ? 'Action approved and dispatched securely.'
          : 'Revision request sent to the originating system.',
        'success'
      );
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleNotifications = async () => {
    if (previewMode) {
      showToast('Notifications are disabled in preview mode.', 'info');
      return;
    }

    try {
      await enablePushNotifications();
      showToast('This device is now registered for executive alerts.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="app-shell">
      {previewMode && (
        <div className="preview-banner">
          <SafeIcon icon={FiEye} />
          Preview data · operational actions are simulated locally
          <button type="button" onClick={onExitPreview}>
            Exit
          </button>
        </div>
      )}
      <Toast
        message={toast?.message}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
      <ExecutiveHeader
        queueCount={hitl.queue.length}
        onEmergency={() => setEmergencyOpen(true)}
        onRecovery={() => setRecoveryOpen(true)}
        onNotifications={handleNotifications}
      />
      <main className="main-content">
        {activeView === 'telemetry' && (
          <>
            <div className="view-heading">
              <div>
                <p className="eyebrow">Executive overview</p>
                <h1>Command center</h1>
              </div>
              <button
                className="refresh-button"
                type="button"
                onClick={() => window.location.reload()}
                aria-label="Refresh command center"
              >
                <SafeIcon icon={FiRefreshCw} />
                Refresh
              </button>
            </div>
            <SystemDirectory previewMode={previewMode} onNotify={showToast} />
            <ExecutiveMetricsGrid
              metrics={telemetry.metrics}
              loading={telemetry.loading}
            />
            <InfrastructurePulse
              pulses={telemetry.pulses}
              previewMode={previewMode}
            />
            <button
              className="queue-callout"
              type="button"
              onClick={() => {
                window.location.hash = 'hitl';
                setActiveView('hitl');
              }}
            >
              <span>
                <SafeIcon icon={FiLayers} />
              </span>
              <div>
                <b>{hitl.queue.length} actions</b>
                <small>Awaiting executive review</small>
              </div>
              <SafeIcon icon={FiArrowRight} />
            </button>
          </>
        )}

        {activeView === 'hitl' && (
          <>
            <div className="view-heading">
              <div>
                <p className="eyebrow">Human in the loop</p>
                <h1>Action queue</h1>
              </div>
              <span>{hitl.queue.length} pending</span>
            </div>
            {hitl.error && <div className="inline-error">{hitl.error}</div>}
            <HitlDeck
              queue={hitl.queue}
              loading={hitl.loading}
              previewMode={previewMode}
              onResolve={requestResolve}
            />
          </>
        )}

        {activeView === 'onyx' && (
          <>
            <div className="view-heading">
              <div>
                <p className="eyebrow">Cognitive command</p>
                <h1>Onyx terminal</h1>
              </div>
              <span>
                Ready <i />
              </span>
            </div>
            <StreamingTerminal onyx={onyx} previewMode={previewMode} />
          </>
        )}
      </main>
      <BottomNav
        activeView={activeView}
        onChange={(view) => {
          window.location.hash = view;
          setActiveView(view);
        }}
        queueCount={hitl.queue.length}
      />
      <ActionConfirmModal
        item={confirmingAction?.item}
        decision={confirmingAction?.decision}
        open={Boolean(confirmingAction)}
        submitting={submittingAction}
        onConfirm={resolveItem}
        onClose={() => !submittingAction && setConfirmingAction(null)}
      />
      <CircuitBreakerModal
        open={emergencyOpen}
        previewMode={previewMode}
        services={circuitBreaker.services}
        onClose={() => setEmergencyOpen(false)}
        onLocalHalt={circuitBreaker.haltService}
        onNotify={showToast}
      />
      <CircuitBreakerRecoveryModal
        open={recoveryOpen}
        previewMode={previewMode}
        localServices={circuitBreaker.services}
        onLocalRecover={circuitBreaker.recoverService}
        onClose={() => setRecoveryOpen(false)}
        onNotify={showToast}
      />
    </div>
  );
}

export default AppShell;