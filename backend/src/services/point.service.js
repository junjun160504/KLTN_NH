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
 * Logic mới: 1 điểm = 3,000đ | Tối thiểu 30 điểm
 */
export async function redeemAllPoints(customerId, totalAmount, connection) {
    try {
        // 1. Lấy số điểm hiện tại
        const [customers] = await connection.query(
            `SELECT points FROM customers WHERE id = ?`,
            [customerId]
        );

        if (!customers || customers.length === 0) {
            throw new Error('Customer not found');
        }

        const customer = customers[0];
        const currentPoints = customer.points;

        // 🔒 Kiểm tra điểm tối thiểu để đổi (30 điểm)
        const MIN_POINTS_TO_REDEEM = 30;
        if (currentPoints < MIN_POINTS_TO_REDEEM) {
            console.log(`ℹ️ Customer chỉ có ${currentPoints} điểm (cần tối thiểu ${MIN_POINTS_TO_REDEEM} điểm để đổi)`);
            return {
                points_used: 0,
                discount_amount: 0,
                points_remaining: currentPoints
            };
        }

        // 2. Tính số tiền giảm: 1 điểm = 3,000đ
        const DISCOUNT_PER_POINT = 3000;
        const discountAmount = currentPoints * DISCOUNT_PER_POINT;

        // 3. Validate không được vượt tổng đơn hàng
        const actualDiscount = Math.min(discountAmount, totalAmount);

        // Tính lại số điểm thực tế sử dụng (nếu discount bị giới hạn)
        const actualPointsUsed = actualDiscount === discountAmount
            ? currentPoints
            : Math.floor(actualDiscount / DISCOUNT_PER_POINT);

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
 * Logic mới: 100,000đ = 1 điểm | Đơn tối thiểu 300,000đ
 */
export async function earnPointsFromPayment(customerId, finalAmount, connection) {
    try {
        // 🔒 Kiểm tra đơn hàng tối thiểu để được tích điểm (300,000đ)
        const MIN_ORDER_FOR_POINTS = 300000;

        // Lấy số điểm hiện tại của customer
        const [customers] = await connection.query(
            `SELECT points FROM customers WHERE id = ?`,
            [customerId]
        );

        if (!customers || customers.length === 0) {
            throw new Error('Customer not found');
        }

        const customer = customers[0];
        const currentPoints = customer.points || 0;

        if (finalAmount < MIN_ORDER_FOR_POINTS) {
            console.log(`ℹ️ Đơn hàng ${finalAmount.toLocaleString()}đ (cần tối thiểu ${MIN_ORDER_FOR_POINTS.toLocaleString()}đ để tích điểm)`);
            return {
                points_earned: 0,
                points_balance: currentPoints // ✅ Trả về điểm hiện tại thay vì 0
            };
        }

        // 1. Tính điểm: 100,000đ = 1 điểm
        const POINTS_PER_AMOUNT = 100000;
        const pointsEarned = Math.floor(finalAmount / POINTS_PER_AMOUNT);

        if (pointsEarned <= 0) {
            console.log('ℹ️ Đơn hàng chưa đủ để tích điểm');
            return {
                points_earned: 0,
                points_balance: currentPoints // ✅ Trả về điểm hiện tại thay vì 0
            };
        }

        // 2. Cộng điểm vào customer
        await connection.query(
            `UPDATE customers 
       SET points = points + ? 
       WHERE id = ?`,
            [pointsEarned, customerId]
        );

        // 3. Lấy số điểm mới sau khi cập nhật
        const [updatedCustomers] = await connection.query(
            `SELECT points FROM customers WHERE id = ?`,
            [customerId]
        );

        const updatedCustomer = updatedCustomers[0];
        console.log(`🎉 Tích ${pointsEarned} điểm cho customer #${customerId} (Tổng: ${updatedCustomer.points})`);

        return {
            points_earned: pointsEarned,
            points_balance: updatedCustomer.points
        };

    } catch (err) {
        console.error('❌ earnPointsFromPayment error:', err);
        throw err;
    }
}

/**
 * 📊 LẤY THÔNG TIN ĐIỂM CỦA CUSTOMER
 * Logic mới: 1 điểm = 3,000đ
 */
export async function getCustomerPoints(customerId) {
    const [customers] = await pool.query(
        `SELECT id, name, phone, points, created_at 
     FROM customers 
     WHERE id = ?`,
        [customerId]
    );

    if (!customers || customers.length === 0) {
        throw new Error('Customer not found');
    }

    const customer = customers[0];

    const DISCOUNT_PER_POINT = 3000; // 1 điểm = 3,000đ

    return {
        customer_id: customer.id,
        name: customer.name,
        phone: customer.phone,
        points: customer.points,
        points_value: customer.points * DISCOUNT_PER_POINT, // Giá trị quy đổi
        member_since: customer.created_at
    };
}
