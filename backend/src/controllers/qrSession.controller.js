import * as qrSessionService from "../services/qrSession.service.js";

/**
 * Validate existing session (for localStorage restore)
 * GET /api/qr-sessions/:id/validate
 */
export async function validateSession(req, res) {
    try {
        const sessionId = parseInt(req.params.id);

        if (!sessionId || isNaN(sessionId)) {
            return res.status(400).json({
                status: 400,
                message: "Valid session ID is required"
            });
        }

        const result = await qrSessionService.validateSession(sessionId);

        if (result.valid) {
            res.status(200).json({
                status: 200,
                valid: true,
                data: result.session
            });
        } else {
            res.status(200).json({
                status: 200,
                valid: false,
                reason: result.reason,
                message: result.message,
                shouldClear: result.shouldClear || false
            });
        }
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: "Internal server error during session validation"
        });
    }
}

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
