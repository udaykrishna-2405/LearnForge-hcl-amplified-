// ─── Course notes persistence ───────────────────────────────
// In-memory map is the source of truth; Supabase is a best-effort mirror so
// notes survive a reload when it is configured, and are simply session-scoped
// when it is not.

import { fetchNotes, upsertNote } from '../services/supabaseClient';

const notes = new Map();

export function primeNotes(entries) {
  for (const { courseId, content } of entries ?? []) {
    notes.set(courseId, content);
  }
}

export function getNote(courseId) {
  return notes.get(courseId) ?? '';
}

export function saveNote(userId, courseId, content) {
  notes.set(courseId, content);
  void upsertNote(userId, courseId, content);
  return content;
}

/** Loads any persisted notes into the in-memory map on start-up. */
export async function loadNotes(userId) {
  const rows = await fetchNotes(userId);
  primeNotes(rows);
  return Object.fromEntries(rows.map(({ courseId, content }) => [courseId, content]));
}
