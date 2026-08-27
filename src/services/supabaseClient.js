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
 * Best-effort snapshot of learner progress. Failures are swallowed because
 * losing a background save must never interrupt the session.
 */
export async function saveLearnerState(learnerId, { profile, path, completedItems, skippedItems }) {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('learner_states').upsert(
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
  } catch {
    return false;
  }
}
