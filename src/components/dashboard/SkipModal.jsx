import { useEffect, useRef, useState } from 'react';
import Button from '../shared/Button';

const REASONS = [
  { id: 'already_know', label: 'I already know this', detail: 'Credits the skills and drops anything now redundant' },
  { id: 'not_relevant', label: 'Not relevant to my goal', detail: 'Removed with no replacement' },
  { id: 'too_difficult', label: 'Too difficult right now', detail: 'An easier prerequisite is suggested instead' },
  { id: 'other', label: 'Another reason', detail: 'Tell us below' },
];

export default function SkipModal({ courseTitle, onConfirm, onClose }) {
  const [reason, setReason] = useState(null);
  const [comment, setComment] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const needsComment = reason === 'other' && !comment.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Skip ${courseTitle}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-5 focus:outline-none"
      >
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">Skip this course?</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {courseTitle} — telling us why lets the rest of the path adjust around it.
        </p>

        <div className="mt-5 space-y-2">
          {REASONS.map((option) => (
            <label
              key={option.id}
              className={`block cursor-pointer rounded-lg border px-3 py-2.5 transition-colors duration-200 ${
                reason === option.id
                  ? 'border-indigo-500 bg-slate-700/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="skip-reason"
                className="sr-only"
                checked={reason === option.id}
                onChange={() => setReason(option.id)}
              />
              <span className="block text-sm font-medium text-slate-200">{option.label}</span>
              <span className="mt-0.5 block text-xs text-slate-400">{option.detail}</span>
            </label>
          ))}

          {reason === 'other' && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="What's the reason?"
              aria-label="Skip reason details"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!reason || needsComment}
            onClick={() => onConfirm({ reason, comment: comment.trim() })}
          >
            Confirm skip
          </Button>
        </div>
      </div>
    </div>
  );
}
