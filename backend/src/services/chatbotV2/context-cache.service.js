/**
 * Thread Context Cache Service
 * 
 * Cache kết quả function calling để tránh gọi lại
 * Giảm token usage bằng cách tái sử dụng data đã fetch
 * 
 * @module services/chatbotV2/context-cache.service
 */

import { ASSISTANT_RUNTIME_CONFIG } from '../../config/openaiAssistant.js';

const { debug } = ASSISTANT_RUNTIME_CONFIG;

// Cache structure: Map<threadId, ThreadContextCache>
const contextCache = new Map();

// Cache TTL (time to live) in milliseconds
const CACHE_TTL = {
    menu: 5 * 60 * 1000,           // 5 phút - menu ít thay đổi
    categories: 10 * 60 * 1000,    // 10 phút - categories rất ít thay đổi
    recommendations: 2 * 60 * 1000, // 2 phút - recommendations có thể thay đổi
    item_details: 5 * 60 * 1000,   // 5 phút - thông tin món ăn
    search: 1 * 60 * 1000,         // 1 phút - search results
};

/**
 * Thread Context Cache structure
 */
class ThreadContextCache {
    constructor(threadId) {
        this.threadId = threadId;
        this.createdAt = Date.now();
        this.lastAccess = Date.now();

        // Cached data
        this.data = {
            menu: null,              // Full menu
            categories: null,        // Danh mục
            recommendations: null,   // Gợi ý món
            itemDetails: new Map(),  // Chi tiết từng món (by ID)
            searchResults: new Map(), // Kết quả tìm kiếm (by query)
        };

        // Timestamps for each cache
        this.timestamps = {
            menu: 0,
            categories: 0,
            recommendations: 0,
        };

        // Track which functions have been called
        this.functionsCalled = new Set();
    }

    /**
     * Check if cache is still valid
     */
    isValid(type) {
        const timestamp = this.timestamps[type] || 0;
        const ttl = CACHE_TTL[type] || 60000;
        return Date.now() - timestamp < ttl;
    }

    /**
     * Set cache data
     */
    set(type, data) {
        this.lastAccess = Date.now();
        this.timestamps[type] = Date.now();
        this.data[type] = data;
        this.functionsCalled.add(type);

        if (debug) {
            console.log(`[ContextCache] Set ${type} for thread ${this.threadId}`);
        }
    }

    /**
     * Get cache data if valid
     */
    get(type) {
        if (this.isValid(type) && this.data[type]) {
            this.lastAccess = Date.now();
            if (debug) {
                console.log(`[ContextCache] Hit ${type} for thread ${this.threadId}`);
            }
            return this.data[type];
        }
        return null;
    }

