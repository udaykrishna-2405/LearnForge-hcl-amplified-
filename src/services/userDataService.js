import { supabase } from './supabaseClient';

// ─── Constants & Configuration ──────────────────────────────

// PostgREST's "no rows returned" from .single(); an absent row is not an error
// here, it just means the user has not reached that part of the app yet.
const NO_ROWS = 'PGRST116';

const VERIFICATION_BUCKET = 'verification-uploads';
const SIGNED_URL_TTL_SECONDS = 3600;

function unlessMissing(error) {
  if (error && error.code !== NO_ROWS) throw error;
}

// ─── Profile ────────────────────────────────────────────────

export async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  unlessMissing(error);
  return data ?? null;
}

export async function saveUserProfile(userId, profileData, onboardingComplete) {
  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: userId,
      profile_data: profileData,
      onboarding_complete: onboardingComplete,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

// ─── Learning path ──────────────────────────────────────────

export async function loadActivePath(userId) {
  const { data, error } = await supabase
    .from('learning_paths')
    .select('path_data, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  unlessMissing(error);
  return data ? { path: data.path_data, startedAt: data.created_at } : null;
}

/**
 * Retires any previous path before inserting the new one. A partial unique
 * index allows only one active row per user, so the update must land first.
 */
export async function saveActivePath(userId, pathData) {
  await supabase
    .from('learning_paths')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  const { error } = await supabase
    .from('learning_paths')
    .insert({ user_id: userId, path_data: pathData, is_active: true });
  if (error) throw error;
}

export async function updateActivePath(userId, pathData) {
  const { error } = await supabase
    .from('learning_paths')
    .update({ path_data: pathData, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
}

// ─── Course progress ────────────────────────────────────────

export async function loadCourseProgress(userId) {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function saveCourseProgress(userId, courseId, updates) {
  const { error } = await supabase.from('course_progress').upsert(
    {
      user_id: userId,
      course_id: courseId,
      ...updates,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' }
  );
  if (error) throw error;
}

// ─── Chat history ───────────────────────────────────────────

export async function loadChatHistory(userId, chatType) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('messages')
    .eq('user_id', userId)
    .eq('chat_type', chatType)
    .maybeSingle();

  unlessMissing(error);
  return data?.messages ?? [];
}

export async function saveChatHistory(userId, chatType, messages) {
  const { error } = await supabase.from('chat_history').upsert(
    {
      user_id: userId,
      chat_type: chatType,
      messages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,chat_type' }
  );
  if (error) throw error;
}

// ─── Notes ──────────────────────────────────────────────────

export async function loadAllNotes(userId) {
  const { data, error } = await supabase
    .from('course_notes')
    .select('course_id, content')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({ courseId: row.course_id, content: row.content ?? '' }));
}

export async function saveNote(userId, courseId, content) {
  const { error } = await supabase.from('course_notes').upsert(
    { user_id: userId, course_id: courseId, content, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' }
  );
  if (error) throw error;
}

// ─── Study sessions ─────────────────────────────────────────

export async function loadStudySessions(userId, daysBack = 90) {
  const since = new Date(Date.now() - daysBack * 86_400_000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('study_sessions')
    .select('date, minutes_studied')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({ date: row.date, minutes: row.minutes_studied ?? 0 }));
}

export async function saveStudySession(userId, date, minutes) {
  const { error } = await supabase.from('study_sessions').upsert(
    { user_id: userId, date, minutes_studied: minutes },
    { onConflict: 'user_id,date' }
  );
  if (error) throw error;
}

// ─── Daily plans ────────────────────────────────────────────

export async function loadDailyPlan(userId, date) {
  const { data, error } = await supabase
    .from('daily_plans')
    .select('plan_json')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  unlessMissing(error);
  return data?.plan_json ?? null;
}

export async function saveDailyPlan(userId, date, plan) {
  const { error } = await supabase.from('daily_plans').upsert(
    { user_id: userId, date, plan_json: plan },
    { onConflict: 'user_id,date' }
  );
  if (error) throw error;
}

// ─── Verification uploads ───────────────────────────────────

/**
 * Stores proof under a folder named for the user, which is what the storage
 * policy checks — one user cannot read or write another's uploads.
 */
export async function uploadVerificationImage(userId, courseId, file) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const filePath = `${userId}/${courseId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: urlError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
  if (urlError) throw urlError;

  return { filePath, signedUrl: data.signedUrl };
}
