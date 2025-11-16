import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const authService = {
    /**
     * Login admin/staff
     * @param {Object} credentials - { username, password, remember }
     * @returns {Promise<Object>} { token, user }
     */
    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_URL}/admin/login`, {
                username: credentials.username,
                password: credentials.password
            });

            if (response.data.token) {
                const { token, user } = response.data;

                // Lưu vào localStorage hoặc sessionStorage tùy theo "remember me"
                const storage = credentials.remember ? localStorage : sessionStorage;

                // Xóa data cũ ở storage khác
                if (credentials.remember) {
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('remember');
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('remember');
                }

                // Lưu data mới
                storage.setItem('token', token);
                storage.setItem('user', JSON.stringify(user));
                storage.setItem('remember', credentials.remember ? 'true' : 'false');
                storage.setItem('loginTime', new Date().toISOString());

                // Set default Authorization header cho các request sau
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                console.log('✅ Login successful:', user.username, '| Role:', user.role);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            throw error.response?.data || { message: 'Đăng nhập thất bại' };
        }
    },

    /**
     * Logout
     */
    logout: () => {
        console.log('🚪 Logging out...');

        // Xóa cả localStorage và sessionStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('remember');
        localStorage.removeItem('loginTime');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('remember');
        sessionStorage.removeItem('loginTime');

        // Xóa Authorization header
        delete axios.defaults.headers.common['Authorization'];
    },

    /**
     * Get token from storage
     */
    getToken: () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    },

    /**
     * Check if token is expired (decode JWT and check exp)
     * Returns true if expired, false if still valid
     */
    isTokenExpired: () => {
        const token = authService.getToken();
        if (!token) return true;

        try {
            // Decode JWT (base64 decode phần payload)
            const payload = JSON.parse(atob(token.split('.')[1]));

            // JWT exp là Unix timestamp (seconds)
            // Date.now() là milliseconds nên chia 1000
            const currentTime = Date.now() / 1000;

            return payload.exp < currentTime;
        } catch (error) {
            console.error('Token decode error:', error);
            return true; // Nếu decode lỗi, coi như expired
        }
    },

    /**
     * Get user from storage
     */
    getUser: () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        const token = authService.getToken();
        if (!token) return false;

        // Quick check: Is token expired?
        if (authService.isTokenExpired()) {
            console.warn('⚠️ Token expired');
            authService.logout();
            return false;
        }

        return true;
    },

    /**
     * Check if remember me was enabled
     */
    isRemembered: () => {
        return localStorage.getItem('remember') === 'true';
    },

    /**
     * Get login time
     */
    getLoginTime: () => {
        return localStorage.getItem('loginTime') || sessionStorage.getItem('loginTime');
    },

    /**
     * Validate token (check if expired or invalid)
     */
    validateToken: async () => {
        const token = authService.getToken();
        if (!token) return false;

        try {
            const response = await axios.get(`${API_URL}/admin/validate`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data.valid === true;
        } catch (error) {
            // Token invalid/expired - backend trả về 401 hoặc 403
            console.error('Token validation failed:', error.response?.status || error.message);
            return false;
        }
    },

    /**
     * Setup axios interceptor
     */
    setupInterceptor: () => {
        // Request interceptor - Chỉ attach token vào header
        axios.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - Backend là source of truth cho token validation
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                // ⚠️ CHỈ redirect khi là lỗi 401/403 từ authenticated request
                // KHÔNG redirect nếu là login request thất bại
                if (error.response?.status === 401 || error.response?.status === 403) {
                    const isLoginRequest = error.config?.url?.includes('/admin/login');
                    const isValidateRequest = error.config?.url?.includes('/admin/validate');

                    // Nếu KHÔNG phải login/validate request → token expired/invalid
                    if (!isLoginRequest && !isValidateRequest) {
                        console.warn('⚠️ Token expired or invalid (401/403), redirecting to login...');
                        authService.logout();
                        window.location.href = '/main/login';
                    }
                    // Nếu là login/validate request → để component xử lý error
                }
                return Promise.reject(error);
            }
        );
    }
};

// Setup interceptor on import
authService.setupInterceptor();

export default authService;
