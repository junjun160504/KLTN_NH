import { query } from '../config/db.js';

// ================ READ OPERATIONS ================

/**
 * Lấy danh sách tất cả employees (không bao gồm soft-deleted)
 * @param {Object} filters - Filter options
 * @param {boolean} filters.includeDeleted - Bao gồm cả soft-deleted employees
 * @returns {Promise<Array>} - Danh sách employees
 */
export async function getAllEmployees(filters = {}) {
    try {
        const { includeDeleted = false } = filters;

        let sql = `
            SELECT 
                id, 
                name, 
                phone, 
                email, 
                gender, 
                address,
                created_at,
                updated_at,
                deleted_at
            FROM employees
        `;

        // Mặc định không hiển thị soft-deleted employees
        if (!includeDeleted) {
            sql += ' WHERE deleted_at IS NULL';
        }

        sql += ' ORDER BY created_at ASC';

        const employees = await query(sql);
        return employees;
    } catch (error) {
        console.error('Error in getAllEmployees:', error);
        throw error;
    }
}

/**
 * Lấy chi tiết một employee theo ID
 * @param {number} id - Employee ID
 * @param {boolean} includeDeleted - Bao gồm cả soft-deleted
 * @returns {Promise<Object>} - Employee object
 */
export async function getEmployeeById(id, includeDeleted = false) {
    try {
        let sql = `
            SELECT 
                id, 
                name, 
                phone, 
                email, 
                gender, 
                address,
                created_at,
                updated_at,
                deleted_at
            FROM employees 
            WHERE id = ?
        `;

        if (!includeDeleted) {
            sql += ' AND deleted_at IS NULL';
        }

        const employees = await query(sql, [id]);

        if (employees.length === 0) {
            return null;
        }

        return employees[0];
    } catch (error) {
        console.error('Error in getEmployeeById:', error);
        throw error;
    }
}

/**
 * Tìm kiếm employees theo tên, phone, email
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {Promise<Array>} - Danh sách employees
 */
export async function searchEmployees(searchTerm) {
    try {
        const sql = `
            SELECT 
                id, 
                name, 
                phone, 
                email, 
                gender, 
                address,
                created_at,
                updated_at
            FROM employees 
            WHERE deleted_at IS NULL
                AND (
                    name LIKE ? 
                    OR phone LIKE ? 
                    OR email LIKE ?
                )
            ORDER BY name ASC
        `;

        const searchPattern = `%${searchTerm}%`;
        const [employees] = await query(sql, [searchPattern, searchPattern, searchPattern]);
        return employees;
    } catch (error) {
        console.error('Error in searchEmployees:', error);
        throw error;
    }
}

// ================ CREATE OPERATIONS ================

/**
 * Tạo employee mới
 * @param {Object} employeeData - Dữ liệu employee
 * @param {string} employeeData.name - Tên nhân viên (required)
 * @param {string} employeeData.phone - Số điện thoại (unique)
 * @param {string} employeeData.email - Email (unique)
 * @param {string} employeeData.gender - Giới tính (MALE/FEMALE/OTHER)
 * @param {string} employeeData.address - Địa chỉ
 * @returns {Promise<Object>} - Employee object mới tạo
 */
