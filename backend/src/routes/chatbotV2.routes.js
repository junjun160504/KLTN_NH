/**
 * Chatbot V2 Routes
 * 
 * Routes cho chatbot sử dụng OpenAI Assistants API
 * 
 * @module routes/chatbotV2.routes
 */

import express from 'express';
import * as chatbotV2Controller from '../controllers/chatbotV2.controller.js';
import tokenRateLimiter, { getRateLimitStatus } from '../middlewares/tokenRateLimiter.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/chatbot-v2/chat
 * @desc    Gửi tin nhắn và nhận phản hồi từ Assistant
 * @body    { message: string, session_id?: string }
 * @access  Public
 * @middleware tokenRateLimiter - Giới hạn 80k TPM
 */
router.post('/chat', tokenRateLimiter, chatbotV2Controller.chat);

/**
 * @route   GET /api/chatbot-v2/history/:session_id
 * @desc    Lấy lịch sử chat của session
 * @params  session_id - ID của session (QR session hoặc customer session)
 * @query   limit - Số lượng tin nhắn tối đa (default: 20)
 * @access  Public
 */
router.get('/history/:session_id', chatbotV2Controller.getChatHistory);

/**
 * @route   DELETE /api/chatbot-v2/conversation/:session_id
 * @desc    Xóa cuộc hội thoại của session
 * @params  session_id - ID của session
 * @access  Public
 */
router.delete('/conversation/:session_id', chatbotV2Controller.clearConversation);

/**
 * @route   POST /api/chatbot-v2/thread
 * @desc    Tạo thread mới cho session
 * @body    { session_id?: string }
 * @access  Public
 */
router.post('/thread', chatbotV2Controller.createThread);

/**
 * @route   GET /api/chatbot-v2/rate-limit-status
 * @desc    Lấy trạng thái rate limit hiện tại
 * @access  Public
 */
router.get('/rate-limit-status', (req, res) => {
    const status = getRateLimitStatus();
    res.json({
        success: true,
        data: status
    });
});

/**
 * @route   GET /api/chatbot-v2/cache-stats
 * @desc    Lấy thống kê cache (function call results)
 * @access  Public
 */
router.get('/cache-stats', chatbotV2Controller.getCacheStats);

/**
 * @route   DELETE /api/chatbot-v2/cache/:thread_id
 * @desc    Xóa cache cho một thread cụ thể
 * @params  thread_id - ID của thread
 * @access  Public
 */
router.delete('/cache/:thread_id', chatbotV2Controller.clearThreadCache);

/**
 * @route   GET /api/chatbot-v2/health
 * @desc    Kiểm tra trạng thái của Chatbot V2 service
 * @access  Public
 */
router.get('/health', chatbotV2Controller.healthCheck);

export default router;
