import {
    getAllEmployees,
    getEmployeeById,
    searchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    hardDeleteEmployee,
    restoreEmployee,
    getEmployeeStats
} from '../services/employee.service.js';

// ================ READ OPERATIONS ================

/**
 * GET /api/employees
 * Lấy danh sách tất cả employees
 */
export async function getAllEmployeesController(req, res) {
    try {
        const { includeDeleted } = req.query;

        const employees = await getAllEmployees({
            includeDeleted: includeDeleted === 'true'
        });

        res.status(200).json({
            status: 200,
            message: 'Employees retrieved successfully',
            data: employees
        });
    } catch (error) {
        console.error('Error in getAllEmployeesController:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve employees',
            error: error.message
        });
    }
}

/**
 * GET /api/employees/:id
 * Lấy chi tiết một employee theo ID
 */
export async function getEmployeeByIdController(req, res) {
    try {
        const { id } = req.params;
        const { includeDeleted } = req.query;

        const employee = await getEmployeeById(
            parseInt(id),
            includeDeleted === 'true'
        );

        if (!employee) {
            return res.status(404).json({
                status: 404,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            status: 200,
            message: 'Employee retrieved successfully',
            data: employee
        });
    } catch (error) {
        console.error('Error in getEmployeeByIdController:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve employee',
            error: error.message
        });
    }
}

/**
 * GET /api/employees/search
 * Tìm kiếm employees theo tên, phone, email
 */
export async function searchEmployeesController(req, res) {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                status: 400,
                message: 'Search term (q) is required'
            });
        }

        const employees = await searchEmployees(q);

        res.status(200).json({
            status: 200,
            message: `Found ${employees.length} employee(s)`,
            data: employees
        });
    } catch (error) {
        console.error('Error in searchEmployeesController:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to search employees',
            error: error.message
        });
    }
}

/**
 * GET /api/employees/stats
 * Lấy thống kê employees
 */
export async function getEmployeeStatsController(req, res) {
    try {
        const stats = await getEmployeeStats();

        res.status(200).json({
            status: 200,
            message: 'Employee statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error in getEmployeeStatsController:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to retrieve employee statistics',
            error: error.message
        });
    }
}

// ================ CREATE OPERATIONS ================

/**
 * POST /api/employees
 * Tạo employee mới
 */
export async function createEmployeeController(req, res) {
    try {
        const { name, phone, email, gender, address } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                status: 400,
                message: 'Employee name is required'
            });
        }

        // Validate email format nếu có
        if (email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid email format'
                });
            }
        }

        // Validate phone format nếu có (10-11 số)
        if (phone && phone.trim() !== '') {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(phone.replace(/[-()\s]/g, ''))) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid phone number format (10-11 digits)'
                });
            }
        }

        const newEmployee = await createEmployee({
            name,
            phone: phone || null,
            email: email || null,
            gender: gender || 'OTHER',
            address: address || null
        });

        res.status(201).json({
            status: 201,
            message: 'Employee created successfully',
            data: newEmployee
        });
    } catch (error) {
        console.error('Error in createEmployeeController:', error);

        // Handle specific errors
        if (error.message.includes('already exists')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        if (error.message.includes('Invalid gender')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to create employee',
            error: error.message
        });
    }
}

// ================ UPDATE OPERATIONS ================

/**
 * PUT /api/employees/:id
 * Cập nhật thông tin employee
 */
export async function updateEmployeeController(req, res) {
    try {
        const { id } = req.params;
        const { name, phone, email, gender, address } = req.body;

        // Validate email format nếu có
        if (email !== undefined && email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid email format'
                });
            }
        }

        // Validate phone format nếu có
        if (phone !== undefined && phone && phone.trim() !== '') {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(phone.replace(/[-()\s]/g, ''))) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid phone number format (10-11 digits)'
                });
            }
        }

        const updatedEmployee = await updateEmployee(parseInt(id), {
            name,
            phone,
            email,
            gender,
            address
        });

        res.status(200).json({
            status: 200,
            message: 'Employee updated successfully',
            data: updatedEmployee
        });
    } catch (error) {
        console.error('Error in updateEmployeeController:', error);

        // Handle specific errors
        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('already exists')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        if (error.message.includes('Invalid gender')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to update employee',
            error: error.message
        });
    }
}

// ================ DELETE OPERATIONS ================

/**
 * DELETE /api/employees/:id
 * Soft delete employee
 */
export async function deleteEmployeeController(req, res) {
    try {
        const { id } = req.params;

        const result = await deleteEmployee(parseInt(id));

        res.status(200).json({
            status: 200,
            message: result.message,
            data: { id: result.id }
        });
    } catch (error) {
        console.error('Error in deleteEmployeeController:', error);

        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('Cannot delete employee')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to delete employee',
            error: error.message
        });
    }
}

/**
 * DELETE /api/employees/:id/permanent
 * Hard delete employee (xóa vĩnh viễn)
 * ⚠️ CẨN THẬN: Không thể khôi phục!
 */
export async function hardDeleteEmployeeController(req, res) {
    try {
        const { id } = req.params;

        const result = await hardDeleteEmployee(parseInt(id));

        res.status(200).json({
            status: 200,
            message: result.message,
            data: { id: result.id }
        });
    } catch (error) {
        console.error('Error in hardDeleteEmployeeController:', error);

        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message.includes('Cannot hard delete employee')) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to permanently delete employee',
            error: error.message
        });
    }
}

/**
 * POST /api/employees/:id/restore
 * Restore soft-deleted employee
 */
export async function restoreEmployeeController(req, res) {
    try {
        const { id } = req.params;

        const restoredEmployee = await restoreEmployee(parseInt(id));

        res.status(200).json({
            status: 200,
            message: 'Employee restored successfully',
            data: restoredEmployee
        });
    } catch (error) {
        console.error('Error in restoreEmployeeController:', error);

        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 404,
                message: error.message
            });
        }

        if (error.message === 'Employee is not deleted') {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Failed to restore employee',
            error: error.message
        });
    }
}