    /**
     * Set item details cache
     */
    setItemDetails(itemId, data) {
        this.lastAccess = Date.now();
        this.data.itemDetails.set(itemId, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get item details if valid
     */
    getItemDetails(itemId) {
        const cached = this.data.itemDetails.get(itemId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL.item_details) {
            this.lastAccess = Date.now();
            return cached.data;
        }
        return null;
    }

    /**
     * Set search results cache
     */
    setSearchResults(query, data) {
        this.lastAccess = Date.now();
        const normalizedQuery = query.toLowerCase().trim();
        this.data.searchResults.set(normalizedQuery, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get search results if valid
     */
    getSearchResults(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const cached = this.data.searchResults.get(normalizedQuery);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL.search) {
            this.lastAccess = Date.now();
            return cached.data;
        }
        return null;
    }

    /**
     * Check if a function type has been called
     */
    hasCalled(type) {
        return this.functionsCalled.has(type);
    }

    /**
     * Get summary of cached data for context injection
     */
    getSummary() {
        const summary = [];

        if (this.data.categories && this.isValid('categories')) {
            summary.push(`Đã có thông tin ${this.data.categories.length} danh mục món ăn`);
        }

        if (this.data.menu && this.isValid('menu')) {
            const itemCount = this.data.menu.length ||
                (this.data.menu.items ? this.data.menu.items.length : 0);
            summary.push(`Đã có thông tin ${itemCount} món trong menu`);
        }

        if (this.data.recommendations && this.isValid('recommendations')) {
            summary.push(`Đã có danh sách gợi ý món ăn`);
        }

        return summary;
    }
}

// ============================================
// PUBLIC FUNCTIONS
// ============================================

/**
 * Get or create cache for a thread
 */
export function getThreadCache(threadId) {
    if (!contextCache.has(threadId)) {
        contextCache.set(threadId, new ThreadContextCache(threadId));
    }
    return contextCache.get(threadId);
}

/**
 * Clear cache for a thread
 */
export function clearThreadCache(threadId) {
    const deleted = contextCache.delete(threadId);
    if (debug && deleted) {
        console.log(`[ContextCache] Cleared cache for thread ${threadId}`);
    }
    return deleted;
}

/**
 * Get cached menu or null
 */
export function getCachedMenu(threadId) {
    const cache = contextCache.get(threadId);
    return cache ? cache.get('menu') : null;
}

/**
 * Set menu cache
 */
export function setCachedMenu(threadId, menu) {
    const cache = getThreadCache(threadId);
    cache.set('menu', menu);
}

/**
 * Get cached categories or null
 */
export function getCachedCategories(threadId) {
    const cache = contextCache.get(threadId);
    return cache ? cache.get('categories') : null;
}

/**
 * Set categories cache
 */
export function setCachedCategories(threadId, categories) {
    const cache = getThreadCache(threadId);
    cache.set('categories', categories);
}

/**
 * Get cached recommendations or null
 */
export function getCachedRecommendations(threadId) {
    const cache = contextCache.get(threadId);
    return cache ? cache.get('recommendations') : null;
}

/**
 * Set recommendations cache
 */
export function setCachedRecommendations(threadId, recommendations) {
    const cache = getThreadCache(threadId);
    cache.set('recommendations', recommendations);
}

/**
 * Get cached item details
 */
export function getCachedItemDetails(threadId, itemId) {
    const cache = contextCache.get(threadId);
    return cache ? cache.getItemDetails(itemId) : null;
}

/**
 * Set item details cache
 */
export function setCachedItemDetails(threadId, itemId, details) {
    const cache = getThreadCache(threadId);
    cache.setItemDetails(itemId, details);
}

/**
 * Get cached search results
 */
export function getCachedSearchResults(threadId, query) {
    const cache = contextCache.get(threadId);
    return cache ? cache.getSearchResults(query) : null;
}

/**
 * Set search results cache
 */
export function setCachedSearchResults(threadId, query, results) {
    const cache = getThreadCache(threadId);
    cache.setSearchResults(query, results);
}

/**
 * Get context summary for a thread
 * Dùng để inject vào message cho AI biết đã có data gì
 */
export function getContextSummary(threadId) {
    const cache = contextCache.get(threadId);
    if (!cache) return [];
    return cache.getSummary();
}

/**
 * Check if thread has called a specific function
 */
export function hasCalledFunction(threadId, functionType) {
    const cache = contextCache.get(threadId);
    return cache ? cache.hasCalled(functionType) : false;
}

/**
 * Cleanup old caches (call periodically)
 */
export function cleanupOldCaches(maxAgeMs = 30 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [threadId, cache] of contextCache.entries()) {
        if (now - cache.lastAccess > maxAgeMs) {
            contextCache.delete(threadId);
            cleaned++;
        }
    }

    if (debug && cleaned > 0) {
        console.log(`[ContextCache] Cleaned ${cleaned} old caches`);
    }

    return cleaned;
}

/**
 * Get cache stats
 */
export function getCacheStats() {
    return {
        totalThreads: contextCache.size,
        caches: Array.from(contextCache.entries()).map(([threadId, cache]) => ({
            threadId,
            age: Date.now() - cache.createdAt,
            lastAccess: Date.now() - cache.lastAccess,
            functionsCalled: Array.from(cache.functionsCalled),
            hasMenu: !!cache.data.menu,
            hasCategories: !!cache.data.categories,
            hasRecommendations: !!cache.data.recommendations,
            itemDetailsCount: cache.data.itemDetails.size,
            searchResultsCount: cache.data.searchResults.size,
        }))
    };
}

// Cleanup old caches every 10 minutes
setInterval(() => cleanupOldCaches(), 10 * 60 * 1000);

export default {
    getThreadCache,
    clearThreadCache,
    getCachedMenu,
    setCachedMenu,
    getCachedCategories,
    setCachedCategories,
    getCachedRecommendations,
    setCachedRecommendations,
    getCachedItemDetails,
    setCachedItemDetails,
    getCachedSearchResults,
    setCachedSearchResults,
    getContextSummary,
    hasCalledFunction,
    cleanupOldCaches,
    getCacheStats,
};
