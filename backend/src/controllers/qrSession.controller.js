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

/**
 * Update customer_id cho qr_session
 * PUT /api/qr-sessions/:sessionId/customer
 */
export async function updateSessionCustomer(req, res) {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { customer_id } = req.body;

        if (!sessionId || isNaN(sessionId)) {
            return res.status(400).json({
                status: 400,
                message: "Valid session ID is required"
            });
        }

        if (!customer_id) {
            return res.status(400).json({
                status: 400,
                message: "customer_id is required"
            });
        }

        const result = await qrSessionService.updateSessionCustomer(sessionId, customer_id);

        res.status(200).json({
            status: 200,
            message: "Session updated successfully",
            data: result
        });
    } catch (err) {
        console.error("updateSessionCustomer error:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}

/**
 * Get session by ID (with customer info)
 * GET /api/qr-sessions/:id
 */
export async function getSessionById(req, res) {
    try {
        const sessionId = parseInt(req.params.id);

        if (!sessionId || isNaN(sessionId)) {
            return res.status(400).json({
                status: 400,
                message: "Valid session ID is required"
            });
        }

        const session = await qrSessionService.getSessionById(sessionId);

        if (!session) {
            return res.status(404).json({
                status: 404,
                message: "Session not found"
            });
        }

        res.status(200).json({
            status: 200,
            data: session
        });
    } catch (err) {
        console.error("getSessionById error:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal server error"
        });
    }
}
