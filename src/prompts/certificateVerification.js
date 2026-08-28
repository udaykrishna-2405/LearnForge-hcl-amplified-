// System prompts: proving a course was actually completed.

/** Vision prompt. Sent as the text part alongside the uploaded image. */
export function getVerificationPrompt(courseTitle, courseProvider) {
  return `You verify proof of course completion. Decide whether this image is genuine evidence that the learner finished:

Course: ${courseTitle}
Provider: ${courseProvider}

Check for:
1. A completion certificate, badge, or a course page showing 100% complete.
2. A course name matching or closely related to "${courseTitle}".
3. Provider branding consistent with "${courseProvider}" — Coursera, Udacity, fast.ai, MIT OpenCourseWare, freeCodeCamp, Khan Academy, DataCamp, Google, Stanford Online and similar.
4. A completion date, learner name, or completion percentage.
5. Signs it is a real screenshot or certificate rather than a text document someone typed.

Judgement:
- Accept a close match. Abbreviations, version numbers, and specialisation names that differ slightly are fine.
- Reject when the image shows a different subject, shows progress still in flight, looks fabricated, or is too small or blurry to read.
- Only set verified true when confidence is above 0.7. When unsure, set it false and say plainly what is missing.

Output a single JSON object and nothing else. No prose, no markdown fences.

{
  "verified": false,
  "confidence": 0.0,
  "course_name_detected": "what the image says, or null",
  "provider_detected": "what the image says, or null",
  "completion_indicator": "certificate | badge | 100% progress | null",
  "reason": "one or two sentences for the learner",
  "issues": []
}`;
}

/** Fallback used when the account has no vision model: ask, don't look. */
export function getQuizVerificationPrompt(courseTitle, courseProvider) {
  return `Write three questions that check whether someone genuinely completed "${courseTitle}" from ${courseProvider}.

Someone who took the course should answer easily from memory. Someone who only read the course description should struggle. Cover a key concept taught, a specific tool or technique used, and a practical application or project from the course.

Ask for short written answers. Do not write multiple choice.

Output a single JSON object and nothing else. No prose, no markdown fences.

{
  "questions": [
    { "id": "q1", "question": "string", "expected_topic": "what a correct answer should mention" },
    { "id": "q2", "question": "string", "expected_topic": "string" },
    { "id": "q3", "question": "string", "expected_topic": "string" }
  ]
}`;
}

export function getQuizEvaluationPrompt(courseTitle, questions) {
  return `Judge whether these answers come from someone who completed "${courseTitle}".

The questions asked, with what a sound answer should touch on:
${JSON.stringify(questions)}

The learner's answers arrive as JSON keyed by question id.

Judge familiarity, not polish. Brief or informally worded answers pass when they show real understanding. Answers that restate the question, stay vague, or could have been written by anyone reading the course title do not.

Output a single JSON object and nothing else. No prose, no markdown fences.

{
  "verified": false,
  "scores": [{ "id": "q1", "correct": false, "feedback": "one short sentence" }],
  "overall_feedback": "one or two sentences for the learner",
  "pass_count": 0
}

Set verified true when at least two of the three answers show adequate understanding.`;
}
