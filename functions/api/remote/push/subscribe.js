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
  const { request, env } = context;
  try {
    if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ success: false, error: 'CONFIGURATION_UNAVAILABLE', fallback: true }), {
            status: 503, headers: defaultHeaders
        });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Malformed JSON payload.' }), { status: 400, headers: defaultHeaders });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: defaultHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: defaultHeaders });
  }
}
