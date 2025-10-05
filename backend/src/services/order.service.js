import { pool, query } from "../config/db.js";

// Tạo hoặc thêm items vào đơn hiện tại (Smart logic)
export async function createOrder({ qr_session_id, items }) {
  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Order must have at least 1 item");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate qr_session exists and is active
    const [[session]] = await connection.query(
      "SELECT * FROM qr_sessions WHERE id = ? AND status = 'ACTIVE'",
      [qr_session_id]
    );
    if (!session) {
      throw new Error("QR session not found or inactive");
    }

    // 2. Check if there's already an active order for this session
    // Only reuse orders with status NEW or IN_PROGRESS
    // If order is PAID, DONE, or CANCELLED -> Create new order
    const [[existingOrder]] = await connection.query(
      `SELECT * FROM orders 
       WHERE qr_session_id = ? 
       AND status IN ('NEW', 'IN_PROGRESS')
       ORDER BY created_at DESC 
       LIMIT 1`,
      [qr_session_id]
    );

    let orderId;

    if (existingOrder) {
      // 2a. Reuse existing active order
      orderId = existingOrder.id;
      console.log(`✅ Adding items to existing order #${orderId} (status: ${existingOrder.status})`);
    } else {
      // 2b. Create new order (no active order found, or previous order was PAID/DONE/CANCELLED)
      const [orderResult] = await connection.query(
        "INSERT INTO orders (qr_session_id, status) VALUES (?, 'NEW')",
        [qr_session_id]
      );
      orderId = orderResult.insertId;
      console.log(`✅ Created new order #${orderId}`);
    }

    // 3. Validate menu items and prepare batch insert data
    const orderItems = [];
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || item.quantity < 1) {
        throw new Error("Invalid item data: menu_item_id and quantity (>0) are required");
      }

      const [[menuItem]] = await connection.query(
        "SELECT * FROM menu_items WHERE id = ? AND is_available = true",
        [item.menu_item_id]
      );

      if (!menuItem) {
        throw new Error(`Menu item ${item.menu_item_id} not found or unavailable`);
      }

      orderItems.push([
        orderId,
        item.menu_item_id,
        item.quantity,
        item.note || null,
        menuItem.price
      ]);
    }

    // 4. Batch insert all order items
    await connection.query(
      `INSERT INTO order_items 
       (order_id, menu_item_id, quantity, note, unit_price)
       VALUES ?`,
      [orderItems]
    );

    // 5. Database trigger will auto-calculate total_price

    await connection.commit();

    // 6. Return complete order with items
    return await getOrderById(orderId);

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Thêm món vào đơn (hỗ trợ thêm 1 hoặc nhiều items)
export async function addItem(orderId, itemsData) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate order exists and can be modified
    const [[order]] = await connection.query(
      `SELECT * FROM orders 
       WHERE id = ? AND status IN ('NEW', 'IN_PROGRESS')`,
      [orderId]
    );

    if (!order) {
      throw new Error("Order not found or cannot be modified (status must be NEW or IN_PROGRESS)");
    }

    // 2. Support both single item and array of items
    const items = Array.isArray(itemsData) ? itemsData : [itemsData];

    if (items.length === 0) {
      throw new Error("At least one item is required");
    }

    // 3. Validate all menu items and prepare batch insert
    const orderItems = [];
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || item.quantity < 1) {
        throw new Error("Invalid item data: menu_item_id and quantity (>0) are required");
      }

      const [[menuItem]] = await connection.query(
        "SELECT * FROM menu_items WHERE id = ? AND is_available = true",
        [item.menu_item_id]
      );

      if (!menuItem) {
        throw new Error(`Menu item ${item.menu_item_id} not found or unavailable`);
      }

      orderItems.push([
        orderId,
        item.menu_item_id,
        item.quantity,
        item.note || null,
        menuItem.price
      ]);
    }

    // 4. Batch insert all items
    await connection.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, note, unit_price)
       VALUES ?`,
      [orderItems]
    );

    // 5. Database trigger will auto-update total_price

    await connection.commit();

    // 6. Return updated order with all items
    return await getOrderById(orderId);

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Lấy tất cả đơn hàng (có thể filter theo status)
export async function getAllOrders(filters = {}) {
  const { status, qr_session_id, table_id, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT 
      o.*,
      qs.table_id,
      t.table_number,
      COUNT(oi.id) as total_items
    FROM orders o
    LEFT JOIN qr_sessions qs ON o.qr_session_id = qs.id
    LEFT JOIN tables t ON qs.table_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 1=1
  `;

  const params = [];

  // Filter theo status
  if (status) {
    sql += " AND o.status = ?";
    params.push(status);
  }

  // Filter theo qr_session_id
  if (qr_session_id) {
    sql += " AND o.qr_session_id = ?";
    params.push(qr_session_id);
  }

  // Filter theo table_id
  if (table_id) {
    sql += " AND qs.table_id = ?";
    params.push(table_id);
  }

  sql += `
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  const [orders] = await pool.query(sql, params);

  // Đếm tổng số orders (cho pagination)
  let countSql = `SELECT COUNT(DISTINCT o.id) as total FROM orders o`;
  countSql += ` LEFT JOIN qr_sessions qs ON o.qr_session_id = qs.id WHERE 1=1`;

  const countParams = [];
  if (status) {
    countSql += " AND o.status = ?";
    countParams.push(status);
  }
  if (qr_session_id) {
    countSql += " AND o.qr_session_id = ?";
    countParams.push(qr_session_id);
  }
  if (table_id) {
    countSql += " AND qs.table_id = ?";
    countParams.push(table_id);
  }

  const [[{ total }]] = await pool.query(countSql, countParams);

  return {
    orders,
    pagination: {
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Lấy đơn + chi tiết món
export async function getOrderById(orderId) {
  const [[order]] = await pool.query(
    `SELECT 
      o.*,
      qs.table_id,
      t.table_number,
      qs.status as session_status
    FROM orders o
    LEFT JOIN qr_sessions qs ON o.qr_session_id = qs.id
    LEFT JOIN tables t ON qs.table_id = t.id
    WHERE o.id = ?`,
    [orderId]
  );

  if (!order) return null;

  const [items] = await pool.query(
    `SELECT 
      oi.*, 
      mi.name as menu_item_name, 
      mi.image_url
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  return { ...order, items };
}

