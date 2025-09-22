import * as menuService from '../services/menu.service.js';

export async function getMenuItems(req, res) {
    try {
        const { name } = req.params;
        const items = await menuService.getAllMenuItems(name);
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
export async function getMenuCategories(req, res) {
    console.log("getMenuCategories called");
    try {
        const categories = await menuService.getMenuCategories();
        console.log(categories)
        res.status(201).json({ status: 201, data: categories });
    } catch (err) {
        console.error('createMenuCategory error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
export async function getItemsByCategory(req, res) {
    try {
        const { id } = req.params; // lấy category id từ URL
        const items = await menuService.getItemsByCategory(id);
        res.json({ success: true, data: items });
    } catch (err) {
        console.error("Error getItemsByCategory:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
export async function getAllItemsController(req, res) {
    try {
        const items = await menuService.getAllItems();
        res.json({ success: true, data: items });
    } catch (err) {
        console.error("Error getItemsByCategory:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}