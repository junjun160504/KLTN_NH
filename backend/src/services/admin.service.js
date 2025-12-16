import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Helper function: Check if requester can manage target based on role hierarchy
 * @param {string} requesterRole - Role of the person performing the action
 * @param {string} targetRole - Role of the target account
 * @returns {boolean} - True if allowed, false otherwise
 */
export function canManageTarget(requesterRole, targetRole) {
    // OWNER can manage anyone
    if (requesterRole === 'OWNER') return true;

    // MANAGER can only manage STAFF
    if (requesterRole === 'MANAGER' && targetRole === 'STAFF') return true;

    // All other cases are denied
    return false;
}

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

// ============================================
// CRUD OPERATIONS FOR ADMIN MANAGEMENT
// ============================================

/**
 * Get all admins with optional filters
 * @param {Object} filters - { includeDeleted, includeInactive }
 * @returns {Array} List of admins with employee info
 */
export async function getAllAdmins(filters = {}) {
    const { includeDeleted = false, includeInactive = false } = filters;

    let sql = `
        SELECT 
            a.id,
            a.username,
            a.role,
            a.employee_id,
            a.is_active,
            a.created_at,
            a.updated_at,
            a.deleted_at,
            e.name as employee_name,
            e.phone as employee_phone,
            e.email as employee_email
        FROM admins a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE 1=1
    `;

    const params = [];

    // Filter deleted
    if (!includeDeleted) {
        sql += ' AND a.deleted_at IS NULL';
    }

    // Filter inactive
    if (!includeInactive) {
        sql += ' AND a.is_active = 1';
    }

    sql += ' ORDER BY a.created_at';

    const admins = await query(sql, params);
    return admins;
}

/**
 * Get admin by ID with employee info
 * @param {Number} id - Admin ID
 * @param {Boolean} includeDeleted - Include soft-deleted admins
 * @returns {Object|null} Admin object or null
 */
export async function getAdminById(id, includeDeleted = false) {
    let sql = `
        SELECT 
            a.id,
            a.username,
            a.role,
            a.employee_id,
            a.is_active,
            a.created_at,
            a.updated_at,
            a.deleted_at,
            e.name as employee_name,
            e.phone as employee_phone,
            e.email as employee_email,
            e.gender as employee_gender,
            e.address as employee_address
        FROM admins a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE a.id = ?
    `;

    if (!includeDeleted) {
        sql += ' AND a.deleted_at IS NULL';
    }

    const [admins] = await query(sql, [id]);
    return admins || null;
}

/**
 * Search admins by username, employee name, phone, or email
 * @param {String} searchTerm - Search keyword
 * @returns {Array} Matching admins
 */
export async function searchAdmins(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        throw new Error('Search term is required');
    }

    const keyword = `%${searchTerm}%`;

    const sql = `
        SELECT 
            a.id,
            a.username,
            a.role,
            a.employee_id,
            a.is_active,
            a.created_at,
            e.name as employee_name,
            e.phone as employee_phone,
            e.email as employee_email
        FROM admins a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE a.deleted_at IS NULL
        AND (
            a.username LIKE ? OR
            e.name LIKE ? OR
            e.phone LIKE ? OR
            e.email LIKE ?
        )
        ORDER BY a.created_at DESC
    `;

    const admins = await query(sql, [keyword, keyword, keyword, keyword]);
    return admins;
}

/**
 * Update admin information
 * @param {Number} id - Admin ID
 * @param {Object} updateData - { username, role, employee_id, is_active }
 * @returns {Object} Updated admin
 */
