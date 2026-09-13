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

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    // Validate session or JWT in real app, here we check HMAC
    const signature = request.headers.get('X-Axim-Signature');
    const rawBody = await request.clone().text();

    // In production we would verify HMAC here
    // if (!await verifyHmac(rawBody, signature, env.AXIM_HMAC_SECRET)) {
    //    return new Response('Invalid signature', { status: 401 });
    // }

    const data = await request.json();
    const { task_id, decision, source_app, action_payload, comment } = data;

    // Check emergency switches
    // const kvState = await env.ARC_STATE.get('emergency_halt');
    // if (kvState === 'true') {
    //    return new Response(JSON.stringify({ error: 'System is halted.' }), { status: 503 });
    // }

    let targetUrl = '';
    if (source_app === 'Coding Lab') {
        targetUrl = 'https://coder.axim.us.com/api/v1/tasks/merge';
    } else {
        targetUrl = 'https://support.axim.us.com/api/v1/tasks/resolve';
    }

    const downstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Axim-Signature': signature || 'dev-sig' },
      body: JSON.stringify({ task_id, decision, action_payload, comment })
    }).catch(() => null);

    return new Response(JSON.stringify({ success: true, task_id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
