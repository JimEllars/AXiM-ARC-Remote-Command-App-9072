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
  const { request } = context;
  try {
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return createResponse(false, null, { code: 'BAD_REQUEST', message: 'Malformed JSON payload.' }, context, 400);
    }

    if (data.email !== 'james.ellars@axim.us.com' && data.email !== 'jrellars@gmail.com') {
      return createResponse(false, null, { code: 'UNAUTHORIZED', message: 'Unauthorized user.' }, context, 403);
    }

    // Simulate FIDO2 challenge generation for AXiM Passport
    const challengeResponse = await fetch('https://passport.axim.us.com/api/v1/auth/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email })
    }).catch(() => null);

    let challenge;
    if (challengeResponse && challengeResponse.ok) {
       const respData = await challengeResponse.json();
       challenge = respData.challenge;
    } else {
       // Mock challenge for dev/preview
       challenge = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    }

    return createResponse(true, { challenge }, null, context, 200);
  } catch (err) {
    return createResponse(false, null, { code: 'INTERNAL_ERROR', message: err.message }, context, 500);
  }
}
