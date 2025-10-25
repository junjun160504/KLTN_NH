import { pool, query } from "../config/db.js";
import ExcelJS from 'exceljs';

// Lấy danh sách món theo tên (cho khách hàng)
export async function getAllMenuItems(name) {
  let sql = "";
  let params = [];

  if (name && name !== "all") {
    sql = `select mi.id, mi.name, mi.price, mi.description, mi.image_url, mi.is_available,
    mc.id as categoryId, mc.name as categoryName
    from menu_items mi
    left join menu_item_categories mic on mi.id = mic.item_id
    left join menu_categories mc on mc.id = mic.category_id
    where mi.name LIKE ?`;
    params.push(`%${name}%`);
  } else {
    sql = `select mi.id, mi.name, mi.price, mi.description, mi.image_url, mi.is_available,
    mc.id as categoryId, mc.name as categoryName
    from menu_items mi
    left join menu_item_categories mic on mi.id = mic.item_id
    left join menu_categories mc on mc.id = mic.category_id`;
  }

  const itemsMap = {};
  const [rows] = await pool.query(sql, params);
  rows.forEach(row => {
    const id = row.id;
    if (!itemsMap[id]) {
      itemsMap[id] = {
        id: row.id,
        name: row.name,
        price: row.price,
        description: row.description,
        image_url: row.image_url,
        is_available: row.is_available,
        categories: []
      }
    }
    if (row.categoryId && row.categoryName) {
      itemsMap[id].categories.push({
        id: row.categoryId,
        name: row.categoryName
      });
    }
  })


  return Object.values(itemsMap);
}


