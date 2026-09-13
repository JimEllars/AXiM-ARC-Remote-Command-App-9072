export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const { action, service } = data; // action: 'halt' | 'recover'

    if (env.ARC_STATE) {
        if (service === 'global') {
            await env.ARC_STATE.put('emergency_halt', action === 'halt' ? 'true' : 'false');
        } else {
            await env.ARC_STATE.put(`emergency_halt_${service}`, action === 'halt' ? 'true' : 'false');
        }
    }

    // In a full implementation, we'd also hit Supabase here to update public.emergency_switches

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
