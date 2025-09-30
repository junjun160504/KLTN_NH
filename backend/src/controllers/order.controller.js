import * as orderService from "../services/order.service.js";

export async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ status: 201, data: order });
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

export async function addItemToOrder(req, res) {
  try {
    const { id } = req.params;
    const added = await orderService.addItem(id, req.body);
    res.json({ status: 200, data: added });
  } catch (err) {
    console.error("addItemToOrder error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) return res.status(404).json({ status: 404, message: "Order not found" });
    res.json({ status: 200, data: order });
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await orderService.updateStatus(id, status);
    res.json({ status: 200, data: updated });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}
