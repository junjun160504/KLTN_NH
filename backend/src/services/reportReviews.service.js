import { pool } from '../config/db.js'

/**
 * ========== RESTAURANT REVIEWS REPORT ==========
 */

/**
 * Get restaurant review statistics
 */
export const getRestaurantReviewStats = async (startDate, endDate) => {
    try {
        // Overall stats
        const [overallStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 1) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews r
      WHERE r.created_at BETWEEN ? AND ?
    `, [startDate, endDate])

        // Previous period for comparison
        const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        const prevStart = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000)
        const prevEnd = new Date(startDate)

        const [prevStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 1) as avg_rating
      FROM reviews r
      WHERE r.created_at BETWEEN ? AND ?
    `, [prevStart, prevEnd])

        const stats = overallStats[0]
        const prev = prevStats[0]

        // Calculate growth
        const reviewsGrowth = prev.total_reviews > 0
            ? (((stats.total_reviews - prev.total_reviews) / prev.total_reviews) * 100).toFixed(1)
            : 0
        const ratingGrowth = prev.avg_rating > 0
            ? (((stats.avg_rating - prev.avg_rating) / prev.avg_rating) * 100).toFixed(1)
            : 0

        return {
            success: true,
            data: {
                totalReviews: parseInt(stats.total_reviews || 0),
                avgRating: parseFloat(stats.avg_rating || 0),
                distribution: {
                    5: parseInt(stats.five_star || 0),
                    4: parseInt(stats.four_star || 0),
                    3: parseInt(stats.three_star || 0),
                    2: parseInt(stats.two_star || 0),
                    1: parseInt(stats.one_star || 0)
                },
                growth: {
                    reviews: parseFloat(reviewsGrowth),
                    rating: parseFloat(ratingGrowth)
                }
            }
        }
    } catch (error) {
        console.error('Error in getRestaurantReviewStats:', error)
        throw error
    }
}

/**
 * Get restaurant review trend by date
 */
export const getRestaurantReviewTrend = async (startDate, endDate) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        DATE(r.created_at) as date,
        COUNT(*) as review_count,
        ROUND(AVG(rating), 1) as avg_rating
      FROM reviews r
      WHERE r.created_at BETWEEN ? AND ?
      GROUP BY DATE(r.created_at)
      ORDER BY date ASC
    `, [startDate, endDate])

        return {
            success: true,
            data: rows.map(row => ({
                date: row.date,
                count: parseInt(row.review_count || 0),
                avgRating: parseFloat(row.avg_rating || 0)
            }))
        }
    } catch (error) {
        console.error('Error in getRestaurantReviewTrend:', error)
        throw error
    }
}

/**
 * Get recent restaurant reviews
 */
export const getRecentRestaurantReviews = async (limit = 10) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        qs.id as session_id,
        t.table_number,
        c.name as customer_name,
        c.phone as customer_phone
      FROM reviews r
      LEFT JOIN qr_sessions qs ON r.qr_session_id = qs.id
      LEFT JOIN tables t ON qs.table_id = t.id
      LEFT JOIN customers c ON qs.customer_id = c.id
      ORDER BY r.created_at DESC
      LIMIT ?
    `, [limit])

        return {
            success: true,
            data: rows
        }
    } catch (error) {
        console.error('Error in getRecentRestaurantReviews:', error)
        throw error
    }
}

/**
 * ========== MENU ITEM REVIEWS REPORT ==========
 */

/**
 * Get menu review statistics
 */
export const getMenuReviewStats = async (startDate, endDate) => {
    try {
        // Overall stats
        const [overallStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(DISTINCT item_id) as reviewed_items,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM menu_reviews mr
      WHERE mr.created_at BETWEEN ? AND ?
    `, [startDate, endDate])

        // Previous period for comparison
        const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        const prevStart = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000)
        const prevEnd = new Date(startDate)

        const [prevStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 1) as avg_rating
      FROM menu_reviews mr
      WHERE mr.created_at BETWEEN ? AND ?
    `, [prevStart, prevEnd])

        const stats = overallStats[0]
        const prev = prevStats[0]

        // Calculate growth
        const reviewsGrowth = prev.total_reviews > 0
            ? (((stats.total_reviews - prev.total_reviews) / prev.total_reviews) * 100).toFixed(1)
            : 0
        const ratingGrowth = prev.avg_rating > 0
            ? (((stats.avg_rating - prev.avg_rating) / prev.avg_rating) * 100).toFixed(1)
            : 0

        return {
            success: true,
            data: {
                totalReviews: parseInt(stats.total_reviews || 0),
                avgRating: parseFloat(stats.avg_rating || 0),
                reviewedItems: parseInt(stats.reviewed_items || 0),
                distribution: {
                    5: parseInt(stats.five_star || 0),
                    4: parseInt(stats.four_star || 0),
                    3: parseInt(stats.three_star || 0),
                    2: parseInt(stats.two_star || 0),
                    1: parseInt(stats.one_star || 0)
                },
                growth: {
                    reviews: parseFloat(reviewsGrowth),
                    rating: parseFloat(ratingGrowth)
                }
            }
        }
    } catch (error) {
        console.error('Error in getMenuReviewStats:', error)
        throw error
    }
}

/**
 * Get menu review trend by date
 */
