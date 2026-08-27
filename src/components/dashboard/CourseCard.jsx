import { memo } from 'react';
import Button from '../shared/Button';
import { CheckIcon, LockIcon, SkipIcon } from '../shared/Icons';
import CourseNotes from './CourseNotes';
import { getDifficultyColor, formatDuration } from '../../utils/helpers';

const SURFACE = {
  completed: 'border-slate-800 bg-slate-800/40',
  active: 'border-slate-700 bg-slate-800',
  locked: 'border-slate-800 bg-slate-800/20 opacity-60',
  skipped: 'border-slate-800 bg-slate-800/20',
};

function CourseCard({ item, status, onComplete, onSkip, isBusy, learnerId, note, dispatch }) {
  const isActive = status === 'active';

  return (
    <article
      className={`rounded-lg border px-4 py-3 transition-colors duration-200 hover:border-slate-600 ${SURFACE[status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="flex items-center gap-1.5 text-base font-medium text-slate-100">
          {status === 'completed' && <CheckIcon className="w-4 h-4 shrink-0 text-emerald-400" animate />}
          {status === 'skipped' && <SkipIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" />}
          {status === 'locked' && <LockIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
          <span className={status === 'skipped' ? 'text-slate-500 line-through' : undefined}>
            {item.title}
          </span>
        </h4>
        <span className="shrink-0 rounded bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
          {item.provider}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
        <span className="font-mono tabular-nums">{formatDuration(item.duration_hours)}</span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
          {item.difficulty}
        </span>
        <span>{item.format}</span>
        <span>{item.cost}</span>
      </div>

      {item.skills_addressed?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.skills_addressed.map((skill) => (
            <span key={skill} className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300">
              {skill}
            </span>
          ))}
        </div>
      )}

      {item.rationale && (
        <p className="mt-2.5 text-sm italic leading-relaxed text-slate-400">{item.rationale}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {isActive && (
          <>
            <Button size="sm" onClick={() => onComplete(item)} disabled={isBusy}>
              <CheckIcon className="w-3.5 h-3.5" />
              Mark complete
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onSkip(item)} disabled={isBusy}>
              Skip
            </Button>
          </>
        )}
        {status === 'completed' && <span className="text-sm text-emerald-400">Completed</span>}
        {status === 'skipped' && <span className="text-sm text-slate-400">Skipped</span>}
        {status === 'locked' && <span className="text-sm text-slate-400">Complete prerequisites first</span>}
      </div>

      {status !== 'locked' && (
        <CourseNotes
          learnerId={learnerId}
          courseId={item.item_id}
          courseTitle={item.title}
          note={note}
          dispatch={dispatch}
        />
      )}
    </article>
  );
}

export default memo(CourseCard);
