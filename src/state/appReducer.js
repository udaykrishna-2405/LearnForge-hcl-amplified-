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
};

export const initialState = {
  view: 'landing',        // 'landing' | 'onboarding' | 'dashboard'
  profile: null,
  chatHistory: [],
  path: null,
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

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}
