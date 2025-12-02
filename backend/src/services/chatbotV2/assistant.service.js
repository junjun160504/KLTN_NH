/**
 * Assistant Service - Main Chatbot V2 Service
 * 
 * Service chính xử lý chat với OpenAI Assistants API
 * Quản lý luồng: message -> thread -> run -> response
 * 
 * Tối ưu token usage:
 * - Cache function results per thread
 * - Inject context summary để AI biết data đã có
 * 
 * @module services/chatbotV2/assistant.service
 */

import openai from '../../config/openaiClient.js';
import {
    ASSISTANT_ID,
    ASSISTANT_RUNTIME_CONFIG,
    ASSISTANT_CREATE_CONFIG,
    ASSISTANT_TOOLS
} from '../../config/openaiAssistant.js';
import * as threadService from './thread.service.js';
import * as functionRouter from './function-router.service.js';
import * as contextCache from './context-cache.service.js';

const { runTimeout, pollInterval, debug } = ASSISTANT_RUNTIME_CONFIG;

// ============================================
// DEBUG LOGGING UTILITIES
// ============================================

/**
 * Estimate tokens for a string (rough approximation)
 * Vietnamese text: ~1.5-2 tokens per character
 * English text: ~0.25-0.5 tokens per word
 */
function estimateTokens(text) {
    if (!text) return 0;
    // Simple estimation: 1 token per 4 characters for mixed content
    return Math.ceil(text.length / 4);
}

/**
 * Log detailed debug info for a chat request
 */
function logChatDebugInfo(info) {
    const separator = '═'.repeat(60);
    console.log(`\n${separator}`);
    console.log(`🔍 CHATBOT V2 DEBUG - ${new Date().toISOString()}`);
    console.log(separator);

    // Thread info
    console.log(`\n📌 THREAD INFO:`);
    console.log(`   Thread ID: ${info.threadId}`);
    console.log(`   Session ID: ${info.sessionId}`);
    console.log(`   Assistant ID: ${info.assistantId}`);

    // Message info
    console.log(`\n💬 MESSAGE:`);
    console.log(`   User message: "${info.userMessage}"`);
    console.log(`   Message length: ${info.userMessage?.length || 0} chars`);
    console.log(`   Est. tokens (message): ~${estimateTokens(info.userMessage)}`);

    // Context info
    if (info.additionalInstructions) {
        console.log(`\n📝 ADDITIONAL INSTRUCTIONS:`);
        console.log(`   ${info.additionalInstructions}`);
        console.log(`   Est. tokens (instructions): ~${estimateTokens(info.additionalInstructions)}`);
    }

    // Thread history
    if (info.threadMessages) {
        console.log(`\n📜 THREAD HISTORY:`);
        console.log(`   Total messages in thread: ${info.threadMessages.length}`);
        let totalHistoryTokens = 0;
        info.threadMessages.forEach((msg, i) => {
            const contentLength = msg.content?.[0]?.text?.value?.length || 0;
            const tokens = estimateTokens(msg.content?.[0]?.text?.value || '');
            totalHistoryTokens += tokens;
            console.log(`   [${i + 1}] ${msg.role}: ${contentLength} chars (~${tokens} tokens)`);
        });
        console.log(`   Total history tokens: ~${totalHistoryTokens}`);
    }

    // Cache info
    if (info.contextSummary && info.contextSummary.length > 0) {
        console.log(`\n💾 CACHE STATUS:`);
        info.contextSummary.forEach(s => console.log(`   ✓ ${s}`));
    }

    console.log(`\n${separator}\n`);
}

/**
 * Log run completion details with token usage
 */
