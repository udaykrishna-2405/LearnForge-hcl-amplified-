import { useEffect, useRef, useState } from 'react';
import Button from '../shared/Button';
import { SendIcon } from '../shared/Icons';

export default function ChatInterface({ chatHistory, onSendMessage, isLoading, isClosed }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory, isLoading]);

  const submit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading || isClosed) return;
    setInput('');
    onSendMessage(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {chatHistory.map((msg, index) => (
          <ChatMessage key={`${msg.ts}-${index}`} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
              <Dot />
              <Dot className="animate-typing-dot-2" />
              <Dot className="animate-typing-dot-3" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-800 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isClosed ? 'Profile captured — generate your path' : 'Tell me about your learning goals...'}
          disabled={isLoading || isClosed}
          aria-label="Message"
          className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
        />
        <Button type="submit" disabled={!input.trim() || isLoading || isClosed} aria-label="Send message" className="px-3">
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  if (!message.content) return null;

  return (
    <div className={`flex animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-500 text-white'
            : 'border border-slate-700 bg-slate-800 text-slate-200'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function Dot({ className = 'animate-typing-dot' }) {
  return <span className={`h-1.5 w-1.5 rounded-full bg-slate-500 ${className}`} />;
}