export async function updateAdmin(id, updateData) {
    // Check admin exists
    const admin = await getAdminById(id);
    if (!admin) {
        throw new Error('Admin not found');
    }

    const { username, role, employee_id, is_active } = updateData;
    const updates = [];
    const params = [];

    // Username update
    if (username !== undefined) {
        // Check username uniqueness (exclude current admin)
        const [existingUsername] = await query(
            'SELECT id FROM admins WHERE username = ? AND id != ? AND deleted_at IS NULL',
            [username, id]
        );

        if (existingUsername) {
            throw new Error(`Username '${username}' already exists`);
        }

        updates.push('username = ?');
        params.push(username);
    }

    // Role update
    if (role !== undefined) {
        const validRoles = ['STAFF', 'MANAGER', 'OWNER'];
        if (!validRoles.includes(role.toUpperCase())) {
            throw new Error('Invalid role. Must be one of: STAFF, MANAGER, OWNER');
        }
        updates.push('role = ?');
        params.push(role.toUpperCase());
    }

    // Employee ID update
    if (employee_id !== undefined) {
        const empId = parseInt(employee_id, 10);
        if (isNaN(empId) || empId <= 0) {
            throw new Error('employee_id must be a valid positive number');
        }

        // Check employee exists
        const [employeeExists] = await query(
            'SELECT id FROM employees WHERE id = ? AND deleted_at IS NULL',
            [empId]
        );

        if (employeeExists.length === 0) {
            throw new Error(`Employee with ID ${empId} not found`);
        }

        updates.push('employee_id = ?');
        params.push(empId);
    }

    // Active status update
    if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
        throw new Error('No fields to update');
    }

    // Execute update
    params.push(id);
    const sql = `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params);

    return await getAdminById(id);
}

/**
 * Change admin password (self-service)
 * Admin must provide old password to change their own password
 * @param {Number} id - Admin ID
 * @param {String} oldPassword - Current password (for verification)
 * @param {String} newPassword - New password
 * @returns {Boolean} Success status
 */
export async function changePassword(id, oldPassword, newPassword) {
    // Get admin with password
    const [admins] = await query(
        'SELECT id, password FROM admins WHERE id = ? AND deleted_at IS NULL',
        [id]
    );

    const admin = admins;
    if (!admin) {
        throw new Error('Admin not found');
    }

    // Verify old password
    const match = await bcrypt.compare(oldPassword, admin.password);
    if (!match) {
        throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
        'UPDATE admins SET password = ? WHERE id = ?',
        [hashedPassword, id]
    );

    return true;
}

/**
 * Reset password by OWNER (without old password)
 * OWNER can reset password for STAFF and MANAGER without knowing old password
 * @param {Number} targetAdminId - Target admin ID to reset password
 * @param {String} newPassword - New password
 * @param {Number} ownerAdminId - OWNER's admin ID (for logging/audit)
 * @returns {Boolean} Success status
 */
export async function resetPasswordByOwner(targetAdminId, newPassword, ownerAdminId) {
    // Get target admin
    const [targetAdmin] = await query(
        'SELECT id, role, username FROM admins WHERE id = ? AND deleted_at IS NULL',
        [targetAdminId]
    );

    if (!targetAdmin) {
        throw new Error('Target admin not found');
    }

    // OWNER can reset their own password, but cannot reset another OWNER's password
    if (targetAdmin.role === 'OWNER' && targetAdmin.id !== ownerAdminId) {
        throw new Error('Cannot reset password for another OWNER account');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
    }

    // Check password strength
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    if (!hasLetters || !hasNumbers) {
        throw new Error('Password must contain both letters and numbers');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
        'UPDATE admins SET password = ? WHERE id = ?',
        [hashedPassword, targetAdminId]
    );

    // Log the action (optional - for audit trail)
    console.log(`[AUDIT] OWNER (ID: ${ownerAdminId}) reset password for admin (ID: ${targetAdminId}, username: ${targetAdmin.username}, role: ${targetAdmin.role})`);

    return true;
}

/**
 * Deactivate admin (set is_active = 0)
 * @param {Number} id - Admin ID
 * @returns {Object} Updated admin
 */
export async function deactivateAdmin(id) {
    const admin = await getAdminById(id);
    if (!admin) {
        throw new Error('Admin not found');
    }

    if (admin.is_active === 0) {
        throw new Error('Admin is already deactivated');
    }

    await query(
        'UPDATE admins SET is_active = 0 WHERE id = ?',
        [id]
    );

    return await getAdminById(id);
}

/**
 * Activate admin (set is_active = 1)
 * @param {Number} id - Admin ID
 * @returns {Object} Updated admin
 */
export async function activateAdmin(id) {
    const admin = await getAdminById(id);
    if (!admin) {
        throw new Error('Admin not found');
    }

    if (admin.is_active === 1) {
        throw new Error('Admin is already active');
    }

    await query(
        'UPDATE admins SET is_active = 1 WHERE id = ?',
        [id]
    );

    return await getAdminById(id);
}

/**
 * Soft delete admin (set deleted_at timestamp)
 * @param {Number} id - Admin ID
 * @returns {Object} Result with ID
 */
export async function deleteAdmin(id) {
    const admin = await getAdminById(id);
    if (!admin) {
        throw new Error('Admin not found');
    }

    if (admin.deleted_at !== null) {
        throw new Error('Admin is already deleted');
    }

    // Cannot delete the last OWNER
    if (admin.role === 'OWNER') {
        const owners = await query(
            'SELECT COUNT(*) as count FROM admins WHERE role = "OWNER" AND deleted_at IS NULL AND id != ?',
            [id]
        );

        if (owners[0].count === 0) {
            throw new Error('Cannot delete the last OWNER. System must have at least one OWNER.');
        }
    }

    await query(
        'UPDATE admins SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
    );

    return { id };
}

/**
 * Permanently delete admin from database
 * @param {Number} id - Admin ID
 * @returns {Object} Result with ID
 */
export async function hardDeleteAdmin(id) {
    const admin = await getAdminById(id, true); // Include deleted
    if (!admin) {
        throw new Error('Admin not found');
    }

    // Cannot delete the last OWNER
    if (admin.role === 'OWNER') {
        const owners = await query(
            'SELECT COUNT(*) as count FROM admins WHERE role = "OWNER" AND id != ?',
            [id]
        );

        if (owners[0].count === 0) {
            throw new Error('Cannot hard delete the last OWNER. System must have at least one OWNER.');
        }
    }

    // Check for related data (orders, payments, etc.)
    const orders = await query(
        'SELECT COUNT(*) as count FROM orders WHERE admin_id = ?',
        [id]
    );

    if (orders[0].count > 0) {
        throw new Error(
            `Cannot hard delete admin: This admin is referenced by ${orders[0].count} order(s). ` +
            `Please reassign those orders first or use soft delete instead.`
        );
    }

    const payments = await query(
        'SELECT COUNT(*) as count FROM payments WHERE admin_id = ?',
        [id]
    );

    if (payments[0].count > 0) {
        throw new Error(
            `Cannot hard delete admin: This admin is referenced by ${payments[0].count} payment(s). ` +
            `Please reassign those payments first or use soft delete instead.`
        );
    }

    // Soft delete instead of hard delete
    await query('UPDATE admins SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);

    return { id };
}

/**
 * Restore soft-deleted admin
 * @param {Number} id - Admin ID
 * @returns {Object} Restored admin
 */
export async function restoreAdmin(id) {
    const admin = await getAdminById(id, true); // Include deleted
    if (!admin) {
        throw new Error('Admin not found');
    }

    if (admin.deleted_at === null) {
        throw new Error('Admin is not deleted');
    }

    // Check if username is still unique when restoring
    const [existingUsername] = await query(
        'SELECT id FROM admins WHERE username = ? AND id != ? AND deleted_at IS NULL',
        [admin.username, id]
    );

    if (existingUsername) {
        throw new Error(
            `Cannot restore: Username '${admin.username}' is now taken by another admin. ` +
            `Please update the username before restoring.`
        );
    }

    await query(
        'UPDATE admins SET deleted_at = NULL WHERE id = ?',
        [id]
    );

    return await getAdminById(id);
}

/**
 * Get admin statistics
 * @returns {Object} Statistics (total, active, inactive, deleted, by role)
 */
export async function getAdminStats() {
    // Total admins (including deleted)
    const totalResult = await query(
        'SELECT COUNT(*) as count FROM admins'
    );

    // Active admins
    const activeResult = await query(
        'SELECT COUNT(*) as count FROM admins WHERE deleted_at IS NULL AND is_active = 1'
    );

    // Inactive admins (not deleted but is_active = 0)
    const inactiveResult = await query(
        'SELECT COUNT(*) as count FROM admins WHERE deleted_at IS NULL AND is_active = 0'
    );

    // Deleted admins
    const deletedResult = await query(
        'SELECT COUNT(*) as count FROM admins WHERE deleted_at IS NOT NULL'
    );

    // By role (active only)
    const staffResult = await query(
        'SELECT COUNT(*) as count FROM admins WHERE role = "STAFF" AND deleted_at IS NULL AND is_active = 1'
    );

    const managerResult = await query(
        'SELECT COUNT(*) as count FROM admins WHERE role = "MANAGER" AND deleted_at IS NULL AND is_active = 1'
    );

    const ownerResult = await query(
        'SELECT COUNT(*) as count FROM admins WHERE role = "OWNER" AND deleted_at IS NULL AND is_active = 1'
    );

    return {
        total: totalResult[0].count,
        active: activeResult[0].count,
        inactive: inactiveResult[0].count,
        deleted: deletedResult[0].count,
        staff: staffResult[0].count,
        manager: managerResult[0].count,
        owner: ownerResult[0].count
    };
}

/**
 * Get admin with full employee details
 * @param {Number} id - Admin ID
 * @returns {Object} Admin with employee info
 */
export async function getAdminWithEmployee(id) {
    const admin = await getAdminById(id);
    if (!admin) {
        throw new Error('Admin not found');
    }

    return admin;
}

