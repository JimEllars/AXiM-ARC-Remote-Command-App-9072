import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import Toast from '../common/Toast';
import { useHitlQueue } from '../../hooks/useHitlQueue';
import { useOnyxStream } from '../../hooks/useOnyxStream';
import { useTelemetry } from '../../hooks/useTelemetry';
import { useCircuitBreakerState } from '../../hooks/useCircuitBreakerState';
import { enablePushNotifications } from '../../services/pushNotificationService';
import { resolveBulkActions } from '../../services/bulkResolutionService';
import ActionConfirmModal from '../hitl/ActionConfirmModal';
import BulkActionConfirmModal from '../hitl/BulkActionConfirmModal';
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
  const [bulkConfirmation, setBulkConfirmation] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [bulkRetryAttempt, setBulkRetryAttempt] = useState(0);
  const [toast, setToast] = useState(null);

  const hitl = useHitlQueue(previewMode);
  const telemetry = useTelemetry(previewMode);
  const onyx = useOnyxStream(previewMode);
  const circuitBreaker = useCircuitBreakerState(previewMode);

  useEffect(() => {
    const handleOfflineSync = (e) => {
      showToast(`Synced ${e.detail} queued action${e.detail > 1 ? 's' : ''}.`, 'success');
    };
    window.addEventListener('arc-offline-sync-complete', handleOfflineSync);
    return () => window.removeEventListener('arc-offline-sync-complete', handleOfflineSync);
  }, []);

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

  const requestBulkResolve = (items, decision) => {
    setBulkResult(null);
    setBulkProgress(null);
    setBulkRetryAttempt(0);
    setBulkConfirmation({ items, decision });
  };

  const updateQueueAfterResolution = (resolvedIds) => {
    hitl.setQueue((current) =>
      current.filter((entry) => !resolvedIds.includes(entry.id))
    );
  };


  useEffect(() => {
    const handleToast = (e) => {
      if (e.detail) {
        showToast(e.detail.message, e.detail.tone || 'info');
      }
    };
    window.addEventListener('arc-toast', handleToast);
    return () => window.removeEventListener('arc-toast', handleToast);
  }, []);

  const resolveItem = async (comment = '') => {
    if (!confirmingAction) return;

    const { item, decision } = confirmingAction;
    setSubmittingAction(true);
    const queueSnapshot = [...hitl.queue];

    try {
      if (previewMode) {
        hitl.setQueue((current) => current.filter((q) => q.id !== item.id));
        setConfirmingAction(null);
        showToast(
          decision === 'APPROVED'
            ? 'Action approved in local preview mode.'
            : 'Revision request recorded locally.',
          'success'
        );
        return;
      }

      const payload = {
          task_id: item.id,
          decision,
          source_app: item.source_app,
          action_payload: item.action_payload,
          comment: comment || 'Resolved via AXiM Executive Remote'
      };

      if (!navigator.onLine) {
          const cached = JSON.parse(localStorage.getItem('arc_offline_actions') || '[]');
          cached.push(payload);
          localStorage.setItem('arc_offline_actions', JSON.stringify(cached));
          // Queue already updated optimistically
          setConfirmingAction(null);
          showToast('Offline: Action queued for automatic delivery.', 'info');
          return;
      }

      const response = await fetch('/api/remote/hitl-resolve', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          if (data.fallbackMode || data.error?.fallback) {
              // Simulate network failure to trigger local demo fallback
              throw new Error('Failed to fetch');
          }
      }

      if (!response.ok) {
        if (response.status === 409) {
           throw new Error('409 Conflict: The action was already modified.');
        }
        if (response.status === 404) {
           // Assume Vite HTML fallback for missing function
           throw new Error('Failed to fetch');
        }
        throw new Error('The edge service rejected this action.');
      }

      setConfirmingAction(null);
      showToast(
        decision === 'APPROVED'
          ? comment
            ? 'Action approved with an audit comment.'
            : 'Action approved and dispatched securely.'
          : comment
            ? 'Revision request sent with an audit comment.'
            : 'Revision request sent to the originating system.',
        'success'
      );
    } catch (error) {
      if (!navigator.onLine || error.message.includes('Failed to fetch')) {
          const payload = {
              task_id: item.id,
              decision,
              source_app: item.source_app,
              action_payload: item.action_payload,
              comment: comment || 'Resolved via AXiM Executive Remote'
          };
          const cached = JSON.parse(localStorage.getItem('arc_offline_actions') || '[]');
          cached.push(payload);
          localStorage.setItem('arc_offline_actions', JSON.stringify(cached));
          // Queue already updated optimistically
          setConfirmingAction(null);
          showToast('Offline: Action queued for automatic delivery.', 'info');
      } else {
          hitl.setQueue(queueSnapshot); // Revert on failure
          if (error.message.includes('409 Conflict')) {
            showToast('Sync collision: This action was already resolved.', 'error');
            hitl.fetchQueue();
          } else {
            showToast(error.message, 'error');
          }
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const dispatchBulkItems = async (
    items,
    decision,
    comment = '',
    retryAttempt = 0
  ) => {
    setSubmittingAction(true);
    setBulkResult(null);
    setBulkProgress({
      completed: 0,
      total: items.length
    });

    try {
      const result = await resolveBulkActions({
        currentQueue: hitl.queue,
        items,
        decision,
        comment,
        previewMode,
        retryAttempt,
        onProgress: setBulkProgress
      });

      // Already optimistically removed, but we need to re-add failed ones
      if (result.failedItems.length > 0) {
        hitl.setQueue(result.rollbackQueue); // Re-add failed items correctly from rollback queue
        hitl.setQueue((current) => current.filter((q) => !result.resolvedIds.includes(q.id)));
      }
      setBulkResult(result);

      if (result.failedItems.length) {
        showToast(
          `${result.resolvedIds.length} resolved. ${
            result.failedItems.length
          } action${
            result.failedItems.length === 1 ? '' : 's'
          } could not be dispatched.`,
          'error'
        );
      } else {
        showToast(
          decision === 'APPROVED'
            ? `${result.resolvedIds.length} actions approved securely.`
            : `${result.resolvedIds.length} revision requests sent securely.`,
          'success'
        );
      }

      return result;
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    } finally {
      setSubmittingAction(false);
    }
  };

  const resolveBulk = async (comment = '') => {
    if (!bulkConfirmation?.items.length) return;

    const { items, decision } = bulkConfirmation;
    const queueSnapshot = [...hitl.queue];

    // Optimistic remove
    hitl.setQueue((current) => current.filter((q) => !items.find(i => i.id === q.id)));

    try {
      await dispatchBulkItems(items, decision, comment);
    } catch (error) {
      hitl.setQueue(queueSnapshot); // Rollback
      if (error.message?.includes('409 Conflict')) {
        showToast('Sync collision: Some actions were already resolved.', 'error');
        hitl.fetchQueue();
      }
      setBulkConfirmation(null);
    }
  };

  const retryFailedBulk = async () => {
    const failedItems = bulkResult?.failedItems || [];

    if (!failedItems.length || !bulkConfirmation) return;

    const previousResult = bulkResult;
    const nextAttempt = bulkRetryAttempt + 1;
    setBulkRetryAttempt(nextAttempt);

    try {
      const retryResult = await dispatchBulkItems(
        failedItems,
        bulkConfirmation.decision,
        '',
        nextAttempt
      );

      const resolvedIds = [
        ...new Set([
          ...previousResult.resolvedIds,
          ...retryResult.resolvedIds
        ])
      ];

      setBulkResult({
        resolvedIds,
        failedItems: retryResult.failedItems
      });
    } catch {
      showToast('Retry dispatch could not be completed.', 'error');
    }
  };

  const handleNotifications = async () => {
    if (previewMode) {
      showToast('Notifications are disabled in preview mode.', 'info');
      return;
    }

    try {
      await enablePushNotifications();
      showToast(
        'This device is now registered for executive alerts.',
        'success'
      );
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: "100dvh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))", paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
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
        connectionStatus={telemetry.connectionStatus}

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
              edgeFingerprint={telemetry.edgeFingerprint}
              pulses={telemetry.pulses}
              previewMode={previewMode}
              onPingAll={telemetry.pingAll}
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
              onResolveBulk={requestBulkResolve}
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

      <BulkActionConfirmModal
        items={bulkConfirmation?.items || []}
        decision={bulkConfirmation?.decision}
        open={Boolean(bulkConfirmation)}
        submitting={submittingAction}
        progress={bulkProgress}
        result={bulkResult}
        onConfirm={resolveBulk}
        onRetry={retryFailedBulk}
        onClose={() => {
          if (!submittingAction) {
            setBulkConfirmation(null);
            setBulkProgress(null);
            setBulkResult(null);
            setBulkRetryAttempt(0);
          }
        }}
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