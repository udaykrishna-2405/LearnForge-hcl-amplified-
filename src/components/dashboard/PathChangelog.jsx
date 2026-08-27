import { useState } from 'react';
import { ChevronDownIcon } from '../shared/Icons';
import { formatShortDate } from '../../utils/studySession';

const CHANGE_TONE = {
  removed: { border: 'border-l-rose-500/70', label: 'Removed', text: 'text-rose-300' },
  added: { border: 'border-l-emerald-500/70', label: 'Added', text: 'text-emerald-300' },
  reordered: { border: 'border-l-indigo-500/70', label: 'Reordered', text: 'text-indigo-300' },
  skill_updated: { border: 'border-l-indigo-500/70', label: 'Skill updated', text: 'text-indigo-300' },
};

const RATING_LABEL = {
  too_easy: 'Too easy',
  just_right: 'Just right',
  too_hard: 'Too hard',
  not_relevant: 'Not relevant',
  already_know: 'Already knew it',
  too_difficult: 'Too hard',
};

export default function PathChangelog({ entries }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="border-l-2 border-slate-700 bg-slate-800/30">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-slate-700/20"
      >
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">
          Path history
          <span className="ml-2 font-mono text-sm font-normal tabular-nums text-slate-400">
            {entries.length}
          </span>
        </h2>
        <ChevronDownIcon className={`w-4 h-4 shrink-0 text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-4 px-4 pb-5">
          {entries.length === 0 ? (
            <p className="text-sm leading-relaxed text-slate-400">
              Your path adapts as you learn. Complete a course and share feedback to
              see changes here.
            </p>
          ) : (
            entries.map((entry) => <ChangelogEntry key={entry.id} entry={entry} />)
          )}
        </div>
      )}
    </section>
  );
}

function ChangelogEntry({ entry }) {
  return (
    <article className="border-t border-slate-800 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-base font-medium text-slate-200">
        After {entry.courseTitle}
      </h3>
      <p className="mt-0.5 text-xs text-slate-400">
        {formatShortDate(entry.date)} · {RATING_LABEL[entry.rating] ?? entry.rating}
      </p>

      <ul className="mt-2.5 space-y-1.5">
        {entry.changes.map((change, i) => {
          const tone = CHANGE_TONE[change.type] ?? CHANGE_TONE.reordered;
          return (
            <li key={`${change.type}-${i}`} className={`border-l-2 ${tone.border} pl-3`}>
              <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
              <span className="ml-1.5 text-sm text-slate-300">{change.course_title}</span>
              {change.reason && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{change.reason}</p>
              )}
            </li>
          );
        })}
      </ul>

      {entry.summary && (
        <p className="mt-2.5 text-sm italic leading-relaxed text-slate-400">{entry.summary}</p>
      )}
    </article>
  );
}
