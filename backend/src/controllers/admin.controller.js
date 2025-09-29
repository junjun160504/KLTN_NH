import * as adminService from '../services/admin.service.js';
import { registerAdmin } from '../services/admin.service.js';

export async function loginAdmin(req, res) {
    try {
        const result = await adminService.login(req.body);
        res.status(200).json({
            status: 200,
            message: 'Login successful',
            token: result.token,
            user: result.user
        });
    } catch (err) {
        console.error('loginAdmin error:', err);
        res.status(401).json({
            status: 401,
            message: err.message
        });
    }
}
export async function getLoginAdmin(req, res) {
    try {
        const logins = await adminService.getLogins();
        res.status(200).json({ status: 200, data: logins });
    } catch (err) {
        console.error('getLoginAdmin error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

export async function registerAdminController(req, res) {
    try {
        const { username, password, role, employee_id } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        await registerAdmin({ username, password, role, employee_id });
        res.json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

