import express from "express";
import {
    createOrUpdateCustomerController,
    getAllCustomersController,
    getCustomerByIdController,
    getCustomerByIdentifierController,
    updateCustomerController,
    updateLoyaltyPointsController,
    getCustomerOrderHistoryController,
    calculatePointsController,
    deleteCustomerController,
} from "../controllers/customer.controller.js";
import { verifyToken, verifyRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ========================================
// 🌐 PUBLIC ENDPOINTS (Không cần auth)
// ========================================

/**
 * POST /api/customers
 * Tạo hoặc cập nhật thông tin khách hàng
 * Body: { phone, name?, email? }
 */
router.post("/", createOrUpdateCustomerController);

/**
 * GET /api/customers/me/:identifier
 * Lấy thông tin khách hàng theo phone hoặc email
 * Params: identifier (phone hoặc email)
 */
router.get("/me/:identifier", getCustomerByIdentifierController);

/**
 * POST /api/customers/calculate-points
 * Tính điểm thưởng từ số tiền order
 * Body: { orderAmount }
 */
router.post("/calculate-points", calculatePointsController);

// ========================================
// 🔒 ADMIN ENDPOINTS (OWNER, MANAGER)
// ========================================

/**
 * GET /api/customers
 * Lấy danh sách tất cả khách hàng
 * Access: OWNER, MANAGER
 */
router.get("/", verifyToken, verifyRole(["OWNER", "MANAGER"]), getAllCustomersController);

/**
 * GET /api/customers/:id
 * Lấy thông tin chi tiết 1 khách hàng
 * Access: OWNER, MANAGER
 */
router.get("/:id", verifyToken, verifyRole(["OWNER", "MANAGER"]), getCustomerByIdController);

/**
 * PUT /api/customers/:id
 * Cập nhật thông tin khách hàng
 * Access: OWNER, MANAGER
 * Body: { name?, email?, phone? }
 */
router.put("/:id", verifyToken, verifyRole(["OWNER", "MANAGER"]), updateCustomerController);

/**
 * PUT /api/customers/:id/points
 * Cập nhật điểm thưởng (Loyalty Points)
 * Access: OWNER, MANAGER
 * Body: { points, operation: 'ADD' | 'SUBTRACT' | 'SET' }
 */
router.put("/:id/points", verifyToken, verifyRole(["OWNER", "MANAGER"]), updateLoyaltyPointsController);

/**
 * GET /api/customers/:id/history
 * Lấy lịch sử order của khách hàng
 * Access: OWNER, MANAGER
 */
router.get("/:id/history", verifyToken, verifyRole(["OWNER", "MANAGER"]), getCustomerOrderHistoryController);

/**
 * DELETE /api/customers/:id
 * Xóa khách hàng (soft delete)
 * Access: OWNER, MANAGER
 */
router.delete("/:id", verifyToken, verifyRole(["OWNER", "MANAGER"]), deleteCustomerController);

export default router;
