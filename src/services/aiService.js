import { ONBOARDING_SYSTEM_PROMPT, PROFILE_EXTRACTION_SYSTEM_PROMPT } from '../prompts/onboardingPrompt';
import { PATH_GENERATION_SYSTEM_PROMPT } from '../prompts/pathGenerationPrompt';
import { ADAPTATION_SYSTEM_PROMPT } from '../prompts/pathAdaptation';

// ─── Constants & Configuration ──────────────────────────────

// Same-origin path; vite.config.js proxies it upstream and attaches the key,
// which the model host cannot receive cross-origin and the client must not hold.
const API_ENDPOINT = '/api/ai';
/**
 * Chosen on measured latency against this account. deepseek-v4-pro answered a
 * two-sentence prompt in 70s and generated a path in 128s, which no amount of
 * prompt tuning fixes. This model does the same work in under a second and
 * generates a path in ~20s, with no loss in structural quality.
 */
const MODEL = 'nvidia/nemotron-3-nano-30b-a3b';

/**
 * The model reasons aloud by default and leaks that reasoning into its answer,
 * which broke JSON parsing and exhausted the token budget on path generation.
 * Disabled, it emits the answer directly.
 */
const TEXT_MODEL_ARGS = { chat_template_kwargs: { thinking: false } };

// Certificate checking needs a model that can actually see the upload.
const VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

const COOLDOWN_MS = 250;
const RETRY_DELAY_MS = 1_000;

/**
 * Ceilings on silence, not on total duration — the budget resets on every
 * delta. Sized at several times the measured cost of each call so a slow
 * response still completes, while a dead connection fails quickly.
 * Measured: chat 0.6s, extraction 1.2s, quiz 1.7s, readiness 2.3s,
 * adaptation 4.1s, path generation 19.8s.
 */
const TIMEOUT_MS = {
  streaming: 45_000,
  vision: 90_000,
  quizVerification: 45_000,
  dailyPlan: 45_000,
  quiz: 45_000,
  readiness: 45_000,
  onboarding: 30_000,
  profileExtraction: 30_000,
  pathGeneration: 90_000,
  adaptation: 45_000,
  assistant: 45_000,
};

/**
 * Completion budgets sized to each call's job, from a measured baseline: a
 * 15-course path costs ~3.3k completion tokens, so generation needs real
 * headroom because truncation fails the request outright. Adaptation stays
 * small because it returns only a diff.
 */
const MAX_TOKENS = {
  streaming: 1000,
  vision: 600,
  quizVerification: 900,
  dailyPlan: 700,
  quiz: 1200,
  readiness: 900,
  onboarding: 800,
  profileExtraction: 500,
  pathGeneration: 6144,
  adaptation: 1500,
  assistant: 1000,
};

const TEMPERATURE = {
  conversational: 0.7,
  structured: 0.3, // Structured JSON output degrades badly at high temperature.
  extraction: 0,   // Reading facts back out of a transcript should not vary.
};

export class AiServiceError extends Error {
  constructor(message, kind = 'network') {
    super(message);
    this.name = 'AiServiceError';
    this.kind = kind; // 'network' | 'parse' | 'timeout'
  }
}

// ─── Utility Functions ──────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Serialises calls one behind the other with a fixed gap, which keeps rapid
 * interactions from tripping the provider's rate limit.
 */
let cooldownUntil = 0;
async function awaitCooldown() {
  const wait = cooldownUntil - Date.now();
  if (wait > 0) await sleep(wait);
  cooldownUntil = Date.now() + COOLDOWN_MS;
}

/** Parses JSON that the model may have wrapped in prose or markdown fences. */
export function extractJSON(text) {
  if (!text) return null;

  const candidates = [];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) candidates.push(fenced[1]);

  const firstBrace = text.search(/[{[]/);
  const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }
  candidates.push(text);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate.trim());
    } catch {
      // Try the next candidate rather than failing on the first shape.
    }
  }
  return null;
}

/** Scans for a balanced JSON object starting at `from`, returning [text, end]. */
function balancedObjectAt(text, from) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = from; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return [text.slice(from, i + 1), i + 1];
    }
  }
  return null;
}

