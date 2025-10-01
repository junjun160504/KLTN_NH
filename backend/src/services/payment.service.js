import { pool, query } from "../config/db.js";
import { buildVietQR } from "../utils/vietqr.js";

// 1. Thanh toán
export async function payOrder({ order_id, method, print_bill }) {
  // Kiểm tra đơn chưa thanh toán
  const [orders] = await pool.query(
    "SELECT id, total_price, status FROM orders WHERE id = ? AND status != 'PAID'",
    [order_id]
  );
  if (orders.length === 0) throw new Error("Không có đơn nào để thanh toán");

  const amount = Number(orders[0].total_price);

  // Nếu là BANKING → tạo QR
  let qr = null;
  if (method === "BANKING") {
    qr = await buildVietQR({
      accountNumber: process.env.VIETQR_ACCOUNT_NO,
      bankCode: process.env.VIETQR_BANK_CODE,
      accountName: process.env.VIETQR_ACCOUNT_NAME,
      amount,
      addInfo: `Thanh toan don ${order_id}`
    });
  }

  // Lưu payment
  const [result] = await pool.query(
    `INSERT INTO payments (order_id, method, amount, printed_bill)
     VALUES (?, ?, ?, ?)`,
    [order_id, method, amount, print_bill ?? false]
  );

  // Nếu là CASH → update luôn orders thành PAID
  if (method === "CASH") {
    await pool.query("UPDATE orders SET status = 'PAID' WHERE id = ?", [order_id]);
  } else if (method === "BANKING") {
    // Có thể update thành trạng thái chờ xác nhận
    await pool.query("UPDATE orders SET status = 'PENDING' WHERE id = ?", [order_id]);
  }

  return {
    payment_id: result.insertId,
    order_id,
    method,
    amount,
    status: method === "CASH" ? "PAID" : "PENDING",
    print_bill: !!print_bill,
    ...(qr ? { qrPayload: qr.payload, qrImage: qr.qrCodeImage } : {})
  };
}

// 2. Callback xác nhận thanh toán Napas/VietQR
export async function confirmPayment({ qr_session_id, transaction_code, amount, success }) {
  const [payments] = await pool.query(
    "SELECT * FROM payments WHERE qr_sessions_id = ? ORDER BY id DESC LIMIT 1",
    [qr_session_id]
  );
  if (payments.length === 0) throw new Error("Payment not found");

  const payment = payments[0];
  if (success) {
    await pool.query("UPDATE orders SET status = 'PAID' WHERE qr_session_id = ?", [qr_session_id]);
    return { ...payment, status: "PAID", transaction_code, amount };
  } else {
    return { ...payment, status: "FAILED", transaction_code, amount };
  }
}

// 3. Hoàn tiền
export async function refundPayment({ payment_id, amount, reason }) {
  const [[payment]] = await pool.query("SELECT * FROM payments WHERE id = ?", [payment_id]);
  if (!payment) throw new Error("Payment not found");
  if (amount > payment.amount) throw new Error("Số tiền hoàn vượt quá số đã thanh toán");

  const newAmount = payment.amount - amount;
  await pool.query("UPDATE payments SET amount = ? WHERE id = ?", [newAmount, payment_id]);

  return {
    payment_id,
    refunded: amount,
    remaining: newAmount,
    reason
  };
}

// 4. Lấy 1 payment
export async function getPaymentById(payment_id) {
  const [[payment]] = await pool.query("SELECT * FROM payments WHERE id = ?", [payment_id]);
  return payment;
}

// 5. Lấy danh sách payment (filter)
export async function listPayments({ qr_session_id, from, to }) {
  let sql = "SELECT * FROM payments WHERE 1=1";
  const params = [];
  if (qr_session_id) {
    sql += " AND qr_sessions_id = ?";
    params.push(qr_session_id);
  }
  if (from && to) {
    sql += " AND paid_at BETWEEN ? AND ?";
    params.push(from, to);
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}
