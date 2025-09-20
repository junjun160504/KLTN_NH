import * as adminService from '../services/admin.service.js';

export async function loginAdmin(req, res) {
    try {
        const token = await adminService.login(req.body);
        res.status(200).json({ status: 200, token });
    } catch (err) {
        console.error('loginAdmin error:', err);
        res.status(401).json({ status: 401, message: err.message });
    }
}
export async function getLoginAdmin(req, res) {
    try {
        const logins = await adminService.getLogins();
        res.status(200).json({ status: 200, data: logins });
    } catch (err) {
        console.error('getLoginAdmin error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }}
