import { query } from "../config/db.js";

// Ghi log
export async function writeLog({
    actor,
    action,
    target_type,
    target_id,
    before_data,
    after_data,
    result,
    reason,
    correlation_id,
    ip_address,
    user_agent
}) {
    const sql = `
      INSERT INTO audit_logs
      (actor, action, target_type, target_id, before_data, after_data, result, reason, correlation_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        actor,
        action,
        target_type,
        target_id,
        before_data ? JSON.stringify(before_data) : null,
        after_data ? JSON.stringify(after_data) : null,
        result,
        reason || null,
        correlation_id || null,
        ip_address || null,
        user_agent || null,
    ];

    const resultInsert = await query(sql, params);
    return { id: resultInsert.insertId };
}

// Lấy danh sách log với filter
export async function getLogs({ actor, action, target_type, from, to }) {
    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    const params = [];

    if (actor) {
        sql += " AND actor = ?";
        params.push(actor);
    }
    if (action) {
        sql += " AND action = ?";
        params.push(action);
    }
    if (target_type) {
        sql += " AND target_type = ?";
        params.push(target_type);
    }
    if (from && to) {
        sql += " AND created_at BETWEEN ? AND ?";
        params.push(from, to);
    }

    sql += " ORDER BY created_at DESC";

    return await query(sql, params);
}

// Lấy chi tiết log theo id
export async function getLogById(id) {
    const rows = await query("SELECT * FROM audit_logs WHERE id = ?", [id]);
    return rows[0];
}
