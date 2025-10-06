import { query } from '../config/db.js';

// Thêm review
export async function saveReview({ qr_session_id, rating, comment }) {
    if (!rating || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    const session = await query('SELECT * FROM qr_sessions WHERE id = ?', [qr_session_id]);
    if (session.length === 0) {
        throw new Error(`QR Session ID ${qr_session_id} does not exist`);
    }

    const result = await query(
        `INSERT INTO reviews (qr_session_id, rating, comment)
         VALUES (?, ?, ?)`,
        [qr_session_id, rating, comment]
    );

    return { id: result.insertId, qr_session_id, rating, comment };
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
