import * as orderService from "../services/order.service.js";

// Lấy danh sách đơn hàng (có filter)
export async function getAllOrders(req, res) {
  try {
    const { status, qr_session_id, table_id, limit, offset } = req.query;

    const filters = {
      status,
      qr_session_id: qr_session_id ? parseInt(qr_session_id) : undefined,
      table_id: table_id ? parseInt(table_id) : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    };

    const result = await orderService.getAllOrders(filters);
    res.json({
      status: 200,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal server error"
    });
  }
}


/**
 * POST /api/orders/admin/create
 * Admin tạo order cho khách hàng tại quầy (không cần QR)
 */
export async function createOrderByAdmin(req, res) {
  try {
    const { table_id, items, customer_phone } = req.body;

    // admin_id từ token (nếu có auth)
    const admin_id = req.user?.id || null;

    const order = await orderService.createOrderByAdmin({
      table_id,
      items,
      admin_id,
      customer_phone, // optional
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully by admin",
      data: order,
    });
  } catch (error) {
    console.error("❌ [ADMIN CREATE ORDER] Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// POST /api/orders - Tạo đơn mới (smart logic: reuse or create new)
export async function createOrder(req, res) {
  try {
    const { qr_session_id, items } = req.body;

    if (!qr_session_id) {
      return res.status(400).json({
        status: 400,
        message: "qr_session_id is required"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "items array is required and must contain at least 1 item"
      });
    }

    const order = await orderService.createOrder({ qr_session_id, items });
    res.status(201).json({
      status: 201,
      message: "Order created successfully",
      data: order
    });
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal server error"
    });
  }
}

export async function addItemToOrder(req, res) {
  try {
    const { id } = req.params;
    const itemsData = req.body;

    // Support both single item object and array of items
    const items = Array.isArray(itemsData) ? itemsData : [itemsData];

    if (items.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "At least one item is required"
      });
    }

    const order = await orderService.addItem(id, items);
    res.json({
      status: 200,
      message: "Items added successfully",
      data: order
    });
  } catch (err) {
    console.error("addItemToOrder error:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal server error"
    });
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

// Lấy đơn theo qr_session_id
export async function getOrdersBySession(req, res) {
  try {
    const { qr_session_id } = req.params;
    const orders = await orderService.getOrdersBySessionId(qr_session_id);
    res.json({
      status: 200,
      data: orders
    });
  } catch (err) {
    console.error("getOrdersBySession error:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal server error"
    });
  }
}

// Lấy đơn theo table_id
export async function getOrdersByTable(req, res) {
  try {
    const { table_id } = req.params;
    const orders = await orderService.getOrdersByTableId(table_id);
    res.json({
      status: 200,
      data: orders
    });
  } catch (err) {
    console.error("getOrdersByTable error:", err);
    res.status(500).json({
      status: 500,
      message: err.message || "Internal server error"
    });
  }
}

// ========== NEW FEATURES ==========

/**
 * Xóa món khỏi order (chỉ khi status = NEW)
 */
export async function removeItemFromOrder(req, res) {
  try {
    const { orderId, itemId } = req.params;

    if (!orderId || !itemId) {
      return res.status(400).json({
        status: 400,
        message: "orderId and itemId are required"
      });
    }

    const result = await orderService.removeItemFromOrder(orderId, itemId);

    if (result.deleted) {
      return res.json({
        status: 200,
        message: result.message,
        data: { orderId: result.orderId, deleted: true }
      });
    }

    res.json({
      status: 200,
      message: "Item removed successfully",
      data: result
    });
  } catch (err) {
    console.error("removeItemFromOrder error:", err);
    const statusCode = err.message.includes("not found") ? 404 :
      err.message.includes("cannot be modified") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: err.message || "Internal server error"
    });
  }
}

/**
 * Cập nhật số lượng món trong order (chỉ khi status = NEW)
 */
export async function updateItemQuantity(req, res) {
  try {
    const { orderId, itemId } = req.params;
    const { quantity } = req.body;

    if (!orderId || !itemId) {
      return res.status(400).json({
        status: 400,
        message: "orderId and itemId are required"
      });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        status: 400,
        message: "quantity is required"
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        status: 400,
        message: "quantity must be a non-negative number"
      });
    }

    const result = await orderService.updateOrderItemQuantity(orderId, itemId, quantity);

    if (result.deleted) {
      return res.json({
        status: 200,
        message: result.message,
        data: { orderId: result.orderId, deleted: true }
      });
    }

    res.json({
      status: 200,
      message: "Item quantity updated successfully",
      data: result
    });
  } catch (err) {
    console.error("updateItemQuantity error:", err);
    const statusCode = err.message.includes("not found") ? 404 :
      err.message.includes("cannot be modified") ? 403 :
        err.message.includes("Quantity") ? 400 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: err.message || "Internal server error"
    });
  }
}

/**
 * Hủy đơn hàng (chỉ khi status = NEW hoặc IN_PROGRESS)
 */
export async function cancelOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: 400,
        message: "orderId is required"
      });
    }

    const result = await orderService.cancelOrder(orderId, reason);

    res.json({
      status: 200,
      message: "Order cancelled successfully",
      data: result
    });
  } catch (err) {
    console.error("cancelOrder error:", err);
    const statusCode = err.message.includes("not found") ? 404 :
      err.message.includes("cannot be cancelled") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: err.message || "Internal server error"
    });
  }
}
