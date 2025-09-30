import * as qrSessionService from "../services/qrSession.service.js";

export async function scanQr(req, res) {
    try {
        const result = await qrSessionService.startSession(req.body);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}

export async function endQr(req, res) {
    try {
        const result = await qrSessionService.closeSession(req.params.id);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        res.status(400).json({ status: 400, message: err.message });
    }
}
