import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

/**
 * Custom hook để xử lý QR URL parameters tự động
 * Sử dụng trong component cần xử lý QR scan
 */
export const useQRHandler = (options = {}) => {
  const {
    redirectPath = '/cus/homes',
    autoRedirect = true,
    onSuccess = null,
    onError = null
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { createSession, isAuthenticated, error: sessionError } = useSession();

  const [isProcessing, setIsProcessing] = useState(false);
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    const processQRParams = async () => {
      try {
        // Skip if already authenticated or currently processing
        if (isAuthenticated || isProcessing) {
          return;
        }

        const urlParams = new URLSearchParams(location.search);
        const tableId = urlParams.get('table');
        const sessionToken = urlParams.get('session');

        // Only process if both parameters are present
        if (!tableId || !sessionToken) {
          return;
        }

        // Validate parameters
        if (!isValidTableId(tableId) || !isValidSessionToken(sessionToken)) {
          const error = 'QR Code parameters không hợp lệ';
          setQrError(error);
          onError?.(error);
          return;
        }

        setIsProcessing(true);
        setQrError(null);

        // Create session
        const sessionData = await createSession(tableId, sessionToken);

        // Success callback
        onSuccess?.(sessionData);

        // Auto redirect if enabled
        if (autoRedirect) {
          // Redirect to target path with table context
          const targetPath = redirectPath.includes(':tableId')
            ? redirectPath.replace(':tableId', tableId)
            : redirectPath;

          navigate(targetPath, { replace: true });
        } else {
          // Just clean the URL without redirecting
          navigate(location.pathname, { replace: true });
        }

      } catch (error) {
        const errorMessage = error.message || 'Không thể xử lý QR Code';
        setQrError(errorMessage);
        onError?.(error);
      } finally {
        setIsProcessing(false);
      }
    };

    processQRParams();
  }, [location.search, location.pathname, isAuthenticated, isProcessing, createSession, navigate, autoRedirect, redirectPath, onSuccess, onError]); // Dependencies



  const isValidTableId = (tableId) => {
    const id = parseInt(tableId);
    return !isNaN(id) && id > 0;
  };

  const isValidSessionToken = (token) => {
    // Session token should be alphanumeric and reasonable length
    return token &&
      typeof token === 'string' &&
      token.length >= 8 &&
      token.length <= 32 &&
      /^[a-zA-Z0-9]+$/.test(token);
  };

  return {
    isProcessing,
    qrError: qrError || sessionError,
    hasQRParams: () => {
      const params = new URLSearchParams(location.search);
      return params.has('table') && params.has('session');
    }
  };
};

export default useQRHandler;