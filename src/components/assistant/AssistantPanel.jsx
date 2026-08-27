import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../shared/Button';
import { CloseIcon, SendIcon } from '../shared/Icons';
import { queryAssistant } from '../../services/aiService';

const SUGGESTIONS = [
  'Why is this the order?',
  'What can I skip if time is short?',
  'How does this map to my target role?',
  'What should I focus on first?',
];

// Caps a single session so one conversation cannot run indefinitely.
const MAX_MESSAGES = 20;

export default function AssistantPanel({ isOpen, onClose, profile, path, progress, history, onAddMessage }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ block: 'end' });
  }, [isOpen, history, isTyping]);

  const atLimit = history.length >= MAX_MESSAGES;

  const send = useCallback(
    async (text) => {
      const question = text.trim();
      if (!question || isTyping || atLimit) return;

      setInput('');
      onAddMessage({ role: 'user', content: question });
      setIsTyping(true);

      try {
        const answer = await queryAssistant(question, profile, path, progress, history);
        onAddMessage({ role: 'assistant', content: answer });
      } catch {
        onAddMessage({
          role: 'assistant',
          content: "I'm having trouble connecting. Let me try again.",
        });
      } finally {
        setIsTyping(false);
      }
    },
    [atLimit, history, isTyping, onAddMessage, path, profile, progress]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/50 md:hidden" onClick={onClose} />

      <aside
        role="dialog"
        aria-label="AI assistant"
        className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-800 bg-slate-900 md:w-96"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 px-4">
          <h2 className="text-base font-semibold text-slate-100">AI Assistant</h2>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="text-slate-500 transition-colors duration-200 hover:text-slate-300"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {history.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-slate-400">
                Ask about anything in your path — the ordering, the trade-offs, or
                what a course is actually for.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 transition-colors duration-200 hover:border-slate-600 hover:text-slate-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'border border-slate-700 bg-slate-800 text-slate-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-1.5 px-1">
              <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="animate-typing-dot-2 h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="animate-typing-dot-3 h-1.5 w-1.5 rounded-full bg-slate-500" />
            </div>
          )}

          {atLimit && (
            <p className="pt-2 text-sm leading-relaxed text-slate-400">
              That was a good conversation — your path is ready to follow.
            </p>
          )}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex shrink-0 items-center gap-2 border-t border-slate-800 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping || atLimit}
            placeholder={atLimit ? 'Session limit reached' : 'Ask about your path...'}
            aria-label="Ask the assistant"
            className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
          />
          <Button type="submit" disabled={!input.trim() || isTyping || atLimit} aria-label="Send" className="px-3">
            <SendIcon />
          </Button>
        </form>
      </aside>
    </>
  );
}
