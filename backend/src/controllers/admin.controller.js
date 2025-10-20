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

// ============================================
// CRUD CONTROLLERS FOR ADMIN MANAGEMENT
// ============================================

/**
 * Get all admins controller
 * Query params: includeDeleted, includeInactive
 */
export async function getAllAdminsController(req, res) {
    try {
        const { includeDeleted, includeInactive } = req.query;

        const filters = {
            includeDeleted: includeDeleted === 'true',
            includeInactive: includeInactive === 'true'
        };

        const admins = await adminService.getAllAdmins(filters);

        res.status(200).json({
            status: 200,
            message: 'Admins retrieved successfully',
            data: admins
        });
    } catch (error) {
        console.error('getAllAdminsController error:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve admins',
            error: error.message
        });
    }
}

/**
 * Get admin by ID controller
 * Path params: id
 * Query params: includeDeleted
 */
export async function getAdminByIdController(req, res) {
    try {
        const { id } = req.params;
        const { includeDeleted } = req.query;

        const admin = await adminService.getAdminById(
            parseInt(id),
            includeDeleted === 'true'
        );

        if (!admin) {
            return res.status(404).json({
                status: 404,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            status: 200,
            message: 'Admin retrieved successfully',
            data: admin
        });
    } catch (error) {
        console.error('getAdminByIdController error:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve admin',
            error: error.message
        });
    }
}

/**
 * Search admins controller
 * Query params: q (search term)
 */
export async function searchAdminsController(req, res) {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                status: 400,
                message: 'Search term (q) is required'
            });
        }

        const admins = await adminService.searchAdmins(q);

        res.status(200).json({
            status: 200,
            message: `Found ${admins.length} admin(s)`,
            data: admins
        });
    } catch (error) {
        console.error('searchAdminsController error:', error);

        if (error.message === 'Search term is required') {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to search admins',
            error: error.message
        });
    }
}

/**
 * Update admin controller
 * Path params: id
 * Body: { username, role, employee_id, is_active }
 */
export async function updateAdminController(req, res) {
    try {
        const { id } = req.params;
        const { username, role, employee_id, is_active } = req.body;

        // Validate username format if provided
        if (username !== undefined) {
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid username format (3-20 characters, alphanumeric and underscore only)'
                });
            }
        }

        // Role validation is now handled by verifyRoleChangePermission middleware
        // No need to validate here

        const updateData = { username, role, employee_id, is_active };
        const admin = await adminService.updateAdmin(parseInt(id), updateData);

        res.status(200).json({
            status: 200,
            message: 'Admin updated successfully',
            data: admin
        });
    } catch (error) {
        console.error('updateAdminController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('already exists') ||
            error.message.includes('Invalid role') ||
            error.message.includes('employee_id') ||
            error.message.includes('No fields to update')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to update admin',
            error: error.message
        });
    }
}

/**
 * Change password controller (self-service)
 * Admin changes their own password by providing old password
 * Path params: id
 * Body: { oldPassword, newPassword }
 */
export async function changePasswordController(req, res) {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                status: 400,
                message: 'Both oldPassword and newPassword are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                status: 400,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Check password strength (optional, more strict)
        const hasLetter = /[a-zA-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);

        if (!hasLetter || !hasNumber) {
            return res.status(400).json({
                status: 400,
                message: 'New password must contain both letters and numbers'
            });
        }

        await adminService.changePassword(parseInt(id), oldPassword, newPassword);

        res.status(200).json({
            status: 200,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('changePasswordController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        if (error.message.includes('password')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to change password',
            error: error.message
        });
    }
}

/**
 * Reset password by OWNER controller
 * OWNER can reset password for STAFF/MANAGER without knowing old password
 * Path params: id (target admin ID)
 * Body: { newPassword }
 * Headers: Authorization with OWNER token
 */
