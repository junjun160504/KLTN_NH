import * as cartService from '../services/cart.service.js';

export async function getCart(req, res) {
    try {
        const { name } = req.params;
        const items = await cartService.getCart(name);
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