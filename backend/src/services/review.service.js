import { query } from '../config/db.js';

// ========== RESTAURANT REVIEWS (reviews table) ==========

// ✅ UPSERT review nhà hàng (INSERT nếu chưa có, UPDATE nếu đã có)
export async function saveReview({ qr_session_id, rating, comment }) {
    if (!rating || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    const sessions = await query('SELECT * FROM qr_sessions WHERE id = ?', [qr_session_id]);
    if (sessions.length === 0) {
        throw new Error(`QR Session ID ${qr_session_id} does not exist`);
    }

    // ✅ Check if review already exists for this session
    const existingReviews = await query(
        'SELECT id FROM reviews WHERE qr_session_id = ?',
        [qr_session_id]
    );

    let reviewId;

    if (existingReviews.length > 0) {
        // ✅ UPDATE existing review
        reviewId = existingReviews[0].id;
        await query(
            `UPDATE reviews 
             SET rating = ?, comment = ?
             WHERE id = ?`,
            [rating, comment, reviewId]
        );
        console.log(`✅ Updated restaurant review #${reviewId} for session ${qr_session_id}`);
    } else {
        // ✅ INSERT new review
        const result = await query(
            `INSERT INTO reviews (qr_session_id, rating, comment)
             VALUES (?, ?, ?)`,
            [qr_session_id, rating, comment]
        );
        reviewId = result.insertId;
        console.log(`✅ Created new restaurant review #${reviewId} for session ${qr_session_id}`);
    }

    return { id: reviewId, qr_session_id, rating, comment, isUpdate: existingReviews.length > 0 };
}

// Lấy review theo qr_session_id
export async function getReviewsBySession(qr_session_id) {
    const rows = await query(
        `SELECT id, qr_session_id, rating, comment, created_at
         FROM reviews
         WHERE qr_session_id = ? ORDER BY created_at DESC`,
        [qr_session_id]
    );
    return rows;
}

// Lấy tất cả review (admin)
export async function getAllReviews() {
    const rows = await query(
        `SELECT id, qr_session_id, rating, comment, created_at
         FROM reviews ORDER BY created_at DESC`
    );
    return rows;
}

// Xoá review
export async function deleteReview(id) {
    const result = await query(`DELETE FROM reviews WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}

// ========== MENU ITEM REVIEWS (menu_reviews table) ==========

// ✅ UPSERT review món ăn (INSERT nếu chưa có, UPDATE nếu đã có)
export async function saveMenuReview({ item_id, qr_session_id, rating, comment }) {
    if (!item_id) {
        throw new Error("item_id is required");
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    // Validate item exists
    const items = await query('SELECT * FROM menu_items WHERE id = ? AND deleted_at IS NULL', [item_id]);
    if (items.length === 0) {
        throw new Error(`Menu item ID ${item_id} does not exist`);
    }

    // Validate session exists
    const sessions = await query('SELECT * FROM qr_sessions WHERE id = ?', [qr_session_id]);
    if (sessions.length === 0) {
        throw new Error(`QR Session ID ${qr_session_id} does not exist`);
    }

    // ✅ Check if review already exists for this item + session
    const existingReviews = await query(
        'SELECT id FROM menu_reviews WHERE item_id = ? AND qr_session_id = ?',
        [item_id, qr_session_id]
    );

    let reviewId;

    if (existingReviews.length > 0) {
        // ✅ UPDATE existing review
        reviewId = existingReviews[0].id;
        await query(
            `UPDATE menu_reviews 
             SET rating = ?, comment = ?
             WHERE id = ?`,
            [rating, comment, reviewId]
        );
        console.log(`✅ Updated menu review #${reviewId} for item ${item_id}, session ${qr_session_id}`);
    } else {
        // ✅ INSERT new review
        const result = await query(
            `INSERT INTO menu_reviews (item_id, qr_session_id, rating, comment)
             VALUES (?, ?, ?, ?)`,
            [item_id, qr_session_id, rating, comment]
        );
        reviewId = result.insertId;
        console.log(`✅ Created new menu review #${reviewId} for item ${item_id}, session ${qr_session_id}`);
    }

    return { id: reviewId, item_id, qr_session_id, rating, comment, isUpdate: existingReviews.length > 0 };
}

// Lấy reviews theo menu item ID (có pagination)
export async function getReviewsByItemId(itemId, { limit = 10, offset = 0 } = {}) {
    const reviews = await query(
        `SELECT id, rating, comment, created_at
         FROM menu_reviews
         WHERE item_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [itemId, limit, offset]
    );

    const totalResult = await query(
        `SELECT COUNT(*) as total FROM menu_reviews WHERE item_id = ?`,
        [itemId]
    );
    const total = totalResult[0]?.total || 0;

    return {
        reviews,
        pagination: {
            total,
            limit,
            offset,
            hasMore: offset + reviews.length < total
        }
    };
}

// Xóa menu review
export async function deleteMenuReview(id) {
    const result = await query(`DELETE FROM menu_reviews WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}
