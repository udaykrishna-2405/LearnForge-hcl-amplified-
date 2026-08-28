import { useCallback, useEffect, useRef, useState } from 'react';
import ChatInterface from './ChatInterface';
import ProfileCard from './ProfileCard';
import Button from '../shared/Button';
import SignOutButton from '../shared/SignOutButton';
import { AlertIcon, ArrowRightIcon } from '../shared/Icons';
import { chatWithAI, extractProfile, generatePath } from '../../services/aiService';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { SKILL_TAXONOMY, DOMAIN_SKILL_REQUIREMENTS } from '../../data/skillTaxonomy';
import { SAMPLE_PATH } from '../../data/samplePath';
import { ACTIONS } from '../../state/appReducer';
import { saveActivePath, saveUserProfile } from '../../services/userDataService';

// Local so the first screen costs nothing and appears instantly.
const GREETING =
  "Hi — I'm your LearnForge advisor. I'll ask a few short questions, then build you a learning path.\n\nWhat skill or role are you working towards?";

// Six exchanges is enough for the four questions the prompt allows; past that
// we finish with what we have rather than let the conversation run on.
const MAX_CHAT_MESSAGES = 12;

export default function OnboardingView({ state, dispatch, userId }) {
  const [isReplying, setIsReplying] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [generateError, setGenerateError] = useState(false);
  const greeted = useRef(false);

  const { chatHistory, profile, pathStatus } = state;
  const isGenerating = pathStatus === 'generating';

  const addMessage = useCallback(
    (role, content) => {
      dispatch({ type: ACTIONS.ADD_CHAT_MESSAGE, payload: { role, content, ts: Date.now() } });
    },
    [dispatch]
  );

  useEffect(() => {
    if (greeted.current || chatHistory.length > 0) return;
    greeted.current = true;
    addMessage('assistant', GREETING);
  }, [chatHistory.length, addMessage]);

  const chatClosed = chatHistory.length >= MAX_CHAT_MESSAGES;
  const canGenerate = profile?.profile_complete === true || (chatClosed && Boolean(profile?.target_role));

  const handleSend = useCallback(
    async (text) => {
      addMessage('user', text);
      setIsReplying(true);
      setChatError(false);

      const turns = [...chatHistory, { role: 'user', content: text }]
        .map(({ role, content }) => ({ role, content }));

      // Reply and profile extraction run together: the panel keeps up with the
      // conversation without adding a second call's latency to the turn, and a
      // failure in either leaves the other intact.
      const [reply, extracted] = await Promise.allSettled([
        chatWithAI(turns),
        extractProfile(turns),
      ]);

      if (reply.status === 'fulfilled') {
        addMessage('assistant', reply.value || 'Got it.');
        setChatError(false);
      } else {
        setChatError(true);
        addMessage('assistant', "I'm having trouble connecting. Let me try again.");
      }

      if (extracted.status === 'fulfilled' && extracted.value) {
        dispatch({ type: ACTIONS.UPDATE_PROFILE, payload: extracted.value });
      }

      setIsReplying(false);
    },
    [addMessage, chatHistory, dispatch]
  );

  const openDashboard = useCallback(
    (path) => {
      // Written immediately so a reload right after onboarding still lands on
      // the dashboard rather than starting the flow again.
      if (userId) {
        saveUserProfile(userId, { ...profile, profile_complete: true }, true).catch(() => {});
        saveActivePath(userId, path).catch(() => {});
      }
      dispatch({ type: ACTIONS.SET_PATH, payload: path });
      dispatch({ type: ACTIONS.SET_VIEW, payload: 'dashboard' });
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: false } });
    },
    [dispatch, profile, userId]
  );

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return; // Guards the double click.

    setGenerateError(false);
    dispatch({ type: ACTIONS.SET_PATH_STATUS, payload: 'generating' });
    dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } });

    try {
      const path = await generatePath(profile, COURSE_CATALOG, SKILL_TAXONOMY, DOMAIN_SKILL_REQUIREMENTS);
      openDashboard(path);
    } catch {
      setGenerateError(true);
      dispatch({ type: ACTIONS.SET_PATH_STATUS, payload: 'error' });
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: false } });
    }
  }, [dispatch, isGenerating, openDashboard, profile]);

  const useSamplePath = useCallback(() => openDashboard(SAMPLE_PATH), [openDashboard]);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4 sm:px-6">
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: ACTIONS.SET_VIEW, payload: 'landing' })}>
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-400 sm:inline">
            Step 1 of 2 · Building your profile
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="h-[70vh] min-h-0 lg:h-[calc(100vh-8.5rem)]">
          <ChatInterface
            chatHistory={chatHistory}
            onSendMessage={handleSend}
            isLoading={isReplying}
            isClosed={chatClosed}
          />
          {chatError && (
            <p className="mt-2 text-xs text-slate-400">
              Connection problem — your next message will retry.
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <ProfileCard profile={profile} />

          {chatClosed && !canGenerate && (
            <p className="text-sm leading-relaxed text-slate-400">
              We have enough to work with. Generate the path and refine it as you go.
            </p>
          )}

          {(canGenerate || chatClosed) && !generateError && (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? 'Generating…' : 'Generate my learning path'}
              {!isGenerating && <ArrowRightIcon />}
            </Button>
          )}

          {generateError && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertIcon />
                <p className="text-sm font-medium">Couldn't build your path</p>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                The planner didn't respond. Try again, or continue with a sample
                ML Engineer path to explore the app.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  Try again
                </Button>
                <Button size="sm" variant="secondary" onClick={useSamplePath}>
                  Use sample path
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
