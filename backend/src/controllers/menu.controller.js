import * as menuService from '../services/menu.service.js';

export async function getMenuItems(req, res) {
    try {
        const items = await menuService.getAllMenuItems();
        res.json({ status: 200, data: items });
    } catch (err) {
        console.error('getMenuItems error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

export async function createMenuItem(req, res) {
    try {
        const newItem = await menuService.addMenuItem(req.body);
        res.status(201).json({ status: 201, data: newItem });
    } catch (err) {
        console.error('createMenuItem error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
