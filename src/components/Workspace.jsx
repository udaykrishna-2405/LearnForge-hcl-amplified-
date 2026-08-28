import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { appReducer, initialState, ACTIONS } from '../state/appReducer';
import LandingPage from './landing/LandingPage';
import OnboardingView from './onboarding/OnboardingView';
import DashboardView from './dashboard/DashboardView';
import LoadingScreen from './shared/LoadingScreen';
import Toast from './shared/Toast';
import AssistantButton from './assistant/AssistantButton';
import AssistantPanel from './assistant/AssistantPanel';
import { useAuth } from '../hooks/useAuth';
import { getDisplayName } from '../services/authService';
import {
  loadActivePath,
  loadAllNotes,
  loadChatHistory,
  loadCourseProgress,
  loadDailyPlan,
  loadStudySessions,
  loadUserProfile,
  saveActivePath,
  saveChatHistory,
  saveUserProfile,
  updateActivePath,
} from '../services/userDataService';
import { calculateProgress } from '../utils/helpers';
import { calculateStreak, toDateKey } from '../utils/studySession';

const PROFILE_DEBOUNCE_MS = 2000;
const PATH_DEBOUNCE_MS = 2000;
const CHAT_DEBOUNCE_MS = 3000;

/** Turns persisted course_progress rows back into the reducer's flat lists. */
function foldProgressRows(rows) {
  const completedItems = [];
  const skippedItems = [];
  const skipReasons = {};
  const verifications = {};

  for (const row of rows) {
    if (row.status === 'completed') completedItems.push(row.course_id);
    if (row.status === 'skipped') {
      skippedItems.push(row.course_id);
      if (row.feedback_rating) skipReasons[row.course_id] = row.feedback_rating;
    }
    if (row.verification_status === 'verified') {
      verifications[row.course_id] = {
        status: 'verified',
        confidence: row.verification_result?.confidence ?? null,
        method: row.verification_result?.method ?? 'image',
      };
    }
  }

  return { completedItems, skippedItems, skipReasons, verifications };
}

export default function Workspace() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isHydrating, setIsHydrating] = useState(true);
  const hydratedFor = useRef(null);

  const {
    view, path, profile, completedItems, skippedItems, studySessions,
    chatHistory, assistantHistory, assistantOpen,
  } = state;

  // Restores the whole session for a returning learner, or routes a new one
  // into onboarding. Runs once per signed-in user.
  useEffect(() => {
    if (!user || hydratedFor.current === user.id) return;
    hydratedFor.current = user.id;

    let cancelled = false;
    setIsHydrating(true);

    (async () => {
      try {
        const [profileRow, activePath, progressRows, notes, sessions, onboardingChat, assistantChat, todaysPlan] =
          await Promise.all([
            loadUserProfile(user.id),
            loadActivePath(user.id),
            loadCourseProgress(user.id),
            loadAllNotes(user.id),
            loadStudySessions(user.id),
            loadChatHistory(user.id, 'onboarding'),
            loadChatHistory(user.id, 'assistant'),
            loadDailyPlan(user.id, toDateKey()),
          ]);

        if (cancelled) return;

        const isReturning = profileRow?.onboarding_complete === true && activePath?.path;

        dispatch({
          type: ACTIONS.HYDRATE_USER_DATA,
          payload: {
            profile: profileRow?.profile_data ?? null,
            path: activePath?.path ?? null,
            pathStartedAt: activePath?.startedAt ?? null,
            ...foldProgressRows(progressRows),
            notes: Object.fromEntries(notes.map((n) => [n.courseId, n.content])),
            studySessions: sessions,
            dailyPlan: todaysPlan,
            chatHistory: onboardingChat,
            assistantHistory: assistantChat,
          },
        });

        dispatch({ type: ACTIONS.SET_VIEW, payload: isReturning ? 'dashboard' : 'landing' });
      } catch {
        // A failed restore must not lock the learner out; they land on the
        // start of the flow with whatever state loaded.
        if (!cancelled) dispatch({ type: ACTIONS.SET_VIEW, payload: 'landing' });
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Clears the previous learner's data so a second sign-in starts clean.
  useEffect(() => {
    if (user) return;
    hydratedFor.current = null;
    dispatch({ type: ACTIONS.SIGN_OUT_RESET });
  }, [user]);

  const streak = useMemo(() => calculateStreak(studySessions), [studySessions]);
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_STREAK, payload: streak });
  }, [streak]);

  // ─── Persistence ───
  // Debounced so a burst of edits costs one write, not one per keystroke.

  useEffect(() => {
    if (!user || !profile || isHydrating) return undefined;
    const timer = setTimeout(() => {
      saveUserProfile(user.id, profile, Boolean(profile.profile_complete)).catch(() => {});
    }, PROFILE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [user, profile, isHydrating]);

  const savedPathRef = useRef(false);
  useEffect(() => {
    if (!user || !path || isHydrating) return undefined;
    const timer = setTimeout(() => {
      // The first save creates the active row; later ones update it in place.
      const persist = savedPathRef.current ? updateActivePath : saveActivePath;
      persist(user.id, path)
        .then(() => { savedPathRef.current = true; })
        .catch(() => {});
    }, PATH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [user, path, isHydrating]);

  useEffect(() => {
    if (!user || chatHistory.length === 0 || isHydrating) return undefined;
    const timer = setTimeout(() => {
      saveChatHistory(user.id, 'onboarding', chatHistory).catch(() => {});
    }, CHAT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [user, chatHistory, isHydrating]);

  useEffect(() => {
    if (!user || assistantHistory.length === 0 || isHydrating) return undefined;
    const timer = setTimeout(() => {
      saveChatHistory(user.id, 'assistant', assistantHistory).catch(() => {});
    }, CHAT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [user, assistantHistory, isHydrating]);

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

  if (isHydrating) return <HydratingScreen name={getDisplayName(user)} />;

  return (
    <div className="text-slate-50 antialiased selection:bg-indigo-500/30">
      {state.isLoading && <LoadingScreen message={state.loadingMessage} />}
      <Toast toasts={state.toasts} onRemove={handleRemoveToast} />

      {view === 'landing' && <LandingPage onStart={handleStart} />}
      {view === 'onboarding' && (
        <OnboardingView state={state} dispatch={dispatch} userId={user.id} />
      )}
      {view === 'dashboard' && path && (
        <DashboardView state={state} dispatch={dispatch} userId={user.id} />
      )}

      {view === 'dashboard' && path && (
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

function HydratingScreen({ name }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-xl font-semibold tracking-tight text-slate-100">
        Welcome back, {name}
      </p>
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-full bg-indigo-500 animate-soft-pulse" />
      </div>
      <p className="mt-4 text-sm text-slate-400">Loading your learning path…</p>
    </div>
  );
}
