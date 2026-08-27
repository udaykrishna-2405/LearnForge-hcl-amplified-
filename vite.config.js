import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

const UPSTREAM = 'https://integrate.api.nvidia.com';

/**
 * The model endpoint sends no CORS headers, so the browser cannot call it
 * directly. Requests go through this same-origin proxy instead, which also
 * keeps the API key out of the client bundle — AI_API_KEY deliberately has no
 * VITE_ prefix, so Vite never inlines it.
 */
function aiProxy(env) {
  return {
    '/api/ai': {
      target: UPSTREAM,
      changeOrigin: true,
      rewrite: () => '/v1/chat/completions',
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          if (env.AI_API_KEY) {
            proxyReq.setHeader('Authorization', `Bearer ${env.AI_API_KEY}`);
          }
        });

        // Server-sent events must reach the browser unbuffered, or the whole
        // stream lands at once and streaming buys nothing.
        proxy.on('proxyRes', (proxyRes) => {
          const isStream = (proxyRes.headers['content-type'] ?? '').includes('event-stream');
          if (!isStream) return;
          proxyRes.headers['cache-control'] = 'no-cache';
          proxyRes.headers['connection'] = 'keep-alive';
          delete proxyRes.headers['content-length'];
          delete proxyRes.headers['content-encoding'];
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy: aiProxy(env) },
    preview: { proxy: aiProxy(env) },
  };
});
