import * as orderService from '../services/order.service.js';

export async function createOrder(req, res) {
    try {
        const order = await orderService.createOrder(req.body);
        res.status(201).json({ status: 201, data: order });
    } catch (err) {
        console.error('createOrder error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

export async function addItemToOrder(req, res) {
    try {
        const orderId = req.params.id;
        const added = await orderService.addItem(orderId, req.body);
        res.json({ status: 200, data: added });
    } catch (err) {
        console.error('addItemToOrder error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

export async function getOrderById(req, res) {
    try {
        const order = await orderService.getOrderById(req.params.id);
        res.json({ status: 200, data: order });
    } catch (err) {
        console.error('getOrderById error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

export async function updateOrderStatus(req, res) {
    try {
        const updated = await orderService.updateStatus(req.params.id, req.body.status);
        res.json({ status: 200, data: updated });
    } catch (err) {
        console.error('updateOrderStatus error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
