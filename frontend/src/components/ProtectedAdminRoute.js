import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

/**
 * Protected Route wrapper cho admin/staff routes
 * Yêu cầu authentication để truy cập
 */
const ProtectedAdminRoute = ({
    children,
    requiredRole = null // 'ADMIN' or 'STAFF' or null (any authenticated user)
}) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/main/login" state={{ from: location }} replace />;
    }

    // If specific role is required, check role
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/main/unauthorized" replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
