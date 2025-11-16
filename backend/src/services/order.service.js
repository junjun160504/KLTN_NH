import { pool, query } from "../config/db.js";
import * as notificationService from "./notification.service.js";
import { closeSession } from "./qrSession.service.js";

/**
 * =====================================================
 * ORDER CREATION LOGIC
 * =====================================================
 * 
 * RULE: Chỉ REUSE order khi status = NEW
 * 
 * Logic:
 * - Nếu có order với status = NEW → THÊM MÓN vào order đó
 * - Nếu order đã IN_PROGRESS/DONE/PAID/CANCELLED → TẠO ORDER MỚI
 * 
 * Lợi ích:
 * ✅ Kitchen workflow rõ ràng (mỗi order = 1 batch)
 * ✅ Audit trail chi tiết (track từng lần đặt)
 * ✅ Flexibility cao (cancel/modify từng order riêng)
 * ✅ Tận dụng QR_SESSION để aggregate nhiều orders
 * 
 * See: ORDER_LOGIC.md cho documentation đầy đủ
 * =====================================================
 */

/**
 * Admin tạo order cho khách hàng (order tại quầy)
 * Không cần qr_session_id, admin chỉ cần table_id
 */
export async function createOrderByAdmin({ table_id, items, admin_id, customer_phone }) {
  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Order must have at least 1 item");
  }

  if (!table_id) {
    throw new Error("table_id is required");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate table exists
    const [[table]] = await connection.query(
      "SELECT * FROM tables WHERE id = ? AND is_active = true",
      [table_id]
    );

    if (!table) {
      throw new Error("Table not found or inactive");
    }

    // 2. Tìm hoặc tạo customer nếu có phone
    let customerId = null;
    if (customer_phone) {
      const [[customer]] = await connection.query(
        "SELECT id FROM customers WHERE phone = ?",
        [customer_phone]
      );

      if (customer) {
        customerId = customer.id;
      }
    }

    // 3. Tìm hoặc tạo qr_session ACTIVE cho bàn này
    let qrSessionId;
    const [[existingSession]] = await connection.query(
      `SELECT id FROM qr_sessions 
       WHERE table_id = ? AND status = 'ACTIVE' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [table_id]
    );

    if (existingSession) {
      qrSessionId = existingSession.id;

      // Update customer_id nếu có
      if (customerId) {
        await connection.query(
          "UPDATE qr_sessions SET customer_id = ? WHERE id = ?",
          [customerId, qrSessionId]
        );
      }
    } else {
      // Tạo qr_session mới
      const [sessionResult] = await connection.query(
        "INSERT INTO qr_sessions (table_id, customer_id, status) VALUES (?, ?, 'ACTIVE')",
        [table_id, customerId]
      );
      qrSessionId = sessionResult.insertId;
    }

    // 4. Check if there's an order with status NEW for this session
    // Logic: Only reuse order if status is NEW (not yet confirmed)
    // If order is IN_PROGRESS or other status -> Create new order
    const [[existingOrder]] = await connection.query(
      `SELECT * FROM orders 
       WHERE qr_session_id = ? 
       AND status = 'NEW'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [qrSessionId]
    );

    let orderId;
    let isNewOrder = false;

    if (existingOrder) {
      // Reuse existing NEW order
      orderId = existingOrder.id;
      isNewOrder = false;

      // Update admin_id
      if (admin_id) {
        await connection.query(
          "UPDATE orders SET admin_id = ? WHERE id = ?",
          [admin_id, orderId]
        );
      }

    } else {
      // Create new order (no NEW order found)
      const [orderResult] = await connection.query(
        "INSERT INTO orders (qr_session_id, admin_id, status) VALUES (?, ?, 'NEW')",
        [qrSessionId, admin_id || null]
      );
      orderId = orderResult.insertId;
      isNewOrder = true;
    }

    // 5. Validate menu items and prepare batch insert data
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

    // 6. Batch insert all order items
    await connection.query(
      `INSERT INTO order_items 
       (order_id, menu_item_id, quantity, note, unit_price)
       VALUES ?`,
      [orderItems]
    );

    // 7. Manual calculate total_price
    const totalPrice = orderItems.reduce((sum, item) => {
      return sum + (item[2] * item[4]); // quantity * unit_price
    }, 0);

    // 8. Update total_price vào orders table
    await connection.query(
      `UPDATE orders 
       SET total_price = total_price + ? 
       WHERE id = ?`,
      [totalPrice, orderId]
    );

    await connection.commit();

    // 9. Get complete order data
    const orderData = await getOrderById(orderId);

    // 10. Send notification to STAFF
    try {
      const itemNames = items.map((item, index) => {
        const orderItem = orderItems[index];
        return `${item.quantity}x món (giá: ${orderItem[4].toLocaleString()}đ)`;
      }).join(', ');

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const tableName = `Bàn ${table.table_number}`;
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
    }
    return orderData;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

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

    // 2. Check if there's an order with status NEW for this session
    // Logic: Only reuse order if status is NEW (not yet confirmed by staff)
    // If order is IN_PROGRESS, DONE, PAID, or CANCELLED -> Create new order
    const [[existingOrder]] = await connection.query(
      `SELECT * FROM orders 
       WHERE qr_session_id = ? 
       AND status = 'NEW'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [qr_session_id]
    );

    let orderId;
    let isNewOrder = false;

    if (existingOrder) {
      // 2a. Reuse existing NEW order (not yet confirmed)
      orderId = existingOrder.id;
      isNewOrder = false;
      console.log(`✅ Adding items to existing NEW order #${orderId}`);
    } else {
      // 2b. Create new order (no NEW order found, previous order was confirmed/completed)
      const [orderResult] = await connection.query(
        "INSERT INTO orders (qr_session_id, status) VALUES (?, 'NEW')",
        [qr_session_id]
      );
      orderId = orderResult.insertId;
      isNewOrder = true;
      console.log(`✅ Created new order #${orderId} (previous order was not NEW or doesn't exist)`);
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

    // 5. Manual calculate total_price (không rely vào trigger)
    const totalPrice = orderItems.reduce((sum, item) => {
      return sum + (item[2] * item[4]); // quantity * unit_price
    }, 0);

    // 6. Update total_price vào orders table
    await connection.query(
      `UPDATE orders 
       SET total_price = total_price + ? 
       WHERE id = ?`,
      [totalPrice, orderId]
    );

    await connection.commit();

    // 6. Get complete order data for notification
    const orderData = await getOrderById(orderId);

    // 7. Lấy thông tin bàn
    const [[tableInfo]] = await connection.query(
      `SELECT t.id, t.table_number 
       FROM qr_sessions qs 
       JOIN tables t ON qs.table_id = t.id 
       WHERE qs.id = ?`,
      [qr_session_id]
    );

    // 8. Tạo notification cho STAFF
    try {
      const itemNames = items.map((item, index) => {
        const orderItem = orderItems[index];
        return `${item.quantity}x món (giá: ${orderItem[4].toLocaleString()}đ)`;
      }).join(', ');

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const tableName = tableInfo ? `Bàn ${tableInfo.table_number}` : 'Bàn N/A';

      if (isNewOrder) {
        // Thông báo order mới
        await notificationService.createNotification({
          target_type: "STAFF",
          target_id: null,
          type: "ORDER_NEW",
          title: `${tableName} - Đơn hàng mới #${orderId}`,
          message: `Khách hàng vừa tạo đơn hàng mới với ${totalItems} món: ${itemNames}`,
          priority: "high",
          action_url: `/main/tables?tableId=${tableInfo?.id}&openPanel=true`,
          metadata: {
            orderId,
            qrSessionId: qr_session_id,
            tableId: tableInfo?.id,
            tableName: tableInfo?.table_number,
            totalItems,
            isNewOrder: true
          },
        });
        console.log(`📤 Notification sent: New order #${orderId} - ${tableName}`);
      } else {
        // Thông báo thêm món vào order cũ
        await notificationService.createNotification({
          target_type: "STAFF",
          target_id: null,
          type: "ORDER_UPDATE",
          title: `${tableName} - Thêm món vào đơn #${orderId}`,
          message: `Khách hàng vừa thêm ${totalItems} món: ${itemNames}`,
          priority: "medium",
          action_url: `/main/tables?tableId=${tableInfo?.id}&openPanel=true`,
          metadata: {
            orderId,
            qrSessionId: qr_session_id,
            tableId: tableInfo?.id,
            tableName: tableInfo?.table_number,
            totalItems,
            isNewOrder: false
          },
        });
        console.log(`📤 Notification sent: Added items to order #${orderId} - ${tableName}`);
      }
    } catch (notifError) {
      // Không throw error nếu notification fail, vẫn return order thành công
      console.error('⚠️ Failed to send notification:', notifError);
    }

    // 9. Return complete order with items
    return orderData;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Thêm món vào đơn (hỗ trợ thêm 1 hoặc nhiều items)
// Logic: Chỉ cho phép thêm món khi order đang ở trạng thái NEW hoặc IN_PROGRESS
export async function addItem(orderId, itemsData) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate order exists and can be modified
    // Allow adding items to NEW and IN_PROGRESS orders
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

    // 5. Manual calculate total_price (không rely vào trigger)
    const totalPrice = orderItems.reduce((sum, item) => {
      return sum + (item[2] * item[4]); // quantity * unit_price
    }, 0);

    // 6. Update total_price vào orders table
    await connection.query(
      `UPDATE orders 
       SET total_price = total_price + ? 
       WHERE id = ?`,
      [totalPrice, orderId]
    );

    await connection.commit();

    // 6. Get complete order data for notification
    const orderData = await getOrderById(orderId);

    // 7. Lấy thông tin bàn từ order
    const [[tableInfo]] = await connection.query(
      `SELECT t.id, t.table_number, o.qr_session_id
       FROM orders o
       JOIN qr_sessions qs ON o.qr_session_id = qs.id
       JOIN tables t ON qs.table_id = t.id
       WHERE o.id = ?`,
      [orderId]
    );

    // 8. Tạo notification cho STAFF khi thêm món vào order cũ
    try {
      const itemNames = items.map((item, index) => {
        const orderItem = orderItems[index];
        return `${item.quantity}x món (giá: ${orderItem[4].toLocaleString()}đ)`;
      }).join(', ');

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const tableName = tableInfo ? `Bàn ${tableInfo.table_number}` : 'Bàn N/A';

      await notificationService.createNotification({
        target_type: "STAFF",
        target_id: null,
        type: "ORDER_UPDATE",
        title: `${tableName} - Thêm món vào đơn #${orderId}`,
        message: `Khách hàng vừa thêm ${totalItems} món: ${itemNames}`,
        priority: "medium",
        action_url: `/main/tables?tableId=${tableInfo?.id}&openPanel=true`,
        metadata: {
          orderId,
          qrSessionId: tableInfo?.qr_session_id,
          tableId: tableInfo?.id,
          tableName: tableInfo?.table_number,
          totalItems,
          isAddItem: true
        },
      });
      console.log(`📤 Notification sent: Added items to order #${orderId} - ${tableName}`);
    } catch (notifError) {
      // Không throw error nếu notification fail, vẫn return order thành công
      console.error('⚠️ Failed to send notification:', notifError);
    }

    // 9. Return updated order with all items
    return orderData;

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
      o.qr_session_id,
      qs.table_id,
      qs.status as session_status,
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

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const [items] = await pool.query(
        `SELECT 
          oi.*, 
          mi.name as menu_item_name, 
          mi.image_url
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [order.id]
      );
      return { ...order, items };
    })
  );

  return {
    orders: ordersWithItems,
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

// Lấy đơn hàng theo table_id (CHỈ LẤY ORDERS CỦA QR SESSION ACTIVE)
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
      AND qs.status = 'ACTIVE'
      AND o.status IN ('NEW', 'IN_PROGRESS', 'DONE')
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

  // Lấy thông tin order trước khi update
  const [[order]] = await pool.query(
    "SELECT id, qr_session_id FROM orders WHERE id = ?",
    [orderId]
  );

  if (!order) {
    throw new Error("Order not found");
  }

  // Update order status
  await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);

  // ✅ Nếu status = PAID và có qr_session_id → Đóng session
  if (status === 'PAID' && order.qr_session_id) {
    try {
      await closeSession(order.qr_session_id);
      console.log(`✅ Session ${order.qr_session_id} closed after order #${orderId} marked as PAID`);
    } catch (error) {
      console.error(`⚠️ Failed to close session ${order.qr_session_id}:`, error);
      // Không throw error vì order status đã update thành công
    }
  }

  return { orderId, status };
}

