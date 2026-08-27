import { formatWeeks } from '../../utils/helpers';

export default function ProgressStats({ progress }) {
  const stats = [
    { label: 'Completed', value: `${progress.completed}/${progress.total}` },
    { label: 'Skills gained', value: progress.skillsGained },
    { label: 'Hours invested', value: progress.hoursInvested },
    { label: 'Time remaining', value: formatWeeks(progress.weeksRemaining) },
  ];

  return (
    <section className="flex flex-wrap divide-x divide-slate-800 border-y border-slate-800 py-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="min-w-28 flex-1 px-4 first:pl-0">
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-100">{value}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{label}</p>
        </div>
      ))}
    </section>
  );
}
