import { useEffect, useRef, useState } from 'react';
import Button from '../shared/Button';

const OPTIONS = [
  { id: 'too_easy', label: 'Too easy', detail: 'I already knew this' },
  { id: 'just_right', label: 'Just right', detail: 'Well matched' },
  { id: 'too_hard', label: 'Too hard', detail: 'Need more foundation' },
  { id: 'not_relevant', label: 'Not relevant', detail: 'Wrong for my goal' },
];

export default function FeedbackModal({ course, onSubmit, onClose }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const panelRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Feedback on ${course?.title}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up w-full rounded-t-lg border border-slate-700 bg-slate-800 p-5 focus:outline-none sm:max-w-sm sm:rounded-lg"
      >
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">
          How was it?
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{course?.title}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setRating(option.id)}
              aria-pressed={rating === option.id}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 ${
                rating === option.id
                  ? 'border-indigo-500 bg-slate-700/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <span className="block text-sm font-medium text-slate-200">{option.label}</span>
              <span className="mt-0.5 block text-xs text-slate-400">{option.detail}</span>
            </button>
          ))}
        </div>

        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything else? (optional)"
          aria-label="Additional feedback"
          className="mt-3 h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Skip</Button>
          <Button
            size="sm"
            disabled={!rating}
            onClick={() => onSubmit({ rating, comment: comment.trim() })}
          >
            Submit feedback
          </Button>
        </div>
      </div>
    </div>
  );
}
