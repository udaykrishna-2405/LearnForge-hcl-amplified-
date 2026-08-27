// ─── Skill level conversion ─────────────────────────────────

const LEVEL_VALUES = { none: 0, beginner: 1, intermediate: 2, advanced: 3 };

export const MAX_SKILL_LEVEL = 3;

export function skillLevelToNum(level) {
  return LEVEL_VALUES[String(level ?? '').toLowerCase()] ?? 0;
}

// ─── Presentation helpers ───────────────────────────────────

export function getDifficultyColor(difficulty) {
  switch (String(difficulty ?? '').toLowerCase()) {
    case 'beginner': return 'bg-emerald-500/15 text-emerald-300';
    case 'intermediate': return 'bg-amber-500/15 text-amber-300';
    case 'advanced': return 'bg-rose-500/15 text-rose-300';
    default: return 'bg-slate-700/50 text-slate-400';
  }
}

export function formatDuration(hours) {
  if (!hours) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours}h`;
}

export function formatWeeks(weeks) {
  if (!weeks) return '0 weeks';
  if (weeks === 1) return '1 week';
  if (weeks <= 8) return `${weeks} weeks`;
  const months = Math.round(weeks / 4.345);
  return `${months} month${months > 1 ? 's' : ''}`;
}

// ─── Path traversal ─────────────────────────────────────────

export function getAllItems(path) {
  return (path?.phases ?? []).flatMap((phase) => phase.items ?? []);
}

/**
 * A course unlocks once every course ahead of it is resolved — completed or
 * skipped. Skipping therefore advances the chain instead of stranding
 * everything downstream behind a course the learner deliberately passed on.
 */
export function getItemStatus(itemId, index, phaseItems, priorItems, completedItems, skippedItems) {
  if (completedItems.includes(itemId)) return 'completed';
  if (skippedItems.includes(itemId)) return 'skipped';

  const blocking = [...priorItems, ...phaseItems.slice(0, index)];
  const allResolved = blocking.every(
    (i) => completedItems.includes(i.item_id) || skippedItems.includes(i.item_id)
  );

  return allResolved ? 'active' : 'locked';
}

// ─── Progress ───────────────────────────────────────────────

const DEFAULT_WEEKLY_HOURS = 10;

/**
 * Durations are derived from the catalog hours and the learner's own weekly
 * budget rather than the model's estimated_weeks, which routinely disagrees
 * with the course list it selected. One source keeps the header and the stats
 * from contradicting each other.
 */
export function calculateProgress(path, completedItems, skippedItems = [], weeklyHours) {
  const perWeek = weeklyHours > 0 ? weeklyHours : DEFAULT_WEEKLY_HOURS;
  const empty = {
    percentage: 0, completed: 0, total: 0,
    hoursInvested: 0, skillsGained: 0, weeksRemaining: 0, totalWeeks: 0,
  };
  if (!path) return empty;

  const allItems = getAllItems(path);
  const total = allItems.length;
  if (total === 0) return empty;

  const skills = new Set();
  let hoursInvested = 0;
  let remainingHours = 0;
  let completed = 0;

  for (const item of allItems) {
    const isComplete = completedItems.includes(item.item_id);
    const isSkipped = skippedItems.includes(item.item_id);

    if (isComplete) {
      completed += 1;
      hoursInvested += item.duration_hours ?? 0;
      for (const tag of item.skills_addressed ?? []) {
        skills.add(String(tag).split(':')[0]);
      }
    } else if (!isSkipped) {
      remainingHours += item.duration_hours ?? 0;
    }
  }

  return {
    percentage: Math.round((completed / total) * 100),
    completed,
    total,
    hoursInvested,
    skillsGained: skills.size,
    weeksRemaining: Math.ceil(remainingHours / perWeek),
    totalWeeks: Math.ceil(
      allItems.reduce((sum, i) => sum + (i.duration_hours ?? 0), 0) / perWeek
    ),
  };
}


// ─── Path adaptation ────────────────────────────────────────

let addedItemSequence = 0;

/**
 * Applies an adaptation diff to a path. Removals never touch work the learner
 * has already done, and additions are placed after their anchor so the
 * prerequisite order the model reasoned about is preserved.
 */
export function applyPathAdaptation(path, diff, completedItems) {
  const removable = new Set(
    (diff.removeItemIds ?? []).filter((id) => !completedItems.includes(id))
  );

  const byAnchor = new Map();
  for (const item of diff.addItems ?? []) {
    if (!item?.course_id) continue;
    addedItemSequence += 1;
    const prepared = { ...item, item_id: `item-added-${addedItemSequence}` };
    const key = `${item.phase_id}::${item.after_item_id ?? ''}`;
    byAnchor.set(key, [...(byAnchor.get(key) ?? []), prepared]);
  }

  const phases = path.phases.map((phase) => {
    const items = [];

    // An addition anchored to nothing goes to the front of its phase.
    items.push(...(byAnchor.get(`${phase.phase_id}::`) ?? []));

    for (const item of phase.items ?? []) {
      if (!removable.has(item.item_id)) items.push(item);
      items.push(...(byAnchor.get(`${phase.phase_id}::${item.item_id}`) ?? []));
    }

    return { ...phase, items };
  });

  return { ...path, phases };
}
