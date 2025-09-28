import api from './index';

// Gọi nhân viên phục vụ
export const callStaff = () => api.get('/call-staff');
