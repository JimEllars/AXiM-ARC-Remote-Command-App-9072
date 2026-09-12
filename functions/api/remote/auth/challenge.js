export async function onRequestPost(context) {
  const { request } = context;
  try {
    const data = await request.json();
    if (data.email !== 'james.ellars@axim.us.com' && data.email !== 'jrellars@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized user.' }), { status: 403 });
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
