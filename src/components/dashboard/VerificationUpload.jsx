import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../shared/Button';
import { AlertIcon, CheckIcon, CloseIcon } from '../shared/Icons';
import {
  ACCEPTED_TYPES,
  isVisionReadable,
  readAsDataUrl,
  requestVerificationQuiz,
  validateFile,
  verifyWithQuiz,
  verifyWithVision,
} from '../../services/verificationService';
import { uploadVerificationImage } from '../../services/userDataService';

const STAGES = ['Uploading proof', 'Reading the certificate', 'Matching the course'];
const STAGE_INTERVAL_MS = 3000;

export default function VerificationUpload({ course, userId, onVerified, onClose }) {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Object URLs leak until revoked, and one is created per selected file.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const selectFile = useCallback((chosen) => {
    const invalid = validateFile(chosen);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setFile(chosen);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return isVisionReadable(chosen) ? URL.createObjectURL(chosen) : null;
    });
  }, []);

  const startQuiz = useCallback(async () => {
    setStep('analyzing');
    setError(null);
    try {
      const generated = await requestVerificationQuiz(course.title, course.provider);
      setQuestions(generated);
      setAnswers({});
      setStep('quiz');
    } catch {
      setError('Could not prepare the questions. Please try again.');
      setStep('upload');
    }
  }, [course.provider, course.title]);

  const handleVerify = useCallback(async () => {
    setStep('analyzing');
    setError(null);

    try {
      // Storage is best-effort: losing the archived copy should not block a
      // learner from being credited for work they actually did.
      const dataUrl = await readAsDataUrl(file);
      uploadVerificationImage(userId, course.item_id, file).catch(() => {});

      if (!isVisionReadable(file)) {
        await startQuiz();
        return;
      }

      const outcome = await verifyWithVision(dataUrl, course.title, course.provider);
      if (outcome.fallback) {
        await startQuiz();
        return;
      }

      setResult(outcome);
      setStep('result');
    } catch (err) {
      setError(err?.message ?? 'Verification could not be completed.');
      setStep('upload');
    }
  }, [course, file, startQuiz, userId]);

  const handleQuizSubmit = useCallback(async () => {
    setStep('analyzing');
    try {
      const outcome = await verifyWithQuiz(course.title, questions, answers);
      setResult(outcome);
      setStep('result');
    } catch {
      setError('Could not check your answers. Please try again.');
      setStep('quiz');
    }
  }, [answers, course.title, questions]);

  const accept = () => {
    onVerified({
      verified: true,
      method: result.method,
      confidence: result.confidence ?? null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Verify completion of ${course.title}`}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up max-h-[90vh] w-full overflow-y-auto rounded-t-lg border border-slate-700 bg-slate-800 p-5 sm:max-w-md sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">
              Verify completion
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-slate-400 transition-colors duration-200 hover:text-slate-200"
          >
            <CloseIcon />
          </button>
        </div>

        {step === 'upload' && (
          <UploadStep
            file={file}
            previewUrl={previewUrl}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            inputRef={inputRef}
            onSelect={selectFile}
            onClear={() => { setFile(null); setPreviewUrl(null); }}
            onVerify={handleVerify}
            onUseQuiz={startQuiz}
            error={error}
          />
        )}

        {step === 'analyzing' && <AnalyzingStep previewUrl={previewUrl} />}

        {step === 'result' && result && (
          <ResultStep
            result={result}
            onAccept={accept}
            onRetry={() => { setResult(null); setStep('upload'); }}
            onUseQuiz={startQuiz}
            onClose={onClose}
          />
        )}

        {step === 'quiz' && questions && (
          <QuizStep
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
            onSubmit={handleQuizSubmit}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

function UploadStep({
  file, previewUrl, isDragging, setIsDragging, inputRef,
  onSelect, onClear, onVerify, onUseQuiz, error,
}) {
  return (
    <>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        Upload your certificate, completion badge, or a screenshot of the finished
        course page.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          onSelect(e.dataTransfer.files?.[0]);
        }}
        className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ${
          isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <p className="text-sm text-slate-300">Drag and drop, or click to browse</p>
        <p className="mt-1 text-xs text-slate-400">PNG, JPG, or PDF — up to 5MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => onSelect(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected proof of completion"
              className="mx-auto max-h-48 rounded object-contain"
            />
          ) : (
            <p className="text-center text-sm text-slate-400">
              PDF selected — we&apos;ll verify with a few questions instead.
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="truncate text-xs text-slate-400">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="shrink-0 text-xs text-slate-400 transition-colors duration-200 hover:text-slate-200"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-amber-400" role="alert">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button onClick={onVerify} disabled={!file} className="mt-4 w-full">
        Verify completion
      </Button>
      <button
        onClick={onUseQuiz}
        className="mt-2 w-full text-center text-sm text-indigo-400 transition-colors duration-200 hover:text-indigo-300"
      >
        No certificate? Answer a few questions instead
      </button>
    </>
  );
}

function AnalyzingStep({ previewUrl }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      STAGE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-5" role="status" aria-live="polite">
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
          className="mx-auto max-h-32 rounded object-contain opacity-40"
        />
      )}
      <ul className="mt-5 space-y-2">
        {STAGES.map((label, i) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            {i < stage ? (
              <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  i === stage ? 'bg-indigo-400 animate-soft-pulse' : 'bg-slate-600'
                }`}
              />
            )}
            <span className={i <= stage ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultStep({ result, onAccept, onRetry, onUseQuiz, onClose }) {
  if (result.verified) {
    const percent = result.confidence != null ? Math.round(result.confidence * 100) : null;

    return (
      <div className="mt-5">
        <p className="flex items-center gap-2 text-base font-medium text-emerald-400">
          <CheckIcon className="h-5 w-5" animate />
          Completion verified
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {result.reason ?? result.overall_feedback}
        </p>

        {percent != null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Confidence</span>
              <span className="font-mono tabular-nums">{percent}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}

        <Button onClick={onAccept} className="mt-5 w-full bg-emerald-600">
          Continue
        </Button>
      </div>
    );
  }

  const issues = result.issues ?? [];

  return (
    <div className="mt-5">
      <p className="flex items-center gap-2 text-base font-medium text-amber-400">
        <AlertIcon className="h-5 w-5" />
        Couldn&apos;t verify this
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        {result.reason ?? result.overall_feedback}
      </p>

      {issues.length > 0 && (
        <ul className="mt-3 space-y-1">
          {issues.map((issue) => (
            <li key={issue} className="flex gap-2 text-sm text-slate-400">
              <span aria-hidden="true">·</span>
              {issue}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 space-y-2">
        <Button onClick={onRetry} className="w-full">Upload a different file</Button>
        {result.method === 'image' ? (
          <Button variant="secondary" onClick={onUseQuiz} className="w-full">
            Verify with questions instead
          </Button>
        ) : (
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

function QuizStep({ questions, answers, setAnswers, onSubmit, error }) {
  const complete = questions.every((q) => answers[q.id]?.trim());

  return (
    <div className="mt-5">
      <p className="text-sm leading-relaxed text-slate-400">
        Answer these in your own words. Short answers are fine.
      </p>

      <div className="mt-4 space-y-4">
        {questions.map((q, i) => (
          <div key={q.id}>
            <label htmlFor={q.id} className="block text-sm text-slate-200">
              <span className="text-slate-400">Q{i + 1}. </span>
              {q.question}
            </label>
            <textarea
              id={q.id}
              rows={2}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              className="mt-1.5 w-full resize-y rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-slate-50 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-amber-400" role="alert">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button onClick={onSubmit} disabled={!complete} className="mt-5 w-full">
        Submit answers
      </Button>
    </div>
  );
}
