/**
 * Chatbot V2 Controller
 * 
 * Xử lý các request cho chatbot sử dụng OpenAI Assistants API
 * 
 * @module controllers/chatbotV2.controller
 */

import * as assistantService from '../services/chatbotV2/assistant.service.js';
import * as threadService from '../services/chatbotV2/thread.service.js';
import * as functionRouter from '../services/chatbotV2/function-router.service.js';
import { recordTokenUsage, getRateLimitStatus } from '../middlewares/tokenRateLimiter.middleware.js';

/**
 * Chat với Assistant
 * 
 * POST /api/chatbot-v2/chat
 * Body: { message: string, session_id?: string }
 */
export async function chat(req, res) {
    try {
        const { message, session_id } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng nhập tin nhắn'
            });
        }

        if (!session_id) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu session_id'
            });
        }

        // Gọi Assistant service
        const result = await assistantService.chat(message.trim(), session_id);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || 'Có lỗi xảy ra khi xử lý tin nhắn'
            });
        }

        // Record actual token usage if available
        if (result.usage) {
            const totalTokens = result.usage.total_tokens ||
                ((result.usage.prompt_tokens || 0) + (result.usage.completion_tokens || 0));
            recordTokenUsage(totalTokens);
            console.log(`📊 Actual tokens used: ${totalTokens}`);
        } else if (req.estimatedTokens) {
            // Fallback to estimated tokens if actual not available
            recordTokenUsage(req.estimatedTokens);
            console.log(`📊 Estimated tokens recorded: ${req.estimatedTokens}`);
        }

        // Format response cho frontend
        const response = formatResponseForFrontend(result);

        // Add rate limit info to response header
        const rateLimitStatus = getRateLimitStatus();
        res.set('X-RateLimit-Remaining', rateLimitStatus.remaining);
        res.set('X-RateLimit-Limit', rateLimitStatus.maxTokens);
        res.set('X-RateLimit-Usage', rateLimitStatus.currentUsage);

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('[ChatbotV2] Chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra. Vui lòng thử lại!'
        });
    }
}

/**
 * Lấy lịch sử chat
 * 
 * GET /api/chatbot-v2/history/:session_id
 */
export async function getChatHistory(req, res) {
    try {
        const { session_id } = req.params;
        const { limit = 20 } = req.query;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu session_id'
            });
        }

        const result = await assistantService.getChatHistory(session_id, parseInt(limit));

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Không tìm thấy lịch sử chat'
            });
        }

        res.status(200).json({
            success: true,
            data: result.messages
        });

    } catch (error) {
        console.error('[ChatbotV2] Get history error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi lấy lịch sử chat'
        });
    }
}

/**
 * Xóa cuộc hội thoại
 * 
 * DELETE /api/chatbot-v2/conversation/:session_id
 */
export async function clearConversation(req, res) {
    try {
        const { session_id } = req.params;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu session_id'
            });
        }

        const result = await assistantService.clearConversation(session_id);

        res.status(200).json({
            success: true,
            message: result.success ? 'Đã xóa cuộc hội thoại' : 'Không có cuộc hội thoại để xóa'
        });

    } catch (error) {
        console.error('[ChatbotV2] Clear conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi xóa cuộc hội thoại'
        });
    }
}

/**
 * Tạo thread mới
 * 
 * POST /api/chatbot-v2/thread
 * Body: { session_id?: string }
 */
export async function createThread(req, res) {
    try {
        const { session_id } = req.body;

        const result = await threadService.createThread(session_id);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || 'Không thể tạo thread mới'
            });
        }

        res.status(201).json({
            success: true,
            data: {
                thread_id: result.thread_id,
                session_id: result.session_id
            }
        });

    } catch (error) {
        console.error('[ChatbotV2] Create thread error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi tạo thread'
        });
    }
}

/**
 * Health check endpoint
 * 
 * GET /api/chatbot-v2/health
 */
