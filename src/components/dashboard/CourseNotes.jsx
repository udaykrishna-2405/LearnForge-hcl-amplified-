import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../shared/Button';
import { AlertIcon, CheckIcon, ChevronDownIcon } from '../shared/Icons';
import { generateQuiz } from '../../services/aiService';
import { getQuizPrompt } from '../../prompts/quizGeneration';
import { getNote, saveNote } from '../../utils/notesStorage';
import { ACTIONS } from '../../state/appReducer';

const AUTOSAVE_DELAY_MS = 1500;
const MIN_CHARS_FOR_QUIZ = 50;

export default function CourseNotes({ learnerId, courseId, courseTitle, note, dispatch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() => note ?? getNote(courseId));
  const [showSaved, setShowSaved] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizState, setQuizState] = useState('idle');
  const saveTimer = useRef(null);
  const savedTimer = useRef(null);

  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    clearTimeout(savedTimer.current);
  }, []);

  // Debounced so a save lands after the learner pauses, not on every keystroke.
  const handleChange = useCallback(
    (value) => {
      setDraft(value);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveNote(learnerId, courseId, value);
        dispatch({ type: ACTIONS.SAVE_NOTE, payload: { courseId, content: value } });
        setShowSaved(true);
        clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setShowSaved(false), 2000);
      }, AUTOSAVE_DELAY_MS);
    },
    [courseId, dispatch, learnerId]
  );

  const handleQuiz = useCallback(async () => {
    setQuizState('loading');
    setQuiz(null);
    try {
      const result = await generateQuiz(getQuizPrompt(courseTitle), draft);
      if (!result.questions?.length) {
        setQuizState('error');
        return;
      }
      setQuiz(result.questions);
      setQuizState('ready');
    } catch {
      setQuizState('error');
    }
  }, [courseTitle, draft]);

  const charCount = draft.trim().length;

  return (
    <div className="mt-3 border-t border-slate-700/60 pt-3">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-300"
      >
        <ChevronDownIcon className={`w-3.5 h-3.5 ${isOpen ? 'rotate-180' : ''}`} />
        Notes
        {charCount > 0 && <span className="font-mono tabular-nums">({charCount})</span>}
      </button>

      {isOpen && (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            placeholder="Key concepts, questions, things to remember..."
            aria-label={`Notes for ${courseTitle}`}
            className="w-full resize-y rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-slate-50 placeholder:text-slate-500 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />

          <div className="mt-2 flex items-center gap-3">
            {charCount >= MIN_CHARS_FOR_QUIZ && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleQuiz}
                disabled={quizState === 'loading'}
              >
                {quizState === 'loading' ? 'Writing questions...' : 'Test me on this'}
              </Button>
            )}
            {showSaved && <span className="text-xs text-slate-400">Saved</span>}
          </div>

          {quizState === 'loading' && <QuizSkeleton />}

          {quizState === 'error' && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-700 px-3 py-2">
              <p className="flex items-center gap-2 text-sm text-amber-400">
                <AlertIcon className="w-4 h-4" />
                Couldn&apos;t build a quiz from these notes.
              </p>
              <Button size="sm" variant="ghost" onClick={handleQuiz}>Retry</Button>
            </div>
          )}

          {quizState === 'ready' && quiz && <Quiz questions={quiz} onRegenerate={handleQuiz} />}
        </div>
      )}
    </div>
  );
}

function Quiz({ questions, onRegenerate }) {
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const score = questions.filter((q) => answers[q.id] === q.correct).length;
  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className="mt-4 rounded-lg border border-slate-700 p-3">
      <p className="text-sm font-medium text-slate-200">
        Quick quiz — {questions.length} questions
      </p>

      <ol className="mt-3 space-y-4">
        {questions.map((q, index) => {
          const picked = answers[q.id];
          const isRight = picked === q.correct;

          return (
            <li key={q.id}>
              <p className="text-sm text-slate-200">
                <span className="text-slate-400">Q{index + 1}. </span>
                {q.question}
              </p>

              <div className="mt-2 space-y-1.5">
                {q.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm transition-colors duration-200 ${
                      checked && option.id === q.correct
                        ? 'text-emerald-300'
                        : checked && option.id === picked
                          ? 'text-rose-300'
                          : 'text-slate-300 hover:bg-slate-700/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="sr-only"
                      disabled={checked}
                      checked={picked === option.id}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: option.id }))}
                    />
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border ${
                        picked === option.id ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                      }`}
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>

              {checked && (
                <p
                  className={`mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed ${
                    isRight ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {isRight && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
                  {q.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center gap-3">
        {!checked ? (
          <Button size="sm" disabled={!allAnswered} onClick={() => setChecked(true)}>
            Check answers
          </Button>
        ) : (
          <>
            <span className="font-mono text-sm tabular-nums text-slate-200">
              {score}/{questions.length} correct
            </span>
            <Button size="sm" variant="ghost" onClick={onRegenerate}>Try again</Button>
          </>
        )}
      </div>
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-700 p-3" role="status" aria-live="polite">
      <div className="h-3 w-1/2 rounded bg-slate-700 animate-soft-pulse" />
      <div className="h-3 w-full rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.1s' }} />
      <div className="h-3 w-5/6 rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.2s' }} />
      <span className="sr-only">Writing quiz questions</span>
    </div>
  );
}
