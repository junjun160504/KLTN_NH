import api from './index';

// Gửi đánh giá của khách
export const submitReview = (reviewData) => api.post('/review', reviewData);
