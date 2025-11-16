import * as paymentService from "../services/payment.service.js";
import { validateSession } from "../services/qrSession.service.js";
import { notifyUser } from "../services/simpleNotification.service.js";

// Thanh toán
export async function processPayment(req, res) {
  try {
    const result = await paymentService.payOrder(req.body);

    // ✅ Gửi notification đơn giản cho customer
    if (result.payment_status === 'PAID' && result.qr_session_id) {
      await notifyUser(result.qr_session_id, {
        type: 'success',
        message: `Thanh toán thành công ${result.amount.toLocaleString('vi-VN')}đ. Cảm ơn bạn!`
      });
    }

    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("processPayment error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}

// Callback Napas
export async function callbackPayment(req, res) {
  try {
    const result = await paymentService.confirmPayment(req.body);

    // ✅ Gửi notification đơn giản cho customer
    if (result.qr_session_id) {
      if (result.payment_status === 'PAID') {
        await notifyUser(result.qr_session_id, {
          type: 'success',
          message: `Thanh toán thành công ${result.amount.toLocaleString('vi-VN')}đ. Cảm ơn bạn!`
        });
      } else if (result.payment_status === 'FAILED') {
        await notifyUser(result.qr_session_id, {
          type: 'error',
          message: `Thanh toán thất bại. Vui lòng thử lại.`
        });
      }
    }

    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("callbackPayment error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}

// Hoàn tiền
export async function refundPayment(req, res) {
  try {
    const result = await paymentService.refundPayment(req.body);
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("refundPayment error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}

// Lấy 1 giao dịch
export async function getPayment(req, res) {
  try {
    const result = await paymentService.getPaymentById(req.params.id);
    if (!result) return res.status(404).json({ status: 404, message: "Payment not found" });
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("getPayment error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}

// Danh sách giao dịch
export async function listPayments(req, res) {
  try {
    const result = await paymentService.listPayments(req.query);
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("listPayments error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}


export async function paymentByAdmin(req, res) {
  try {
    const { sessionId, adminId, useAllPoints = false } = req.body;

    // validate sessionId is active
    const session = await validateSession(sessionId);
    if (!session.valid) {
      return res.status(400).json({ status: 400, message: "Invalid or expired session" });
    }

    const result = await paymentService.payOrderByAdmin({
      sessionId,
      adminId,
      useAllPoints
    });

    if (!result.success) {
      return res.status(400).json({ status: 400, message: result.message });
    }
    res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.error("paymentByAdmin error:", error);
    res.status(500).json({ status: 500, message: error.message });
  }
}

export async function notifyForUser(req, res) {
  try {
    const { sessionId, message } = req.body;
    await notifyUser(sessionId, {
      type: 'success',
      message: 'Đơn hàng đã được xác nhận'
    });
    res.status(200).json({ status: 200, message: "Notification sent" });
  } catch (error) {
    console.error("notifyForUser error:", error);
    res.status(500).json({ status: 500, message: error.message });
  }
}

// Tạo payment records cho session (từ customer)
export async function createSessionPayments(req, res) {
  try {
    const { sessionId, method, orderIds } = req.body;

    // Validate input
    if (!sessionId || !method || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields: sessionId, method, orderIds'
      });
    }

    const result = await paymentService.createSessionPayments({
      sessionId,
      method,
      orderIds
    });

    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("createSessionPayments error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}

// Hủy payment records cho session
export async function cancelSessionPayments(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        status: 400,
        message: 'Missing sessionId parameter'
      });
    }

    const result = await paymentService.cancelSessionPayments(sessionId);

    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("cancelSessionPayments error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}
