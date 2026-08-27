import { ChatIcon, CloseIcon } from '../shared/Icons';

export default function AssistantButton({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full transition-opacity duration-200 hover:opacity-90 ${
        isOpen ? 'border border-slate-600 bg-slate-800 text-slate-300' : 'bg-indigo-500 text-white'
      }`}
    >
      {isOpen ? <CloseIcon /> : <ChatIcon />}
    </button>
  );
}
