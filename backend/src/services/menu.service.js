import { pool, query } from "../config/db.js";


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
  const sql = "SELECT * FROM menu_categories WHERE is_available = 1";
  const rows = await query(sql);
  console.log("[getMenuCategories] rows:", rows);   // 👈 log ra để xem
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
