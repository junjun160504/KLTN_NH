import * as menuService from "../services/menuItem.service.js";

export async function updateMenu(req, res) {
    try {
        const result = await menuService.updateMenuItem(req.params.id, req.body);
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function deleteMenu(req, res) {
    try {
        const success = await menuService.deleteMenuItem(req.params.id);
        if (!success) return res.status(404).json({ status: 404, message: "Menu not found" });
        res.json({ status: 200, message: "Deleted" });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}
