// ─── Study session derivation ───────────────────────────────
// Pure functions over a session log: [{ date: 'YYYY-MM-DD', minutes }]

import { getAllItems } from './helpers';

const DAY_MS = 86_400_000;

/** Local calendar date as YYYY-MM-DD; toISOString would shift by timezone. */
export function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(aKey, bKey) {
  return Math.round((new Date(`${bKey}T00:00:00`) - new Date(`${aKey}T00:00:00`)) / DAY_MS);
}

/**
 * Consecutive study days ending today or yesterday. Yesterday still counts so
 * the streak does not appear broken before the user has studied today.
 */
export function calculateStreak(sessions) {
  if (!sessions?.length) return 0;

  const days = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  const today = toDateKey();

  const gapFromToday = daysBetween(days[0], today);
  if (gapFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i += 1) {
    if (daysBetween(days[i], days[i - 1]) !== 1) break;
    streak += 1;
  }
  return streak;
}

/** Total minutes studied across the last 7 days, today included. */
export function calculateWeeklyMinutes(sessions) {
  if (!sessions?.length) return 0;
  const cutoff = toDateKey(new Date(Date.now() - 6 * DAY_MS));
  return sessions
    .filter((s) => s.date >= cutoff)
    .reduce((sum, s) => sum + (s.minutes ?? 0), 0);
}

export function calculateWeeklyHours(sessions) {
  return Math.round((calculateWeeklyMinutes(sessions) / 60) * 10) / 10;
}

/**
 * Compares how far through the timeline the learner is against how much of the
 * path they have finished. Ten points of slack in either direction counts as
 * on track, so normal week-to-week variation does not read as failure.
 */
export function getPaceStatus(path, completedItems, startedAt, timelineMonths) {
  if (!path || !timelineMonths) return 'on-track';

  const total = getAllItems(path).length;
  if (total === 0) return 'on-track';

  const daysElapsed = Math.max(0, (Date.now() - new Date(startedAt).getTime()) / DAY_MS);
  const timeProgress = Math.min(1, daysElapsed / (timelineMonths * 30));
  const courseProgress = (completedItems?.length ?? 0) / total;

  if (courseProgress > timeProgress + 0.1) return 'ahead';
  if (courseProgress < timeProgress - 0.1) return 'behind';
  return 'on-track';
}

/**
 * Projected finish date from observed pace, falling back to the learner's
 * stated weekly budget until enough sessions exist to measure them.
 */
export function getExpectedCompletionDate(path, completedItems, sessions, weeklyHoursGoal) {
  if (!path) return null;

  const remainingHours = getAllItems(path)
    .filter((item) => !completedItems?.includes(item.item_id))
    .reduce((sum, item) => sum + (item.duration_hours ?? 0), 0);

  if (remainingHours === 0) return toDateKey();

  const observed = calculateWeeklyHours(sessions);
  const perWeek = observed > 0 ? observed : (weeklyHoursGoal > 0 ? weeklyHoursGoal : 10);
  const weeks = Math.ceil(remainingHours / perWeek);

  return toDateKey(new Date(Date.now() + weeks * 7 * DAY_MS));
}

export function formatLongDate(dateKey) {
  if (!dateKey) return '';
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateKey) {
  if (!dateKey) return '';
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
