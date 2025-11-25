import express from 'express';
import {
    getAllEmployeesController,
    getEmployeeByIdController,
    searchEmployeesController,
    getEmployeeStatsController,
    createEmployeeController,
    updateEmployeeController,
    deleteEmployeeController,
    hardDeleteEmployeeController,
    restoreEmployeeController
} from '../controllers/employee.controller.js';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ================ STATISTICS & SEARCH (đặt trước các route parameterized) ================

// GET /api/employees/stats - Lấy thống kê employees
router.get('/stats', verifyToken, getEmployeeStatsController);

// GET /api/employees/search?q=keyword - Tìm kiếm employees
router.get('/search', verifyToken, searchEmployeesController);

// ================ READ OPERATIONS ================

// GET /api/employees - Lấy tất cả employees
router.get('/', verifyToken, getAllEmployeesController);

// GET /api/employees/:id - Lấy chi tiết employee
router.get('/:id', verifyToken, getEmployeeByIdController);

// ================ CREATE OPERATIONS ================

// POST /api/employees - Tạo employee mới
router.post('/', verifyToken, createEmployeeController);

// ================ UPDATE OPERATIONS ================

// PUT /api/employees/:id - Cập nhật employee
router.put('/:id', verifyToken, updateEmployeeController);

// ================ DELETE & RESTORE OPERATIONS ================

// POST /api/employees/:id/restore - Restore soft-deleted employee (OWNER only)
router.post('/:id/restore', verifyToken, verifyRole(['OWNER']), restoreEmployeeController);

// DELETE /api/employees/:id - Soft delete employee (OWNER only)
router.delete('/:id', verifyToken, verifyRole(['OWNER']), deleteEmployeeController);

// DELETE /api/employees/:id/permanent - Hard delete employee (OWNER only)
router.delete('/:id/permanent', verifyToken, verifyRole(['OWNER']), hardDeleteEmployeeController);

export default router;
