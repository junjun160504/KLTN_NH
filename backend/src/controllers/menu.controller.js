import * as menuService from "../services/menu.service.js";

// Lấy danh sách món (theo tên hoặc all)
export async function getMenuItems(req, res) {
  try {
    const { name } = req.params;
    const items = await menuService.getAllMenuItems(name);
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("getMenuItems error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Thêm món mới (admin)
export async function createMenuItem(req, res) {
  try {
    const newItem = await menuService.addMenuItem(req.body);
    res.status(201).json({ status: 201, data: newItem });
  } catch (err) {
    console.error("createMenuItem error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy danh mục món
export async function getMenuCategories(req, res) {
  try {
    const categories = await menuService.getMenuCategories();
    res.status(201).json({ status: 201, data: categories });
  } catch (err) {
    console.error("createMenuCategory error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy món theo category
export async function getItemsByCategory(req, res) {
  try {
    const { id } = req.params;
    const items = await menuService.getItemsByCategory(id);
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("getItemsByCategory error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy tất cả món (admin)
export async function getAllItemsController(req, res) {
  try {
    const items = await menuService.getAllItems();
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error("getAllItemsController error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

// Lấy chi tiết món ăn kèm reviews
export async function getMenuItemDetail(req, res) {
  try {
    const { id } = req.params;
    const item = await menuService.getMenuItemDetail(id);

    if (!item) {
      return res.status(404).json({
        status: 404,
        message: "Menu item not found"
      });
    }

    res.json({ status: 200, data: item });
  } catch (err) {
    console.error("getMenuItemDetail error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// ================ MENU ITEM CRUD CONTROLLERS ================

// Cập nhật món ăn (Update)
export async function updateMenuItem(req, res) {
  try {
    const { id } = req.params;
    const { name, price, description, category_id, image_url, is_available } = req.body;

    // Validation: Kiểm tra price nếu có
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid price value"
      });
    }

    const updatedItem = await menuService.updateMenuItem(id, {
      name,
      price,
      description,
      category_id,
      image_url,
      is_available
    });

    res.json({
      status: 200,
      message: "Menu item updated successfully",
      data: updatedItem
    });
  } catch (err) {
    console.error("updateMenuItem error:", err);

    if (err.message === "Menu item not found") {
      return res.status(404).json({
        status: 404,
        message: "Menu item not found"
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Xóa mềm món ăn (Soft Delete)
export async function deleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    const result = await menuService.deleteMenuItem(id);

    res.json({
      status: 200,
      message: "Menu item deleted successfully",
      data: { id: parseInt(id) }
    });
  } catch (err) {
    console.error("deleteMenuItem error:", err);

    if (err.message === "Menu item not found") {
      return res.status(404).json({
        status: 404,
        message: "Menu item not found"
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Xóa vĩnh viễn món ăn (Hard Delete)
export async function hardDeleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    const result = await menuService.hardDeleteMenuItem(id);

    res.json({
      status: 200,
      message: "Menu item permanently deleted",
      data: { id: parseInt(id) }
    });
  } catch (err) {
    console.error("hardDeleteMenuItem error:", err);

    if (err.message === "Menu item not found") {
      return res.status(404).json({
        status: 404,
        message: "Menu item not found"
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// ================ END MENU ITEM CRUD ================


// ================ CATEGORY CRUD CONTROLLERS ================

// Lấy chi tiết một danh mục theo ID (Read One)
export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const category = await menuService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        status: 404,
        message: "Category not found"
      });
    }

    res.json({ status: 200, data: category });
  } catch (err) {
    console.error("getCategoryById error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Tạo danh mục mới (Create)
export async function createCategory(req, res) {
  try {
    const { name, description, is_available } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Category name is required"
      });
    }

    const newCategory = await menuService.createCategory({
      name: name.trim(),
      description,
      is_available
    });

    res.status(201).json({
      status: 201,
      message: "Category created successfully",
      data: newCategory
    });
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Cập nhật danh mục (Update)
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description, is_available } = req.body;

    // Validation
    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Category name cannot be empty"
      });
    }

    const updatedCategory = await menuService.updateCategory(id, {
      name: name ? name.trim() : undefined,
      description,
      is_available
    });

    res.json({
      status: 200,
      message: "Category updated successfully",
      data: updatedCategory
    });
  } catch (err) {
    console.error("updateCategory error:", err);

    if (err.message === "Category not found") {
      return res.status(404).json({
        status: 404,
        message: "Category not found"
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Xóa mềm danh mục (Soft Delete)
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const result = await menuService.deleteCategory(id);

    res.json({
      status: 200,
      message: result.message,
      data: { id: result.id }
    });
  } catch (err) {
    console.error("deleteCategory error:", err);

    if (err.message === "Category not found") {
      return res.status(404).json({
        status: 404,
        message: "Category not found"
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Xóa vĩnh viễn danh mục (Hard Delete) - Admin only, cẩn thận!
export async function hardDeleteCategory(req, res) {
  try {
    const { id } = req.params;
    const result = await menuService.hardDeleteCategory(id);

    res.json({
      status: 200,
      message: result.message,
      data: { id: result.id }
    });
  } catch (err) {
    console.error("hardDeleteCategory error:", err);

    if (err.message === "Category not found") {
      return res.status(404).json({
        status: 404,
        message: "Category not found"
      });
    }

    res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// ================ END CATEGORY CRUD CONTROLLERS ================

// ================ EXCEL CONTROLLERS ================

/**
 * Export categories to Excel
 */
export async function exportCategoriesToExcel(req, res) {
  try {
    const { includeDeleted } = req.query;
    const includeDeletedBool = includeDeleted === 'true';

    const excelBuffer = await menuService.exportCategoriesToExcel(includeDeletedBool);

    // Set headers cho file download
    const filename = `categories_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (err) {
    console.error("exportCategoriesToExcel error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: err.message
    });
  }
}

/**
 * Download Excel template
 */
export async function downloadExcelTemplate(req, res) {
  try {
    const templateBuffer = await menuService.generateExcelTemplate();

    // Set headers cho file download
    const filename = 'categories_template.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', templateBuffer.length);

    res.send(templateBuffer);
  } catch (err) {
    console.error("downloadExcelTemplate error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: err.message
    });
  }
}

/**
 * Import categories from Excel
 */
export async function importCategoriesFromExcel(req, res) {
  try {
    // Kiểm tra file có được upload không
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: "No file uploaded. Please upload an Excel file."
      });
    }

    // Kiểm tra file extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid file format. Please upload an Excel file (.xlsx or .xls)"
      });
    }

    // Get options from query params
    const options = {
      updateExisting: req.body.updateExisting === 'true',
      skipDuplicate: req.body.skipDuplicate === 'true'
    };

    // Import data
    const results = await menuService.importCategoriesFromExcel(req.file.buffer, options);

    // Determine status code based on results
    const statusCode = results.failed > 0 ? 207 : 200; // 207 Multi-Status

    res.status(statusCode).json({
      status: statusCode,
      message: "Import completed",
      data: results
    });
  } catch (err) {
    console.error("importCategoriesFromExcel error:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: err.message
    });
  }
}

// ================ END EXCEL CONTROLLERS ================

// ================ MENU ITEM EXCEL CONTROLLERS ================

/**
 * Export menu items to Excel
 */
export async function exportMenuItemsToExcel(req, res) {
  try {
    const buffer = await menuService.exportMenuItemsToExcel();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
      new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const filename = `menu_items_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("exportMenuItemsToExcel error:", err);
    res.status(500).json({
      status: 500,
      message: "Export failed",
      error: err.message
    });
  }
}

/**
 * Download Excel template for menu items import
 */
export async function downloadMenuItemExcelTemplate(req, res) {
  try {
    const buffer = await menuService.generateMenuItemExcelTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="menu_item_import_template.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error("downloadMenuItemExcelTemplate error:", err);
    res.status(500).json({
      status: 500,
      message: "Template generation failed",
      error: err.message
    });
  }
}

/**
 * Import menu items from Excel
 */
export async function importMenuItemsFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: "No file uploaded"
      });
    }

    const fileBuffer = req.file.buffer;
    const options = {
      updateExisting: req.body.updateExisting === 'true',
      skipDuplicate: req.body.skipDuplicate === 'true'
    };

    const results = await menuService.importMenuItemsFromExcel(fileBuffer, options);

    // Determine response status based on results
    const status = results.failed > 0 ? 400 : 201;
    const message = results.failed > 0
      ? 'Import completed with errors'
      : 'Import completed successfully';

    res.status(status).json({
      status,
      message,
      data: results
    });
  } catch (err) {
    console.error("importMenuItemsFromExcel error:", err);
    res.status(500).json({
      status: 500,
      message: "Import failed",
      error: err.message
    });
  }
}

// ================ END MENU ITEM EXCEL CONTROLLERS ================
