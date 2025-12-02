/**
 * Token Rate Limiter Middleware
 * Giới hạn token usage cho OpenAI Assistant API
 * Limit: 80,000 TPM (tokens per minute) - để buffer 20k cho quota 100k
 */

// Token tracking store
const tokenStore = {
    tokens: [],           // Array of { timestamp, count }
    windowMs: 60 * 1000,  // 1 minute window
    maxTokens: 80000,     // 80k TPM limit (buffer 20k from 100k quota)
};

/**
 * Ước tính số token từ message
 * Rule of thumb: ~4 characters = 1 token (cho tiếng Việt có thể cao hơn)
 */
export const estimateTokens = (text) => {
    if (!text) return 0;
    // Tiếng Việt thường cần nhiều token hơn tiếng Anh
    // Ước tính: 1 token ≈ 3 ký tự cho tiếng Việt
    return Math.ceil(text.length / 3);
};

/**
 * Ước tính token cho một request chatbot
 * Bao gồm: input message + context + estimated response
 */
export const estimateRequestTokens = (message, history = []) => {
    let totalTokens = 0;

    // Input message
    totalTokens += estimateTokens(message);

    // History context (nếu có)
    if (history && history.length > 0) {
        history.forEach(msg => {
            totalTokens += estimateTokens(msg.content || msg.text || '');
        });
    }

    // System prompt overhead (khoảng 500 tokens)
    totalTokens += 500;

    // Estimated response (trung bình 300-500 tokens)
    totalTokens += 400;

    // Function calling overhead
    totalTokens += 200;

    return totalTokens;
};

/**
 * Clean up expired tokens from the window
 */
const cleanupExpiredTokens = () => {
    const now = Date.now();
    const windowStart = now - tokenStore.windowMs;

    // Remove tokens outside the window
    tokenStore.tokens = tokenStore.tokens.filter(t => t.timestamp > windowStart);
};

/**
 * Get current token usage in the window
 */
export const getCurrentUsage = () => {
    cleanupExpiredTokens();
    return tokenStore.tokens.reduce((sum, t) => sum + t.count, 0);
};

/**
 * Get remaining tokens available
 */
export const getRemainingTokens = () => {
    return Math.max(0, tokenStore.maxTokens - getCurrentUsage());
};

/**
 * Check if we can process a request with estimated tokens
 */
export const canProcessRequest = (estimatedTokens) => {
    const remaining = getRemainingTokens();
    return remaining >= estimatedTokens;
};

/**
 * Record token usage
 */
export const recordTokenUsage = (tokenCount) => {
    cleanupExpiredTokens();
    tokenStore.tokens.push({
        timestamp: Date.now(),
        count: tokenCount,
    });

    console.log(`📊 Token recorded: ${tokenCount}, Total in window: ${getCurrentUsage()}/${tokenStore.maxTokens}`);
};

/**
 * Get time until tokens are available
 */
export const getWaitTime = (requiredTokens) => {
    cleanupExpiredTokens();

    if (canProcessRequest(requiredTokens)) {
        return 0;
    }

    // Find oldest token that needs to expire
    const sortedTokens = [...tokenStore.tokens].sort((a, b) => a.timestamp - b.timestamp);
    let tokensToFree = requiredTokens - getRemainingTokens();
    let waitUntil = Date.now();

    for (const token of sortedTokens) {
        tokensToFree -= token.count;
        waitUntil = token.timestamp + tokenStore.windowMs;

        if (tokensToFree <= 0) break;
    }

    return Math.max(0, waitUntil - Date.now());
};

/**
 * Rate Limiter Middleware
 */
export const tokenRateLimiter = (req, res, next) => {
    const message = req.body?.message || '';
    const history = req.body?.history || [];

    // Estimate tokens for this request
    const estimatedTokens = estimateRequestTokens(message, history);

    // Check if we can process
    if (!canProcessRequest(estimatedTokens)) {
        const waitTime = getWaitTime(estimatedTokens);
        const waitSeconds = Math.ceil(waitTime / 1000);

        console.log(`⚠️ Rate limit reached. Current: ${getCurrentUsage()}/${tokenStore.maxTokens} TPM`);
        console.log(`⏳ Need to wait ${waitSeconds}s for ${estimatedTokens} tokens`);

        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: `Hệ thống đang bận, vui lòng thử lại sau ${waitSeconds} giây`,
            details: {
                currentUsage: getCurrentUsage(),
                maxTokens: tokenStore.maxTokens,
                estimatedTokens,
                waitTimeMs: waitTime,
                waitTimeSeconds: waitSeconds,
            }
        });
    }

    // Store estimated tokens in request for later recording
    req.estimatedTokens = estimatedTokens;

    console.log(`✅ Request allowed. Estimated: ${estimatedTokens} tokens, Available: ${getRemainingTokens()}/${tokenStore.maxTokens}`);

    next();
};

/**
 * Record actual token usage after response
 * Call this in controller after getting response from OpenAI
 */
export const recordActualUsage = (usage) => {
    if (usage && (usage.total_tokens || usage.prompt_tokens || usage.completion_tokens)) {
        const totalTokens = usage.total_tokens ||
            ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0));
        recordTokenUsage(totalTokens);
        return totalTokens;
    }
    return 0;
};

/**
 * Get rate limit status
 */
export const getRateLimitStatus = () => {
    cleanupExpiredTokens();
    const currentUsage = getCurrentUsage();
    const remaining = getRemainingTokens();
    const percentage = Math.round((currentUsage / tokenStore.maxTokens) * 100);

    return {
        currentUsage,
        maxTokens: tokenStore.maxTokens,
        remaining,
        usagePercentage: percentage,
        windowMs: tokenStore.windowMs,
        requestsInWindow: tokenStore.tokens.length,
    };
};

export default tokenRateLimiter;
