# LearnForge

An AI-powered personalised learning path recommender. Describe your goal in a
short conversation and LearnForge builds a phased course roadmap, explains why
every course is on it, and re-plans the sequence as your skills change.

Built for the HCL Amplified Hackathon.

## Running it

```bash
npm install
cp .env.example .env    # then fill in AI_API_KEY
npm run dev
```

Open http://localhost:5173.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_KEY` | yes | Model provider key. Read server-side by the proxy (dev) or edge function (deployed) — **no `VITE_` prefix**, so it is never inlined into the browser bundle. |
| `VITE_SUPABASE_URL` | no | Enables progress persistence. Without it the app runs in memory. |
| `VITE_SUPABASE_ANON_KEY` | no | As above. |

For persistence, run `supabase-schema.sql` once in the Supabase SQL editor.

## Architecture

```
src/
  data/         Seed course catalog, skill taxonomy, offline fallback path
  prompts/      One system prompt per AI capability
  services/     Model client (retry, timeout, cooldown, JSON recovery), Supabase
  state/        useReducer store
  components/   landing · onboarding · dashboard · assistant · shared
  utils/        Progress, skill, and status derivation
```

### The model endpoint is proxied, not called directly

`integrate.api.nvidia.com` sends no CORS headers, so the browser cannot call it
from page JavaScript. Two proxies expose the same `/api/ai` path and attach the
key server-side, so the client code is identical in both environments:

| Environment | Proxy |
| --- | --- |
| `npm run dev` / `npm run preview` | `vite.config.js` |
| Deployed | `api/ai.js` (edge function) |

The key is read as `AI_API_KEY` — deliberately without a `VITE_` prefix, so Vite
never inlines it into the browser bundle.

### Deploying

The repo is configured for Vercel (`vercel.json` + `api/ai.js`).

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Add an environment variable `AI_API_KEY` with your NVIDIA NIM key.
3. Deploy. The build and output settings come from `vercel.json`.

For another host, port `api/ai.js` to its function format. The requirement is
that it streams the upstream body through rather than buffering it — see below.

### Latency, and why every call streams

The upstream is slow and highly variable: 17-56s for a short reply, and up to
~2 minutes for path generation. Two consequences shape the design.

**Everything streams.** `postOnce` in `src/services/aiService.js` always sends
`stream: true` and accumulates the deltas, even for calls whose result is only
useful complete. A buffered request that sends nothing for two minutes is killed
by serverless function timeouts; streaming keeps bytes flowing so the request
survives. The assistant additionally renders its deltas as they arrive.

**Timeouts limit silence, not duration.** The per-call budget resets on each
delta, so a slow-but-progressing response is never cut off, while a genuinely
dead connection still fails fast.

Every AI surface degrades to a usable state on failure, and path generation
offers a built-in sample path so a demo can continue with no network at all.
