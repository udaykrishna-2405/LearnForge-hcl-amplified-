import { CheckIcon } from '../shared/Icons';

const FIELDS = [
  { key: 'target_role', label: 'Goal', read: (p) => p.target_role },
  { key: 'domain', label: 'Domain', read: (p) => p.domain },
  { key: 'experience', label: 'Experience', read: (p) => (p.experience_years ? `${p.experience_years} yrs` : null) },
  { key: 'timeline', label: 'Timeline', read: (p) => (p.timeline_months ? `${p.timeline_months} months` : null) },
  { key: 'weekly', label: 'Weekly time', read: (p) => (p.weekly_hours ? `${p.weekly_hours} hrs/week` : null) },
  { key: 'budget', label: 'Budget', read: (p) => p.budget },
  { key: 'format', label: 'Format', read: (p) => p.preferred_format },
];

const skillName = (skill) => (typeof skill === 'string' ? skill : skill?.skill ?? '');

export default function ProfileCard({ profile }) {
  const p = profile ?? {};
  const skills = p.current_skills ?? [];
  const isComplete = p.profile_complete === true;

  const filled = FIELDS.filter((f) => f.read(p)).length + (skills.length > 0 ? 1 : 0);
  const percent = Math.round((filled / (FIELDS.length + 1)) * 100);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Your profile</h2>
        {isComplete && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            <CheckIcon className="w-3 h-3" />
            Complete
          </span>
        )}
      </div>

      <dl className="mt-5 space-y-2.5">
        {FIELDS.map((field) => {
          const value = field.read(p);
          return (
            <div key={field.key} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-slate-400">{field.label}</dt>
              <dd className={`truncate text-sm ${value ? 'text-slate-200' : 'text-slate-500'}`}>
                {value || '—'}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-wider text-slate-400">Current skills</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.length > 0 ? (
            skills.map((skill, i) => (
              <span
                key={`${skillName(skill)}-${i}`}
                className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300"
              >
                {skillName(skill)}
                {skill?.level ? ` · ${skill.level}` : ''}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">Not captured yet</span>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Completeness</span>
          <span className="tabular-nums">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
