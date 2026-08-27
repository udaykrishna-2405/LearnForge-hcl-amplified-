import { useCallback, useEffect, useState } from 'react';
import Button from '../shared/Button';
import { AlertIcon } from '../shared/Icons';
import { generateReadiness } from '../../services/aiService';
import { buildReadinessContext, getReadinessPrompt } from '../../prompts/readinessScore';
import { formatLongDate, toDateKey } from '../../utils/studySession';
import { ACTIONS } from '../../state/appReducer';

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ReadinessPanel({ profile, path, completedItems, score, dispatch }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const targetRole = profile?.target_role ?? 'your target role';

  const handleAnalyze = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(false);

    try {
      const result = await generateReadiness(
        getReadinessPrompt(profile?.target_role),
        buildReadinessContext({ profile, path, completedItems })
      );
      dispatch({
        type: ACTIONS.SET_READINESS_SCORE,
        payload: { ...result, analyzedOn: toDateKey() },
      });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [completedItems, dispatch, isLoading, path, profile]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-800/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">Job readiness</h2>
        {score && !isLoading && (
          <span className="shrink-0 text-xs text-slate-400">
            {formatLongDate(score.analyzedOn)}
          </span>
        )}
      </div>

      {isLoading && <ReadinessSkeleton />}

      {!isLoading && error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-700 px-3 py-2.5">
          <p className="flex items-center gap-2 text-sm text-amber-400">
            <AlertIcon className="w-4 h-4" />
            Couldn&apos;t run the analysis.
          </p>
          <Button size="sm" variant="secondary" onClick={handleAnalyze}>Try again</Button>
        </div>
      )}

      {!isLoading && !error && !score && (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-slate-400">
            Get an assessment of how ready you are for {targetRole} roles, based on
            what you have actually completed.
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={handleAnalyze} disabled={isLoading}>Analyse now</Button>
          </div>
        </div>
      )}

      {!isLoading && score && (
        <ReadinessReport score={score} targetRole={targetRole} onReanalyze={handleAnalyze} />
      )}
    </section>
  );
}

function ReadinessReport({ score, targetRole, onReanalyze }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const breakdown = score.breakdown ?? {};
  const rows = [
    { label: 'Technical skills', data: breakdown.technical_skills },
    { label: 'Project portfolio', data: breakdown.project_portfolio },
    { label: 'Knowledge depth', data: breakdown.knowledge_depth },
  ].filter((row) => row.data);

  return (
    <div className="mt-5 space-y-6">
      {score.ready_to_apply && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm leading-relaxed text-emerald-400">
          You meet the threshold to start applying for entry-level {targetRole} positions.
        </p>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <ScoreRing value={score.overall_score} mounted={mounted} />
        <div className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-wider text-slate-400">Ready for</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{score.current_role_fit}</p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(({ label, data }) => (
          <BreakdownRow key={label} label={label} data={data} mounted={mounted} />
        ))}
      </div>

      {score.target_role_gap && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-400">
            Still missing for {targetRole}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{score.target_role_gap}</p>
        </div>
      )}

      {score.top_3_next_actions?.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Your next 3 actions</h3>
          <ol className="mt-2 space-y-1.5">
            {score.top_3_next_actions.map((action, i) => (
              <li key={action} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                <span className="font-mono tabular-nums text-slate-400">{i + 1}.</span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      <Button size="sm" variant="secondary" onClick={onReanalyze}>Re-analyse</Button>
    </div>
  );
}

function ScoreRing({ value, mounted }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const offset = mounted ? CIRCUMFERENCE * (1 - pct / 100) : CIRCUMFERENCE;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="8" className="stroke-slate-700" />
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none" strokeWidth="8" strokeLinecap="round"
          className="stroke-indigo-500"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1200ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tabular-nums text-white">{pct}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
}

function BreakdownRow({ label, data, mounted }) {
  const value = Math.max(0, Math.min(100, data.score ?? 0));
  const fill = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="font-mono text-sm tabular-nums text-slate-400">{value}/100</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full ${fill}`}
          style={{ width: mounted ? `${value}%` : '0%', transition: 'width 800ms ease-out' }}
        />
      </div>
      {data.note && <p className="mt-1 text-xs leading-relaxed text-slate-400">{data.note}</p>}
    </div>
  );
}

function ReadinessSkeleton() {
  return (
    <div className="mt-5 space-y-3" role="status" aria-live="polite">
      <div className="mx-auto h-28 w-28 rounded-full bg-slate-700 animate-soft-pulse" />
      <div className="h-3 w-2/3 rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.1s' }} />
      <div className="h-3 w-full rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.2s' }} />
      <div className="h-3 w-4/5 rounded bg-slate-800 animate-soft-pulse" style={{ animationDelay: '0.3s' }} />
      <span className="sr-only">Analysing your readiness</span>
    </div>
  );
}