function logRunCompletion(info) {
    const separator = '─'.repeat(60);
    console.log(`\n${separator}`);
    console.log(`✅ RUN COMPLETED - ${info.runId}`);
    console.log(separator);

    // Token usage from OpenAI
    if (info.usage) {
        console.log(`\n📊 TOKEN USAGE (from OpenAI):`);
        console.log(`   Prompt tokens: ${info.usage.prompt_tokens || 'N/A'}`);
        console.log(`   Completion tokens: ${info.usage.completion_tokens || 'N/A'}`);
        console.log(`   Total tokens: ${info.usage.total_tokens || 'N/A'}`);
    }

    // Function calls
    if (info.functionCalls && info.functionCalls.length > 0) {
        console.log(`\n🔧 FUNCTION CALLS:`);
        info.functionCalls.forEach((fc, i) => {
            const resultSize = JSON.stringify(fc.result || {}).length;
            console.log(`   [${i + 1}] ${fc.name}`);
            console.log(`       Args: ${JSON.stringify(fc.arguments)}`);
            console.log(`       Result size: ${resultSize} chars (~${estimateTokens(JSON.stringify(fc.result))} tokens)`);
            console.log(`       From cache: ${fc.fromCache ? '✓ YES' : '✗ NO'}`);
            console.log(`       Execution time: ${fc.executionTime}ms`);
        });
    }

    // Cache stats
    if (info.cacheStats) {
        console.log(`\n💾 CACHE STATS:`);
        console.log(`   Hits: ${info.cacheStats.hits}`);
        console.log(`   Misses: ${info.cacheStats.misses}`);
    }

    // Response info
    if (info.responseContent) {
        console.log(`\n📤 RESPONSE:`);
        console.log(`   Length: ${info.responseContent.length} chars`);
        console.log(`   Est. tokens: ~${estimateTokens(info.responseContent)}`);
    }

    // Timing
    console.log(`\n⏱️ TIMING:`);
    console.log(`   Total response time: ${info.totalTime}ms`);

    console.log(`\n${separator}\n`);
}

// ============================================
// ASSISTANT MANAGEMENT
// ============================================

/**
 * Lấy hoặc tạo Assistant
 * Nếu ASSISTANT_ID đã được cấu hình thì dùng, nếu không thì tạo mới
 * 
 * @returns {Promise<string>} Assistant ID
 */
export async function getOrCreateAssistant() {
    // Nếu đã có Assistant ID trong env
    if (ASSISTANT_ID) {
        try {
            // Verify assistant vẫn tồn tại
            await openai.beta.assistants.retrieve(ASSISTANT_ID);
            if (debug) {
                console.log(`[Assistant] Using existing assistant: ${ASSISTANT_ID}`);
            }
            return ASSISTANT_ID;
        } catch (error) {
            console.warn(`[Assistant] Configured assistant ${ASSISTANT_ID} not found, creating new one`);
        }
    }

    // Tạo assistant mới
    const assistant = await openai.beta.assistants.create(ASSISTANT_CREATE_CONFIG);

    console.log(`[Assistant] Created new assistant: ${assistant.id}`);
    console.log(`[Assistant] ⚠️ Add this to your .env file: OPENAI_ASSISTANT_ID=${assistant.id}`);

    return assistant.id;
}

/**
 * Update Assistant configuration
 * 
 * @param {string} assistantId - Assistant ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated assistant
 */
export async function updateAssistant(assistantId, updates) {
    try {
        const assistant = await openai.beta.assistants.update(assistantId, updates);
        if (debug) {
            console.log(`[Assistant] Updated assistant: ${assistantId}`);
        }
        return assistant;
    } catch (error) {
        console.error('[Assistant] Error updating assistant:', error);
        throw error;
    }
}

// ============================================
// MESSAGE HANDLING
// ============================================

// Store function call results during a run (reset per chat call)
let currentRunFunctionCalls = [];

/**
 * Gửi tin nhắn và nhận response từ Assistant
 * Đây là hàm chính để xử lý chat
 * 
 * @param {string} message - Tin nhắn từ user
 * @param {string|number} sessionId - ID của session (QR session hoặc custom)
 * @param {Object} [options] - Các options bổ sung
 * @returns {Promise<Object>} Response từ Assistant
 */
