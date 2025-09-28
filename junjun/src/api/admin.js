import api from './index';

// Đăng nhập admin
export const loginAdmin = (credentials) => api.post('/admin/login', credentials);
