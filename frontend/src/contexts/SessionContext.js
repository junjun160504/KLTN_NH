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

  // Helper functions defined before useEffect
  const isValidSessionData = (sessionData) => {
    // Relaxed validation - only check essential fields
    return sessionData &&
      sessionData.session_id &&
      sessionData.table_id
    // &&sessionData.table_number;
    // Removed strict status check to allow session persistence
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

  // Initialize session from localStorage on app start
  useEffect(() => {
    const initSession = async () => {
      try {
        const savedSession = localStorage.getItem('qr_session');
        console.log('🔍 Checking localStorage for qr_session:', savedSession);

        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          console.log('📦 Parsed session data:', sessionData);

          // Validate session data structure
          if (!isValidSessionData(sessionData)) {
            console.warn('⚠️ Invalid session data structure, clearing...');
            clearSession();
            return;
          }

          // ✨ NEW: Validate session với backend
          console.log('🔄 Validating session with backend...');
          const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

          try {
            const response = await axios.get(
              `${REACT_APP_API_URL}/qr-sessions/${sessionData.session_id}/validate`
            );

            console.log('📡 Validation response:', response.data);

            if (response.data.valid) {
              // Session hợp lệ → Restore
              console.log('✅ Session is valid, restoring...');
              dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: sessionData });
              setupAxiosInterceptor(sessionData.session_id);
            } else {
              // Session không hợp lệ
              console.warn('❌ Session invalid:', response.data.reason);
              console.warn('Message:', response.data.message);

              // Nếu backend bảo clear → Xóa localStorage
              if (response.data.shouldClear) {
                console.log('🗑️ Clearing invalid session from localStorage');
                clearSession();
              }

              // Show notification to user
              // notification.warning({
              //   message: 'Session hết hạn',
              //   description: response.data.message,
              //   duration: 5
              // });
            }
          } catch (validationError) {
            console.error('❌ Error validating session:', validationError);

            // Nếu network error hoặc 500 → Giữ session tạm thời
            if (validationError.response?.status >= 500) {
              console.log('⚠️ Server error, keeping session temporarily');
              dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: sessionData });
              setupAxiosInterceptor(sessionData.session_id);
            } else {
              // Other errors → Clear session
              console.log('🗑️ Clearing session due to validation error');
              clearSession();
            }
          }
        } else {
          console.log('ℹ️ No saved session found in localStorage');
        }
      } catch (error) {
        console.error('❌ Error initializing session:', error);
        clearSession();
      }
    };

    initSession();
  }, []); // Empty dependency array - only run once on mount


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
        created_at: new Date().toISOString(),
        expired_at: response.data.data.expired_at // NEW: Lưu thời gian expire
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