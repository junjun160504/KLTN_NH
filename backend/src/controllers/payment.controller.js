import * as paymentService from '../services/payment.service.js';

export async function processPayment(req, res) {
    try {
        const result = await paymentService.payOrder(req.body);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error('processPayment error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
