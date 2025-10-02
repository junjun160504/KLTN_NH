import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { Spin } from 'antd';

/**
 * Protected Route wrapper cho customer routes
 * Yêu cầu session hợp lệ để truy cập
 */
const ProtectedCustomerRoute = ({
  children,
  requireSession = true,
  fallbackPath = '/cus/menus'
}) => {
  const { isAuthenticated, isLoading, session } = useSession();
  const location = useLocation();

  // Show loading while checking session
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // If session is required but not authenticated
  if (requireSession && !isAuthenticated) {
    // Check if current URL has QR parameters - if so, let it process
    const urlParams = new URLSearchParams(location.search);
    const hasQRParams = urlParams.has('table') && urlParams.has('session');

    if (hasQRParams) {
      // Let the component handle QR processing
      return children;
    }

    // Redirect to fallback path
    return <Navigate to={fallbackPath} replace />;
  }

  // If session exists but is not active
  if (isAuthenticated && session?.status !== 'ACTIVE') {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

/**
 * Public Route wrapper - accessible without session
 */
const PublicCustomerRoute = ({ children }) => {
  return children;
};

export { ProtectedCustomerRoute, PublicCustomerRoute };
export default ProtectedCustomerRoute;