import * as pointService from "../services/point.service.js";

/**
 * 📊 Lấy thông tin điểm của customer
 */
export async function getCustomerPoints(req, res) {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            return res.status(400).json({
                status: 400,
                message: "customerId is required"
            });
        }

        const data = await pointService.getCustomerPoints(customerId);

        res.json({
            status: 200,
            data
        });
    } catch (err) {
        console.error("getCustomerPoints error:", err);
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
}
