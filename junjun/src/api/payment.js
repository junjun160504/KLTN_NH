import api from './index';

// Gửi yêu cầu thanh toán
export const processPayment = (paymentData) => api.post('/payment', paymentData);