export const getMenuReviewTrend = async (startDate, endDate) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        DATE(mr.created_at) as date,
        COUNT(*) as review_count,
        ROUND(AVG(rating), 1) as avg_rating
      FROM menu_reviews mr
      WHERE mr.created_at BETWEEN ? AND ?
      GROUP BY DATE(mr.created_at)
      ORDER BY date ASC
    `, [startDate, endDate])

        return {
            success: true,
            data: rows.map(row => ({
                date: row.date,
                count: parseInt(row.review_count || 0),
                avgRating: parseFloat(row.avg_rating || 0)
            }))
        }
    } catch (error) {
        console.error('Error in getMenuReviewTrend:', error)
        throw error
    }
}

/**
 * Get top rated menu items
 */
export const getTopRatedMenuItems = async (limit = 10, startDate = null, endDate = null) => {
    try {
        let whereClause = ''
        let params = []

        if (startDate && endDate) {
            whereClause = 'WHERE mr.created_at BETWEEN ? AND ?'
            params = [startDate, endDate]
        }

        const [rows] = await pool.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.price,
        mi.image_url,
        MAX(mc.name) as category_name,
        COUNT(mr.id) as review_count,
        ROUND(AVG(mr.rating), 1) as avg_rating,
        SUM(CASE WHEN mr.rating = 5 THEN 1 ELSE 0 END) as five_star_count
      FROM menu_items mi
      LEFT JOIN menu_reviews mr ON mi.id = mr.item_id ${startDate && endDate ? 'AND mr.created_at BETWEEN ? AND ?' : ''}
      LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_categories mc ON mic.category_id = mc.id
      WHERE mi.deleted_at IS NULL
      GROUP BY mi.id, mi.name, mi.price, mi.image_url
      HAVING review_count > 0 AND avg_rating >= 4.5
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT ?
    `, startDate && endDate ? [startDate, endDate, limit] : [limit])

        return {
            success: true,
            data: rows.map(row => ({
                id: row.id,
                name: row.name,
                price: parseFloat(row.price || 0),
                imageUrl: row.image_url,
                categoryName: row.category_name,
                reviewCount: parseInt(row.review_count || 0),
                avgRating: parseFloat(row.avg_rating || 0),
                fiveStarCount: parseInt(row.five_star_count || 0)
            }))
        }
    } catch (error) {
        console.error('Error in getTopRatedMenuItems:', error)
        throw error
    }
}

/**
 * Get lowest rated menu items (for improvement)
 */
export const getLowestRatedMenuItems = async (limit = 5, startDate = null, endDate = null) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.price,
        mi.image_url,
        MAX(mc.name) as category_name,
        COUNT(mr.id) as review_count,
        ROUND(AVG(mr.rating), 1) as avg_rating
      FROM menu_items mi
      LEFT JOIN menu_reviews mr ON mi.id = mr.item_id ${startDate && endDate ? 'AND mr.created_at BETWEEN ? AND ?' : ''}
      LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_categories mc ON mic.category_id = mc.id
      WHERE mi.deleted_at IS NULL
      GROUP BY mi.id, mi.name, mi.price, mi.image_url
      HAVING review_count >= 2 AND avg_rating < 4
      ORDER BY avg_rating ASC, review_count DESC
      LIMIT ?
    `, startDate && endDate ? [startDate, endDate, limit] : [limit])

        return {
            success: true,
            data: rows.map(row => ({
                id: row.id,
                name: row.name,
                price: parseFloat(row.price || 0),
                imageUrl: row.image_url,
                categoryName: row.category_name,
                reviewCount: parseInt(row.review_count || 0),
                avgRating: parseFloat(row.avg_rating || 0)
            }))
        }
    } catch (error) {
        console.error('Error in getLowestRatedMenuItems:', error)
        throw error
    }
}

/**
 * Get recent menu reviews
 */
export const getRecentMenuReviews = async (limit = 10) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        mr.id,
        mr.rating,
        mr.comment,
        mr.created_at,
        mi.id as item_id,
        mi.name as item_name,
        mi.image_url as item_image,
        t.table_number,
        c.name as customer_name
      FROM menu_reviews mr
      LEFT JOIN menu_items mi ON mr.item_id = mi.id
      LEFT JOIN qr_sessions qs ON mr.qr_session_id = qs.id
      LEFT JOIN tables t ON qs.table_id = t.id
      LEFT JOIN customers c ON qs.customer_id = c.id
      ORDER BY mr.created_at DESC
      LIMIT ?
    `, [limit])

        return {
            success: true,
            data: rows
        }
    } catch (error) {
        console.error('Error in getRecentMenuReviews:', error)
        throw error
    }
}

/**
 * Get review distribution by rating (both restaurant and menu)
 */
export const getCombinedRatingDistribution = async (startDate, endDate) => {
    try {
        // Restaurant reviews distribution
        const [restaurantDist] = await pool.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE created_at BETWEEN ? AND ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [startDate, endDate])

        // Menu reviews distribution
        const [menuDist] = await pool.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM menu_reviews
      WHERE created_at BETWEEN ? AND ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [startDate, endDate])

        // Format as array [{ rating: 5, count: x }, { rating: 4, count: y }, ...]
        const formatDistribution = (rows) => {
            const result = []
            for (let i = 5; i >= 1; i--) {
                const found = rows.find(row => row.rating === i)
                result.push({
                    rating: i,
                    count: found ? parseInt(found.count || 0) : 0
                })
            }
            return result
        }

        return {
            success: true,
            data: {
                restaurant: formatDistribution(restaurantDist),
                menu: formatDistribution(menuDist)
            }
        }
    } catch (error) {
        console.error('Error in getCombinedRatingDistribution:', error)
        throw error
    }
}
