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

const router = express.Router();

// ================ STATISTICS & SEARCH (đặt trước các route parameterized) ================

// GET /api/employees/stats - Lấy thống kê employees
router.get('/stats', getEmployeeStatsController);

// GET /api/employees/search?q=keyword - Tìm kiếm employees
router.get('/search', searchEmployeesController);

// ================ READ OPERATIONS ================

// GET /api/employees - Lấy tất cả employees
router.get('/', getAllEmployeesController);

// GET /api/employees/:id - Lấy chi tiết employee
router.get('/:id', getEmployeeByIdController);

// ================ CREATE OPERATIONS ================

// POST /api/employees - Tạo employee mới
router.post('/', createEmployeeController);

// ================ UPDATE OPERATIONS ================

// PUT /api/employees/:id - Cập nhật employee
router.put('/:id', updateEmployeeController);

// ================ DELETE & RESTORE OPERATIONS ================

// POST /api/employees/:id/restore - Restore soft-deleted employee
router.post('/:id/restore', restoreEmployeeController);

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', deleteEmployeeController);

// DELETE /api/employees/:id/permanent - Hard delete employee (CẨN THẬN!)
router.delete('/:id/permanent', hardDeleteEmployeeController);

export default router;
