import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Persistence is optional: without credentials the app runs fully in memory
// rather than crashing at module load.
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isPersistenceEnabled = supabase !== null;

/**
 * Every write is best-effort. In-memory state is the source of truth, so a
 * persistence failure must never surface as an error or block interaction.
 */
async function attempt(run, fallback = null) {
  if (!supabase) return fallback;
  try {
    return await run(supabase);
  } catch {
    return fallback;
  }
}

// ─── Learner state ──────────────────────────────────────────

export async function saveLearnerState(learnerId, { profile, path, completedItems, skippedItems }) {
  return attempt(async (db) => {
    const { error } = await db.from('learner_states').upsert(
      {
        id: learnerId,
        profile,
        path_data: path,
        completed_items: completedItems,
        skipped_items: skippedItems,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  }, false);
}

// ─── Study sessions ─────────────────────────────────────────

export async function fetchRecentSessions(userId, sinceDate) {
  return attempt(async (db) => {
    const { data, error } = await db
      .from('study_sessions')
      .select('date, minutes_studied')
      .eq('user_id', userId)
      .gte('date', sinceDate)
      .order('date', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({ date: row.date, minutes: row.minutes_studied ?? 0 }));
  }, []);
}

export async function upsertStudySession(userId, date, minutes, goalId) {
  return attempt(async (db) => {
    const { error } = await db.from('study_sessions').upsert(
      { user_id: userId, date, minutes_studied: minutes, goal_id: goalId ?? null },
      { onConflict: 'user_id,date' }
    );
    return !error;
  }, false);
}

// ─── Daily plans ────────────────────────────────────────────

export async function upsertDailyPlan(userId, date, plan) {
  return attempt(async (db) => {
    const { error } = await db.from('daily_plans').upsert(
      { user_id: userId, date, plan_json: plan },
      { onConflict: 'user_id,date' }
    );
    return !error;
  }, false);
}

export async function fetchDailyPlan(userId, date) {
  return attempt(async (db) => {
    const { data, error } = await db
      .from('daily_plans')
      .select('plan_json')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    return error ? null : (data?.plan_json ?? null);
  }, null);
}

// ─── Course notes ───────────────────────────────────────────

export async function fetchNotes(userId) {
  return attempt(async (db) => {
    const { data, error } = await db
      .from('course_notes')
      .select('course_id, content')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((row) => ({ courseId: row.course_id, content: row.content ?? '' }));
  }, []);
}

export async function upsertNote(userId, courseId, content) {
  return attempt(async (db) => {
    const { error } = await db.from('course_notes').upsert(
      { user_id: userId, course_id: courseId, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id' }
    );
    return !error;
  }, false);
}
