import express from "express";
import {
  getMenuItems,
  createMenuItem,
  getMenuCategories,
  getItemsByCategory,
  getMenuItemDetail,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
  exportCategoriesToExcel,
  downloadExcelTemplate,
  importCategoriesFromExcel,
  updateMenuItem,
  deleteMenuItem,
  hardDeleteMenuItem,
  exportMenuItemsToExcel,
  downloadMenuItemExcelTemplate,
  importMenuItemsFromExcel,
} from "../controllers/menu.controller.js";
import { uploadExcel, handleUploadError } from "../middlewares/upload.middleware.js";
import {
  uploadMenuImage,
  handleImageUploadError,
  processCloudinaryUpload
} from "../middlewares/cloudinaryUpload.middleware.js";
import { verifyToken, verifyRole } from "../middlewares/auth.middleware.js";

console.log("Mounting /api/menu routes...");
const router = express.Router();

// ================ CATEGORY ROUTES ================

// Khách hàng xem danh sách danh mục (PUBLIC)
router.get("/cus/menus/categories", getMenuCategories);

// Admin: Lấy chi tiết một danh mục theo ID
router.get("/admin/categories/:id", verifyToken, getCategoryById);

// Admin: Tạo danh mục mới - OWNER, MANAGER only
router.post("/admin/categories", verifyToken, verifyRole(['OWNER', 'MANAGER']), createCategory);

// Admin: Cập nhật danh mục - OWNER, MANAGER only
router.put("/admin/categories/:id", verifyToken, verifyRole(['OWNER', 'MANAGER']), updateCategory);

// Admin: Xóa mềm danh mục (soft delete) - OWNER, MANAGER only
router.delete("/admin/categories/:id", verifyToken, verifyRole(['OWNER', 'MANAGER']), deleteCategory);

// Admin: Xóa vĩnh viễn danh mục (hard delete) - OWNER only
router.delete("/admin/categories/:id/permanent", verifyToken, verifyRole(['OWNER']), hardDeleteCategory);

// ================ EXCEL ROUTES ================

// Admin: Export categories to Excel
router.get("/admin/categories/export/excel", verifyToken, exportCategoriesToExcel);

// Admin: Download Excel template
router.get("/admin/categories/template/excel", verifyToken, downloadExcelTemplate);

// Admin: Import categories from Excel
router.post("/admin/categories/import/excel", verifyToken, uploadExcel, handleUploadError, importCategoriesFromExcel);

// ================ MENU ITEM ROUTES ================

// Admin: Excel operations cho Menu Items
// Note: Đặt Excel routes TRƯỚC các parameterized routes để tránh conflict

// Admin: Export menu items to Excel
router.get("/admin/menus/export/excel", verifyToken, exportMenuItemsToExcel);

// Admin: Download menu item Excel template
router.get("/admin/menus/template/excel", verifyToken, downloadMenuItemExcelTemplate);

// Admin: Import menu items from Excel
router.post("/admin/menus/import/excel", verifyToken, uploadExcel, handleUploadError, importMenuItemsFromExcel);

// Khách hàng xem chi tiết món ăn (với reviews) - PUBLIC
router.get("/cus/menus/item/:id", getMenuItemDetail);
// Khách hàng xem món theo danh mục - PUBLIC
// Đặt các route tĩnh trước
router.get("/cus/menus/category/:id", getItemsByCategory);
// Sau cùng mới đặt route động - PUBLIC
router.get("/cus/menus/:name", getMenuItems);




// Admin: thêm món (với upload ảnh lên Cloudinary)
router.post("/admin/menus", verifyToken, verifyRole(['OWNER', 'MANAGER']), uploadMenuImage, handleImageUploadError, processCloudinaryUpload, createMenuItem);

// Admin: cập nhật món (với upload ảnh lên Cloudinary) - OWNER, MANAGER only
router.put("/admin/menus/:id", verifyToken, verifyRole(['OWNER', 'MANAGER']), uploadMenuImage, handleImageUploadError, processCloudinaryUpload, updateMenuItem);

// Admin: xóa mềm món (soft delete) - OWNER, MANAGER only
router.delete("/admin/menus/:id", verifyToken, verifyRole(['OWNER', 'MANAGER']), deleteMenuItem);

// Admin: xóa vĩnh viễn món (hard delete) - OWNER only
router.delete("/admin/menus/:id/permanent", verifyToken, verifyRole(['OWNER']), hardDeleteMenuItem);

export default router;
