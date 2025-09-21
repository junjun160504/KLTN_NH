import api from './index';

// Tạo đơn mới
export const createOrder = (data) => api.post('/orders', data);

// Thêm món vào đơn
export const addItemToOrder = (orderId, itemData) => api.put(`/orders/${orderId}/add`, itemData);

// Lấy đơn theo ID
export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

// Cập nhật trạng thái đơn
export const updateOrderStatus = (orderId, status) => api.put(`/orders/${orderId}/status`, { status });
