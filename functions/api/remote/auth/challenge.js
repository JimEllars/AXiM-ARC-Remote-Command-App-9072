const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

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
      return new Response(JSON.stringify({ error: 'Malformed JSON payload.' }), { status: 400, headers: defaultHeaders });
    }

    if (data.email !== 'james.ellars@axim.us.com' && data.email !== 'jrellars@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized user.' }), { status: 403, headers: defaultHeaders });
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

    return new Response(JSON.stringify({ challenge }), {
      headers: defaultHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: defaultHeaders });
  }
}
