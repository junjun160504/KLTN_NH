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
    "SELECT * FROM customers WHERE phone = ?",
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
        "SELECT id FROM customers WHERE email = ? AND id != ?",
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
        "SELECT id FROM customers WHERE email = ?",
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
    "SELECT id, name, email, phone, points, created_at FROM customers ORDER BY created_at DESC"
  );
  return rows;
}

/**
 * 🔍 Lấy thông tin customer theo ID
 */
export async function getCustomerById(customerId) {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE id = ?",
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
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE phone = ?",
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
    "SELECT id, name, email, phone, points, created_at FROM customers WHERE email = ?",
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
        "SELECT id FROM customers WHERE email = ? AND id != ?",
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
      "SELECT id FROM customers WHERE phone = ? AND id != ?",
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
 * Business Rule: Mỗi 10,000 VNĐ = 1 điểm
 */
export function calculateLoyaltyPoints(orderAmount) {
  const POINTS_PER_AMOUNT = 10000; // 10,000 VNĐ = 1 điểm
  return Math.floor(orderAmount / POINTS_PER_AMOUNT);
}

/**
 * 📊 Lấy lịch sử order của customer
 */
export async function getCustomerOrderHistory(customerId) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  const [orders] = await pool.query(
    `SELECT 
      o.id,
      o.total_price,
      o.status,
      o.created_at,
      o.updated_at,
      qs.table_id,
      t.table_number
    FROM orders o
    JOIN qr_sessions qs ON o.qr_session_id = qs.id
    LEFT JOIN tables t ON qs.table_id = t.id
    WHERE qs.customer_id = ?
    ORDER BY o.created_at DESC`,
    [customerId]
  );

  return {
    customer,
    totalOrders: orders.length,
    orders,
  };
}
