import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { appReducer, initialState, ACTIONS } from './state/appReducer';
import LandingPage from './components/landing/LandingPage';
import OnboardingView from './components/onboarding/OnboardingView';
import DashboardView from './components/dashboard/DashboardView';
import LoadingScreen from './components/shared/LoadingScreen';
import Toast from './components/shared/Toast';
import AssistantButton from './components/assistant/AssistantButton';
import AssistantPanel from './components/assistant/AssistantPanel';
import { saveLearnerState, isPersistenceEnabled } from './services/supabaseClient';
import { calculateProgress } from './utils/helpers';

// The learner_states primary key is a UUID, so the session id must be one too.
const LEARNER_ID =
  globalThis.crypto?.randomUUID?.() ?? '00000000-0000-4000-8000-000000000000';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { view, path, profile, completedItems, skippedItems, assistantOpen, assistantHistory } = state;

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
      {view === 'dashboard' && path && <DashboardView state={state} dispatch={dispatch} />}

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