// Thêm món mới (Admin) - Hỗ trợ nhiều categories
export async function addMenuItem({ name, price, description, category, image_url, is_available }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert món
    const [result] = await conn.query(
      `INSERT INTO menu_items (name, price, description, image_url, is_available)
       VALUES (?, ?, ?, ?, ?)`,
      [name, price, description || null, image_url || null, is_available ?? true]
    );

    const itemId = result.insertId;

    // 2. Insert quan hệ món ↔ nhiều danh mục
    if (category && Array.isArray(category) && category.length > 0) {
      const values = category.map(catId => [itemId, catId]);
      await conn.query(
        "INSERT INTO menu_item_categories (item_id, category_id) VALUES ?",
        [values]
      );
    }

    await conn.commit();
    return { id: itemId, name, price, category };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Lấy một menu item theo ID (helper function)
export async function getMenuItemById(id) {
  const sql =
    `
    SELECT 
      mi.id, mi.name, mi.price, mi.description, mi.image_url, mi.is_available,
      mc.id AS categoryId, mc.name AS categoryName
    FROM menu_items mi
    JOIN menu_item_categories mic ON mi.id = mic.item_id
    JOIN menu_categories mc ON mc.id = mic.category_id
    WHERE mi.id = ?
    `
  const [rows] = await pool.query(sql, [id]);
  const itemsMap = {};
  rows.forEach(row => {
    const itemId = row.id;
    if (!itemsMap[itemId]) {
      itemsMap[itemId] = {
        id: row.id,
        name: row.name,
        price: row.price,
        description: row.description,
        image_url: row.image_url,
        is_available: row.is_available,
        categories: []
      }
    }
    if (row.categoryId && row.categoryName) {
      itemsMap[itemId].categories.push({
        id: row.categoryId,
        name: row.categoryName
      });
    }
  })
  return Object.values(itemsMap)[0] || null;
}

// Cập nhật món ăn (Update) - Hỗ trợ nhiều categories
export async function updateMenuItem(id, { name, price, description, category, image_url, is_available }) {
  const conn = await pool.getConnection();
  try {
    // Kiểm tra menu item có tồn tại không
    const existingItem = await getMenuItemById(id);
    if (!existingItem) {
      throw new Error("Menu item not found");
    }

    await conn.beginTransaction();

    // 1. Update thông tin món
    await conn.query(
      `UPDATE menu_items 
       SET name = ?, price = ?, description = ?, image_url = ?, is_available = ?
       WHERE id = ?`,
      [
        name ?? existingItem.name,
        price ?? existingItem.price,
        description ?? existingItem.description,
        image_url ?? existingItem.image_url,
        is_available ?? existingItem.is_available,
        id
      ]
    );

    // 2. Update categories nếu có thay đổi
    if (category !== undefined) {
      // Xóa tất cả categories cũ
      await conn.query("DELETE FROM menu_item_categories WHERE item_id = ?", [id]);

      // Thêm các categories mới (nếu có)
      if (category && Array.isArray(category) && category.length > 0) {
        const values = category.map(catId => [id, catId]);
        await conn.query(
          "INSERT INTO menu_item_categories (item_id, category_id) VALUES ?",
          [values]
        );
      }
    }

    await conn.commit();

    // Trả về menu item đã update
    return await getMenuItemById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Xóa mềm món ăn (Soft Delete)
export async function deleteMenuItem(id) {
  // Kiểm tra menu item có tồn tại không
  const existingItem = await getMenuItemById(id);
  if (!existingItem) {
    throw new Error("Menu item not found");
  }

  // Soft delete: chỉ set is_available = 0
  const sql = "UPDATE menu_items SET is_available = 0 WHERE id = ?";
  await query(sql, [id]);

  return { message: "Menu item deleted successfully", id };
}

// Xóa vĩnh viễn món ăn (Hard Delete) - Cẩn thận khi dùng!
export async function hardDeleteMenuItem(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Xóa các quan hệ món-danh mục
    await conn.query("DELETE FROM menu_item_categories WHERE item_id = ?", [id]);

    // 2. Xóa các reviews của món này (nếu có)
    await conn.query("DELETE FROM menu_reviews WHERE item_id = ?", [id]);

    // 3. Xóa món khỏi các đơn hàng cũ (tùy business logic, có thể giữ lại hoặc xóa)
    // Ở đây ta sẽ set item_id = NULL thay vì xóa để giữ lịch sử đơn hàng
    await conn.query("UPDATE order_items SET menu_item_id = NULL WHERE menu_item_id = ?", [id]);

    // 4. Xóa món
    const [result] = await conn.query("DELETE FROM menu_items WHERE id = ?", [id]);

    await conn.commit();

    if (result.affectedRows === 0) {
      throw new Error("Menu item not found");
    }

    return { message: "Menu item permanently deleted", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ================ CATEGORY CRUD OPERATIONS ================

// Lấy danh sách tất cả danh mục (Read All)
export async function getMenuCategories() {
  const sql = "SELECT * FROM menu_categories WHERE is_available = 1";
  const rows = await query(sql);
  return rows;
}

// Lấy chi tiết một danh mục theo ID (Read One)
export async function getCategoryById(id) {
  const sql = "SELECT * FROM menu_categories WHERE id = ?";
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

// Tạo danh mục mới (Create)
export async function createCategory({ name, description, is_available }) {
  const sql = `
    INSERT INTO menu_categories (name, description, is_available)
    VALUES (?, ?, ?)
  `;
  const result = await query(sql, [
    name,
    description || null,
    is_available ?? true
  ]);

  return {
    id: result.insertId,
    name,
    description,
    is_available: is_available ?? true
  };
}

// Cập nhật danh mục (Update)
export async function updateCategory(id, { name, description, is_available }) {
  // Kiểm tra category có tồn tại không
  const existingCategory = await getCategoryById(id);
  if (!existingCategory) {
    throw new Error("Category not found");
  }

  const sql = `
    UPDATE menu_categories 
    SET name = ?, description = ?, is_available = ?
    WHERE id = ?
  `;

  await query(sql, [
    name ?? existingCategory.name,
    description ?? existingCategory.description,
    is_available ?? existingCategory.is_available,
    id
  ]);

  // Trả về category đã update
  return await getCategoryById(id);
}

// Xóa mềm danh mục (Soft Delete)
export async function deleteCategory(id) {
  // Kiểm tra category có tồn tại không
  const existingCategory = await getCategoryById(id);
  if (!existingCategory) {
    throw new Error("Category not found");
  }

  // Soft delete: chỉ set is_available = false
  const sql = "UPDATE menu_categories SET is_available = 0 WHERE id = ?";
  await query(sql, [id]);

  return { message: "Category deleted successfully", id };
}

// Xóa vĩnh viễn danh mục (Hard Delete) - Cẩn thận khi dùng!
export async function hardDeleteCategory(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Xóa các quan hệ món-danh mục
    await conn.query(
      "DELETE FROM menu_item_categories WHERE category_id = ?",
      [id]
    );

    // 2. Xóa danh mục
    const [result] = await conn.query(
      "DELETE FROM menu_categories WHERE id = ?",
      [id]
    );

    await conn.commit();

    if (result.affectedRows === 0) {
      throw new Error("Category not found");
    }

    return { message: "Category permanently deleted", id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ================ END CATEGORY CRUD ================
// Lấy món theo category
export async function getItemsByCategory(id) {
  const sql =
    `
    SELECT 
      mi.id, mi.name, mi.price, mi.description, mi.image_url, mi.is_available,
      mc.id AS categoryId, mc.name AS categoryName
    FROM menu_items mi
    JOIN menu_item_categories mic ON mi.id = mic.item_id
    JOIN menu_categories mc ON mc.id = mic.category_id
    WHERE mic.category_id = ?
    `
  const [rows] = await pool.query(sql, [id]);
  const itemsMap = {};
  rows.forEach(row => {
    const itemId = row.id;
    if (!itemsMap[itemId]) {
      itemsMap[itemId] = {
        id: row.id,
        name: row.name,
        price: row.price,
        description: row.description,
        image_url: row.image_url,
        is_available: row.is_available,
        categories: []
      }
    }
    if (row.categoryId && row.categoryName) {
      itemsMap[itemId].categories.push({
        id: row.categoryId,
        name: row.categoryName
      });
    }
  })
  return Object.values(itemsMap);
}

// Lấy chi tiết món ăn kèm reviews và rating
export async function getMenuItemDetail(itemId) {
  const connection = await pool.getConnection();
  try {
    // 1. Get menu item info
    const [[item]] = await connection.query(
      `SELECT 
        mi.*,
        mc.id as category_id,
        mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_categories mc ON mc.id = mic.category_id
      WHERE mi.id = ?`,
      [itemId]
    );

    if (!item) return null;

    // 2. Get reviews statistics từ menu_reviews (không phải reviews)
    const [[stats]] = await connection.query(
      `SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM menu_reviews
      WHERE item_id = ?`,
      [itemId]
    );

    // 3. Get recent reviews (10 most recent)
    const [recentReviews] = await connection.query(
      `SELECT id, rating, comment, created_at
       FROM menu_reviews
       WHERE item_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [itemId]
    );

    // 4. Build response
    const avgRating = stats.average_rating ? parseFloat(Number(stats.average_rating).toFixed(1)) : 0;

    return {
      ...item,
      category: item.category_id ? {
        id: item.category_id,
        name: item.category_name
      } : null,
      reviews: {
        total: stats.total_reviews || 0,
        average_rating: avgRating,
        rating_distribution: {
          5: stats.rating_5 || 0,
          4: stats.rating_4 || 0,
          3: stats.rating_3 || 0,
          2: stats.rating_2 || 0,
          1: stats.rating_1 || 0
        },
        recent_reviews: recentReviews
      }
    };
  } finally {
    connection.release();
  }
}

// ================ EXCEL OPERATIONS ================



/**
 * Xuất danh sách categories ra Excel
 * @param {boolean} includeDeleted - Có xuất cả categories đã xóa mềm không
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function exportCategoriesToExcel(includeDeleted = false) {
  // Lấy dữ liệu từ database
  let sql = "SELECT * FROM menu_categories";
  if (!includeDeleted) {
    sql += " WHERE is_available = 1";
  }
  sql += " ORDER BY id ASC";

  const categories = await query(sql);

  // Tạo workbook và worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Categories');

  // Thiết lập columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tên danh mục', key: 'name', width: 30 },
    { header: 'Mô tả', key: 'description', width: 50 },
    { header: 'Trạng thái', key: 'is_available', width: 15 }
  ];

  // Style cho header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Thêm dữ liệu
  categories.forEach(category => {
    worksheet.addRow({
      id: category.id,
      name: category.name,
      description: category.description || '',
      is_available: category.is_available ? 'Hoạt động' : 'Đã ẩn'
    });
  });

  // Style cho các rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle' };
      row.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });

  // Tạo buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Tạo file Excel template để import
 * @returns {Promise<Buffer>} Excel template buffer
 */
export async function generateExcelTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Categories Template');

  // Thiết lập columns
  worksheet.columns = [
    { header: 'Tên danh mục *', key: 'name', width: 30 },
    { header: 'Mô tả', key: 'description', width: 50 },
    { header: 'Trạng thái (1=Hoạt động, 0=Ẩn)', key: 'is_available', width: 30 }
  ];

  // Style cho header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Thêm hướng dẫn
  worksheet.addRow({
    name: 'Món Việt',
    description: 'Các món ăn Việt Nam truyền thống',
    is_available: 1
  });

  worksheet.addRow({
    name: 'Món Tây',
    description: 'Các món ăn phương Tây',
    is_available: 1
  });

  worksheet.addRow({
    name: 'Đồ uống',
    description: 'Nước giải khát, trà, cà phê',
    is_available: 1
  });

  // Thêm note row
  const noteRow = worksheet.addRow(['', '', '']);
  noteRow.getCell(1).value = 'LƯU Ý:';
  noteRow.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } };

  worksheet.addRow(['- Cột "Tên danh mục" là bắt buộc (không được để trống)', '', '']);
  worksheet.addRow(['- Cột "Mô tả" là tùy chọn', '', '']);
  worksheet.addRow(['- Cột "Trạng thái": 1 = Hoạt động, 0 = Ẩn (mặc định là 1)', '', '']);
  worksheet.addRow(['- Xóa các dòng hướng dẫn này trước khi import', '', '']);

  // Merge cells cho note
  worksheet.mergeCells('A5:C5');
  worksheet.mergeCells('A6:C6');
  worksheet.mergeCells('A7:C7');
  worksheet.mergeCells('A8:C8');
  worksheet.mergeCells('A9:C9');

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Import categories từ Excel file
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export async function importCategoriesFromExcel(fileBuffer, options = {}) {
  const { updateExisting = false, skipDuplicate = false } = options;
  console.log("importCategoriesFromExcel options:", updateExisting, skipDuplicate);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    details: []
  };

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Bắt đầu từ row 2 (skip header)
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      // Skip empty rows
      if (!row.getCell(1).value) continue;

      results.total++;

      const categoryData = {
        name: row.getCell(1).value?.toString().trim(),
        description: row.getCell(2).value?.toString().trim() || null,
        is_available: row.getCell(3).value !== null ? parseInt(row.getCell(3).value) : 1
      };


      try {
        // Validation
        if (!categoryData.name || categoryData.name === '') {
          throw new Error('Tên danh mục không được để trống');
        }

        if (categoryData.name.length > 100) {
          throw new Error('Tên danh mục không được vượt quá 100 ký tự');
        }

        // Kiểm tra duplicate
        const [existing] = await conn.query(
          'SELECT id, name FROM menu_categories WHERE name = ?',
          [categoryData.name]
        );

        if (existing.length > 0) {
          if (updateExisting) {
            // Update existing category
            await conn.query(
              'UPDATE menu_categories SET description = ?, is_available = ? WHERE id = ?',
              [categoryData.description, categoryData.is_available, existing[0].id]
            );
            results.updated++;
            results.success++;
            results.details.push({
              row: i,
              name: categoryData.name,
              status: 'updated',
              id: existing[0].id
            });
          } else if (skipDuplicate) {
            // Skip duplicate
            results.skipped++;
            results.details.push({
              row: i,
              name: categoryData.name,
              status: 'skipped',
              reason: 'Danh mục đã tồn tại'
            });
          } else {
            throw new Error(`Danh mục "${categoryData.name}" đã tồn tại`);
          }
        } else {
          // Insert new category
          const [result] = await conn.query(
            'INSERT INTO menu_categories (name, description, is_available) VALUES (?, ?, ?)',
            [categoryData.name, categoryData.description, categoryData.is_available]
          );

          results.success++;
          results.details.push({
            row: i,
            name: categoryData.name,
            status: 'created',
            id: result.insertId
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i,
          name: categoryData.name || 'N/A',
          error: error.message
        });
      }
    }

    await conn.commit();

    return results;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// ================ END EXCEL OPERATIONS ================

// ================ MENU ITEM EXCEL OPERATIONS ================

/**
 * Export all menu items to Excel with beautiful formatting
 */
export async function exportMenuItemsToExcel() {
  try {
    // Get all menu items with category info
    const [items] = await pool.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.price,
        mi.description,
        mi.image_url,
        mi.is_available,
        mc.name as category_name,
        mi.created_at,
        mi.updated_at
      FROM menu_items mi
      LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
      LEFT JOIN menu_categories mc ON mc.id = mic.category_id
      ORDER BY mi.id ASC
    `);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Menu Items');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tên Món', key: 'name', width: 30 },
      { header: 'Giá (VND)', key: 'price', width: 15 },
      { header: 'Mô Tả', key: 'description', width: 40 },
      { header: 'Danh Mục', key: 'category_name', width: 20 },
      { header: 'Hình Ảnh URL', key: 'image_url', width: 30 },
      { header: 'Trạng Thái', key: 'is_available', width: 15 },
      { header: 'Ngày Tạo', key: 'created_at', width: 20 },
      { header: 'Ngày Cập Nhật', key: 'updated_at', width: 20 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add data rows
    items.forEach(item => {
      const row = worksheet.addRow({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || '',
        category_name: item.category_name || 'Chưa phân loại',
        image_url: item.image_url || '',
        is_available: item.is_available ? 'Available' : 'Hidden',
        created_at: item.created_at,
        updated_at: item.updated_at
      });

      // Style data rows
      row.alignment = { vertical: 'middle', wrapText: true };

      // Color code for availability status
      if (!item.is_available) {
        row.getCell('is_available').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }
        };
      }

      // Format price with thousand separator
      row.getCell('price').numFmt = '#,##0';
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error('Export menu items error:', error);
    throw error;
  }
}

/**
 * Generate Excel template for importing menu items
 */
export async function generateMenuItemExcelTemplate() {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Menu Items Template');

    // Define columns
    worksheet.columns = [
      { header: 'Tên Món (*)', key: 'name', width: 30 },
      { header: 'Giá (VND) (*)', key: 'price', width: 15 },
      { header: 'Mô Tả', key: 'description', width: 40 },
      { header: 'Category ID', key: 'category_id', width: 15 },
      { header: 'Hình Ảnh URL', key: 'image_url', width: 30 },
      { header: 'Trạng Thái (true/false)', key: 'is_available', width: 20 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add instruction row
    const instructionRow = worksheet.addRow({
      name: 'Ví dụ: Phở Bò',
      price: 45000,
      description: 'Phở bò truyền thống Hà Nội',
      category_id: 1,
      image_url: '/images/pho-bo.jpg',
      is_available: 'true'
    });
    instructionRow.font = { italic: true, color: { argb: 'FF808080' } };

    // Add sample data rows
    worksheet.addRow({
      name: 'Bún Chả',
      price: 35000,
      description: 'Bún chả Hà Nội',
      category_id: 1,
      image_url: '/images/bun-cha.jpg',
      is_available: 'true'
    });

    worksheet.addRow({
      name: 'Cà Phê Sữa',
      price: 25000,
      description: 'Cà phê sữa đá',
      category_id: 2,
      image_url: '/images/ca-phe.jpg',
      is_available: 'true'
    });

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add notes
    const notesRow = worksheet.addRow([]);
    notesRow.getCell(1).value = 'Ghi chú:';
    notesRow.getCell(1).font = { bold: true };

    worksheet.addRow(['- (*) = Trường bắt buộc']);
    worksheet.addRow(['- Tên món: Tối đa 255 ký tự']);
    worksheet.addRow(['- Giá: Phải là số dương (VND)']);
    worksheet.addRow(['- Category ID: Phải tồn tại trong hệ thống (hoặc để trống)']);
    worksheet.addRow(['- Trạng thái: true (hiển thị) hoặc false (ẩn), mặc định: true']);
    worksheet.addRow(['- Xóa các dòng ví dụ trước khi import']);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error('Generate template error:', error);
    throw error;
  }
}

/**
 * Import menu items from Excel file
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {Object} options - Import options
 * @param {Boolean} options.updateExisting - Update if item exists
 * @param {Boolean} options.skipDuplicate - Skip if item exists
 */
export async function importMenuItemsFromExcel(fileBuffer, options = {}) {
  const { updateExisting = false, skipDuplicate = false } = options;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.worksheets[0];

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      details: []
    };

    // Skip header row, start from row 2
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      // Skip empty rows
      if (!row.getCell(1).value) continue;

      results.total++;

      try {
        // Parse data
        const itemData = {
          name: row.getCell(1).value?.toString().trim(),
          price: parseFloat(row.getCell(2).value),
          description: row.getCell(3).value?.toString().trim() || null,
          // Parse categories - có thể là một hoặc nhiều category IDs cách nhau bởi dấu phảy
          category_ids: row.getCell(4).value 
            ? row.getCell(4).value.toString().split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [],
          image_url: row.getCell(5).value?.toString().trim() || null,
          is_available: row.getCell(6).value !== undefined
            ? (row.getCell(6).value.toString().toLowerCase() === 'true' || row.getCell(6).value === true || row.getCell(6).value === 1)
            : true
        };

        // Validation
        if (!itemData.name) {
          throw new Error('Tên món không được để trống');
        }

        if (!itemData.price || isNaN(itemData.price) || itemData.price < 0) {
          throw new Error('Giá không hợp lệ (phải là số dương)');
        }

        // Check if categories exist (if provided)
        if (itemData.category_ids.length > 0) {
          const [categoryCheck] = await conn.query(
            'SELECT id FROM menu_categories WHERE id IN (?)',
            [itemData.category_ids]
          );
          
          if (categoryCheck.length !== itemData.category_ids.length) {
            const foundIds = categoryCheck.map(c => c.id);
            const missingIds = itemData.category_ids.filter(id => !foundIds.includes(id));
            throw new Error(`Category IDs ${missingIds.join(', ')} không tồn tại`);
          }
        }

        // Check if item already exists (by name)
        const [existingItems] = await conn.query(
          'SELECT id FROM menu_items WHERE LOWER(name) = LOWER(?)',
          [itemData.name]
        );

        if (existingItems.length > 0) {
          const existingItemId = existingItems[0].id;

          if (updateExisting) {
            // Update existing item
            await conn.query(
              `UPDATE menu_items 
               SET price = ?, description = ?, image_url = ?, is_available = ?
               WHERE id = ?`,
              [itemData.price, itemData.description, itemData.image_url, itemData.is_available, existingItemId]
            );

            // Update category relationships if provided
            if (itemData.category_ids.length > 0) {
              // Delete old relationships
              await conn.query('DELETE FROM menu_item_categories WHERE item_id = ?', [existingItemId]);
              
              // Insert new relationships (multiple categories)
              const values = itemData.category_ids.map(catId => [existingItemId, catId]);
              if (values.length > 0) {
                await conn.query(
                  'INSERT INTO menu_item_categories (item_id, category_id) VALUES ?',
                  [values]
                );
              }
            }

            results.success++;
            results.updated++;
            results.details.push({
              row: i,
              name: itemData.name,
              status: 'updated',
              id: existingItemId,
              categories: itemData.category_ids.length
            });
          } else if (skipDuplicate) {
            // Skip duplicate
            results.skipped++;
            results.details.push({
              row: i,
              name: itemData.name,
              status: 'skipped',
              reason: 'Món ăn đã tồn tại'
            });
          } else {
            // Strict mode: throw error
            throw new Error(`Món ăn "${itemData.name}" đã tồn tại`);
          }
        } else {
          // Insert new item
          const [result] = await conn.query(
            `INSERT INTO menu_items (name, price, description, image_url, is_available)
             VALUES (?, ?, ?, ?, ?)`,
            [itemData.name, itemData.price, itemData.description, itemData.image_url, itemData.is_available]
          );

          const newItemId = result.insertId;

          // Insert category relationships if provided (multiple categories)
          if (itemData.category_ids.length > 0) {
            const values = itemData.category_ids.map(catId => [newItemId, catId]);
            await conn.query(
              'INSERT INTO menu_item_categories (item_id, category_id) VALUES ?',
              [values]
            );
          }

          results.success++;
          results.created++;
          results.details.push({
            row: i,
            name: itemData.name,
            status: 'created',
            id: newItemId,
            categories: itemData.category_ids.length
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i,
          name: row.getCell(1).value?.toString() || 'N/A',
          error: error.message
        });
      }
    }

    await conn.commit();

    return results;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// ================ END MENU ITEM EXCEL OPERATIONS ================
