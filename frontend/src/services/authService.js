import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

                storage.setItem('token', token);
                storage.setItem('user', JSON.stringify(user));
                storage.setItem('remember', credentials.remember ? 'true' : 'false');

                // Set default Authorization header cho các request sau
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Đăng nhập thất bại' };
        }
    },

    /**
     * Logout
     */
    logout: () => {
        // Xóa cả localStorage và sessionStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('remember');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('remember');

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
        return !!authService.getToken();
    },

    /**
     * Check if remember me was enabled
     */
    isRemembered: () => {
        return localStorage.getItem('remember') === 'true';
    },

    /**
     * Setup axios interceptor
     */
    setupInterceptor: () => {
        // Request interceptor
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

        // Response interceptor
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    authService.logout();
                    window.location.href = '/main/login';
                }
                return Promise.reject(error);
            }
        );
    }
};

// Setup interceptor on import
authService.setupInterceptor();

export default authService;
