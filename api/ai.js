/**
 * Production counterpart to the /api/ai proxy in vite.config.js.
 *
 * It exists for two reasons the browser cannot solve on its own: the model host
 * sends no CORS headers, and the API key must never reach the client. Both are
 * handled here, server-side.
 *
 * Runs on the edge runtime so the upstream body can be piped straight through.
 * That matters more than it looks: path generation can run for minutes, and a
 * response that buffers in silence for that long is killed by the platform's
 * function timeout. Streaming keeps bytes moving, so the request survives.
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://integrate.api.nvidia.com/v1/chat/completions';

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    // Deliberately vague to the client; the detail belongs in the host's logs.
    return json({ error: 'AI service is not configured' }, 503);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: request.headers.get('accept') ?? 'application/json',
      },
      body: await request.text(),
    });
  } catch {
    return json({ error: 'Could not reach the AI service' }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    return json({ error: 'The AI service returned an error' }, upstream.status || 502);
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/json';

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': contentType,
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
