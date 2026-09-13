const REQUEST_TIMEOUT_MS = 15000;

function createDispatchError(response, body) {
  if (response.status === 409) {
    return new Error('409 Conflict: The action was already modified.');
  }

  const message =
    body?.message ||
    body?.error ||
    `Dispatch failed with status ${response.status}.`;

  return new Error(message);
}

async function dispatchItem(item, decision, comment, retryAttempt = 0) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch('/api/remote/hitl-resolve', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Dispatch-Attempt': String(retryAttempt + 1)
      },
      signal: controller.signal,
      body: JSON.stringify({
        task_id: item.id,
        decision,
        source_app: item.source_app,
        action_payload: item.action_payload,
        comment:
          comment ||
          (retryAttempt > 0
            ? `Retry ${retryAttempt} via AXiM Executive Remote`
            : 'Bulk resolution via AXiM Executive Remote')
      })
    });

    if (!response.ok) {
      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      throw createDispatchError(response, body);
    }

    return {
      item,
      status: 'fulfilled',
      attempts: retryAttempt + 1
    };
  } catch (error) {
    const message =
      error.name === 'AbortError'
        ? 'The dispatch timed out before edge confirmation.'
        : error.message || 'The edge service rejected this action.';

    return {
      item,
      status: 'rejected',
      attempts: retryAttempt + 1,
      error: new Error(message)
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildResult(results) {
  return {
    resolvedIds: results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.item.id),
    failedItems: results
      .filter((result) => result.status === 'rejected')
      .map((result) => ({
        ...result.item,
        dispatchAttempts: result.attempts,
        dispatchError: result.error?.message || 'Dispatch failed.'
      }))
  };
}

export async function resolveBulkActions({
  items,
  decision,
  comment = '',
  previewMode,
  onProgress,
  retryAttempt = 0
}) {
  if (!items.length) {
    return {
      resolvedIds: [],
      failedItems: []
    };
  }

  if (previewMode) {
    items.forEach((item, index) => {
      onProgress?.({
        completed: index + 1,
        total: items.length,
        item,
        status: 'fulfilled'
      });
    });

    return {
      resolvedIds: items.map((item) => item.id),
      failedItems: []
    };
  }

  let completed = 0;

  const results = await Promise.all(
    items.map(async (item) => {
      const result = await dispatchItem(
        item,
        decision,
        comment,
        retryAttempt
      );

      completed += 1;
      onProgress?.({
        completed,
        total: items.length,
        item,
        status: result.status,
        error: result.error?.message
      });

      return result;
    })
  );

  return buildResult(results);
}
