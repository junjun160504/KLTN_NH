import express from 'express';
import * as callStaffController from '../controllers/callStaff.controller.js';

const router = express.Router();

/**
 * @route   POST /api/call-staff
 * @desc    Tạo thông báo gọi nhân viên (chỉ tạo notification, tự động emit qua Socket.IO)
 * @access  Public (không cần auth cho khách hàng)
 */
router.post('/', callStaffController.createCallStaffNotification);

export default router;

