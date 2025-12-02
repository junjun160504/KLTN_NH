/**
 * Chatbot Functions Service
 * 
 * Implement các functions mà Assistant có thể gọi
 * Bao gồm: get_menu, get_categories, get_recommendations
 * 
 * @module services/chatbotV2/chatbot-functions.service
 */

import { query } from '../../config/db.js';
import { ASSISTANT_RUNTIME_CONFIG } from '../../config/openaiAssistant.js';

const { debug } = ASSISTANT_RUNTIME_CONFIG;

/**
 * Lấy danh sách món ăn từ menu
 * 
 * @param {Object} params - Parameters
 * @param {number} [params.category_id] - ID danh mục để lọc
 * @param {string} [params.search] - Từ khóa tìm kiếm
 * @param {number} [params.limit=10] - Số lượng kết quả tối đa
 * @returns {Promise<Array>} Danh sách món ăn
 */
export async function getMenu({ category_id, search, limit = 10 } = {}) {
    try {
        // Giới hạn limit tối đa - đảm bảo là số nguyên
        const safeLimit = parseInt(Math.min(Math.max(1, Number(limit) || 10), 20), 10);

        let sql = `
      SELECT 
        mi.id,
        mi.name,
        mi.price,
        mi.description,
        mi.image_url,
        GROUP_CONCAT(DISTINCT mc.name ORDER BY mc.name SEPARATOR ', ') as categories,
        COALESCE(ROUND(AVG(mr.rating), 1), 0) as avg_rating,
        COUNT(DISTINCT mr.id) as review_count
      FROM menu_items mi
      LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_categories mc ON mic.category_id = mc.id AND mc.deleted_at IS NULL
      LEFT JOIN menu_reviews mr ON mi.id = mr.item_id
      WHERE mi.is_available = 1 AND mi.deleted_at IS NULL
    `;

        const params = [];

        // Lọc theo category
        if (category_id) {
            sql += ` AND mic.category_id = ?`;
            params.push(parseInt(category_id, 10));
        }

        // Tìm kiếm theo tên hoặc mô tả
        if (search && search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            sql += ` AND (mi.name LIKE ? OR mi.description LIKE ?)`;
            params.push(searchTerm, searchTerm);
        }

        sql += ` GROUP BY mi.id ORDER BY avg_rating DESC, mi.name ASC LIMIT ${safeLimit}`;
        // Note: LIMIT được đưa trực tiếp vào SQL vì mysql2 execute có issue với LIMIT placeholder

        const results = await query(sql, params);

        if (debug) {
            console.log(`[Functions] get_menu returned ${results.length} items`);
        }

        // Format kết quả cho AI dễ đọc
        return results.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            price_formatted: formatPrice(item.price),
            description: item.description || 'Chưa có mô tả',
            categories: item.categories || 'Chưa phân loại',
            rating: item.avg_rating,
            review_count: item.review_count,
            image_url: item.image_url
        }));

    } catch (error) {
        console.error('[Functions] Error in getMenu:', error);
        throw error;
    }
}

/**
 * Lấy danh sách tất cả danh mục món ăn
 * 
 * @returns {Promise<Array>} Danh sách danh mục
 */
export async function getCategories() {
    try {
        const results = await query(`
      SELECT 
        mc.id,
        mc.name,
        mc.description,
        COUNT(DISTINCT mic.item_id) as item_count
      FROM menu_categories mc
      LEFT JOIN menu_item_categories mic ON mc.id = mic.category_id
      LEFT JOIN menu_items mi ON mic.item_id = mi.id AND mi.is_available = 1 AND mi.deleted_at IS NULL
      WHERE mc.is_available = 1 AND mc.deleted_at IS NULL
      GROUP BY mc.id
      ORDER BY mc.name ASC
    `);

        if (debug) {
            console.log(`[Functions] get_categories returned ${results.length} categories`);
        }

        return results.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            item_count: cat.item_count || 0
        }));

    } catch (error) {
        console.error('[Functions] Error in getCategories:', error);
        throw error;
    }
}

