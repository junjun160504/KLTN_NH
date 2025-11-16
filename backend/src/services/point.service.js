import { pool } from "../config/db.js";

/**
 * =====================================================
 * 🎯 POINT SERVICE - TÍCH ĐIỂM & ĐỔI ĐIỂM ĐƠN GIẢN
 * =====================================================
 * Logic: Chỉ dùng bảng customers.points
 * Không tạo bảng transaction history
 * =====================================================
 */

/**
 * 💸 ĐỔI HẾT ĐIỂM THÀNH GIẢM GIÁ (ALL-IN)
 * Gọi KHI ADMIN XÁC NHẬN THANH TOÁN
 */
export async function redeemAllPoints(customerId, totalAmount, connection) {
    try {
        // 1. Lấy số điểm hiện tại
        const [[customer]] = await connection.query(
            `SELECT points FROM customers WHERE id = ?`,
            [customerId]
        );

        if (!customer) {
            throw new Error('Customer not found');
        }

        const currentPoints = customer.points;

        // Nếu không có điểm thì bỏ qua
        if (currentPoints <= 0) {
            console.log('ℹ️ Customer không có điểm để đổi');
            return {
                points_used: 0,
                discount_amount: 0,
                points_remaining: 0
            };
        }

        // 2. Tính số tiền giảm: 100 điểm = 10,000đ
        const discountAmount = Math.floor((currentPoints / 100) * 10000);

        // 3. Validate không được vượt tổng đơn hàng
        const actualDiscount = Math.min(discountAmount, totalAmount);

        // Tính lại số điểm thực tế sử dụng (nếu discount bị giới hạn)
        const actualPointsUsed = actualDiscount === discountAmount
            ? currentPoints
            : Math.floor((actualDiscount / 10000) * 100);

        // 4. Trừ điểm (ALL-IN - dùng hết)
        await connection.query(
            `UPDATE customers SET points = 0 WHERE id = ?`,
            [customerId]
        );

        console.log(`✅ Đổi ${actualPointsUsed} điểm → Giảm ${actualDiscount.toLocaleString()}đ cho customer #${customerId}`);

        return {
            points_used: actualPointsUsed,
            discount_amount: actualDiscount,
            points_remaining: 0 // Luôn = 0 vì đổi hết
        };

    } catch (err) {
        console.error('❌ redeemAllPoints error:', err);
        throw err;
    }
}

/**
 * 🎉 TÍCH ĐIỂM TỰ ĐỘNG KHI THANH TOÁN
 * Gọi SAU KHI ADMIN XÁC NHẬN PAYMENT
 */
export async function earnPointsFromPayment(customerId, finalAmount, connection) {
    try {
        // 1. Tính điểm: 10,000đ = 1 điểm
        const pointsEarned = Math.floor(finalAmount / 10000);

        if (pointsEarned <= 0) {
            console.log('ℹ️ Đơn hàng dưới 10k, không tích điểm');
            return {
                points_earned: 0,
                points_balance: 0
            };
        }

        // 2. Cộng điểm vào customer
        await connection.query(
            `UPDATE customers 
       SET points = points + ? 
       WHERE id = ?`,
            [pointsEarned, customerId]
        );

        // 3. Lấy số điểm mới
        const [[customer]] = await connection.query(
            `SELECT points FROM customers WHERE id = ?`,
            [customerId]
        );

        console.log(`🎉 Tích ${pointsEarned} điểm cho customer #${customerId} (Tổng: ${customer.points})`);

        return {
            points_earned: pointsEarned,
            points_balance: customer.points
        };

    } catch (err) {
        console.error('❌ earnPointsFromPayment error:', err);
        throw err;
    }
}

/**
 * 📊 LẤY THÔNG TIN ĐIỂM CỦA CUSTOMER
 */
export async function getCustomerPoints(customerId) {
    const [[customer]] = await pool.query(
        `SELECT id, name, phone, points, created_at 
     FROM customers 
     WHERE id = ?`,
        [customerId]
    );

    if (!customer) {
        throw new Error('Customer not found');
    }

    return {
        customer_id: customer.id,
        name: customer.name,
        phone: customer.phone,
        points: customer.points,
        points_value: Math.floor((customer.points / 100) * 10000), // Giá trị quy đổi
        member_since: customer.created_at
    };
}
