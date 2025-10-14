import * as tableService from "../services/table.service.js";

export async function createTable(req, res) {
    try {
        const result = await tableService.createTable(req.body);
        res.json({ status: 201, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function updateTable(req, res) {
    try {
        const result = await tableService.updateTable(req.params.id, req.body);
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function deleteTable(req, res) {
    try {
        const result = await tableService.deleteTable(req.params.id);
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function listTables(req, res) {
    try {
        const result = await tableService.getTables();
        res.json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}
