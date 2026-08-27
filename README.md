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
| `AI_API_KEY` | yes | Model provider key. Read by the dev-server proxy only — **no `VITE_` prefix**, so it is never inlined into the browser bundle. |
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
from page JavaScript. `vite.config.js` exposes `/api/ai` as a same-origin proxy
and attaches the key server-side. This fixes CORS and keeps the key out of the
client bundle.

**Deploying anywhere other than `vite dev`/`vite preview` requires porting that
proxy to a serverless function** (Vercel/Netlify function, Express route, or
similar) that forwards to `https://integrate.api.nvidia.com/v1/chat/completions`
with the `Authorization` header attached. Without it the AI features will fail
and the app will fall back to its sample path.

### Latency

The upstream is slow and highly variable — 17-56s for a short reply, and longer
for path generation. Timeouts are sized accordingly in `src/services/aiService.js`,
requests time out rather than hang forever, and every AI surface degrades to a
usable state on failure. Path generation offers a built-in sample path so a demo
can continue with no network.
