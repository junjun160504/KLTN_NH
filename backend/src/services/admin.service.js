import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function login({ username, password }) {
    // JOIN với bảng employees để lấy name
    const rows = await query(
        `SELECT 
            a.id, 
            a.username, 
            a.password, 
            a.role, 
            a.employee_id,
            e.name as employee_name
         FROM admins a
         LEFT JOIN employees e ON a.employee_id = e.id
         WHERE a.username = ? AND a.is_active = 1`,
        [username]
    );

    const user = rows[0];
    if (!user) throw new Error('Admin not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error('Wrong password');

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.employee_name || user.username // fallback to username nếu không có name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.employee_name || user.username,
            employee_id: user.employee_id
        }
    };
}

export async function registerAdmin({ username, password, role = 'STAFF', employee_id }) {
    console.log('Received employee_id:', employee_id, '| typeof:', typeof employee_id); // Debug

    const empId = parseInt(employee_id, 10);
    if (isNaN(empId) || empId <= 0) {
        throw new Error('employee_id must be a valid positive number');
    }

    const existing = await query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) {
        throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
        'INSERT INTO admins (username, password, role, employee_id, is_active) VALUES (?, ?, ?, ?, 1)',
        [username, hashedPassword, role, empId]
    );
}


