import { formatWeeks } from '../../utils/helpers';

export default function PathOverview({ path, totalCourses, totalWeeks }) {
  return (
    <section>
      <h1 className="text-xl font-semibold tracking-tight text-slate-100">
        {path.path_title || path.title || 'Your learning path'}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
        {path.summary}
      </p>
      <p className="mt-3 text-sm text-slate-400">
        <span className="font-mono tabular-nums text-slate-400">{totalCourses}</span> courses ·{' '}
        <span className="font-mono tabular-nums text-slate-400">{path.phases.length}</span> phases ·{' '}
        <span className="font-mono tabular-nums text-slate-400">{formatWeeks(totalWeeks)}</span>
      </p>
    </section>
  );
}
