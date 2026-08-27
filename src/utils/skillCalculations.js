// ─── Skill level derivation for the radar ───────────────────

import { MAX_SKILL_LEVEL, skillLevelToNum, getAllItems } from './helpers';

const PARTIAL_CREDIT = 0.5;

// A learner who skips something because they already know it has the skill.
const CREDITING_SKIP_REASONS = new Set(['already_know', 'too_easy']);

/**
 * Current level per skill. Completed courses grant their full stated level, and
 * so do courses skipped as already-known. A course in progress grants partial
 * credit so the radar responds while work is underway rather than only at the
 * moment of completion.
 */
export function getSkillLevels(
  path,
  completedCourseIds,
  inProgressCourseIds = [],
  skippedItems = [],
  skipReasons = {}
) {
  const levels = {};

  for (const skill of Object.keys(path?.skill_progression ?? {})) {
    levels[skill] = skillLevelToNum(path.skill_progression[skill]?.start);
  }

  const creditedSkips = new Set(
    skippedItems.filter((id) => CREDITING_SKIP_REASONS.has(skipReasons[id]))
  );

  for (const item of getAllItems(path)) {
    const done = completedCourseIds?.includes(item.item_id) || creditedSkips.has(item.item_id);
    const active = inProgressCourseIds?.includes(item.item_id);
    if (!done && !active) continue;

    for (const tag of item.skills_addressed ?? []) {
      const [skill, level] = String(tag).split(':');
      const value = skillLevelToNum(level);
      const granted = done ? value : Math.max(0, value - PARTIAL_CREDIT);
      levels[skill] = Math.max(levels[skill] ?? 0, granted);
    }
  }

  return levels;
}

export function getTargetSkillLevels(path) {
  const targets = {};
  for (const [skill, data] of Object.entries(path?.skill_progression ?? {})) {
    targets[skill] = skillLevelToNum(data?.target);
  }
  return targets;
}

/** The n skills with the widest gap — where the learner most needs to move. */
export function getTopSkills(currentLevels, targetLevels, n = 8) {
  return Object.keys(targetLevels)
    .map((skill) => ({ skill, gap: (targetLevels[skill] ?? 0) - (currentLevels[skill] ?? 0) }))
    .sort((a, b) => b.gap - a.gap || a.skill.localeCompare(b.skill))
    .slice(0, n)
    .map((entry) => entry.skill);
}

export function getLevelLabel(n) {
  const rounded = Math.round(n ?? 0);
  if (rounded >= MAX_SKILL_LEVEL) return 'Advanced';
  if (rounded === 2) return 'Intermediate';
  if (rounded === 1) return 'Beginner';
  return 'None';
}
