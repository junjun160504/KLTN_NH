import * as staffOrderService from "../services/staffOrder.service.js";

export async function confirmOrder(req, res) {
    try {
        const result = await staffOrderService.confirmOrder(req.params.id);
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function rejectOrder(req, res) {
    try {
        const result = await staffOrderService.rejectOrder(req.params.id, req.body.reason);
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function updateOrderItem(req, res) {
    try {
        const result = await staffOrderService.updateOrderItem(req.params.itemId, req.body);
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}
