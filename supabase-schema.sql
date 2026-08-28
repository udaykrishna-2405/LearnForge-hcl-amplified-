-- LearnForge — Supabase schema
--
-- Run once in the Supabase SQL editor.
--
-- WARNING: this DROPS the pre-auth demo tables. They keyed rows by a
-- client-generated id with no owner, which cannot be secured once accounts
-- exist. Every table below is instead owned by a row in auth.users and readable
-- only by that user. If you have data in the old tables, export it first.

DROP TABLE IF EXISTS public.learner_states CASCADE;
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.daily_plans    CASCADE;
DROP TABLE IF EXISTS public.course_notes   CASCADE;

-- ─── Profiles ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name           TEXT,
    profile_data        JSONB NOT NULL DEFAULT '{}',
    onboarding_complete BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- ─── Learning paths ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.learning_paths (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path_data  JSONB NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One ACTIVE path per user, with any number of retired ones. A plain
-- UNIQUE (user_id, is_active) would also cap retired paths at one, so the
-- second time a path was replaced the insert would fail.
CREATE UNIQUE INDEX IF NOT EXISTS learning_paths_one_active
    ON public.learning_paths (user_id) WHERE is_active;

-- ─── Course progress ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_progress (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id              TEXT NOT NULL,
    status                 TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'skipped', 'locked', 'pending_verification')),
    completed_at           TIMESTAMPTZ,
    feedback_rating        TEXT,
    feedback_comment       TEXT,
    verification_image_url TEXT,
    verification_status    TEXT NOT NULL DEFAULT 'none'
        CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
    verification_result    JSONB,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, course_id)
);

-- ─── Chat history ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chat_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_type  TEXT NOT NULL CHECK (chat_type IN ('onboarding', 'assistant')),
    messages   JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, chat_type)
);

-- ─── Notes ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id  TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, course_id)
);

-- ─── Study sessions ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    minutes_studied INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, date)
);

-- ─── Daily plans ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_plans (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    plan_json  JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, date)
);

-- ─── Row level security ─────────────────────────────────────
-- Each policy is the same shape: a row is yours or it is invisible.

ALTER TABLE public.user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'user_profiles', 'learning_paths', 'course_progress',
        'chat_history', 'course_notes', 'study_sessions', 'daily_plans'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Owner access" ON public.%I', t);
        EXECUTE format(
            'CREATE POLICY "Owner access" ON public.%I FOR ALL
             USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t
        );
    END LOOP;
END $$;

-- ─── Verification uploads ───────────────────────────────────
-- Create the bucket first: Storage → New bucket → name "verification-uploads",
-- Public off, 5MB limit, allowed types image/png, image/jpeg, image/webp,
-- application/pdf. Then the policies below scope it per user.
--
-- Uploads are stored as "<user-id>/<item-id>-<timestamp>.<ext>", so the first
-- path segment is the owner and is what these policies check.

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-uploads', 'verification-uploads', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload verification files" ON storage.objects;
CREATE POLICY "Users can upload verification files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'verification-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can read own verification files" ON storage.objects;
CREATE POLICY "Users can read own verification files"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'verification-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