/**
 * Lấy gợi ý món ăn dựa trên tiêu chí
 * 
 * @param {Object} params - Parameters
 * @param {string} [params.criteria='popular'] - Tiêu chí: popular, top_rated, random
 * @param {number} [params.limit=3] - Số lượng gợi ý
 * @returns {Promise<Array>} Danh sách món được gợi ý
 */
export async function getRecommendations({ criteria = 'popular', limit = 3 } = {}) {
    try {
        // Giới hạn limit - đảm bảo là số nguyên
        const safeLimit = parseInt(Math.min(Math.max(1, Number(limit) || 3), 5), 10);

        let sql = '';

        switch (criteria) {
            case 'popular':
                // Món được đặt nhiều nhất
                sql = `
          SELECT 
            mi.id, mi.name, mi.price, mi.description, mi.image_url,
            COUNT(oi.id) as order_count,
            COALESCE(ROUND(AVG(mr.rating), 1), 0) as avg_rating
          FROM menu_items mi
          LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
          LEFT JOIN menu_reviews mr ON mi.id = mr.item_id
          WHERE mi.is_available = 1 AND mi.deleted_at IS NULL
          GROUP BY mi.id
          ORDER BY order_count DESC, avg_rating DESC
          LIMIT ${safeLimit}
        `;
                break;

            case 'top_rated':
                // Món được đánh giá cao nhất
                sql = `
          SELECT 
            mi.id, mi.name, mi.price, mi.description, mi.image_url,
            COALESCE(ROUND(AVG(mr.rating), 1), 0) as avg_rating,
            COUNT(mr.id) as review_count
          FROM menu_items mi
          LEFT JOIN menu_reviews mr ON mi.id = mr.item_id
          WHERE mi.is_available = 1 AND mi.deleted_at IS NULL
          GROUP BY mi.id
          HAVING avg_rating > 0
          ORDER BY avg_rating DESC, review_count DESC
          LIMIT ${safeLimit}
        `;
                break;

            case 'random':
            default:
                // Món ngẫu nhiên
                sql = `
          SELECT 
            mi.id, mi.name, mi.price, mi.description, mi.image_url,
            COALESCE(ROUND(AVG(mr.rating), 1), 0) as avg_rating
          FROM menu_items mi
          LEFT JOIN menu_reviews mr ON mi.id = mr.item_id
          WHERE mi.is_available = 1 AND mi.deleted_at IS NULL
          GROUP BY mi.id
          ORDER BY RAND()
          LIMIT ${safeLimit}
        `;
                break;
        }

        const results = await query(sql);

        if (debug) {
            console.log(`[Functions] get_recommendations (${criteria}) returned ${results.length} items`);
        }

        // Format kết quả với label cho AI
        return results.map((item, index) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            price_formatted: formatPrice(item.price),
            description: item.description || 'Chưa có mô tả',
            rating: item.avg_rating,
            recommendation_rank: index + 1,
            recommendation_reason: getRecommendationReason(criteria, item)
        }));

    } catch (error) {
        console.error('[Functions] Error in getRecommendations:', error);
        throw error;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format giá tiền theo VND
 * @param {number} price - Giá tiền
 * @returns {string} Giá đã format
 */
function formatPrice(price) {
    if (!price && price !== 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

/**
 * Tạo lý do gợi ý dựa trên criteria
 * @param {string} criteria - Tiêu chí
 * @param {Object} item - Item data
 * @returns {string} Lý do gợi ý
 */
function getRecommendationReason(criteria, item) {
    switch (criteria) {
        case 'popular':
            return item.order_count > 0
                ? `Được đặt ${item.order_count} lần`
                : 'Món ăn phổ biến';
        case 'top_rated':
            return `Đánh giá ${item.avg_rating}/5 ⭐`;
        case 'random':
        default:
            return 'Gợi ý cho bạn';
    }
}

// ============================================
// EXPORTS
// ============================================

export default {
    getMenu,
    getCategories,
    getRecommendations
};
