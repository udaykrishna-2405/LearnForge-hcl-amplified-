import { useEffect } from 'react';
import { CheckIcon, AlertIcon, CloseIcon } from './Icons';

const TONES = {
  success: { border: 'border-emerald-500/40', text: 'text-emerald-400', Icon: CheckIcon },
  error: { border: 'border-rose-500/40', text: 'text-rose-400', Icon: AlertIcon },
  warning: { border: 'border-amber-500/40', text: 'text-amber-400', Icon: AlertIcon },
  info: { border: 'border-indigo-500/40', text: 'text-indigo-400', Icon: AlertIcon },
};

export default function Toast({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const tone = TONES[toast.type] ?? TONES.info;
  const { Icon } = tone;

  return (
    <div
      role="status"
      className={`pointer-events-auto animate-toast-in flex items-start gap-2.5 rounded-lg border ${tone.border} bg-slate-800 px-3 py-2.5 w-72`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${tone.text}`} />
      <p className="flex-1 text-sm leading-relaxed text-slate-200">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-500 hover:text-slate-300 transition-colors duration-200"
        aria-label="Dismiss notification"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
