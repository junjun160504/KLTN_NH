import * as cartService from '../services/cart.service.js';

/**
 * GET /api/cart/cus/cart?qr_session_id=1
 * Lấy giỏ hàng theo qr_session_id
 */
export async function getCart(req, res) {
  try {
    const { qr_session_id } = req.query;

    if (!qr_session_id) {
      return res.status(400).json({
        status: 400,
        message: "qr_session_id is required"
      });
    }

    const items = await cartService.getCart(qr_session_id);

    res.json({
      status: 200,
      data: items,
      total_items: items.length
    });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({
      status: 500,
      message: err.message || 'Internal server error'
    });
  }
}

/**
 * POST /api/cart/cus/cart
 * Thêm món vào giỏ hàng
 */
export async function addToCart(req, res) {
  try {
    const { qr_session_id, menu_item_id, quantity, note } = req.body;

    if (!qr_session_id) {
      return res.status(400).json({
        status: 400,
        message: "qr_session_id is required"
      });
    }

    if (!menu_item_id) {
      return res.status(400).json({
        status: 400,
        message: "menu_item_id is required"
      });
    }

    const newItem = await cartService.addToCart(req.body);

    res.status(201).json({
      status: 201,
      message: "Item added to cart successfully",
      data: newItem
    });
  } catch (err) {
    console.error('addToCart error:', err);
    res.status(400).json({
      status: 400,
      message: err.message || 'Failed to add item to cart'
    });
  }
}

/**
 * PUT /api/cart/items/:id
 * Cập nhật quantity hoặc note của cart item
 */
export async function updateCartItem(req, res) {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;

    if (quantity === undefined && note === undefined) {
      return res.status(400).json({
        status: 400,
        message: "At least one field (quantity or note) is required"
      });
    }

    if (quantity !== undefined && typeof quantity !== 'number') {
      return res.status(400).json({
        status: 400,
        message: "Quantity must be a number"
      });
    }

    const result = await cartService.updateCartItem(id, { quantity, note });

    if (result.deleted) {
      return res.json({
        status: 200,
        message: result.message,
        deleted: true
      });
    }

    res.json({
      status: 200,
      message: "Cart item updated successfully",
      data: result
    });
  } catch (err) {
    console.error('updateCartItem error:', err);

    if (err.message.includes('not found')) {
      return res.status(404).json({
        status: 404,
        message: err.message
      });
    }

    if (err.message.includes('Cannot update')) {
      return res.status(403).json({
        status: 403,
        message: err.message
      });
    }

    res.status(400).json({
      status: 400,
      message: err.message || 'Failed to update cart item'
    });
  }
}

/**
 * DELETE /api/cart/items/:id
 * Xóa món khỏi giỏ hàng
 */
export async function removeCartItem(req, res) {
  try {
    const { id } = req.params;

    const result = await cartService.removeCartItem(id);

    res.json({
      status: 200,
      message: result.message,
      success: result.success
    });
  } catch (err) {
    console.error('removeCartItem error:', err);

    if (err.message.includes('not found')) {
      return res.status(404).json({
        status: 404,
        message: err.message
      });
    }

    if (err.message.includes('Cannot remove')) {
      return res.status(403).json({
        status: 403,
        message: err.message
      });
    }

    res.status(400).json({
      status: 400,
      message: err.message || 'Failed to remove cart item'
    });
  }
}

/**
 * DELETE /api/cart?qr_session_id=1
 * Xóa tất cả items trong giỏ hàng
 */
export async function clearCart(req, res) {
  try {
    const { qr_session_id } = req.query;

    if (!qr_session_id) {
      return res.status(400).json({
        status: 400,
        message: "qr_session_id is required"
      });
    }

    const result = await cartService.clearCart(qr_session_id);

    res.json({
      status: 200,
      message: result.message,
      success: result.success,
      deleted_count: result.deletedCount
    });
  } catch (err) {
    console.error('clearCart error:', err);

    if (err.message.includes('No active cart')) {
      return res.status(404).json({
        status: 404,
        message: err.message
      });
    }

    res.status(400).json({
      status: 400,
      message: err.message || 'Failed to clear cart'
    });
  }
}

/**
 * PUT /api/cart/:id/status
 * Cập nhật status của cart
 */
export async function updateCartStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 400,
        message: "status is required"
      });
    }

    const result = await cartService.updateCartStatus(id, status);

    res.json({
      status: 200,
      message: result.message,
      data: {
        cart_id: result.cart_id,
        new_status: result.new_status
      }
    });
  } catch (err) {
    console.error('updateCartStatus error:', err);

    if (err.message.includes('not found')) {
      return res.status(404).json({
        status: 404,
        message: err.message
      });
    }

    res.status(400).json({
      status: 400,
      message: err.message || 'Failed to update cart status'
    });
  }
}