// ========== NEW FEATURES ==========

/**
 * Xóa món khỏi order (chỉ khi status = NEW)
 */
export async function removeItemFromOrder(orderId, itemId) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  console.log(`🗑️ Removing item #${itemId} from order #${orderId}...`);

  try {
    // 1. Validate order exists and status = NEW
    const [[order]] = await connection.query(
      `SELECT * FROM orders WHERE id = ? AND status = 'NEW'`,
      [orderId]
    );

    if (!order) {
      throw new Error("Order not found or cannot be modified (status must be NEW)");
    }

    // 2. Check if order_item exists
    const [[orderItem]] = await connection.query(
      `SELECT * FROM order_items WHERE id = ? AND order_id = ?`,
      [itemId, orderId]
    );

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    // 3. Calculate price to subtract
    const priceToSubtract = orderItem.quantity * orderItem.unit_price;

    // 4. Delete order_item
    await connection.query(
      `DELETE FROM order_items WHERE id = ?`,
      [itemId]
    );

    // 5. Update total_price manually
    await connection.query(
      `UPDATE orders 
       SET total_price = total_price - ? 
       WHERE id = ?`,
      [priceToSubtract, orderId]
    );

    // 6. Check if order has no items left
    const [[{ itemCount }]] = await connection.query(
      `SELECT COUNT(*) as itemCount FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    // 5. If no items left, delete the order
    if (itemCount === 0) {
      await connection.query(`DELETE FROM orders WHERE id = ?`, [orderId]);
      await connection.commit();

      return { orderId, deleted: true, message: "Order deleted (no items left)" };
    }

    await connection.commit();

    // 6. Get updated order data
    const updatedOrder = await getOrderById(orderId);

    // 7. Get table info and send notification
    const [[tableInfo]] = await connection.query(
      `SELECT t.id, t.table_number, o.qr_session_id
       FROM orders o
       JOIN qr_sessions qs ON o.qr_session_id = qs.id
       JOIN tables t ON qs.table_id = t.id
       WHERE o.id = ?`,
      [orderId]
    );

    try {
      const tableName = tableInfo ? `Bàn ${tableInfo.table_number}` : 'Bàn N/A';

      // await notificationService.createNotification({
      //   target_type: "STAFF",
      //   target_id: null,
      //   type: "ORDER_UPDATE",
      //   title: `🗑️ ${tableName} - Xóa món khỏi đơn #${orderId}`,
      //   message: `Khách hàng đã xóa 1 món khỏi đơn hàng`,
      //   priority: "low",
      //   action_url: `/management/orders/${orderId}`,
      //   metadata: {
      //     orderId,
      //     qrSessionId: tableInfo?.qr_session_id,
      //     tableId: tableInfo?.id,
      //     tableName: tableInfo?.table_number,
      //     removedItemId: itemId,
      //     remainingItems: itemCount
      //   },
      // });
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
    }

    return updatedOrder;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Cập nhật số lượng món trong order (chỉ khi status = NEW)
 */
export async function updateOrderItemQuantity(orderId, itemId, quantity) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate quantity
    if (!quantity || quantity < 0) {
      throw new Error("Quantity must be greater than or equal to 0");
    }

    // 2. Validate order exists and status = NEW
    const [[order]] = await connection.query(
      `SELECT * FROM orders WHERE id = ? AND status = 'NEW'`,
      [orderId]
    );

    if (!order) {
      throw new Error("Order not found or cannot be modified (status must be NEW)");
    }

    // 3. Check if order_item exists
    const [[orderItem]] = await connection.query(
      `SELECT * FROM order_items WHERE id = ? AND order_id = ?`,
      [itemId, orderId]
    );

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    // 4. If quantity = 0, delete the item
    if (quantity === 0) {
      // Calculate price to subtract
      const priceToSubtract = orderItem.quantity * orderItem.unit_price;

      await connection.query(
        `DELETE FROM order_items WHERE id = ?`,
        [itemId]
      );

      // Update total_price
      await connection.query(
        `UPDATE orders 
         SET total_price = total_price - ? 
         WHERE id = ?`,
        [priceToSubtract, orderId]
      );

      // Check if order has no items left
      const [[{ itemCount }]] = await connection.query(
        `SELECT COUNT(*) as itemCount FROM order_items WHERE order_id = ?`,
        [orderId]
      );

      if (itemCount === 0) {
        await connection.query(`DELETE FROM orders WHERE id = ?`, [orderId]);
        await connection.commit();

        return { orderId, deleted: true, message: "Order deleted (no items left)" };
      }
    } else {
      // 5. Calculate price difference
      const oldPrice = orderItem.quantity * orderItem.unit_price;
      const newPrice = quantity * orderItem.unit_price;
      const priceDifference = newPrice - oldPrice;

      // 6. Update quantity
      await connection.query(
        `UPDATE order_items SET quantity = ? WHERE id = ?`,
        [quantity, itemId]
      );

      // 7. Update total_price manually
      await connection.query(
        `UPDATE orders 
         SET total_price = total_price + ? 
         WHERE id = ?`,
        [priceDifference, orderId]
      );
    }

    await connection.commit();

    // 6. Get updated order data
    const updatedOrder = await getOrderById(orderId);

    // 7. Get table info and send notification
    const [[tableInfo]] = await connection.query(
      `SELECT t.id, t.table_number, o.qr_session_id
       FROM orders o
       JOIN qr_sessions qs ON o.qr_session_id = qs.id
       JOIN tables t ON qs.table_id = t.id
       WHERE o.id = ?`,
      [orderId]
    );

    try {
      const tableName = tableInfo ? `Bàn ${tableInfo.table_number}` : 'Bàn N/A';
      const action = quantity === 0 ? 'xóa' : 'cập nhật số lượng';
      // update logic notification for quantity change

      // await notificationService.createNotification({
      //   target_type: "STAFF",
      //   target_id: null,
      //   type: "ORDER_UPDATE",
      //   title: `✏️ ${tableName} - Cập nhật đơn #${orderId}`,
      //   message: `Khách hàng đã ${action} món (số lượng: ${orderItem.quantity} → ${quantity})`,
      //   priority: "low",
      //   action_url: `/management/orders/${orderId}`,
      //   metadata: {
      //     orderId,
      //     qrSessionId: tableInfo?.qr_session_id,
      //     tableId: tableInfo?.id,
      //     tableName: tableInfo?.table_number,
      //     updatedItemId: itemId,
      //     oldQuantity: orderItem.quantity,
      //     newQuantity: quantity
      //   },
      // });
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
    }

    return updatedOrder;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Hủy đơn hàng (chỉ khi status = NEW hoặc IN_PROGRESS)
 */
export async function cancelOrder(orderId, reason = null) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate order exists and can be cancelled
    const [[order]] = await connection.query(
      `SELECT * FROM orders WHERE id = ? AND status IN ('NEW', 'IN_PROGRESS')`,
      [orderId]
    );

    if (!order) {
      throw new Error("Order not found or cannot be cancelled (status must be NEW or IN_PROGRESS)");
    }

    // 2. Update order status to CANCELLED
    await connection.query(
      `UPDATE orders SET status = 'CANCELLED' WHERE id = ?`,
      [orderId]
    );

    await connection.commit();

    // 3. Get updated order data
    const updatedOrder = await getOrderById(orderId);

    // 4. Get table info and send notification
    const [[tableInfo]] = await connection.query(
      `SELECT t.id, t.table_number, o.qr_session_id
       FROM orders o
       JOIN qr_sessions qs ON o.qr_session_id = qs.id
       JOIN tables t ON qs.table_id = t.id
       WHERE o.id = ?`,
      [orderId]
    );

    try {
      const tableName = tableInfo ? `Bàn ${tableInfo.table_number}` : 'Bàn N/A';
      const reasonText = reason ? ` (Lý do: ${reason})` : '';

      await notificationService.createNotification({
        target_type: "STAFF",
        target_id: null,
        type: "ORDER_UPDATE",
        title: `${tableName} - Hủy đơn #${orderId}`,
        message: `Khách hàng đã hủy đơn hàng${reasonText}`,
        priority: "medium",
        action_url: `/main/tables?tableId=${tableInfo?.id}&openPanel=true`,
        metadata: {
          orderId,
          qrSessionId: tableInfo?.qr_session_id,
          tableId: tableInfo?.id,
          tableName: tableInfo?.table_number,
          previousStatus: order.status,
          cancelReason: reason
        },
      });
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
    }

    return updatedOrder;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
