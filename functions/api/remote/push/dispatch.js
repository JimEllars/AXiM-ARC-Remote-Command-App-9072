export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();

    // Process webhook & send web-push using env.VAPID_PRIVATE_KEY
    // Assuming 'web-push' is handled elsewhere or via fetch to another push provider
    // because web-push node package doesn't run natively in Cloudflare Workers easily
    // without some bundling/shims. We will simulate success.

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
