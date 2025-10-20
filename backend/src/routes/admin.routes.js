import express from 'express';
import {
    loginAdmin,
    getLoginAdmin,
    registerAdminController,
    // CRUD controllers
    getAllAdminsController,
    getAdminByIdController,
    searchAdminsController,
    updateAdminController,
    changePasswordController,
    resetPasswordByOwnerController,
    deactivateAdminController,
    activateAdminController,
    deleteAdminController,
    hardDeleteAdminController,
    restoreAdminController,
    getAdminStatsController,
    getAdminWithEmployeeController
} from '../controllers/admin.controller.js';
import { verifyToken, verifyRole, verifySelfOrOwner, verifyRoleChangePermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.post('/login', loginAdmin);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// OWNER ONLY - Register new admin
router.post('/register-admin', verifyToken, verifyRole(['OWNER']), registerAdminController);

// OWNER/MANAGER - Get login history
router.get('/man/logins', verifyToken, verifyRole(['OWNER', 'MANAGER']), getLoginAdmin);

// ============================================
// CRUD ROUTES (OWNER/MANAGER can view)
// ============================================

// Statistics (OWNER/MANAGER only)
router.get('/stats', verifyToken, verifyRole(['OWNER', 'MANAGER']), getAdminStatsController);

// Search (OWNER/MANAGER only)
router.get('/search', verifyToken, verifyRole(['OWNER', 'MANAGER']), searchAdminsController);

// Get all admins (OWNER/MANAGER only)
router.get('/', verifyToken, verifyRole(['OWNER', 'MANAGER']), getAllAdminsController);

// Get admin by ID (Any authenticated admin can view)
router.get('/:id', verifyToken, getAdminByIdController);

// Get admin with employee details (Any authenticated admin can view)
router.get('/:id/employee', verifyToken, getAdminWithEmployeeController);

// ============================================
// UPDATE ROUTES
// ============================================

// Update admin (Self or OWNER only, with role change validation)
router.put('/:id', verifyToken, verifySelfOrOwner(true), verifyRoleChangePermission, updateAdminController);

// ============================================
// PASSWORD MANAGEMENT ROUTES
// ============================================

// Change own password (Self only - requires old password)
router.put('/:id/password', verifyToken, verifySelfOrOwner(false), changePasswordController);

// Reset password by OWNER (OWNER only - no old password required)
router.put('/:id/reset-password', verifyToken, verifyRole(['OWNER']), resetPasswordByOwnerController);

// ============================================
// ACTIVATE/DEACTIVATE ROUTES (OWNER only)
// ============================================

router.put('/:id/deactivate', verifyToken, verifyRole(['OWNER']), deactivateAdminController);
router.put('/:id/activate', verifyToken, verifyRole(['OWNER']), activateAdminController);

// ============================================
// DELETE & RESTORE ROUTES (OWNER only)
// ============================================

// Restore (OWNER only)
router.post('/:id/restore', verifyToken, verifyRole(['OWNER']), restoreAdminController);

// Soft delete (OWNER only)
router.delete('/:id', verifyToken, verifyRole(['OWNER']), deleteAdminController);

// Hard delete (OWNER only)
router.delete('/:id/permanent', verifyToken, verifyRole(['OWNER']), hardDeleteAdminController);

export default router;
