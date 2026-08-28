import {
  AiServiceError,
  evaluateVerificationQuiz,
  generateVerificationQuiz,
  verifyCertificate,
} from './aiService';
import {
  getQuizEvaluationPrompt,
  getQuizVerificationPrompt,
  getVerificationPrompt,
} from '../prompts/certificateVerification';

// ─── Constants & Configuration ──────────────────────────────

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const ACCEPTED_TYPES = [...IMAGE_TYPES, 'application/pdf'];

export class VerificationError extends Error {}

// ─── File handling ──────────────────────────────────────────

export function validateFile(file) {
  if (!file) return 'Choose a file first.';
  if (file.size > MAX_FILE_BYTES) return 'Image must be under 5MB.';
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Please upload a PNG, JPG, or PDF file.';
  return null;
}

/** A PDF cannot be handed to a vision model, so it routes to the quiz instead. */
export function isVisionReadable(file) {
  return IMAGE_TYPES.includes(file?.type);
}

export function readAsDataUrl(file) {
  const invalid = validateFile(file);
  if (invalid) return Promise.reject(new VerificationError(invalid));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new VerificationError('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

// ─── Verification ───────────────────────────────────────────

/**
 * Vision check. Resolves { fallback: true } when the account cannot use the
 * vision model, which tells the caller to switch to quiz verification rather
 * than showing the learner a failure they cannot act on.
 */
export async function verifyWithVision(dataUrl, courseTitle, courseProvider) {
  try {
    const result = await verifyCertificate(
      dataUrl,
      getVerificationPrompt(courseTitle, courseProvider)
    );
    return { ...result, method: 'image' };
  } catch (error) {
    if (error instanceof AiServiceError && error.kind === 'unavailable') {
      return { fallback: true };
    }
    throw error;
  }
}

export function requestVerificationQuiz(courseTitle, courseProvider) {
  return generateVerificationQuiz(getQuizVerificationPrompt(courseTitle, courseProvider));
}

export async function verifyWithQuiz(courseTitle, questions, answers) {
  const result = await evaluateVerificationQuiz(
    getQuizEvaluationPrompt(courseTitle, questions),
    answers
  );
  return { ...result, method: 'quiz' };
}