export async function createEmployee(employeeData) {
    try {
        const { name, phone, email, gender = 'OTHER', address } = employeeData;

        // Validation
        if (!name || name.trim() === '') {
            throw new Error('Employee name is required');
        }

        // Check duplicate phone
        if (phone) {
            const [existingPhone] = await query(
                'SELECT id FROM employees WHERE phone = ? AND deleted_at IS NULL',
                [phone]
            );
            if (existingPhone) {
                throw new Error(`Phone number '${phone}' already exists`);
            }
        }

        // Check duplicate email
        if (email) {
            const [existingEmail] = await query(
                'SELECT id FROM employees WHERE email = ? AND deleted_at IS NULL',
                [email]
            );
            if (existingEmail) {
                throw new Error(`Email '${email}' already exists`);
            }
        }

        // Validate gender
        const validGenders = ['MALE', 'FEMALE', 'OTHER'];
        if (gender && !validGenders.includes(gender.toUpperCase())) {
            throw new Error(`Invalid gender. Must be one of: ${validGenders.join(', ')}`);
        }

        // Insert employee
        const sql = `
            INSERT INTO employees (name, phone, email, gender, address)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            name.trim(),
            phone || null,
            email || null,
            gender.toUpperCase(),
            address || null
        ]);

        // Lấy employee vừa tạo
        const newEmployee = await getEmployeeById(result.insertId);
        return newEmployee;
    } catch (error) {
        console.error('Error in createEmployee:', error);
        throw error;
    }
}

// ================ UPDATE OPERATIONS ================

/**
 * Cập nhật thông tin employee
 * @param {number} id - Employee ID
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} - Employee object sau khi update
 */
export async function updateEmployee(id, updateData) {
    try {
        // Check employee tồn tại
        const existingEmployee = await getEmployeeById(id);
        if (!existingEmployee) {
            throw new Error('Employee not found');
        }

        const { name, phone, email, gender, address } = updateData;

        // Build dynamic UPDATE query
        const updates = [];
        const values = [];

        if (name !== undefined && name.trim() !== '') {
            updates.push('name = ?');
            values.push(name.trim());
        }

        if (phone !== undefined) {
            // Check duplicate phone (exclude current employee)
            if (phone) {
                const [existingPhone] = await query(
                    'SELECT id FROM employees WHERE phone = ? AND id != ? AND deleted_at IS NULL',
                    [phone, id]
                );
                if (existingPhone) {
                    throw new Error(`Phone number '${phone}' already exists`);
                }
            }
            updates.push('phone = ?');
            values.push(phone || null);
        }

        if (email !== undefined) {
            // Check duplicate email (exclude current employee)
            if (email) {
                const [existingEmail] = await query(
                    'SELECT id FROM employees WHERE email = ? AND id != ? AND deleted_at IS NULL',
                    [email, id]
                );
                if (existingEmail) {
                    throw new Error(`Email '${email}' already exists`);
                }
            }
            updates.push('email = ?');
            values.push(email || null);
        }

        if (gender !== undefined) {
            const validGenders = ['MALE', 'FEMALE', 'OTHER'];
            if (gender && !validGenders.includes(gender.toUpperCase())) {
                throw new Error(`Invalid gender. Must be one of: ${validGenders.join(', ')}`);
            }
            updates.push('gender = ?');
            values.push(gender.toUpperCase());
        }

        if (address !== undefined) {
            updates.push('address = ?');
            values.push(address || null);
        }

        // Nếu không có gì để update
        if (updates.length === 0) {
            return existingEmployee;
        }

        // Execute UPDATE
        const sql = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        await query(sql, values);

        // Lấy employee sau khi update
        const updatedEmployee = await getEmployeeById(id);
        return updatedEmployee;
    } catch (error) {
        console.error('Error in updateEmployee:', error);
        throw error;
    }
}

// ================ DELETE OPERATIONS ================

/**
 * Soft delete employee (set deleted_at)
 * @param {number} id - Employee ID
 * @returns {Promise<Object>} - Result object
 */
export async function deleteEmployee(id) {
    try {
        // Check employee tồn tại
        const employee = await getEmployeeById(id);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Check xem employee có đang được sử dụng trong admins không
        const [admins] = await query(
            'SELECT id FROM admins WHERE employee_id = ? AND is_active = 1',
            [id]
        );

        if (admins) {
            throw new Error('Cannot delete employee: This employee has active admin account(s)');
        }

        // Soft delete
        await query(
            'UPDATE employees SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        return {
            success: true,
            message: 'Employee soft deleted successfully',
            id: id
        };
    } catch (error) {
        console.error('Error in deleteEmployee:', error);
        throw error;
    }
}

/**
 * Hard delete employee (xóa vĩnh viễn khỏi database)
 * ⚠️ CẨN THẬN: Không thể khôi phục!
 * @param {number} id - Employee ID
 * @returns {Promise<Object>} - Result object
 */
export async function hardDeleteEmployee(id) {
    try {
        // Check employee tồn tại
        const employee = await getEmployeeById(id, true); // Include deleted
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Check xem employee có đang được sử dụng trong admins không
        const admins = await query(
            'SELECT id, username FROM admins WHERE employee_id = ?',
            [id]
        );

        if (admins.length > 0) {
            const usernames = admins.map(a => a.username).join(', ');
            throw new Error(
                `Cannot hard delete employee: This employee is referenced by admin account(s): ${usernames}. ` +
                `Please delete or reassign those admins first.`
            );
        }

        // Soft delete instead of hard delete
        await query('UPDATE employees SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);

        return {
            success: true,
            message: 'Employee deleted successfully',
            id: id
        };
    } catch (error) {
        console.error('Error in hardDeleteEmployee:', error);
        throw error;
    }
}

/**
 * Restore soft-deleted employee
 * @param {number} id - Employee ID
 * @returns {Promise<Object>} - Restored employee
 */
export async function restoreEmployee(id) {
    try {
        // Check employee đã bị soft delete
        const employee = await getEmployeeById(id, true);
        if (!employee) {
            throw new Error('Employee not found');
        }

        if (!employee.deleted_at) {
            throw new Error('Employee is not deleted');
        }

        // Restore
        await query(
            'UPDATE employees SET deleted_at = NULL WHERE id = ?',
            [id]
        );

        const restoredEmployee = await getEmployeeById(id);
        return restoredEmployee;
    } catch (error) {
        console.error('Error in restoreEmployee:', error);
        throw error;
    }
}

// ================ STATISTICS ================

/**
 * Lấy thống kê employees
 * @returns {Promise<Object>} - Statistics object
 */
export async function getEmployeeStats() {
    try {
        const [stats] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted,
                SUM(CASE WHEN gender = 'MALE' AND deleted_at IS NULL THEN 1 ELSE 0 END) as male,
                SUM(CASE WHEN gender = 'FEMALE' AND deleted_at IS NULL THEN 1 ELSE 0 END) as female,
                SUM(CASE WHEN gender = 'OTHER' AND deleted_at IS NULL THEN 1 ELSE 0 END) as other
            FROM employees
        `);

        return stats;
    } catch (error) {
        console.error('Error in getEmployeeStats:', error);
        throw error;
    }
}
