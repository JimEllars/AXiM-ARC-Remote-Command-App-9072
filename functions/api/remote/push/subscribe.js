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
    if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return createResponse(false, null, { code: 'CONFIGURATION_UNAVAILABLE', message: 'Configuration unavailable', fallback: true }, context, 503);
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return createResponse(false, null, { code: 'BAD_REQUEST', message: 'Malformed JSON payload.' }, context, 400);
    }

    return createResponse(true, null, null, context, 200);
  } catch (err) {
    return createResponse(false, null, { code: 'INTERNAL_ERROR', message: err.message }, context, 500);
  }
}
