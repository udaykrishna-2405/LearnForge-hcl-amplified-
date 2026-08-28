import { useCallback, useState } from 'react';
import Button from '../shared/Button';
import { AlertIcon, CheckIcon } from '../shared/Icons';
import { generateDailyPlan } from '../../services/aiService';
import { buildPlannerContext, getDailyPlanPrompt } from '../../prompts/dailyPlanner';
import { saveDailyPlan, saveStudySession } from '../../services/userDataService';
import { toDateKey } from '../../utils/studySession';
import { ACTIONS } from '../../state/appReducer';

const TIME_OPTIONS = [30, 45, 60, 90];

export default function DailyPlanner({
  userId, profile, path, completedItems, sessions, streak, plan, paceStatus, presetMinutes, dispatch,
}) {
  const [availableMinutes, setAvailableMinutes] = useState(presetMinutes ?? 45);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const today = toDateKey();
  const sessionLogged = sessions.some((s) => s.date === today);

  const handleGenerate = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(false);

    try {
      const result = await generateDailyPlan(
        getDailyPlanPrompt({ availableMinutes }),
        buildPlannerContext({ profile, path, completedItems, sessions, paceStatus })
      );
      dispatch({ type: ACTIONS.SET_DAILY_PLAN, payload: result });
      void saveDailyPlan(userId, today, result).catch(() => {});
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [availableMinutes, completedItems, dispatch, isLoading, userId, paceStatus, path, profile, sessions, today]);

  const handleLogSession = useCallback(() => {
    dispatch({ type: ACTIONS.LOG_STUDY_SESSION, payload: { date: today, minutes: availableMinutes } });
    void saveStudySession(userId, today, availableMinutes).catch(() => {});
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  }, [availableMinutes, dispatch, userId, today]);

  if (sessionLogged && !justLogged) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-800/40 px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckIcon className="w-4 h-4" />
          Today&apos;s study logged. See you tomorrow.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-800/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">Today&apos;s plan</h2>
        <StreakBadge streak={streak} />
      </div>

      <p className="mt-4 text-sm text-slate-400">How long do you have today?</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {TIME_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            onClick={() => setAvailableMinutes(minutes)}
            aria-pressed={availableMinutes === minutes}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
              availableMinutes === minutes
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {minutes} min
          </button>
        ))}
      </div>

      {isLoading && <PlannerSkeleton />}

      {!isLoading && error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-700 px-3 py-2.5">
          <p className="flex items-center gap-2 text-sm text-amber-400">
            <AlertIcon className="w-4 h-4" />
            Couldn&apos;t generate plan.
          </p>
          <Button size="sm" variant="secondary" onClick={handleGenerate}>Try again</Button>
        </div>
      )}

      {!isLoading && !error && !plan && (
        <div className="mt-4">
          <Button onClick={handleGenerate} disabled={isLoading}>Generate today&apos;s plan</Button>
        </div>
      )}

      {!isLoading && plan && (
        <>
          <PlanBody plan={plan} />
          <div className="mt-5">
            <Button
              onClick={handleLogSession}
              disabled={justLogged}
              className={`w-full ${justLogged ? 'bg-emerald-600' : ''}`}
            >
              {justLogged ? <><CheckIcon className="w-4 h-4" />Logged</> : 'Mark today as done'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function StreakBadge({ streak }) {
  if (streak < 2) {
    return <span className="shrink-0 text-xs text-slate-400">Start your streak today</span>;
  }
  return (
    <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
      🔥 {streak} days
    </span>
  );
}

function PlanBody({ plan }) {
  const primary = plan.primary_task ?? {};
  const secondary = plan.secondary_task;

  return (
    <div className="mt-5 space-y-4 border-t border-slate-800 pt-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400">Primary</p>
        <h3 className="mt-1 text-base font-medium text-slate-100">{primary.course_title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{primary.action}</p>
        <p className="mt-1.5 font-mono text-sm tabular-nums text-slate-400">
          {primary.estimated_minutes} min
        </p>
        {primary.focus_tip && (
          <p className="mt-1.5 text-sm italic leading-relaxed text-slate-400">{primary.focus_tip}</p>
        )}
      </div>

      {secondary?.description && (
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Secondary · {secondary.type}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{secondary.description}</p>
          <p className="mt-1.5 font-mono text-sm tabular-nums text-slate-400">
            {secondary.estimated_minutes} min
          </p>
        </div>
      )}

      {plan.motivational_note && (
        <p className="text-sm italic leading-relaxed text-slate-400">{plan.motivational_note}</p>
      )}

      {plan.pacing_note && <PacingPill note={plan.pacing_note} />}
    </div>
  );
}

function PacingPill({ note }) {
  const behind = /behind|slower|catch up/i.test(note);
  const tone = behind
    ? 'border-amber-500/40 text-amber-300'
    : 'border-emerald-500/40 text-emerald-300';
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs ${tone}`}>{note}</span>
  );
}

function PlannerSkeleton() {
  return (
    <div className="mt-5 space-y-3 border-t border-slate-800 pt-4" role="status" aria-live="polite">
      <div className="h-3 w-20 rounded bg-slate-700 animate-soft-pulse" />
      <div className="h-4 w-2/3 rounded bg-slate-700 animate-soft-pulse" style={{ animationDelay: '0.1s' }} />
      <div className="h-3 w-full rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.2s' }} />
      <div className="h-3 w-4/5 rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.3s' }} />
      <span className="sr-only">Generating today&apos;s plan</span>
    </div>
  );
}
