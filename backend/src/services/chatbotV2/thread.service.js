/**
 * Thread Management Service for OpenAI Assistants API
 * 
 * Quản lý OpenAI Threads - mapping với sessions
 * - Nếu session_id là số (QR session) -> lưu vào DB
 * - Nếu session_id là string (browser session) -> dùng in-memory cache
 * 
 * @module services/chatbotV2/thread.service
 */

import openai from '../../config/openaiClient.js';
import { query } from '../../config/db.js';
import { ASSISTANT_RUNTIME_CONFIG } from '../../config/openaiAssistant.js';

const { debug } = ASSISTANT_RUNTIME_CONFIG;

// In-memory cache for browser sessions (string session IDs)
// Format: { sessionId: { threadId, assistantId, createdAt, messageCount } }
const browserSessionThreads = new Map();

/**
 * Check if session ID is a QR session (numeric) or browser session (string)
 */
function isQRSession(sessionId) {
    return !isNaN(Number(sessionId)) && Number.isInteger(Number(sessionId)) && Number(sessionId) > 0;
}

/**
 * Tạo thread mới trên OpenAI
 * 
 * @param {string|number} sessionId - Session ID
 * @param {string} assistantId - ID của Assistant
 * @returns {Promise<Object>} Thread info với openai_thread_id
 */