// Lấy đơn hàng theo qr_session_id
export async function getOrdersBySessionId(qr_session_id) {
  const [orders] = await pool.query(
    `SELECT 
      o.*,
      COUNT(oi.id) as total_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.qr_session_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    [qr_session_id]
  );

  // Lấy items cho mỗi order
  for (const order of orders) {
    const [items] = await pool.query(
      `SELECT 
        oi.*, 
        mi.name as menu_item_name, 
        mi.image_url 
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;
  }

  return orders;
}

// Lấy đơn hàng theo table_id
export async function getOrdersByTableId(table_id) {
  const [orders] = await pool.query(
    `SELECT 
      o.*,
      qs.id as qr_session_id,
      qs.status as session_status,
      t.table_number,
      COUNT(oi.id) as total_items
    FROM orders o
    JOIN qr_sessions qs ON o.qr_session_id = qs.id
    JOIN tables t ON qs.table_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE t.id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    [table_id]
  );

  // Lấy items cho mỗi order
  for (const order of orders) {
    const [items] = await pool.query(
      `SELECT 
        oi.*, 
        mi.name as menu_item_name, 
        mi.image_url 
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;
  }

  return orders;
}

// Cập nhật trạng thái đơn
export async function updateStatus(orderId, status) {
  const valid = ["NEW", "IN_PROGRESS", "DONE", "PAID", "CANCELLED"];
  if (!valid.includes(status)) throw new Error("Invalid order status");

  await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
  return { orderId, status };
}