export async function resetPasswordByOwnerController(req, res) {
    try {
        const targetAdminId = parseInt(req.params.id);
        const { newPassword } = req.body;
        const ownerAdminId = req.user.id; // From verifyToken middleware

        if (!newPassword) {
            return res.status(400).json({
                status: 400,
                message: 'newPassword is required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                status: 400,
                message: 'New password must be at least 6 characters long'
            });
        }

        const hasLetter = /[a-zA-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);

        if (!hasLetter || !hasNumber) {
            return res.status(400).json({
                status: 400,
                message: 'New password must contain both letters and numbers'
            });
        }

        await adminService.resetPasswordByOwner(targetAdminId, newPassword, ownerAdminId);

        res.status(200).json({
            status: 200,
            message: 'Password reset successfully by OWNER'
        });
    } catch (error) {
        console.error('resetPasswordByOwnerController error:', error);

        if (error.message === 'Target admin not found' || error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message === 'Cannot reset password for another OWNER account') {
            return res.status(403).json({
                status: 403,
                message: error.message
            });
        }

        if (error.message.includes('password')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to reset password',
            error: error.message
        });
    }
}

/**
 * Deactivate admin controller
 * Path params: id
 */
export async function deactivateAdminController(req, res) {
    try {
        const { id } = req.params;

        const admin = await adminService.deactivateAdmin(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Admin deactivated successfully',
            data: admin
        });
    } catch (error) {
        console.error('deactivateAdminController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('already deactivated')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to deactivate admin',
            error: error.message
        });
    }
}

/**
 * Activate admin controller
 * Path params: id
 */
export async function activateAdminController(req, res) {
    try {
        const { id } = req.params;

        const admin = await adminService.activateAdmin(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Admin activated successfully',
            data: admin
        });
    } catch (error) {
        console.error('activateAdminController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('already active')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to activate admin',
            error: error.message
        });
    }
}

/**
 * Soft delete admin controller
 * Path params: id
 */
export async function deleteAdminController(req, res) {
    try {
        const { id } = req.params;

        const result = await adminService.deleteAdmin(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Admin soft deleted successfully',
            data: result
        });
    } catch (error) {
        console.error('deleteAdminController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('already deleted') ||
            error.message.includes('last OWNER')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to delete admin',
            error: error.message
        });
    }
}

/**
 * Hard delete admin controller
 * Path params: id
 */
export async function hardDeleteAdminController(req, res) {
    try {
        const { id } = req.params;

        const result = await adminService.hardDeleteAdmin(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Admin permanently deleted',
            data: result
        });
    } catch (error) {
        console.error('hardDeleteAdminController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('last OWNER') ||
            error.message.includes('referenced by')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to permanently delete admin',
            error: error.message
        });
    }
}

/**
 * Restore admin controller
 * Path params: id
 */
export async function restoreAdminController(req, res) {
    try {
        const { id } = req.params;

        const admin = await adminService.restoreAdmin(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Admin restored successfully',
            data: admin
        });
    } catch (error) {
        console.error('restoreAdminController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('not deleted') ||
            error.message.includes('Username') ||
            error.message.includes('taken')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to restore admin',
            error: error.message
        });
    }
}

/**
 * Get admin statistics controller
 */
export async function getAdminStatsController(req, res) {
    try {
        const stats = await adminService.getAdminStats();

        res.status(200).json({
            status: 200,
            message: 'Admin statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('getAdminStatsController error:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve admin statistics',
            error: error.message
        });
    }
}

/**
 * Get admin with employee details controller
 * Path params: id
 */
export async function getAdminWithEmployeeController(req, res) {
    try {
        const { id } = req.params;

        const admin = await adminService.getAdminWithEmployee(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Admin with employee details retrieved successfully',
            data: admin
        });
    } catch (error) {
        console.error('getAdminWithEmployeeController error:', error);

        if (error.message === 'Admin not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve admin with employee details',
            error: error.message
        });
    }
}

