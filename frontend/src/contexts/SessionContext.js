import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Session State Types
const SESSION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SESSION: 'SET_SESSION',
  CLEAR_SESSION: 'CLEAR_SESSION',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false
};

// Session reducer
const sessionReducer = (state, action) => {
  switch (action.type) {
    case SESSION_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case SESSION_ACTIONS.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case SESSION_ACTIONS.CLEAR_SESSION:
      return {
        ...state,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case SESSION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isAuthenticated: false
      };

    default:
      return state;
  }
};

// Create context
const SessionContext = createContext();

// Session provider component
export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Initialize session from localStorage on app start
  useEffect(() => {
    const initSession = () => {
      try {
        const savedSession = localStorage.getItem('qr_session');
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);

          // Validate session data structure
          if (isValidSessionData(sessionData)) {
            dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: sessionData });
            setupAxiosInterceptor(sessionData.session_id);
          } else {
            // Invalid session data, clear it
            clearSession();
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        clearSession();
      }
    };

    initSession();
  }, []);

  const isValidSessionData = (sessionData) => {
    return sessionData &&
      sessionData.session_id &&
      sessionData.table_id &&
      sessionData.table_number &&
      sessionData.status === 'ACTIVE';
  };

  const clearSession = () => {
    // Remove from localStorage
    localStorage.removeItem('qr_session');

    // Remove axios interceptor
    if (axios.defaults.sessionInterceptorId) {
      axios.interceptors.request.eject(axios.defaults.sessionInterceptorId);
      delete axios.defaults.sessionInterceptorId;
    }

    // Update state
    dispatch({ type: SESSION_ACTIONS.CLEAR_SESSION });
  };

  const setupAxiosInterceptor = (sessionId) => {
    // Remove existing interceptor if any
    axios.interceptors.request.eject(axios.defaults.sessionInterceptorId);

    // Add new interceptor
    const interceptorId = axios.interceptors.request.use(
      (config) => {
        // Only add session header for customer API calls
        if (config.url && config.url.includes('/api/')) {
          config.headers['qr-session-id'] = sessionId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Store interceptor ID for cleanup
    axios.defaults.sessionInterceptorId = interceptorId;
  };

  const createSession = async (tableId, sessionToken) => {
    dispatch({ type: SESSION_ACTIONS.SET_LOADING, payload: true });

    try {
      const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
      const response = await axios.post(`${REACT_APP_API_URL}/qr-sessions/scan`, {
        table_id: parseInt(tableId),
        session_token: sessionToken
      });

      const sessionData = {
        session_id: response.data.data.id,
        table_id: response.data.data.table_id,
        table_number: response.data.data.table_number,
        status: response.data.data.status,
        created_at: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('qr_session', JSON.stringify(sessionData));

      // Update state
      dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: sessionData });

      // Setup axios interceptor
      setupAxiosInterceptor(sessionData.session_id);

      return sessionData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'QR Code không hợp lệ hoặc đã hết hạn';
      dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const refreshSession = async () => {
    if (!state.session) return;

    try {
      const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
      const response = await axios.get(`${REACT_APP_API_URL}/qr-sessions/${state.session.session_id}`);

      const updatedSession = { ...state.session, ...response.data.data };
      localStorage.setItem('qr_session', JSON.stringify(updatedSession));
      dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: updatedSession });

      return updatedSession;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      clearSession();
      throw error;
    }
  };

  const value = {
    // State
    ...state,

    // Actions
    createSession,
    clearSession,
    refreshSession,

    // Utilities
    getSessionId: () => state.session?.session_id,
    getTableId: () => state.session?.table_id,
    getTableNumber: () => state.session?.table_number,
    isSessionActive: () => state.session?.status === 'ACTIVE'
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook to use session context
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;