export async function createThread(sessionId, assistantId) {
    try {
        // Tạo thread mới trên OpenAI
        const thread = await openai.beta.threads.create({
            metadata: {
                session_id: String(sessionId),
                created_at: new Date().toISOString()
            }
        });

        if (debug) {
            console.log(`[Thread] Created new thread: ${thread.id} for session: ${sessionId}`);
        }

        // Lưu vào DB nếu là QR session, hoặc vào memory nếu là browser session
        if (isQRSession(sessionId)) {
            await query(`
                INSERT INTO chat_threads (qr_session_id, openai_thread_id, assistant_id, status)
                VALUES (?, ?, ?, 'ACTIVE')
            `, [Number(sessionId), thread.id, assistantId]);
        } else {
            // Browser session - lưu vào memory
            browserSessionThreads.set(sessionId, {
                threadId: thread.id,
                assistantId,
                createdAt: new Date(),
                messageCount: 0
            });
        }

        return {
            id: thread.id,
            sessionId,
            assistantId,
            status: 'ACTIVE',
            createdAt: new Date(),
            success: true
        };
    } catch (error) {
        console.error('[Thread] Error creating thread:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lấy thread đang active của một session
 * 
 * @param {string|number} sessionId - Session ID
 * @returns {Promise<Object|null>} Thread info hoặc null nếu không tìm thấy
 */
export async function getThread(sessionId) {
    try {
        // Browser session - check memory
        if (!isQRSession(sessionId)) {
            const cached = browserSessionThreads.get(sessionId);
            if (cached) {
                return {
                    id: cached.threadId,
                    sessionId,
                    assistantId: cached.assistantId,
                    status: 'ACTIVE',
                    messageCount: cached.messageCount,
                    createdAt: cached.createdAt
                };
            }
            return null;
        }

        // QR session - check DB
        const [thread] = await query(`
            SELECT id, qr_session_id, openai_thread_id, assistant_id, status, message_count, created_at
            FROM chat_threads
            WHERE qr_session_id = ? AND status = 'ACTIVE'
            ORDER BY created_at DESC
            LIMIT 1
        `, [Number(sessionId)]);

        if (!thread) {
            if (debug) {
                console.log(`[Thread] No active thread found for session: ${sessionId}`);
            }
            return null;
        }

        return {
            id: thread.openai_thread_id,
            dbId: thread.id,
            sessionId: thread.qr_session_id,
            assistantId: thread.assistant_id,
            status: thread.status,
            messageCount: thread.message_count,
            createdAt: thread.created_at
        };
    } catch (error) {
        console.error('[Thread] Error getting thread:', error);
        return null;
    }
}

/**
 * Lấy hoặc tạo thread cho một session
 * Nếu đã có thread active thì trả về, nếu không thì tạo mới
 * 
 * @param {string|number} sessionId - Session ID
 * @param {string} assistantId - ID của Assistant
 * @returns {Promise<Object>} Thread info
 */
export async function getOrCreateThread(sessionId, assistantId) {
    // Kiểm tra thread đã tồn tại chưa
    const existingThread = await getThread(sessionId);

    if (existingThread) {
        if (debug) {
            console.log(`[Thread] Found existing thread: ${existingThread.id} for session: ${sessionId}`);
        }
        return existingThread;
    }

    // Tạo thread mới
    return await createThread(sessionId, assistantId);
}

/**
 * Archive thread (đánh dấu không còn active)
 * 
 * @param {string|number} sessionId - Session ID
 * @returns {Promise<Object>} Result
 */
export async function archiveThread(sessionId) {
    try {
        // Browser session - xóa khỏi memory
        if (!isQRSession(sessionId)) {
            const existed = browserSessionThreads.delete(sessionId);
            return { success: true, archived: existed };
        }

        // QR session - update DB
        const result = await query(`
            UPDATE chat_threads 
            SET status = 'ARCHIVED', updated_at = NOW()
            WHERE qr_session_id = ? AND status = 'ACTIVE'
        `, [Number(sessionId)]);

        if (debug) {
            console.log(`[Thread] Archived threads for session: ${sessionId}, affected: ${result.affectedRows}`);
        }

        return { success: true, archived: result.affectedRows > 0 };
    } catch (error) {
        console.error('[Thread] Error archiving thread:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Xóa thread trên OpenAI và DB
 * 
 * @param {string} threadId - OpenAI Thread ID
 * @returns {Promise<boolean>} True nếu thành công
 */
export async function deleteThread(threadId) {
    try {
        // Xóa trên OpenAI
        await openai.beta.threads.del(threadId);

        // Xóa trong DB
        await query(`
      DELETE FROM chat_threads WHERE openai_thread_id = ?
    `, [threadId]);

        if (debug) {
            console.log(`[Thread] Deleted thread: ${threadId}`);
        }

        return true;
    } catch (error) {
        console.error('[Thread] Error deleting thread:', error);
        throw error;
    }
}

/**
 * Tăng message count cho thread
 * 
 * @param {string} threadId - OpenAI Thread ID
 * @param {number} increment - Số lượng tăng (default: 1)
 * @returns {Promise<void>}
 */
export async function incrementMessageCount(threadId, increment = 1) {
    try {
        // Update in memory cache if browser session
        for (const [sessionId, data] of browserSessionThreads.entries()) {
            if (data.threadId === threadId) {
                data.messageCount += increment;
                return;
            }
        }

        // Update in DB for QR sessions
        await query(`
            UPDATE chat_threads 
            SET message_count = message_count + ?, updated_at = NOW()
            WHERE openai_thread_id = ?
        `, [increment, threadId]);
    } catch (error) {
        console.error('[Thread] Error incrementing message count:', error);
        // Non-critical, don't throw
    }
}

/**
 * Lấy tất cả threads của một session (bao gồm cả archived)
 * 
 * @param {number} qrSessionId - ID của QR session
 * @returns {Promise<Array>} Danh sách threads
 */
export async function getAllThreadsForSession(qrSessionId) {
    try {
        const threads = await query(`
      SELECT id, openai_thread_id, assistant_id, status, message_count, created_at, updated_at
      FROM chat_threads
      WHERE qr_session_id = ?
      ORDER BY created_at DESC
    `, [qrSessionId]);

        return threads.map(t => ({
            id: t.openai_thread_id,
            dbId: t.id,
            assistantId: t.assistant_id,
            status: t.status,
            messageCount: t.message_count,
            createdAt: t.created_at,
            updatedAt: t.updated_at
        }));
    } catch (error) {
        console.error('[Thread] Error getting all threads:', error);
        throw error;
    }
}

export default {
    createThread,
    getThread,
    getOrCreateThread,
    archiveThread,
    deleteThread,
    incrementMessageCount,
    getAllThreadsForSession
};