export async function chat(message, sessionId, options = {}) {
    const startTime = Date.now();

    // Reset function calls for this chat
    currentRunFunctionCalls = [];

    try {
        // 1. Lấy hoặc tạo Assistant
        const assistantId = await getOrCreateAssistant();


        // 2. Lấy hoặc tạo Thread cho session này
        const thread = await threadService.getOrCreateThread(sessionId, assistantId);

        // 3. Set current thread for function router cache
        functionRouter.setCurrentThread(thread.id);

        // 4. Get context summary for optimization
        const contextSummary = contextCache.getContextSummary(thread.id);
        let additionalInstructions = '';

        if (contextSummary.length > 0) {
            additionalInstructions = `\n[Ngữ cảnh đã có: Bạn có thể sử dụng dữ liệu đã lưu thay vì gọi function nếu không cần dữ liệu mới.]`;
        }

        // 5. Get thread messages for debug logging (before adding new message)
        let threadMessages = [];
        try {
            const existingMessages = await openai.beta.threads.messages.list(thread.id, {
                limit: 50,
                order: 'asc'
            });
            threadMessages = existingMessages.data;
        } catch (e) {
            console.warn('[Assistant] Could not fetch thread history for debug:', e.message);
        }

        // 🔍 DEBUG LOG - Before sending
        logChatDebugInfo({
            threadId: thread.id,
            sessionId: sessionId,
            assistantId: assistantId,
            userMessage: message,
            additionalInstructions: additionalInstructions,
            threadMessages: threadMessages,
            contextSummary: contextSummary
        });

        // 6. Thêm message của user vào thread
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: message
        });

        // 7. Tạo và chạy Run với additional_instructions nếu có context
        const runOptions = {
            assistant_id: assistantId,
        };

        // Inject context hint via additional_instructions
        if (additionalInstructions) {
            runOptions.additional_instructions = additionalInstructions;
        }

        const run = await openai.beta.threads.runs.create(thread.id, runOptions);
        console.log(`[Assistant] 🚀 Run started: ${run.id}`);

        // 8. Chờ Run hoàn thành (bao gồm xử lý function calls)
        const completedRun = await waitForRunCompletion(thread.id, run.id);

        // 9. Lấy response message
        const response = await getAssistantResponse(thread.id);

        // 10. Update message count
        await threadService.incrementMessageCount(thread.id, 2); // user + assistant

        const totalTime = Date.now() - startTime;

        // Calculate cache stats
        const cacheHits = currentRunFunctionCalls.filter(f => f.fromCache).length;
        const cacheMisses = currentRunFunctionCalls.filter(f => !f.fromCache).length;

        // 🔍 DEBUG LOG - After completion
        logRunCompletion({
            runId: completedRun.id,
            usage: completedRun.usage,
            functionCalls: currentRunFunctionCalls,
            cacheStats: { hits: cacheHits, misses: cacheMisses },
            responseContent: response.content,
            totalTime: totalTime
        });

        return {
            success: true,
            message: response.content,
            thread_id: thread.id,
            run_id: completedRun.id,
            function_calls: currentRunFunctionCalls,
            usage: completedRun.usage,
            responseTime: totalTime,
            cacheStats: {
                hits: cacheHits,
                misses: cacheMisses
            }
        };

    } catch (error) {
        console.error('[Assistant] Chat error:', error);

        return {
            success: false,
            error: error.message,
            message: 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại!',
            function_calls: currentRunFunctionCalls,
            responseTime: Date.now() - startTime
        };
    }
}

/**
 * Chờ Run hoàn thành, xử lý function calls nếu có
 * 
 * @param {string} threadId - Thread ID
 * @param {string} runId - Run ID
 * @returns {Promise<Object>} Completed run
 */
async function waitForRunCompletion(threadId, runId) {
    const startTime = Date.now();

    while (true) {
        // Check timeout
        if (Date.now() - startTime > runTimeout) {
            throw new Error('Run timeout exceeded');
        }

        // Get current run status - SDK v5: retrieve(runId, { thread_id })
        const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });

        if (debug) {
            console.log(`[Assistant] Run status: ${run.status}`);
        }

        switch (run.status) {
            case 'completed':
                return run;

            case 'requires_action':
                // Xử lý function calls
                await handleRequiredAction(threadId, runId, run.required_action);
                break;

            case 'failed':
                throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);

            case 'cancelled':
                throw new Error('Run was cancelled');

            case 'expired':
                throw new Error('Run expired');

            case 'queued':
            case 'in_progress':
                // Chờ và poll lại
                await sleep(pollInterval);
                break;

            default:
                await sleep(pollInterval);
        }
    }
}

/**
 * Xử lý required_action (function calls)
 * 
 * @param {string} threadId - Thread ID
 * @param {string} runId - Run ID
 * @param {Object} requiredAction - Required action object
 */
