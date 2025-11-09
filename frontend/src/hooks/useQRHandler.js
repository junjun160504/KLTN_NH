import { useEffect, useState, useRef } from 'react';
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

  // ✅ Use refs to avoid re-triggering effect when callbacks change
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // ✅ Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // ✅ Track if QR params have been processed to prevent re-processing
  const processedParamsRef = useRef(null);

  useEffect(() => {
    const processQRParams = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const tableId = urlParams.get('table');
        const sessionToken = urlParams.get('session');

        // Only process if both parameters are present
        if (!tableId || !sessionToken) {
          return;
        }

        // ✅ Skip if already authenticated
        if (isAuthenticated) {
          console.log('✅ Already authenticated, skipping QR processing');
          return;
        }

        // ✅ Skip if these exact params were already processed
        const paramsKey = `${tableId}-${sessionToken}`;
        if (processedParamsRef.current === paramsKey) {
          console.log('✅ QR params already processed, skipping');
          return;
        }

        // ✅ Skip if currently processing
        if (isProcessing) {
          console.log('⏳ Already processing, skipping');
          return;
        }

        // Validate parameters
        if (!isValidTableId(tableId) || !isValidSessionToken(sessionToken)) {
          const error = 'QR Code parameters không hợp lệ';
          setQrError(error);
          onErrorRef.current?.(error);
          return;
        }

        console.log('🔄 Processing QR params:', { tableId, sessionToken: sessionToken.substring(0, 8) + '...' });

        setIsProcessing(true);
        setQrError(null);

        // ✅ Mark as processed BEFORE API call to prevent duplicate calls
        processedParamsRef.current = paramsKey;

        // Create session
        const sessionData = await createSession(tableId, sessionToken);

        console.log('✅ Session created successfully:', sessionData);

        // Success callback
        onSuccessRef.current?.(sessionData);

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
        console.error('❌ QR Processing error:', error);
        const errorMessage = error.message || 'Không thể xử lý QR Code';
        setQrError(errorMessage);
        onErrorRef.current?.(error);
        // Reset processed flag on error to allow retry
        processedParamsRef.current = null;
      } finally {
        setIsProcessing(false);
      }
    };

    processQRParams();
    // ✅ ONLY depend on location.search and isAuthenticated
    // Remove isProcessing, onSuccess, onError from dependencies
  }, [location.search, isAuthenticated, createSession, navigate, autoRedirect, redirectPath, location.pathname]);



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