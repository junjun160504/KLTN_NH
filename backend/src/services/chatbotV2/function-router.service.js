/**
 * Function Router Service
 * 
 * Router để dispatch function calls từ OpenAI Assistant
 * Khi Assistant yêu cầu gọi function, router sẽ điều hướng
 * đến function tương ứng và trả về kết quả
 * 
 * Tích hợp caching để tránh gọi function lặp lại, giảm token usage
 * 
 * @module services/chatbotV2/function-router.service
 */

import * as chatbotFunctions from './chatbot-functions.service.js';
import { FUNCTION_DESCRIPTIONS, ASSISTANT_RUNTIME_CONFIG } from '../../config/openaiAssistant.js';
import * as contextCache from './context-cache.service.js';

const { debug, maxFunctionRetries } = ASSISTANT_RUNTIME_CONFIG;

// Current thread ID for caching (set per chat call)
let currentThreadId = null;

/**
 * Set current thread ID for cache operations
 * @param {string} threadId - Thread ID
 */
export function setCurrentThread(threadId) {
    currentThreadId = threadId;
    if (debug) {
        console.log(`[FunctionRouter] Set current thread: ${threadId}`);
    }
}

/**
 * Get current thread ID
 * @returns {string|null} Thread ID
 */
export function getCurrentThread() {
    return currentThreadId;
}

/**
 * Map function name với implementation
 */
const functionMap = {
    'get_menu': chatbotFunctions.getMenu,
    'get_categories': chatbotFunctions.getCategories,
    'get_recommendations': chatbotFunctions.getRecommendations,
};

/**
 * Map function name với cache getter/setter
 */
const cacheMap = {
    'get_menu': {
        get: () => currentThreadId ? contextCache.getCachedMenu(currentThreadId) : null,
        set: (data) => currentThreadId && contextCache.setCachedMenu(currentThreadId, data),
        description: 'menu items'
    },
    'get_categories': {
        get: () => currentThreadId ? contextCache.getCachedCategories(currentThreadId) : null,
        set: (data) => currentThreadId && contextCache.setCachedCategories(currentThreadId, data),
        description: 'categories'
    },
    'get_recommendations': {
        get: () => currentThreadId ? contextCache.getCachedRecommendations(currentThreadId) : null,
        set: (data) => currentThreadId && contextCache.setCachedRecommendations(currentThreadId, data),
        description: 'recommendations'
    },
};

/**
 * Execute một function call từ Assistant
 * Kiểm tra cache trước, nếu có data hợp lệ thì trả về luôn
 * 
 * @param {string} functionName - Tên function cần gọi
 * @param {Object} args - Arguments cho function (đã parse từ JSON)
 * @param {boolean} [forceRefresh=false] - Force fetch mới, bỏ qua cache
 * @returns {Promise<Object>} Kết quả từ function
 * @throws {Error} Nếu function không tồn tại hoặc execution fail
 */
export async function executeFunction(functionName, args = {}, forceRefresh = false) {
    const startTime = Date.now();

    try {
        // Kiểm tra function có tồn tại không
        const fn = functionMap[functionName];

        if (!fn) {
            const error = new Error(`Unknown function: ${functionName}`);
            error.code = 'UNKNOWN_FUNCTION';
            throw error;
        }

        // Check cache first (nếu không force refresh)
        const cacheConfig = cacheMap[functionName];
        if (cacheConfig && !forceRefresh) {
            const cachedData = cacheConfig.get();
            if (cachedData) {
                const executionTime = Date.now() - startTime;
                if (debug) {
                    console.log(`[FunctionRouter] CACHE HIT for ${functionName} (${executionTime}ms)`);
                }
                return {
                    success: true,
                    data: cachedData,
                    executionTime,
                    fromCache: true
                };
            }
        }

        if (debug) {
            console.log(`[FunctionRouter] Executing: ${functionName} (cache miss)`);
            console.log(`[FunctionRouter] Args:`, JSON.stringify(args));
        }

        // Execute function
        const result = await fn(args);

        const executionTime = Date.now() - startTime;

        // Cache result
        if (cacheConfig && result) {
            cacheConfig.set(result);
            if (debug) {
                console.log(`[FunctionRouter] Cached ${cacheConfig.description}`);
            }
        }

        if (debug) {
            console.log(`[FunctionRouter] ${functionName} completed in ${executionTime}ms`);
        }

        return {
            success: true,
            data: result,
            executionTime,
            fromCache: false
        };

    } catch (error) {
        const executionTime = Date.now() - startTime;

        console.error(`[FunctionRouter] Error executing ${functionName}:`, error.message);

        return {
            success: false,
            error: error.message,
            code: error.code || 'EXECUTION_ERROR',
            executionTime
        };
    }
}

