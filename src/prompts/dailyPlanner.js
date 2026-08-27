// System prompt: turn a roadmap into one concrete session for today.

const SHAPE = `{
  "primary_task": {
    "course_id": "string from the path",
    "course_title": "string",
    "action": "specific instruction, e.g. 'Watch lectures 3-4 on gradient descent'",
    "estimated_minutes": number,
    "focus_tip": "one sentence on what to pay attention to"
  },
  "secondary_task": {
    "type": "review|quiz|reading|project-step",
    "description": "specific, not generic",
    "estimated_minutes": number
  },
  "motivational_note": "one sentence tied to their stated goal",
  "pacing_note": "one sentence, or null when they are on track"
}`;

export function getDailyPlanPrompt({ availableMinutes }) {
  return `You are LearnForge's study planner. Turn the learner's roadmap into one concrete session for today.

Rules:
- The two tasks together must fit in ${availableMinutes} minutes. Primary takes most of it.
- Name a real course from their path and a real unit inside it. "Continue the course" is a failure; "Watch lectures 3-4 on gradient descent" is correct.
- Pick the course they are actually up to, not one they have finished.
- The motivational note must reference their specific goal or progress. Generic encouragement is a failure.
- Set pacing_note only when the supplied pace status is ahead or behind. Otherwise null.

Output a single JSON object and nothing else. No prose, no markdown fences.

${SHAPE}`;
}

/** Only what the planner needs — sending the whole path wastes tokens. */
export function buildPlannerContext({ profile, path, completedItems, sessions, paceStatus }) {
  const remaining = (path?.phases ?? [])
    .flatMap((phase) => (phase.items ?? []).map((item) => ({ ...item, phase: phase.title })))
    .filter((item) => !completedItems.includes(item.item_id))
    .slice(0, 4)
    .map((item) => ({
      course_id: item.course_id,
      item_id: item.item_id,
      title: item.title,
      phase: item.phase,
      duration_hours: item.duration_hours,
      skills_addressed: item.skills_addressed,
    }));

  return JSON.stringify({
    goal: profile?.target_role ?? null,
    weekly_hours: profile?.weekly_hours ?? null,
    pace_status: paceStatus,
    next_up: remaining,
    completed_count: completedItems.length,
    sessions_last_7_days: sessions.slice(-7),
  });
}
