import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { appReducer, initialState, ACTIONS } from './state/appReducer';
import LandingPage from './components/landing/LandingPage';
import OnboardingView from './components/onboarding/OnboardingView';
import DashboardView from './components/dashboard/DashboardView';
import LoadingScreen from './components/shared/LoadingScreen';
import Toast from './components/shared/Toast';
import AssistantButton from './components/assistant/AssistantButton';
import AssistantPanel from './components/assistant/AssistantPanel';
import {
  saveLearnerState,
  isPersistenceEnabled,
  fetchRecentSessions,
  fetchDailyPlan,
} from './services/supabaseClient';
import { loadNotes } from './utils/notesStorage';
import { calculateProgress } from './utils/helpers';
import { calculateStreak, toDateKey } from './utils/studySession';

// The learner_states primary key is a UUID, so the session id must be one too.
const LEARNER_ID =
  globalThis.crypto?.randomUUID?.() ?? '00000000-0000-4000-8000-000000000000';

const HISTORY_DAYS = 30;

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const {
    view, path, profile, completedItems, skippedItems, studySessions,
    assistantOpen, assistantHistory,
  } = state;

  // Rehydrate whatever was persisted; absent Supabase this is simply a no-op
  // and the session runs entirely in memory.
  useEffect(() => {
    if (!isPersistenceEnabled) return;
    let cancelled = false;

    (async () => {
      const since = toDateKey(new Date(Date.now() - HISTORY_DAYS * 86_400_000));
      const [sessions, notes, todaysPlan] = await Promise.all([
        fetchRecentSessions(LEARNER_ID, since),
        loadNotes(LEARNER_ID),
        fetchDailyPlan(LEARNER_ID, toDateKey()),
      ]);
      if (cancelled) return;
      if (sessions.length) dispatch({ type: ACTIONS.SET_STUDY_SESSIONS, payload: sessions });
      if (Object.keys(notes).length) dispatch({ type: ACTIONS.SET_NOTES, payload: notes });
      if (todaysPlan) dispatch({ type: ACTIONS.SET_DAILY_PLAN, payload: todaysPlan });
    })();

    return () => { cancelled = true; };
  }, []);

  // Streak is derived, so it is recomputed whenever the session log changes.
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_STREAK, payload: calculateStreak(studySessions) });
  }, [studySessions]);

  useEffect(() => {
    if (!isPersistenceEnabled || (!profile && !path)) return;
    saveLearnerState(LEARNER_ID, { profile, path, completedItems, skippedItems });
  }, [profile, path, completedItems, skippedItems]);

  const progress = useMemo(
    () => calculateProgress(path, completedItems, skippedItems, profile?.weekly_hours),
    [path, completedItems, skippedItems, profile?.weekly_hours]
  );

  const handleStart = useCallback(
    () => dispatch({ type: ACTIONS.SET_VIEW, payload: 'onboarding' }),
    []
  );

  const handleRemoveToast = useCallback(
    (id) => dispatch({ type: ACTIONS.REMOVE_TOAST, payload: id }),
    []
  );

  const toggleAssistant = useCallback(() => dispatch({ type: ACTIONS.TOGGLE_ASSISTANT }), []);

  const addAssistantMessage = useCallback(
    (message) => dispatch({ type: ACTIONS.ADD_ASSISTANT_MESSAGE, payload: message }),
    []
  );

  const showAssistant = view === 'dashboard' && Boolean(path);

  return (
    <div className="text-slate-50 antialiased selection:bg-indigo-500/30">
      {state.isLoading && <LoadingScreen message={state.loadingMessage} />}
      <Toast toasts={state.toasts} onRemove={handleRemoveToast} />

      {view === 'landing' && <LandingPage onStart={handleStart} />}
      {view === 'onboarding' && <OnboardingView state={state} dispatch={dispatch} />}
      {view === 'dashboard' && path && (
        <DashboardView state={state} dispatch={dispatch} learnerId={LEARNER_ID} />
      )}

      {showAssistant && (
        <>
          <AssistantButton isOpen={assistantOpen} onClick={toggleAssistant} />
          <AssistantPanel
            isOpen={assistantOpen}
            onClose={toggleAssistant}
            profile={profile}
            path={path}
            progress={progress}
            history={assistantHistory}
            onAddMessage={addAssistantMessage}
          />
        </>
      )}
    </div>
  );
}
