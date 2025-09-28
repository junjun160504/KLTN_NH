import api from './index';

// Thêm thông tin khách hàng
export const addCustomer = (customerData) => api.post('/customers', customerData);
