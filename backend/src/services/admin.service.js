import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function login({ username, password }) {
    const rows = await query('SELECT * FROM admins WHERE username = ? AND is_active = 1', [username]);
    const user = rows[0];
    if (!user) throw new Error('Admin not found');

    //const match = await bcrypt.compare(password, user.password);
    //if (!match) throw new Error('Wrong password');

    const payload = { id: user.id, username: user.username, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}