/**
 * Execute function với retry mechanism
 * 
 * @param {string} functionName - Tên function
 * @param {Object} args - Arguments
 * @param {number} [retries=maxFunctionRetries] - Số lần retry
 * @returns {Promise<Object>} Kết quả
 */
export async function executeFunctionWithRetry(functionName, args = {}, retries = maxFunctionRetries) {
    let lastError;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        const result = await executeFunction(functionName, args);

        if (result.success) {
            return result;
        }

        lastError = result;

        if (attempt <= retries) {
            if (debug) {
                console.log(`[FunctionRouter] Retry ${attempt}/${retries} for ${functionName}`);
            }
            // Wait một chút trước khi retry
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }

    return lastError;
}

/**
 * Process multiple tool calls từ Assistant Run
 * 
 * @param {Array} toolCalls - Array of tool calls từ run.required_action
 * @returns {Promise<Array>} Array of tool outputs để submit
 */
export async function processToolCalls(toolCalls) {
    if (!toolCalls || !Array.isArray(toolCalls)) {
        return [];
    }

    const toolOutputs = [];

    for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') {
            continue;
        }

        const functionName = toolCall.function.name;
        let args = {};

        // Parse arguments từ JSON string
        try {
            args = JSON.parse(toolCall.function.arguments || '{}');
        } catch (parseError) {
            console.error(`[FunctionRouter] Failed to parse args for ${functionName}:`, parseError);
            args = {};
        }

        // Execute function
        const result = await executeFunctionWithRetry(functionName, args);

        // Format output cho OpenAI
        let output;
        if (result.success) {
            output = JSON.stringify(result.data);
        } else {
            output = JSON.stringify({
                error: true,
                message: result.error || 'Function execution failed'
            });
        }

        toolOutputs.push({
            tool_call_id: toolCall.id,
            output: output
        });
    }

    return toolOutputs;
}

/**
 * Process multiple tool calls với cache support
 * Trả về cả toolOutputs và results để biết cache hit/miss
 * 
 * @param {Array} toolCalls - Array of tool calls từ run.required_action
 * @returns {Promise<Object>} { toolOutputs: Array, results: Array }
 */
export async function processToolCallsWithCache(toolCalls) {
    if (!toolCalls || !Array.isArray(toolCalls)) {
        return { toolOutputs: [], results: [] };
    }

    const toolOutputs = [];
    const results = [];

    for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') {
            continue;
        }

        const functionName = toolCall.function.name;
        let args = {};

        // Parse arguments từ JSON string
        try {
            args = JSON.parse(toolCall.function.arguments || '{}');
        } catch (parseError) {
            console.error(`[FunctionRouter] Failed to parse args for ${functionName}:`, parseError);
            args = {};
        }

        // Execute function (với cache check bên trong)
        const result = await executeFunctionWithRetry(functionName, args);

        // Store result info
        results.push({
            data: result.success ? result.data : { error: true, message: result.error },
            fromCache: result.fromCache || false,
            executionTime: result.executionTime || 0,
            success: result.success
        });

        // Format output cho OpenAI
        let output;
        if (result.success) {
            output = JSON.stringify(result.data);
        } else {
            output = JSON.stringify({
                error: true,
                message: result.error || 'Function execution failed'
            });
        }

        toolOutputs.push({
            tool_call_id: toolCall.id,
            output: output
        });
    }

    return { toolOutputs, results };
}

/**
 * Validate function name
 * 
 * @param {string} functionName - Tên function
 * @returns {boolean} True nếu function hợp lệ
 */
export function isValidFunction(functionName) {
    return functionName in functionMap;
}

/**
 * Lấy danh sách tất cả functions có sẵn
 * 
 * @returns {Array<Object>} Danh sách functions với description
 */
export function getAvailableFunctions() {
    return Object.keys(functionMap).map(name => ({
        name,
        description: FUNCTION_DESCRIPTIONS[name] || name
    }));
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
    return contextCache.getCacheStats();
}

/**
 * Clear cache for current thread
 */
export function clearCurrentThreadCache() {
    if (currentThreadId) {
        contextCache.clearThreadCache(currentThreadId);
    }
}

// ============================================
// EXPORTS
// ============================================

export default {
    executeFunction,
    executeFunctionWithRetry,
    processToolCalls,
    processToolCallsWithCache,
    isValidFunction,
    getAvailableFunctions,
    setCurrentThread,
    getCurrentThread,
    getCacheStats,
    clearCurrentThreadCache
};
