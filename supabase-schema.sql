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

-- ─── Daily planner ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,
    date            DATE NOT NULL,
    minutes_studied INTEGER NOT NULL DEFAULT 0,
    goal_id         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.daily_plans (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT NOT NULL,
    date       DATE NOT NULL,
    plan_json  JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, date)
);

-- ─── Course notes ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT NOT NULL,
    course_id  TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, course_id)
);

-- Same anonymous demo posture as learner_states: tighten before real use.
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access for demo" ON public.study_sessions;
CREATE POLICY "Allow public access for demo" ON public.study_sessions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access for demo" ON public.daily_plans;
CREATE POLICY "Allow public access for demo" ON public.daily_plans
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access for demo" ON public.course_notes;
CREATE POLICY "Allow public access for demo" ON public.course_notes
    FOR ALL USING (true) WITH CHECK (true);
