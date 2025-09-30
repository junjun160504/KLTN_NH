import * as auditService from "../services/audit.service.js";

export async function createLog(req, res) {
    try {
        const ctx = {
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
        };
        const result = await auditService.writeLog({ ...req.body, ...ctx });
        res.status(201).json({ status: 201, data: result });
    } catch (err) {
        console.error("createLog error:", err);
        res.status(500).json({ status: 500, message: err.message });
    }
}

export async function listLogs(req, res) {
    try {
        const result = await auditService.getLogs(req.query);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error("listLogs error:", err);
        res.status(500).json({ status: 500, message: err.message });
    }
}

export async function getLog(req, res) {
    try {
        const result = await auditService.getLogById(req.params.id);
        if (!result) return res.status(404).json({ status: 404, message: "Log not found" });
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error("getLog error:", err);
        res.status(500).json({ status: 500, message: err.message });
    }
}