async function handleRequiredAction(threadId, runId, requiredAction) {
    if (requiredAction.type !== 'submit_tool_outputs') {
        throw new Error(`Unknown required action type: ${requiredAction.type}`);
    }

    const toolCalls = requiredAction.submit_tool_outputs.tool_calls;

    if (debug) {
        console.log(`[Assistant] Processing ${toolCalls.length} tool calls`);
    }

    // Process all tool calls (with cache support)
    const { toolOutputs, results } = await functionRouter.processToolCallsWithCache(toolCalls);

    // Store function call results for response (with cache info)
    for (let i = 0; i < toolCalls.length; i++) {
        const call = toolCalls[i];
        const resultInfo = results[i];

        currentRunFunctionCalls.push({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments || '{}'),
            result: resultInfo.data,
            fromCache: resultInfo.fromCache || false,
            executionTime: resultInfo.executionTime || 0
        });
    }

    // Submit tool outputs back to the run - SDK v5: submitToolOutputs(runId, { thread_id, tool_outputs })
    await openai.beta.threads.runs.submitToolOutputs(runId, {
        thread_id: threadId,
        tool_outputs: toolOutputs
    });

    if (debug) {
        console.log(`[Assistant] Submitted ${toolOutputs.length} tool outputs`);
    }
}

/**
 * Lấy response message mới nhất từ Assistant
 * 
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object>} Message object
 */
async function getAssistantResponse(threadId) {
    const messages = await openai.beta.threads.messages.list(threadId, {
        limit: 1,
        order: 'desc'
    });

    if (!messages.data.length) {
        throw new Error('No response message found');
    }

    const message = messages.data[0];

    // Extract text content
    let content = '';
    for (const block of message.content) {
        if (block.type === 'text') {
            content += block.text.value;
        }
    }

    return {
        id: message.id,
        role: message.role,
        content: content,
        createdAt: new Date(message.created_at * 1000)
    };
}

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

/**
 * Lấy lịch sử chat của một session
 * 
 * @param {number} qrSessionId - QR Session ID
 * @param {number} [limit=20] - Số lượng messages tối đa
 * @returns {Promise<Array>} Danh sách messages
 */
export async function getChatHistory(qrSessionId, limit = 20) {
    try {
        const thread = await threadService.getThread(qrSessionId);

        if (!thread) {
            return [];
        }

        const messages = await openai.beta.threads.messages.list(thread.id, {
            limit: limit,
            order: 'asc'
        });

        return messages.data.map(msg => {
            let content = '';
            for (const block of msg.content) {
                if (block.type === 'text') {
                    content += block.text.value;
                }
            }

            return {
                id: msg.id,
                role: msg.role,
                content: content,
                createdAt: new Date(msg.created_at * 1000)
            };
        });

    } catch (error) {
        console.error('[Assistant] Error getting chat history:', error);
        return [];
    }
}

/**
 * Xóa conversation (archive thread)
 * 
 * @param {number} qrSessionId - QR Session ID
 * @returns {Promise<boolean>} True nếu thành công
 */
export async function clearConversation(qrSessionId) {
    try {
        return await threadService.archiveThread(qrSessionId);
    } catch (error) {
        console.error('[Assistant] Error clearing conversation:', error);
        return false;
    }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Sleep helper
 * @param {number} ms - Milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Health check cho Assistant service
 * 
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
    try {
        const assistantId = ASSISTANT_ID || 'not_configured';
        let assistantStatus = 'unknown';

        if (ASSISTANT_ID) {
            try {
                await openai.beta.assistants.retrieve(ASSISTANT_ID);
                assistantStatus = 'ok';
            } catch {
                assistantStatus = 'not_found';
            }
        } else {
            assistantStatus = 'not_configured';
        }

        return {
            service: 'chatbotV2',
            status: assistantStatus === 'ok' ? 'healthy' : 'degraded',
            assistantId,
            assistantStatus,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            service: 'chatbotV2',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// ============================================
// EXPORTS
// ============================================

export default {
    getOrCreateAssistant,
    updateAssistant,
    chat,
    getChatHistory,
    clearConversation,
    healthCheck
};
