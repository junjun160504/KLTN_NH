import { pool, query } from "../config/db.js";
import { buildVietQR } from "../utils/vietqr.js";
import { closeSession } from "./qrSession.service.js";
import { notifyPaymentCompleted } from "./simpleNotification.service.js";

// 1. Thanh toán
export async function payOrder({ order_id, method, print_bill }) {
  try {
    // ✅ Validate input
    if (!order_id || !method) {
      throw new Error("Thiếu thông tin order_id hoặc method");
    }

    // ✅ Validate payment method
    const validMethods = ['CASH', 'BANKING', 'QR', 'CARD'];
    if (!validMethods.includes(method)) {
      throw new Error(`Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: ${validMethods.join(', ')}`);
    }

    // ✅ Kiểm tra đơn hàng tồn tại và chưa thanh toán
    const [orders] = await pool.query(
      "SELECT o.id, o.total_price, o.status, o.qr_session_id FROM orders o WHERE o.id = ? AND o.status != 'PAID'",
      [order_id]
    );

    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại hoặc đã được thanh toán");
    }

    const order = orders[0];
    const amount = Number(order.total_price);
    const qr_session_id = order.qr_session_id; // ✅ Lấy qr_session_id để gửi notification

    // ✅ Kiểm tra đã có payment pending cho order này chưa
    const [existingPayments] = await pool.query(
      "SELECT id, payment_status, method, amount FROM payments WHERE order_id = ? AND payment_status IN ('PENDING', 'PROCESSING')",
      [order_id]
    );

    // Nếu đã có payment pending và cùng phương thức thanh toán → Trả về thông tin cũ
    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];

      // Nếu cùng phương thức thanh toán (BANKING/QR) → Tái sử dụng payment cũ
      if ((existingPayment.method === 'BANKING' || existingPayment.method === 'QR') &&
        (method === 'BANKING' || method === 'QR')) {

        // Tạo lại QR code với thông tin hiện tại
        const qr = await buildVietQR({
          accountNumber: process.env.VIETQR_ACCOUNT_NO,
          bankCode: process.env.VIETQR_BANK_CODE,
          accountName: process.env.VIETQR_ACCOUNT_NAME,
          amount: existingPayment.amount,
          addInfo: `Thanh toan don ${order_id}`
        });

        return {
          payment_id: existingPayment.id,
          order_id,
          method: existingPayment.method,
          amount: existingPayment.amount,
          payment_status: existingPayment.payment_status,
          order_status: "PENDING_PAYMENT",
          print_bill: false,
          is_existing: true, // Đánh dấu là payment đã tồn tại
          qr_data: {
            qr_code_url: qr.qrCodeUrl,
            qr_code_image: qr.qrCodeImage,
            quick_link: qr.quickLink,
            bank_info: qr.bankInfo || {
              account_number: process.env.VIETQR_ACCOUNT_NO,
              account_name: process.env.VIETQR_ACCOUNT_NAME,
              bank_code: process.env.VIETQR_BANK_CODE,
              amount: existingPayment.amount,
              transfer_content: `Thanh toan don ${order_id}`
            }
          }
        };
      }

      // Nếu khác phương thức hoặc không phải BANKING/QR → Báo lỗi
      throw new Error("Đơn hàng đang có giao dịch thanh toán đang xử lý. Vui lòng hoàn thành giao dịch trước đó hoặc hủy để tạo giao dịch mới.");
    }

    // ✅ Tạo QR code nếu là phương thức BANKING hoặc QR
    let qr = null;
    if (method === "BANKING" || method === "QR") {
      // Validate environment variables
      const requiredEnvVars = ['VIETQR_ACCOUNT_NO', 'VIETQR_BANK_CODE', 'VIETQR_ACCOUNT_NAME'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        throw new Error(`Thiếu cấu hình VietQR: ${missingVars.join(', ')}`);
      }

      qr = await buildVietQR({
        accountNumber: process.env.VIETQR_ACCOUNT_NO,
        bankCode: process.env.VIETQR_BANK_CODE,
        accountName: process.env.VIETQR_ACCOUNT_NAME,
        amount,
        addInfo: `Thanh toan don ${order_id}`
      });
    }

    // ✅ Insert payment record
    const [result] = await pool.query(
      `INSERT INTO payments (order_id, method, amount, printed_bill, payment_status)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, method, amount, print_bill ? 1 : 0, method === "CASH" ? "PAID" : "PENDING"]
    );

    const payment_id = result.insertId;

    // ✅ Update order status based on payment method
    if (method === "CASH") {
      // Tiền mặt → Thanh toán ngay
      await pool.query(
        "UPDATE orders SET status = 'PAID' WHERE id = ?",
        [order_id]
      );
    } else {
      // Banking/QR/Card → Chờ xác nhận
      // await pool.query(
      //   "UPDATE orders SET status = 'PENDING_PAYMENT' WHERE id = ?",
      //   [order_id]
      // );
    }

    // ✅ Return response
    const response = {
      payment_id,
      order_id,
      method,
      amount,
      payment_status: method === "CASH" ? "PAID" : "PENDING",
      order_status: method === "CASH" ? "PAID" : "PENDING_PAYMENT",
      print_bill: !!print_bill,
      created_at: new Date().toISOString(),
      qr_session_id: qr_session_id // ✅ Thêm qr_session_id để controller gửi notification
    };

    // Add QR data if generated
    if (qr) {
      response.qr_data = {
        qr_code_url: qr.qrCodeUrl,        // URL trực tiếp đến QR image
        qr_code_image: qr.qrCodeImage,    // Same as URL (for backward compatibility)
        quick_link: qr.quickLink,         // Quick link cho mobile
        bank_info: qr.bankInfo || {
          account_number: process.env.VIETQR_ACCOUNT_NO,
          account_name: process.env.VIETQR_ACCOUNT_NAME,
          bank_code: process.env.VIETQR_BANK_CODE,
          amount: amount,
          transfer_content: `Thanh toan don ${order_id}`
        }
      };
    }

    return response;

  } catch (error) {
    console.error("payOrder error:", error);
    throw error;
  }
}

// 2. Callback xác nhận thanh toán Napas/VietQR
export async function confirmPayment({ qr_session_id, transaction_code, amount, success }) {
  try {
    // ✅ Validate input
    if (!qr_session_id) {
      throw new Error("Thiếu thông tin qr_session_id");
    }

    // ✅ Tìm payment gần nhất của session
    const [payments] = await pool.query(
      `SELECT p.*, o.id as order_id, o.status as order_status 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.qr_session_id = ? 
       AND p.payment_status = 'PENDING'
       ORDER BY p.id DESC 
       LIMIT 1`,
      [qr_session_id]
    );

    if (payments.length === 0) {
      throw new Error("Không tìm thấy giao dịch thanh toán đang chờ xác nhận");
    }

    const payment = payments[0];

    // ✅ Validate amount (nếu có)
    if (amount && Number(amount) !== Number(payment.amount)) {
      throw new Error(`Số tiền không khớp. Mong đợi: ${payment.amount}, Nhận được: ${amount}`);
    }

    // ✅ Xử lý kết quả thanh toán
    if (success) {
      // Thanh toán thành công
      await pool.query(
        `UPDATE payments 
         SET payment_status = 'PAID', 
             transaction_code = ?,
             confirmed_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [transaction_code || null, payment.id]
      );

      await pool.query(
        `UPDATE orders 
         SET status = 'PAID', 
             updated_at = NOW() 
         WHERE id = ?`,
        [payment.order_id]
      );

      // ✅ Đóng qr_session khi admin xác nhận thanh toán thành công
      if (qr_session_id) {
        try {
          await closeSession(qr_session_id);
          console.log(`✅ Session ${qr_session_id} closed after payment confirmation`);
        } catch (error) {
          console.error(`⚠️ Failed to close session ${qr_session_id}:`, error);
          // Không throw error vì thanh toán đã thành công
        }
      }

      return {
        payment_id: payment.id,
        order_id: payment.order_id,
        payment_status: "PAID",
        order_status: "PAID",
        transaction_code,
        amount: payment.amount,
        confirmed_at: new Date().toISOString(),
        message: "Xác nhận thanh toán thành công",
        qr_session_id: qr_session_id // ✅ Thêm để controller gửi notification
      };

    } else {
      // Thanh toán thất bại
      await pool.query(
        `UPDATE payments 
         SET payment_status = 'FAILED', 
             transaction_code = ?,
             confirmed_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [transaction_code || null, payment.id]
      );

      await pool.query(
        `UPDATE orders 
         SET status = 'NEW', 
             updated_at = NOW() 
         WHERE id = ?`,
        [payment.order_id]
      );

      return {
        payment_id: payment.id,
        order_id: payment.order_id,
        payment_status: "FAILED",
        order_status: "NEW",
        transaction_code,
        amount: payment.amount,
        confirmed_at: new Date().toISOString(),
        message: "Thanh toán thất bại, đơn hàng được khôi phục",
        qr_session_id: qr_session_id // ✅ Thêm để controller gửi notification
      };
    }

  } catch (error) {
    console.error("confirmPayment error:", error);
    throw error;
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


export async function payOrderByAdmin({ sessionId, adminId }) {
  const connect = await pool.getConnection();

  try {
    // Validate session exists and is active
    const sqlCheckSession = `SELECT * FROM qr_sessions WHERE id = ? AND status = 'ACTIVE'`;
    const sessions = await query(sqlCheckSession, [sessionId]);

    if (sessions.length === 0) {
      throw new Error("Session not found or already completed");
    }

    // Get all orders for this session
    const sqlFindOrder = `SELECT * FROM orders WHERE qr_session_id = ?`;
    const orders = await query(sqlFindOrder, [sessionId]);

    if (orders.length === 0) {
      throw new Error("No orders found for the given sessionId");
    }

    // Separate orders by status
    console.log('📦 Processing orders:', orders.length);
    const ordersToConfirm = orders.filter(item => item.status === 'IN_PROGRESS' || item.status === 'DONE');
    const ordersToCancel = orders.filter(item => item.status === 'NEW');

    console.log('✅ Orders to confirm (IN_PROGRESS/DONE):', ordersToConfirm.length);
    console.log('❌ Orders to cancel (NEW):', ordersToCancel.length);

    // Calculate total amount from confirmed orders
    const totalAmount = ordersToConfirm.reduce((sum, order) => sum + Number(order.total_price || 0), 0);

    await connect.beginTransaction();

    try {
      // 1. Cancel NEW orders
      if (ordersToCancel.length > 0) {
        const orderIdsToCancel = ordersToCancel.map(item => item.id);
        const placeholders = orderIdsToCancel.map(() => '?').join(',');
        await connect.query(`
          UPDATE orders 
          SET status = 'CANCELLED', admin_id = ?, updated_at = NOW()
          WHERE id IN (${placeholders})
        `, [adminId, ...orderIdsToCancel]);
      }

      // 2. Mark IN_PROGRESS and DONE orders as PAID
      if (ordersToConfirm.length > 0) {
        const orderIdsToConfirm = ordersToConfirm.map(item => item.id);
        const placeholders = orderIdsToConfirm.map(() => '?').join(',');
        await connect.query(`
          UPDATE orders 
          SET status = 'PAID', admin_id = ?, updated_at = NOW()
          WHERE id IN (${placeholders})
        `, [adminId, ...orderIdsToConfirm]);
      }

      // 3. Close session as COMPLETED
      await connect.query(`
        UPDATE qr_sessions 
        SET status = 'COMPLETED'
        WHERE id = ?
      `, [sessionId]);

      await connect.commit();
      console.log('✅ Transaction committed successfully');

      // 4. Send real-time notification to customer via Socket.IO
      try {
        await notifyPaymentCompleted(sessionId, {
          ordersConfirmed: ordersToConfirm,
          ordersCancelled: ordersToCancel,
          totalAmount
        });
        console.log('✅ Payment notification sent to customer');
      } catch (notifyError) {
        // Don't fail the payment if notification fails
        console.error('⚠️ Failed to send payment notification:', notifyError);
      }

      return {
        success: true,
        message: 'Payment by admin completed successfully',
        ordersConfirmed: ordersToConfirm.map(item => ({
          id: item.id,
          status: 'PAID',
          total_price: item.total_price
        })),
        ordersCancelled: ordersToCancel.map(item => ({
          id: item.id,
          status: 'CANCELLED'
        })),
        totalAmount,
        sessionId,
        sessionStatus: 'COMPLETED'
      };
    } catch (error) {
      await connect.rollback();
      console.error('❌ Transaction rolled back:', error);
      throw error;
    }
  } catch (error) {
    console.error("payOrderByAdmin error:", error.message);
    throw error;
  } finally {
    connect.release();
  }
}
