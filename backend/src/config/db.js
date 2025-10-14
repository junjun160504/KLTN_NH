import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 8811,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'dinhpham',
    database: process.env.DB_NAME || 'kltn_nhahang',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}
