export async function onRequestPost(context) {
  const { request } = context;
  try {
    const data = await request.json();

    // Typically insert into Supabase here
    // const supabaseUrl = env.SUPABASE_URL;
    // const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
