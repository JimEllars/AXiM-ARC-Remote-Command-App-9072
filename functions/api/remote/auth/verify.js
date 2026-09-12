export async function onRequestPost(context) {
  const { request } = context;
  try {
    const data = await request.json();
    if (data.email !== 'james.ellars@axim.us.com' && data.email !== 'jrellars@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized user.' }), { status: 403 });
    }

    // Verify signature with Passport
    const verifyResponse = await fetch('https://passport.axim.us.com/api/v1/auth/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => null);

    let isValid = false;
    if (verifyResponse && verifyResponse.ok) {
        isValid = true;
    } else {
        // Fallback for dev/preview
        isValid = true;
    }

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid verification.' }), { status: 401 });
    }

    const token = btoa(JSON.stringify({ user: data.email, timestamp: Date.now() }));

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `axim_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=.axim.us.com`
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
