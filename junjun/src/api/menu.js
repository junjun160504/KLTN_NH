import api from './index';

// Lấy danh sách món ăn
export const fetchMenuItems = async () => api.get('/menu');

// Thêm món mới (admin)
export const createMenuItem = (menuData) => api.post('/menu', menuData);
