import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const initAuth = async () => {
            try {
                const token = authService.getToken();
                const savedUser = authService.getUser();

                if (token && savedUser) {
                    // Validate token (optional)
                    const isValid = await authService.validateToken();

                    if (isValid) {
                        setUser(savedUser);
                    } else {
                        console.warn('⚠️ Invalid token, logging out');
                        authService.logout();
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                authService.logout();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const data = await authService.login(credentials);
            setUser(data.user);
            return data;
        } catch (error) {
            console.error('❌ Login failed in context:', error);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        isStaff: user?.role === 'STAFF',
        isManager: user?.role === 'MANAGER',
        isOwner: user?.role === 'OWNER',
        // Helper: Kiểm tra user có role cụ thể
        hasRole: (role) => user?.role === role,
        // Helper: Kiểm tra user có quyền truy cập (nếu không truyền allowedRoles hoặc empty array thì cho phép tất cả)
        canAccess: (allowedRoles) => !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(user?.role),
        getLoginTime: authService.getLoginTime,
        isRemembered: authService.isRemembered
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
