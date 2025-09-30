import * as paymentService from "../services/payment.service.js";

// Thanh toán
export async function processPayment(req, res) {
  try {
    const result = await paymentService.payOrder(req.body);
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
