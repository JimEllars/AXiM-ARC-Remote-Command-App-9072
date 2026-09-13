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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Axim-Signature'
};

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
      return new Response(JSON.stringify({ error: 'Malformed JSON payload.' }), { status: 400, headers: defaultHeaders });
    }

    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload.' }), { status: 400, headers: defaultHeaders });
    }

    const { task_id, decision, source_app, action_payload, comment } = data;

    if (!task_id || !decision) {
      return new Response(JSON.stringify({ error: 'Missing required fields: task_id, decision' }), { status: 400, headers: defaultHeaders });
    }

    if (env && env.ARC_STATE) {
      const kvState = await env.ARC_STATE.get('emergency_halt');
      if (kvState === 'true') {
         return new Response(JSON.stringify({ error: 'System is halted.' }), { status: 503, headers: defaultHeaders });
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

    return new Response(JSON.stringify({ success: true, task_id }), {
      headers: defaultHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: defaultHeaders });
  }
}
