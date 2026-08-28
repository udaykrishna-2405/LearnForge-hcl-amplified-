// ─── Constants & Configuration ──────────────────────────────

export const ACTIONS = {
  SET_VIEW: 'SET_VIEW',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SET_PATH: 'SET_PATH',
  UPDATE_PATH: 'UPDATE_PATH',
  SET_PATH_STATUS: 'SET_PATH_STATUS',
  COMPLETE_COURSE: 'COMPLETE_COURSE',
  SKIP_COURSE: 'SKIP_COURSE',
  SET_LOADING: 'SET_LOADING',
  TOGGLE_ASSISTANT: 'TOGGLE_ASSISTANT',
  ADD_ASSISTANT_MESSAGE: 'ADD_ASSISTANT_MESSAGE',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  TOGGLE_PHASE: 'TOGGLE_PHASE',
  RESET: 'RESET',

  // ─── Daily planner ───
  SET_DAILY_PLAN: 'SET_DAILY_PLAN',
  LOG_STUDY_SESSION: 'LOG_STUDY_SESSION',
  SET_STUDY_SESSIONS: 'SET_STUDY_SESSIONS',
  SET_STREAK: 'SET_STREAK',

  // ─── Adaptive feedback ───
  OPEN_FEEDBACK: 'OPEN_FEEDBACK',
  CLOSE_FEEDBACK: 'CLOSE_FEEDBACK',
  APPLY_PATH_CHANGES: 'APPLY_PATH_CHANGES',
  ADD_CHANGELOG_ENTRY: 'ADD_CHANGELOG_ENTRY',

  // ─── Notes & quizzing ───
  SAVE_NOTE: 'SAVE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_NOTES: 'SET_NOTES',

  // ─── Readiness ───
  SET_READINESS_SCORE: 'SET_READINESS_SCORE',

  // ─── Auth & persistence ───
  HYDRATE_USER_DATA: 'HYDRATE_USER_DATA',
  SIGN_OUT_RESET: 'SIGN_OUT_RESET',

  // ─── Completion verification ───
  START_VERIFICATION: 'START_VERIFICATION',
  CANCEL_VERIFICATION: 'CANCEL_VERIFICATION',
  VERIFICATION_RESULT: 'VERIFICATION_RESULT',
};

export const initialState = {
  view: 'landing',        // 'landing' | 'onboarding' | 'dashboard'
  profile: null,
  chatHistory: [],
  path: null,
  pathStartedAt: null,  // Anchors every pacing calculation
  pathStatus: 'idle',     // 'idle' | 'generating' | 'ready' | 'error'
  isLoading: false,
  loadingMessage: '',
  assistantOpen: false,
  assistantHistory: [],
  toasts: [],
  expandedPhases: [],
  completedItems: [],
  skippedItems: [],
  skipReasons: {},        // itemId -> reason, so skills can be credited later

  dailyPlan: null,
  studySessions: [],      // [{ date: 'YYYY-MM-DD', minutes }]
  streak: 0,
  changelog: [],          // Reverse-chronological path adaptations
  notes: {},              // courseId -> note text
  readinessScore: null,
  feedbackModalOpen: false,
  feedbackTargetCourse: null,

  verifyingItemId: null,      // Course currently awaiting proof
  verifications: {},          // itemId -> { status, confidence, method, reason }
};

// ─── Reducer ────────────────────────────────────────────────

let toastSequence = 0;

