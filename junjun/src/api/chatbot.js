import api from './index';

// Gửi tin nhắn đến chatbot
export const chatWithBot = (message) => api.post('/chatbot', { message });
