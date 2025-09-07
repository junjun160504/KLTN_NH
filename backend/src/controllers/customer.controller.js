import * as customerService from '../services/customer.service.js';

export async function addCustomer(req, res) {
    try {
        const result = await customerService.addPhone(req.body);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error('addCustomer error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
