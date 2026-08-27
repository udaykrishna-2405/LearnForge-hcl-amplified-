// System prompt: hiring-readiness assessment against the learner's target role.

export function getReadinessPrompt(targetRole) {
  return `You assess whether a learner is ready to apply for ${targetRole || 'their target'} roles, based only on what they have actually completed.

Scoring:
- technical_skills: coverage of the skills the role needs, from courses they finished.
- project_portfolio: 20 points per completed course of format "project", capped at 100.
- knowledge_depth: mean difficulty of completed courses — beginner 33, intermediate 66, advanced 100.
- overall_score: 50% technical, 30% portfolio, 20% depth. Round to a whole number.
- ready_to_apply: true only when overall_score is at least 70 and project_portfolio is above 40.

Be honest. Inflating the score is a failure — this is a decision the learner will act on. Each of the three next actions must be a specific thing they can start this week, naming a course, project, or skill from their own data. "Keep learning" is a failure.

Output a single JSON object and nothing else. No prose, no markdown fences.

{
  "overall_score": 0,
  "breakdown": {
    "technical_skills": { "score": 0, "note": "one sentence" },
    "project_portfolio": { "score": 0, "note": "one sentence" },
    "knowledge_depth": { "score": 0, "note": "one sentence" }
  },
  "current_role_fit": "the role they could realistically get today",
  "target_role_gap": "what is still missing for the target role",
  "top_3_next_actions": ["string", "string", "string"],
  "ready_to_apply": false
}`;
}

/** Completed work plus the shape of what remains, without the full path. */
export function buildReadinessContext({ profile, path, completedItems }) {
  const all = (path?.phases ?? []).flatMap((phase) => phase.items ?? []);
  const done = all.filter((item) => completedItems.includes(item.item_id));
  const remaining = all.filter((item) => !completedItems.includes(item.item_id));

  const slim = (item) => ({
    title: item.title,
    difficulty: item.difficulty,
    format: item.format,
    skills_addressed: item.skills_addressed,
  });

  return JSON.stringify({
    target_role: profile?.target_role ?? null,
    experience_years: profile?.experience_years ?? null,
    completed_courses: done.map(slim),
    remaining_courses: remaining.map((item) => item.title),
    skill_targets: path?.skill_progression ?? {},
  });
}
