import * as cartService from '../services/cart.service.js';

export async function getCart(req, res) {
  try {
    const { qr_session_id } = req.query; // GET /cus/cart?qr_session_id=1
    if (!qr_session_id) {
      return res.status(400).json({ status: 400, message: "Thiếu qr_session_id" });
    }
    const items = await cartService.getCart(qr_session_id);
    res.json({ status: 200, data: items });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ status: 500, message: 'Internal server error' });
  }
}

export async function addToCart(req, res) {
  try {
    const newItem = await cartService.addToCart(req.body);
    res.status(201).json({ status: 201, data: newItem });
  } catch (err) {
    console.error('addToCart error:', err);
    res.status(500).json({ status: 500, message: 'Internal server error' });
  }
}
