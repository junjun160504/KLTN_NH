import pool from "../config/db.js";

// Lấy danh sách món theo tên (cho khách hàng)
export async function getAllMenuItems(name) {
  let sql = "";
  let params = [];

  if (name && name !== "all") {
    sql = "SELECT * FROM menu_items WHERE is_available = 1 AND name LIKE ?";
    params.push(`%${name}%`);
  } else {
    sql = "SELECT * FROM menu_items WHERE is_available = 1";
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

// Thêm món mới (Admin)
export async function addMenuItem({ name, price, description, category_id, image_url, is_available }) {
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

    // 2. Insert quan hệ món ↔ danh mục
    if (category_id) {
      await conn.query(
        "INSERT INTO menu_item_categories (item_id, category_id) VALUES (?, ?)",
        [itemId, category_id]
      );
    }

    await conn.commit();
    return { id: itemId, name, price, category_id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Lấy danh mục món
export async function getMenuCategories() {
  const [rows] = await pool.query("SELECT * FROM menu_categories WHERE is_available = 1");
  return rows;
}

// Lấy món theo category
export async function getItemsByCategory(id) {
  const [rows] = await pool.query(
    `
    SELECT 
      mi.id, mi.name, mi.price, mi.description, mi.image_url, mi.is_available,
      mc.id AS categoryId, mc.name AS categoryName
    FROM menu_items mi
    JOIN menu_item_categories mic ON mi.id = mic.item_id
    JOIN menu_categories mc ON mc.id = mic.category_id
    WHERE mic.category_id = ? AND mi.is_available = 1
    `,
    [id]
  );
  return rows;
}

// Lấy tất cả món (admin)
export async function getAllItems() {
  const [rows] = await pool.query(
    `
    SELECT 
      mi.id, mi.name, mi.price, mi.description, mi.image_url, mi.is_available,
      mc.id AS categoryId, mc.name AS categoryName
    FROM menu_items mi
    LEFT JOIN menu_item_categories mic ON mi.id = mic.item_id
    LEFT JOIN menu_categories mc ON mc.id = mic.category_id
    `
  );
  return rows;
}