function safeParse(text) {
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

/**
 * Separates the profile snapshot from the reply. The model is asked for tagged
 * output but drops the wrapper often enough that a bare trailing object has to
 * be recognised too — otherwise the profile panel silently stops updating.
 */
export function splitProfileReply(raw) {
  const text = raw ?? '';

  // Tags are stripped whether or not their payload parses, so a malformed
  // snapshot never leaks into the chat transcript.
  const tagged = text.match(/<PROFILE_JSON>([\s\S]*?)<\/PROFILE_JSON>/);
  const visible = tagged ? text.replace(tagged[0], '').trim() : text;

  if (tagged) {
    const parsed = safeParse(tagged[1]);
    if (parsed) return { text: visible, profileJson: parsed };
  }

  for (let i = visible.indexOf('{'); i !== -1; i = visible.indexOf('{', i + 1)) {
    const found = balancedObjectAt(visible, i);
    if (!found) break;
    const [candidate, end] = found;
    const parsed = safeParse(candidate);
    if (parsed && 'target_role' in parsed) {
      const clean = (visible.slice(0, i) + visible.slice(end))
        .replace(/```(?:json)?/g, '')
        .trim();
      return { text: clean, profileJson: parsed };
    }
  }

  return { text: visible.trim(), profileJson: null };
}

/**
 * The catalog is sent as model context on every generation. Prose fields are
 * dropped because selection only needs the structured attributes, and the
 * saving is roughly two thirds of the payload.
 */
export function compactCatalog(catalog) {
  return catalog.map(({ course_id, title, provider, skills_taught, prerequisites, difficulty, duration_hours, format, rating, cost }) => ({
    course_id, title, provider, skills_taught, prerequisites,
    difficulty, duration_hours, format, rating, cost,
  }));
}

/**
 * Grounds gap analysis in the explicit requirements for the learner's target
 * role when the taxonomy defines one, instead of leaving the model to guess
 * what the role demands. Free-text roles are matched loosely.
 */
function findRoleRequirements(targetRole, requirements) {
  if (!targetRole) return null;
  const wanted = String(targetRole).toLowerCase().replace(/[^a-z]/g, '');
  const hit = Object.keys(requirements).find(
    (role) => role.toLowerCase().replace(/[^a-z]/g, '') === wanted
  );
  return hit ? { role: hit, requires: requirements[hit] } : null;
}

/** Only the fields adaptation needs to reason about placement and redundancy. */
function summarisePathForDiff(path) {
  return (path?.phases ?? []).map((phase) => ({
    phase_id: phase.phase_id,
    title: phase.title,
    items: (phase.items ?? []).map((item) => ({
      item_id: item.item_id,
      course_id: item.course_id,
      title: item.title,
      skills_addressed: item.skills_addressed,
    })),
  }));
}

// ─── Core request ───────────────────────────────────────────

/**
 * Splits a decoder buffer into complete SSE events, returning any trailing
 * partial line so it can be prepended to the next chunk. A network chunk can
 * end mid-line, and parsing that half-line would drop tokens.
 */
function takeCompleteLines(buffer) {
  const lines = buffer.split('\n');
  return { lines: lines.slice(0, -1), rest: lines[lines.length - 1] };
}

function readFinishReason(line) {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return null;
  try {
    return JSON.parse(payload)?.choices?.[0]?.finish_reason ?? null;
  } catch {
    return null;
  }
}

function readDelta(line) {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return null;
  try {
    return JSON.parse(payload)?.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null; // A malformed frame should not abort a healthy stream.
  }
}

/**
 * Every call uses the streaming transport, even the ones whose result is only
 * useful complete. Path generation can run for minutes, and a buffered request
 * that sends nothing for that long is killed by serverless platform timeouts.
 * Streaming keeps bytes flowing, so the connection stays alive; the deltas are
 * simply accumulated and returned as one string.
 */
async function postOnce(systemPrompt, messages, budget, temperature, onChunk) {
  const model = budget.model ?? MODEL;
  const controller = new AbortController();
  // Reset by each delta, so the budget limits silence rather than total length.
  let idleTimer;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort(), budget.timeout);
  };
  resetIdle();

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        model,
        ...(model === MODEL ? TEXT_MODEL_ARGS : {}),
        // Vision requests carry their instruction inside the user turn, so the
        // system role is omitted when there is no system prompt to send.
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        temperature,
        top_p: 0.95,
        max_tokens: budget.maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (response.status === 404 || response.status === 403) {
      throw new AiServiceError('Model is not available for this account', 'unavailable');
    }
    if (!response.ok || !response.body) {
      throw new AiServiceError(`Upstream responded ${response.status}`, 'network');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    let truncated = false;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      resetIdle();

      buffer += decoder.decode(value, { stream: true });
      const { lines, rest } = takeCompleteLines(buffer);
      buffer = rest;

      for (const line of lines) {
        const trimmed = line.trim();
        if (readFinishReason(trimmed) === 'length') truncated = true;
        const delta = readDelta(trimmed);
        if (!delta) continue;
        full += delta;
        onChunk?.(delta);
      }
    }

    if (!full.trim()) {
      throw new AiServiceError('Response contained no message content', 'parse');
    }
    if (truncated) {
      throw new AiServiceError('Response was cut off before it finished', 'parse');
    }

    return full;
  } finally {
    clearTimeout(idleTimer);
  }
}

/**
 * One retry with a fixed backoff. Timeouts are the exception: the budget is
 * already generous, so a retry would only double an unacceptable wait.
 */
async function callModel(kind, systemPrompt, messages, temperature = TEMPERATURE.conversational, model) {
  const budget = { maxTokens: MAX_TOKENS[kind], timeout: TIMEOUT_MS[kind], model };

  await awaitCooldown();
  try {
    return await postOnce(systemPrompt, messages, budget, temperature);
  } catch (error) {
    if (error?.kind === 'unavailable') throw error;
    if (error?.name === 'AbortError') {
      throw new AiServiceError('The model did not respond in time', 'timeout');
    }
    await sleep(RETRY_DELAY_MS);
    await awaitCooldown();
    return postOnce(systemPrompt, messages, budget, temperature);
  }
}

// ─── Streaming ──────────────────────────────────────────────

/**
 * Streams a completion, emitting text as it arrives. Falls back to a second
 * attempt if the stream fails, so a transient break still produces an answer
 * rather than an error.
 */
export async function streamAIResponse({ messages, systemPrompt, onChunk, onDone, onError }) {
  const budget = { maxTokens: MAX_TOKENS.streaming, timeout: TIMEOUT_MS.streaming };

  await awaitCooldown();
  try {
    const full = await postOnce(systemPrompt, messages, budget, TEMPERATURE.conversational, onChunk);
    onDone?.(full);
    return full;
  } catch (error) {
    onError?.(error);

    try {
      await sleep(RETRY_DELAY_MS);
      await awaitCooldown();
      const fallback = await postOnce(systemPrompt, messages, budget, TEMPERATURE.conversational);
      onDone?.(fallback);
      return fallback;
    } catch {
      return null;
    }
  }
}

// ─── Public API ─────────────────────────────────────────────

/** The conversational half of an onboarding turn. */
export async function chatWithAI(chatHistory) {
  const raw = await callModel('onboarding', ONBOARDING_SYSTEM_PROMPT, chatHistory);
  return splitProfileReply(raw).text;
}

/**
 * The structured half, run as its own call. A response that is nothing but JSON
 * is far more reliable than one carrying both prose and a data block, and
 * running it alongside the reply keeps the turn at single-call latency.
 */
export async function extractProfile(chatHistory) {
  const transcript = chatHistory
    .map((m) => `${m.role === 'user' ? 'Learner' : 'Advisor'}: ${m.content}`)
    .join('\n');

  const raw = await callModel(
    'profileExtraction',
    PROFILE_EXTRACTION_SYSTEM_PROMPT,
    [{ role: 'user', content: transcript }],
    TEMPERATURE.extraction
  );

  const parsed = extractJSON(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  // Nulls mean "not yet known" and must not overwrite established values.
  return Object.fromEntries(
    Object.entries(parsed).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
  );
}

export async function generatePath(profile, courseCatalog, skillTaxonomy, roleRequirements) {
  const payload = JSON.stringify({
    profile,
    target_role_requirements: findRoleRequirements(profile?.target_role, roleRequirements ?? {}),
    catalog: compactCatalog(courseCatalog),
    skill_taxonomy: skillTaxonomy,
  });

  const text = await callModel(
    'pathGeneration',
    PATH_GENERATION_SYSTEM_PROMPT,
    [{ role: 'user', content: payload }],
    TEMPERATURE.structured
  );

  const path = extractJSON(text);
  if (!path?.phases?.length) {
    throw new AiServiceError('Path response was not valid JSON', 'parse');
  }
  return path;
}

/** Returns a diff describing what should change, not a replacement path. */
export async function adaptPath(action, profile, currentPath, courseCatalog, completedItems) {
  const payload = JSON.stringify({
    action,
    profile,
    completed_item_ids: completedItems,
    remaining_path: summarisePathForDiff(currentPath),
    catalog: compactCatalog(courseCatalog),
  });

  const text = await callModel(
    'adaptation',
    ADAPTATION_SYSTEM_PROMPT,
    [{ role: 'user', content: payload }],
    TEMPERATURE.structured
  );

  const diff = extractJSON(text);
  if (!diff || typeof diff !== 'object') {
    throw new AiServiceError('Adaptation response was not valid JSON', 'parse');
  }

  return {
    removeItemIds: Array.isArray(diff.remove_item_ids) ? diff.remove_item_ids : [],
    addItems: Array.isArray(diff.add_items) ? diff.add_items : [],
    summary: typeof diff.summary === 'string' ? diff.summary : '',
  };
}


// ─── Feature calls ──────────────────────────────────────────

/** Shared shape for the small structured features. */
async function requestJSON(kind, systemPrompt, userContent, validate) {
  const text = await callModel(
    kind,
    systemPrompt,
    [{ role: 'user', content: userContent }],
    TEMPERATURE.structured
  );

  const parsed = extractJSON(text);
  if (!parsed || (validate && !validate(parsed))) {
    throw new AiServiceError(`${kind} response was not valid JSON`, 'parse');
  }
  return parsed;
}

export function generateDailyPlan(systemPrompt, context) {
  return requestJSON('dailyPlan', systemPrompt, context, (p) => Boolean(p.primary_task));
}

export function generateQuiz(systemPrompt, notes) {
  return requestJSON('quiz', systemPrompt, notes, (q) => Array.isArray(q.questions));
}

export function generateReadiness(systemPrompt, context) {
  return requestJSON(
    'readiness',
    systemPrompt,
    context,
    (r) => typeof r.overall_score === 'number' && Boolean(r.breakdown)
  );
}

// ─── Certificate verification ───────────────────────────────

/**
 * Asks a vision model whether an upload really evidences completion. Throws an
 * AiServiceError of kind 'unavailable' when the account has no vision access,
 * which is the signal for the caller to fall back to quiz verification.
 */
export async function verifyCertificate(dataUrl, prompt) {
  const message = {
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: dataUrl } },
      { type: 'text', text: prompt },
    ],
  };

  const text = await callModel('vision', null, [message], TEMPERATURE.structured, VISION_MODEL);
  const parsed = extractJSON(text);

  if (!parsed || typeof parsed.verified !== 'boolean') {
    throw new AiServiceError('Verification response was not valid JSON', 'parse');
  }
  return parsed;
}

export async function generateVerificationQuiz(systemPrompt) {
  const text = await callModel('quizVerification', systemPrompt, [
    { role: 'user', content: 'Generate the questions.' },
  ], TEMPERATURE.structured);

  const parsed = extractJSON(text);
  if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
    throw new AiServiceError('Quiz response was not valid JSON', 'parse');
  }
  return parsed.questions;
}

export async function evaluateVerificationQuiz(systemPrompt, answers) {
  const text = await callModel('quizVerification', systemPrompt, [
    { role: 'user', content: JSON.stringify(answers) },
  ], TEMPERATURE.structured);

  const parsed = extractJSON(text);
  if (!parsed || typeof parsed.verified !== 'boolean') {
    throw new AiServiceError('Evaluation response was not valid JSON', 'parse');
  }
  return parsed;
}
