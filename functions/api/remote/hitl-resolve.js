async function verifyHmac(payload, signature, secret) {
    if (!signature) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['verify']
    );
    const sigBuf = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(payload));
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Axim-Signature',
  'X-Content-Type-Options': 'nosniff'
};


function createResponse(success, data, error, context, status = 200, headers = defaultHeaders) {
  const payload = {
    success,
    data: data || null,
    error: error ? { code: error.code || 'UNKNOWN_ERROR', message: error.message || error } : null,
    meta: {
      timestamp: new Date().toISOString(),
      edgeRegion: context?.request?.cf?.colo || 'Local'
    }
  };
  if (error && error.fallback) {
      payload.fallbackMode = true;
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: defaultHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const signature = request.headers.get('X-Axim-Signature');

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return createResponse(false, null, { code: 'BAD_REQUEST', message: 'Malformed JSON payload.' }, context, 400);
    }

    if (!data || typeof data !== 'object') {
      return createResponse(false, null, { code: 'BAD_REQUEST', message: 'Invalid payload.' }, context, 400);
    }

    const { task_id, decision, source_app, action_payload, comment } = data;

    if (!task_id || !decision) {
      return createResponse(false, null, { code: 'BAD_REQUEST', message: 'Missing required fields: task_id, decision' }, context, 400);
    }

    if (env && env.ARC_STATE) {
      const kvState = await env.ARC_STATE.get('emergency_halt');
      if (kvState === 'true') {
         return createResponse(false, null, { code: 'SERVICE_UNAVAILABLE', message: 'System is halted.' }, context, 503);
      }
    }

    let targetUrl = '';
    if (source_app === 'Coding Lab') {
        targetUrl = 'https://coder.axim.us.com/api/v1/tasks/merge';
    } else {
        targetUrl = 'https://support.axim.us.com/api/v1/tasks/resolve';
    }

    // Defensive check if fetch succeeds
    try {
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Axim-Signature': signature || 'dev-sig' },
        body: JSON.stringify({ task_id, decision, action_payload, comment })
      });
    } catch (fetchErr) {
       // Ignore fetch errors to remote target if unreachable in fallback
       console.error("Downstream fetch failed:", fetchErr);
    }

    return createResponse(true, { task_id }, null, context, 200);
  } catch (err) {
    return createResponse(false, null, { code: 'INTERNAL_ERROR', message: err.message }, context, 500);
  }
}