export function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_VIEW:
      return { ...state, view: action.payload };

    case ACTIONS.UPDATE_PROFILE:
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case ACTIONS.ADD_CHAT_MESSAGE:
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };

    case ACTIONS.SET_PATH: {
      const firstPhase = action.payload?.phases?.[0]?.phase_id;
      return {
        ...state,
        path: action.payload,
        pathStartedAt: state.pathStartedAt ?? new Date().toISOString(),
        pathStatus: 'ready',
        expandedPhases: firstPhase ? [firstPhase] : [],
      };
    }

    case ACTIONS.UPDATE_PATH:
      return { ...state, path: action.payload };

    case ACTIONS.SET_PATH_STATUS:
      return { ...state, pathStatus: action.payload };

    case ACTIONS.COMPLETE_COURSE:
      return state.completedItems.includes(action.payload)
        ? state
        : { ...state, completedItems: [...state.completedItems, action.payload] };

    case ACTIONS.SKIP_COURSE: {
      const { itemId, reason } = action.payload;
      if (state.skippedItems.includes(itemId)) return state;
      return {
        ...state,
        skippedItems: [...state.skippedItems, itemId],
        skipReasons: { ...state.skipReasons, [itemId]: reason },
      };
    }

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingMessage: action.payload.message ?? '',
      };

    case ACTIONS.TOGGLE_ASSISTANT:
      return { ...state, assistantOpen: !state.assistantOpen };

    case ACTIONS.ADD_ASSISTANT_MESSAGE:
      return { ...state, assistantHistory: [...state.assistantHistory, action.payload] };

    case ACTIONS.ADD_TOAST: {
      toastSequence += 1;
      return { ...state, toasts: [...state.toasts, { ...action.payload, id: toastSequence }] };
    }

    case ACTIONS.REMOVE_TOAST:
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case ACTIONS.TOGGLE_PHASE: {
      const id = action.payload;
      return {
        ...state,
        expandedPhases: state.expandedPhases.includes(id)
          ? state.expandedPhases.filter((p) => p !== id)
          : [...state.expandedPhases, id],
      };
    }

    // ─── Daily planner ───

    case ACTIONS.SET_DAILY_PLAN:
      return { ...state, dailyPlan: action.payload };

    case ACTIONS.SET_STUDY_SESSIONS:
      return { ...state, studySessions: action.payload };

    case ACTIONS.LOG_STUDY_SESSION: {
      const { date, minutes } = action.payload;
      // One session per day; logging again tops up that day's minutes.
      const existing = state.studySessions.find((s) => s.date === date);
      const studySessions = existing
        ? state.studySessions.map((s) =>
            s.date === date ? { ...s, minutes: s.minutes + minutes } : s
          )
        : [...state.studySessions, { date, minutes }];
      return { ...state, studySessions };
    }

    case ACTIONS.SET_STREAK:
      return { ...state, streak: action.payload };

    // ─── Adaptive feedback ───

    case ACTIONS.OPEN_FEEDBACK:
      return { ...state, feedbackModalOpen: true, feedbackTargetCourse: action.payload };

    case ACTIONS.CLOSE_FEEDBACK:
      return { ...state, feedbackModalOpen: false, feedbackTargetCourse: null };

    case ACTIONS.APPLY_PATH_CHANGES:
      return { ...state, path: action.payload };

    case ACTIONS.ADD_CHANGELOG_ENTRY:
      return { ...state, changelog: [action.payload, ...state.changelog] };

    // ─── Notes & quizzing ───

    case ACTIONS.SAVE_NOTE:
      return {
        ...state,
        notes: { ...state.notes, [action.payload.courseId]: action.payload.content },
      };

    case ACTIONS.DELETE_NOTE: {
      const notes = { ...state.notes };
      delete notes[action.payload];
      return { ...state, notes };
    }

    case ACTIONS.SET_NOTES:
      return { ...state, notes: action.payload };

    // ─── Readiness ───

    case ACTIONS.SET_READINESS_SCORE:
      return { ...state, readinessScore: action.payload };

    // ─── Auth & persistence ───

    /** Restores a returning learner's whole session in one dispatch. */
    case ACTIONS.HYDRATE_USER_DATA: {
      const {
        profile, path, pathStartedAt, completedItems, skippedItems, skipReasons,
        verifications, notes, studySessions, dailyPlan, chatHistory, assistantHistory,
      } = action.payload;

      return {
        ...state,
        profile: profile ?? state.profile,
        path: path ?? state.path,
        pathStartedAt: pathStartedAt ?? state.pathStartedAt,
        pathStatus: path ? 'ready' : state.pathStatus,
        expandedPhases: path?.phases?.[0] ? [path.phases[0].phase_id] : state.expandedPhases,
        completedItems: completedItems ?? state.completedItems,
        skippedItems: skippedItems ?? state.skippedItems,
        skipReasons: skipReasons ?? state.skipReasons,
        verifications: verifications ?? state.verifications,
        notes: notes ?? state.notes,
        studySessions: studySessions ?? state.studySessions,
        dailyPlan: dailyPlan ?? state.dailyPlan,
        chatHistory: chatHistory?.length ? chatHistory : state.chatHistory,
        assistantHistory: assistantHistory?.length ? assistantHistory : state.assistantHistory,
      };
    }

    case ACTIONS.SIGN_OUT_RESET:
      return initialState;

    // ─── Completion verification ───

    case ACTIONS.START_VERIFICATION:
      return { ...state, verifyingItemId: action.payload };

    case ACTIONS.CANCEL_VERIFICATION:
      return { ...state, verifyingItemId: null };

    /**
     * On success this defers to the same completion transition as
     * COMPLETE_COURSE, so verified and directly-marked courses converge on one
     * code path and the existing action keeps working untouched.
     */
    case ACTIONS.VERIFICATION_RESULT: {
      const { itemId, verified, confidence, method, reason } = action.payload;

      const verifications = {
        ...state.verifications,
        [itemId]: verified
          ? { status: 'verified', confidence, method }
          : { status: 'rejected', reason },
      };

      if (!verified) {
        return { ...state, verifyingItemId: null, verifications };
      }

      const completed = appReducer(state, { type: ACTIONS.COMPLETE_COURSE, payload: itemId });
      return { ...completed, verifyingItemId: null, verifications };
    }

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}
