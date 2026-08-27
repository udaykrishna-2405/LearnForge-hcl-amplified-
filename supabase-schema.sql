-- LearnForge — Supabase schema
-- Run once in the Supabase SQL editor before enabling persistence.

CREATE TABLE IF NOT EXISTS public.learner_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile         JSONB,
    path_data       JSONB,
    completed_items JSONB DEFAULT '[]'::jsonb,
    skipped_items   JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing installations predate the skipped_items column.
ALTER TABLE public.learner_states
    ADD COLUMN IF NOT EXISTS skipped_items JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.learner_states ENABLE ROW LEVEL SECURITY;

-- Anonymous demo access. Sessions are keyed by an unguessable client-side UUID;
-- tighten this to an authenticated policy before any real deployment.
DROP POLICY IF EXISTS "Allow public access for demo" ON public.learner_states;
CREATE POLICY "Allow public access for demo" ON public.learner_states
    FOR ALL USING (true) WITH CHECK (true);
