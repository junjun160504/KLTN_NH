import express from 'express';
import {
    loginAdmin,
    validateTokenController,
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
import { verifyToken, verifyRole, verifySelfOrOwner, verifyRoleChangePermission, verifyManagementHierarchy } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.post('/login', loginAdmin);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Validate token - Check if token is still valid
router.get('/validate', verifyToken, validateTokenController);

// OWNER/MANAGER - Register new admin (with hierarchy check)
router.post('/register-admin', verifyToken, verifyRole(['OWNER', 'MANAGER']), verifyManagementHierarchy, registerAdminController);

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

// Reset password by OWNER/MANAGER (with hierarchy check in controller)
router.put('/:id/reset-password', verifyToken, verifyRole(['OWNER', 'MANAGER']), resetPasswordByOwnerController);

// ============================================
// ACTIVATE/DEACTIVATE ROUTES (OWNER/MANAGER with hierarchy)
// ============================================

router.put('/:id/deactivate', verifyToken, verifyRole(['OWNER', 'MANAGER']), deactivateAdminController);
router.put('/:id/activate', verifyToken, verifyRole(['OWNER', 'MANAGER']), activateAdminController);

// ============================================
// DELETE & RESTORE ROUTES (OWNER/MANAGER with hierarchy)
// ============================================

// Restore (OWNER/MANAGER with hierarchy check in controller)
router.post('/:id/restore', verifyToken, verifyRole(['OWNER', 'MANAGER']), restoreAdminController);

// Soft delete (OWNER/MANAGER with hierarchy check in controller)
router.delete('/:id', verifyToken, verifyRole(['OWNER', 'MANAGER']), deleteAdminController);

// Hard delete (OWNER/MANAGER with hierarchy check in controller)
router.delete('/:id/permanent', verifyToken, verifyRole(['OWNER', 'MANAGER']), hardDeleteAdminController);

export default router;
