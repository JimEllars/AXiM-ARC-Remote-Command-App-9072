const fs = require('fs');

const path = 'src/components/layout/AppShell.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Update resolveItem
content = content.replace(
  `const resolveItem = async (comment = '') => {
    if (!confirmingAction?.item) return;

    setSubmittingAction(true);
    const { item, decision } = confirmingAction;`,
  `const resolveItem = async (comment = '') => {
    if (!confirmingAction?.item) return;

    setSubmittingAction(true);
    const { item, decision } = confirmingAction;

    // Store snapshot before optimistic update
    const queueSnapshot = [...hitl.queue];
    hitl.setQueue((current) => current.filter((q) => q.id !== item.id));`
);

content = content.replace(
  `      if (!navigator.onLine) {
          const cached = JSON.parse(localStorage.getItem('arc_offline_actions') || '[]');
          cached.push(payload);
          localStorage.setItem('arc_offline_actions', JSON.stringify(cached));
          hitl.setQueue((current) => current.filter((q) => q.id !== item.id));
          setConfirmingAction(null);`,
  `      if (!navigator.onLine) {
          const cached = JSON.parse(localStorage.getItem('arc_offline_actions') || '[]');
          cached.push(payload);
          localStorage.setItem('arc_offline_actions', JSON.stringify(cached));
          // Queue already updated optimistically
          setConfirmingAction(null);`
);

content = content.replace(
  `      if (!response.ok) {
        throw new Error('The edge service rejected this action.');
      }

      hitl.setQueue((current) => current.filter((q) => q.id !== item.id));
      setConfirmingAction(null);`,
  `      if (!response.ok) {
        if (response.status === 409) {
           throw new Error('409 Conflict: The action was already modified.');
        }
        throw new Error('The edge service rejected this action.');
      }

      setConfirmingAction(null);`
);

content = content.replace(
  `} catch (error) {
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
          hitl.setQueue((current) => current.filter((q) => q.id !== item.id));
          setConfirmingAction(null);
          showToast('Offline: Action queued for automatic delivery.', 'info');
      } else {
          showToast(error.message, 'error');
      }`,
  `} catch (error) {
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
      }`
);

// Update resolveBulk
content = content.replace(
  `  const resolveBulk = async (comment = '') => {
    if (!bulkConfirmation?.items.length) return;

    const { items, decision } = bulkConfirmation;

    try {
      await dispatchBulkItems(items, decision, comment);
    } catch {
      setBulkConfirmation(null);
    }
  };`,
  `  const resolveBulk = async (comment = '') => {
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
  };`
);

content = content.replace(
  `      updateQueueAfterResolution(result.resolvedIds);
      setBulkResult(result);`,
  `      // Already optimistically removed, but we need to re-add failed ones
      if (result.failedItems.length > 0) {
        hitl.setQueue((current) => [...current, ...result.failedItems]);
      }
      setBulkResult(result);`
);

fs.writeFileSync(path, content);
