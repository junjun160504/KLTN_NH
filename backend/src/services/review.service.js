import { query } from '../config/db.js';

export async function saveReview({ qr_session_id, rating, comment }) {
    const session = await query('SELECT * FROM qr_sessions WHERE id = ?', [qr_session_id]);
    if (session.length === 0) {
        throw new Error(`QR Session ID ${qr_session_id} does not exist`);
    }

    await query(`INSERT INTO reviews (qr_session_id, rating, comment)
               VALUES (?, ?, ?)`, [qr_session_id, rating, comment]);
    return { qr_session_id, rating, comment };
}

