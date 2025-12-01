import { pool } from "../config/db.js";

/**
 * 🎯 Tạo hoặc cập nhật thông tin khách hàng
 * Business Rule: 
 * - Phone là bắt buộc (UNIQUE)
 * - Email là optional (UNIQUE nếu có)
 * - Name là optional
 * - Nếu phone đã tồn tại → cập nhật thông tin
 * - Nếu phone chưa có → tạo mới
 */
export async function createOrUpdateCustomer({ name, email, phone }) {
  // Validate phone (bắt buộc)
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // Chuẩn hóa phone (xóa khoảng trắng, dấu gạch ngang)
  const normalizedPhone = phone.replace(/[\s\-]/g, "");

  // Kiểm tra phone đã tồn tại chưa
  const [existing] = await pool.query(
    "SELECT * FROM customers WHERE phone = ? AND deleted_at IS NULL",
    [normalizedPhone]
  );

  if (existing.length > 0) {
    // ✅ Customer đã tồn tại → UPDATE thông tin
    const customerId = existing[0].id;
    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }

    if (email) {
      // Kiểm tra email có bị trùng với customer khác không
      const [emailCheck] = await pool.query(
        "SELECT id FROM customers WHERE email = ? AND id != ? AND deleted_at IS NULL",
        [email, customerId]
      );

      if (emailCheck.length > 0) {
        throw new Error("Email already exists for another customer");
      }

      updates.push("email = ?");
      values.push(email);
    }

    // Nếu có thông tin cần update
    if (updates.length > 0) {
      values.push(customerId);
      await pool.query(
        `UPDATE customers SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    // Lấy thông tin customer sau khi update
    const [updated] = await pool.query(
      "SELECT id, name, email, phone, points, created_at FROM customers WHERE id = ?",
      [customerId]
    );

    return {
      isNew: false,
      customer: updated[0],
    };
  } else {
    // ✅ Customer mới → INSERT
    // Kiểm tra email có bị trùng không (nếu có)
    if (email) {
      const [emailCheck] = await pool.query(
        "SELECT id FROM customers WHERE email = ? AND deleted_at IS NULL",
        [email]
      );

      if (emailCheck.length > 0) {
        throw new Error("Email already exists");
      }
    }

    const [result] = await pool.query(
      "INSERT INTO customers (name, email, phone, points) VALUES (?, ?, ?, 0)",
      [name || null, email || null, normalizedPhone]
    );

    const [newCustomer] = await pool.query(
      "SELECT id, name, email, phone, points, created_at FROM customers WHERE id = ?",
      [result.insertId]
    );

    return {
      isNew: true,
      customer: newCustomer[0],
    };
  }
}

/**
 * 📋 Lấy danh sách tất cả khách hàng (Admin only)
 */
export async function getAllCustomers() {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE deleted_at IS NULL ORDER BY created_at"
  );
  return rows;
}

/**
 * 🔍 Lấy thông tin customer theo ID
 */
export async function getCustomerById(customerId) {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE id = ? AND deleted_at IS NULL",
    [customerId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * 🔍 Lấy thông tin customer theo phone
 */
export async function getCustomerByPhone(phone) {
  const normalizedPhone = phone.replace(/[\s\-]/g, "");

  const [rows] = await pool.query(
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE phone = ? AND deleted_at IS NULL",
    [normalizedPhone]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * 🔍 Lấy thông tin customer theo email
 */
export async function getCustomerByEmail(email) {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE email = ? AND deleted_at IS NULL",
    [email]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * ✏️ Cập nhật thông tin customer (Admin only)
 */
export async function updateCustomerInfo(customerId, { name, email, phone }) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name);
  }

  if (email !== undefined) {
    // Kiểm tra email trùng
    if (email) {
      const [emailCheck] = await pool.query(
        "SELECT id FROM customers WHERE email = ? AND id != ? AND deleted_at IS NULL",
        [email, customerId]
      );

      if (emailCheck.length > 0) {
        throw new Error("Email already exists for another customer");
      }
    }

    updates.push("email = ?");
    values.push(email);
  }

  if (phone !== undefined) {
    // Kiểm tra phone trùng
    const normalizedPhone = phone.replace(/[\s\-]/g, "");
    const [phoneCheck] = await pool.query(
      "SELECT id FROM customers WHERE phone = ? AND id != ? AND deleted_at IS NULL",
      [normalizedPhone, customerId]
    );

    if (phoneCheck.length > 0) {
      throw new Error("Phone already exists for another customer");
    }

    updates.push("phone = ?");
    values.push(normalizedPhone);
  }

  if (updates.length === 0) {
    return customer; // Không có gì để update
  }

  values.push(customerId);
  await pool.query(
    `UPDATE customers SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  return await getCustomerById(customerId);
}

/**
 * 🎁 Cập nhật điểm thưởng (Loyalty Points)
 * @param {number} customerId - ID khách hàng
 * @param {number} points - Số điểm cần thêm/trừ
 * @param {string} operation - 'ADD' | 'SET' | 'SUBTRACT'
 * @param {number} adminId - ID admin thực hiện (for audit)
 */
export async function updateLoyaltyPoints(customerId, points, operation = "ADD", adminId = null) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  let newPoints;

  switch (operation.toUpperCase()) {
    case "ADD":
      // Cộng điểm
      newPoints = customer.points + points;
      break;

    case "SUBTRACT":
      // Trừ điểm (không được âm)
      newPoints = Math.max(0, customer.points - points);
      break;

    case "SET":
      // Set điểm cụ thể
      newPoints = Math.max(0, points);
      break;

    default:
      throw new Error("Invalid operation. Must be ADD, SUBTRACT, or SET");
  }

  await pool.query("UPDATE customers SET points = ? WHERE id = ?", [newPoints, customerId]);

  // TODO: Ghi log vào bảng points_history (nếu cần audit trail)
  // await pool.query(
  //   "INSERT INTO points_history (customer_id, old_points, new_points, operation, admin_id) VALUES (?, ?, ?, ?, ?)",
  //   [customerId, customer.points, newPoints, operation, adminId]
  // );

  return {
    customerId,
    oldPoints: customer.points,
    newPoints,
    operation,
    changedBy: adminId,
  };
}

/**
 * 💰 Tính điểm thưởng từ số tiền order
 * Business Rule: Mỗi 100,000 VNĐ = 1 điểm | Đơn tối thiểu 300,000đ
 */
export function calculateLoyaltyPoints(orderAmount) {
  const MIN_ORDER_FOR_POINTS = 300000; // Đơn tối thiểu 300,000đ
  const POINTS_PER_AMOUNT = 100000; // 100,000 VNĐ = 1 điểm

  if (orderAmount < MIN_ORDER_FOR_POINTS) {
    return 0; // Không đủ điều kiện tích điểm
  }

  return Math.floor(orderAmount / POINTS_PER_AMOUNT);
}

/**
 * 📊 Lấy lịch sử order của customer (group theo phiên)
 */
export async function getCustomerOrderHistory(customerId) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  // Lấy tất cả orders với thông tin phiên
  const [orders] = await pool.query(
    `SELECT 
      o.id,
      o.total_price,
      o.status,
      o.created_at,
      o.updated_at,
      o.qr_session_id,
      qs.table_id,
      qs.status as session_status,
      qs.created_at as session_created_at,
      qs.updated_at as session_updated_at,
      t.table_number
    FROM orders o
    JOIN qr_sessions qs ON o.qr_session_id = qs.id
    LEFT JOIN tables t ON qs.table_id = t.id
    WHERE qs.customer_id = ?
    ORDER BY qs.created_at DESC, o.created_at ASC`,
    [customerId]
  );

  // Group orders theo qr_session_id
  const sessionsMap = new Map();

  for (const order of orders) {
    const sessionId = order.qr_session_id;

    if (!sessionsMap.has(sessionId)) {
      sessionsMap.set(sessionId, {
        session_id: sessionId,
        table_id: order.table_id,
        table_number: order.table_number,
        session_status: order.session_status,
        session_created_at: order.session_created_at,
        session_updated_at: order.session_updated_at,
        orders: [],
        total_amount: 0,
        order_count: 0
      });
    }

    const session = sessionsMap.get(sessionId);
    session.orders.push({
      id: order.id,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at
    });
    session.total_amount += parseFloat(order.total_price || 0);
    session.order_count += 1;
  }

  const sessions = Array.from(sessionsMap.values());

  return {
    customer,
    totalSessions: sessions.length,
    totalOrders: orders.length,
    sessions,
    // Giữ lại orders để backward compatible
    orders,
  };
}

/**
 * 🗑️ Soft delete customer
 * @param {number} customerId - Customer ID
 * @returns {Object} Deletion result
 */
export async function deleteCustomer(customerId) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  // Soft delete - set deleted_at timestamp
  await pool.query(
    "UPDATE customers SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
    [customerId]
  );

  return {
    id: customerId,
    message: "Customer deleted successfully"
  };
}