export async function healthCheck(req, res) {
    try {
        // Import openai để check connection
        const openai = (await import('../config/openaiClient.js')).default;
        const { ASSISTANT_ID } = await import('../config/openaiAssistant.js');

        // Check OpenAI connection
        await openai.models.list();

        // Check Assistant exists
        const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);

        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                assistant: {
                    id: assistant.id,
                    name: assistant.name,
                    model: assistant.model
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[ChatbotV2] Health check failed:', error);
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format response từ Assistant service cho frontend
 * 
 * @param {Object} result - Response từ assistant.service
 * @returns {Object} Formatted response cho frontend
 */
function formatResponseForFrontend(result) {
    const { message, function_calls, thread_id, run_id } = result;

    // Nếu không có function calls, trả về text đơn giản
    if (!function_calls || function_calls.length === 0) {
        return {
            response_type: 'text',
            text: message,
            thread_id,
            run_id
        };
    }

    // Parse function results để tạo rich content
    const contents = [];
    let menuItems = [];
    let recommendations = [];

    // Xử lý function calls results
    for (const call of function_calls) {
        if (!call.result?.success) continue;

        const data = call.result.data;

        switch (call.name) {
            case 'get_menu':
                if (Array.isArray(data) && data.length > 0) {
                    menuItems = [...menuItems, ...data];
                }
                break;

            case 'get_recommendations':
                if (Array.isArray(data) && data.length > 0) {
                    recommendations = [...recommendations, ...data];
                }
                break;

            case 'get_categories':
                // Categories được Assistant format trong message
                break;
        }
    }

    // Add text content first
    if (message) {
        contents.push({
            type: 'text',
            value: formatMessageText(message)
        });
    }

    // Add recommendations as menu_items (có reason)
    if (recommendations.length > 0) {
        contents.push({
            type: 'menu_items',
            items: recommendations.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image_url: item.image_url || '/assets/images/default-food.png',
                reason: item.recommendation_reason || item.reason || ''
            }))
        });
    }

    // Add menu items as mentioned_items (không có reason)
    if (menuItems.length > 0 && recommendations.length === 0) {
        contents.push({
            type: 'mentioned_items',
            items: menuItems.slice(0, 5).map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image_url: item.image_url || '/assets/images/default-food.png'
            }))
        });
    }

    return {
        response_type: contents.length > 1 ? 'rich_content' : 'text',
        contents: contents,
        text: message, // Fallback
        thread_id,
        run_id
    };
}

/**
 * Format message text - convert markdown to HTML-friendly format
 */
function formatMessageText(text) {
    if (!text) return '';

    return text
        // Bold: **text** -> <strong>text</strong>
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic: *text* -> <em>text</em>
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br/>');
}

/**
 * Get context cache statistics
 * 
 * GET /api/chatbot-v2/cache-stats
 */
export async function getCacheStats(req, res) {
    try {
        const stats = functionRouter.getCacheStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('[ChatbotV2] Get cache stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi lấy cache stats'
        });
    }
}

/**
 * Clear cache for a specific thread
 * 
 * DELETE /api/chatbot-v2/cache/:thread_id
 */
export async function clearThreadCache(req, res) {
    try {
        const { thread_id } = req.params;

        if (!thread_id) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thread_id'
            });
        }

        // Import context-cache service
        const contextCache = await import('../services/chatbotV2/context-cache.service.js');
        const cleared = contextCache.clearThreadCache(thread_id);

        res.status(200).json({
            success: true,
            message: cleared ? 'Đã xóa cache cho thread' : 'Không tìm thấy cache cho thread này'
        });
    } catch (error) {
        console.error('[ChatbotV2] Clear thread cache error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi xóa cache'
        });
    }
}

export default {
    chat,
    getChatHistory,
    clearConversation,
    createThread,
    healthCheck,
    getCacheStats,
    clearThreadCache
};
