import React, { useState } from "react";
import {
    Layout,
    Typography,
    Button,
    message,
} from "antd";
import {
    ArrowLeftOutlined,
    DollarOutlined,
    BankOutlined,
    QrcodeOutlined,
    CreditCardOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// Format giá tiền
const formatPrice = (price) => {
    return Math.round(price).toLocaleString('vi-VN');
};

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Nhận data từ BillsCus page
    const { totalPrice: initialTotal = 0, unpaidOrders = [] } = location.state || {};

    // State
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH', 'BANKING', 'QR', 'CARD'
    const [loading, setLoading] = useState(false);
    const [usePoints, setUsePoints] = useState(false); // Dùng điểm hay không

    // Mock data - Điểm tích lũy của khách hàng (sau này lấy từ API)
    const customerPoints = 200; // 200 điểm = 200đ

    // Tính toán
    const totalAmount = initialTotal;

    // Tính số điểm tối đa có thể dùng (không vượt quá tổng tiền và điểm hiện có)
    const maxPointsCanUse = Math.min(customerPoints, totalAmount);

    // Số tiền giảm từ điểm (1000 điểm = 1000đ)
    const pointsDiscount = usePoints ? maxPointsCanUse : 0;

    // Số tiền cần thanh toán sau khi trừ điểm (đây là số tiền cuối cùng)
    const finalAmount = totalAmount - pointsDiscount;

    // Phương thức thanh toán
    const paymentMethods = [
        {
            key: 'CASH',
            label: 'Tiền mặt',
            icon: <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
        },
        {
            key: 'BANKING',
            label: 'Chuyển khoản',
            icon: <BankOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
        },
        {
            key: 'QR',
            label: 'Quét QR',
            icon: <QrcodeOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
        },
        {
            key: 'CARD',
            label: 'Quẹt thẻ',
            icon: <CreditCardOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
        },
    ];

    // Xử lý thanh toán
    const handlePayment = async () => {
        try {
            setLoading(true);

            if (finalAmount <= 0) {
                message.warning("Số tiền thanh toán phải lớn hơn 0!");
                return;
            }

            // Nếu chọn thanh toán bằng TIỀN MẶT → Gửi notification cho staff
            if (paymentMethod === 'CASH') {
                await handleCashPayment();
            } else {
                // Các phương thức khác: BANKING, QR, CARD
                await handleOtherPaymentMethods();
            }

        } catch (error) {
            console.error("Payment error:", error);
            message.error("Thanh toán thất bại: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Xử lý thanh toán TIỀN MẶT - Gửi notification
    const handleCashPayment = async () => {
        try {
            // Lấy thông tin bàn từ localStorage
            const sessionData = localStorage.getItem("qr_session");
            if (!sessionData) {
                message.error("Không tìm thấy thông tin phiên!");
                return;
            }

            const { table_id, session_id } = JSON.parse(sessionData);

            // Tạo notification cho staff
            const notificationData = {
                target_type: 'STAFF', // Gửi cho tất cả staff
                type: 'PAYMENT', // Loại notification
                title: `💰 Yêu cầu thanh toán tiền mặt - Bàn ${table_id}`,
                message: `Khách hàng ở bàn ${table_id} yêu cầu thanh toán ${formatPrice(finalAmount)}đ bằng tiền mặt.`,
                priority: 'high', // Ưu tiên cao
                action_url: `/management/orders?table=${table_id}`,
                metadata: JSON.stringify({
                    table_id,
                    session_id,
                    payment_method: 'CASH',
                    amount: finalAmount,
                    discount_points: pointsDiscount,
                    original_amount: totalAmount,
                    order_ids: unpaidOrders.map(o => o.id)
                })
            };

            // Gửi request tạo notification
            await axios.post(`${REACT_APP_API_URL}/notifications`, notificationData);

            // Thông báo thành công
            message.success({
                content: "Đã gửi yêu cầu thanh toán! Vui lòng đợi nhân viên đến bàn.",
                duration: 3
            });

            // Quay về trang bills sau 2 giây
            setTimeout(() => {
                navigate('/cus/bills', {
                    state: {
                        paymentRequested: true,
                        paymentMethod: 'CASH'
                    }
                });
            }, 2000);

        } catch (error) {
            console.error("Cash payment notification error:", error);
            throw error;
        }
    };

    // Xử lý các phương thức thanh toán khác (BANKING, QR, CARD)
    const handleOtherPaymentMethods = async () => {
        try {
            // TODO: Implement logic cho các phương thức khác
            // - BANKING: Hiển thị thông tin chuyển khoản
            // - QR: Hiển thị mã QR
            // - CARD: Gọi API quẹt thẻ

            // Gọi API thanh toán cho từng order
            const paymentPromises = unpaidOrders.map(order =>
                axios.post(`${REACT_APP_API_URL}/payment`, {
                    order_id: order.id,
                    method: paymentMethod,
                    amount: finalAmount, // Số tiền sau khi trừ điểm
                    print_bill: false
                })
            );

            await Promise.all(paymentPromises);

            // Thành công
            message.success("Thanh toán thành công!");

            // Quay về trang bills với trạng thái đã thanh toán
            setTimeout(() => {
                navigate('/cus/bills', {
                    state: { paymentSuccess: true }
                });
            }, 1000);

        } catch (error) {
            console.error("Payment error:", error);
            throw error;
        }
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
            {/* Header */}
            <Header
                className="transition-all duration-300"
                style={{
                    background: "#fff",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: 64,
                }}
            >
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined style={{ color: "#333", fontSize: 18 }} />}
                    onClick={() => navigate(-1)}
                />
                <div className="text-center">
                    <Title level={5} style={{ margin: 0, color: "#226533", fontWeight: 600 }}>
                        Thanh toán
                    </Title>
                </div>
                <div style={{ width: 40 }}></div>
            </Header>

            {/* Content */}
            <Content
                style={{
                    padding: "1px",
                    paddingTop: "72px",
                    paddingBottom: "100px",
                }}
            >
                {/* Tổng tiền - KHÔNG thay đổi */}
                <div
                    style={{
                        background: "#fff",
                        padding: "16px",
                        borderRadius: 8,
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: "1px solid #f0f0f0",
                    }}
                >
                    <Text style={{ fontSize: 14, color: "#666" }}>Tổng tiền</Text>
                    <Text strong style={{ fontSize: 16, color: "#226533", fontWeight: 600 }}>
                        {formatPrice(totalAmount)}đ
                    </Text>
                </div>

                {/* Dùng điểm và Số tiền thanh toán - GỘP THÀNH 1 Ô */}
                <div
                    style={{
                        background: "#fff",
                        padding: "16px",
                        borderRadius: 8,
                        marginBottom: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: "1px solid #f0f0f0",
                    }}
                >
                    {/* Dùng điểm tích lũy */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                            paddingBottom: 16,
                            borderBottom: "1px solid #f0f0f0",
                        }}
                    >
                        <div>
                            <Text style={{ fontSize: 14, color: "#333", display: "block" }}>
                                Dùng {formatPrice(customerPoints)} điểm
                            </Text>
                            <Text style={{ fontSize: 12, color: "#999" }}>
                                Giảm {formatPrice(maxPointsCanUse)}đ
                            </Text>
                        </div>

                        {/* Toggle Switch */}
                        <label
                            style={{
                                position: "relative",
                                display: "inline-block",
                                width: 44,
                                height: 24,
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={usePoints}
                                onChange={(e) => setUsePoints(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: usePoints ? "#226533" : "#d9d9d9",
                                    borderRadius: 24,
                                    transition: "0.3s",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        height: 18,
                                        width: 18,
                                        left: usePoints ? 23 : 3,
                                        bottom: 3,
                                        backgroundColor: "white",
                                        borderRadius: "50%",
                                        transition: "0.3s",
                                    }}
                                />
                            </span>
                        </label>
                    </div>

                    {/* Số tiền thanh toán - Hiển thị đơn giản */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 14, color: "#666" }}>Số tiền thanh toán</Text>
                        <Text strong style={{ fontSize: 16, color: "#226533", fontWeight: 600 }}>
                            {formatPrice(finalAmount)}đ
                        </Text>
                    </div>
                </div>

                {/* Phương thức thanh toán */}
                <div
                    style={{
                        background: "#fff",
                        padding: "16px",
                        borderRadius: 8,
                        marginBottom: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: "1px solid #f0f0f0",
                    }}
                >
                    <Text style={{ fontSize: 14, color: "#666", display: "block", marginBottom: 12 }}>
                        Phương thức thanh toán
                    </Text>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 12,
                        }}
                    >
                        {paymentMethods.map((method) => (
                            <div
                                key={method.key}
                                onClick={() => setPaymentMethod(method.key)}
                                style={{
                                    border: `2px solid ${paymentMethod === method.key ? '#226533' : '#e8e8e8'}`,
                                    borderRadius: 8,
                                    padding: "16px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                    background: paymentMethod === method.key ? '#f6ffed' : '#fff',
                                    transition: "all 0.3s",
                                }}
                            >
                                {method.icon}
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: paymentMethod === method.key ? 600 : 400,
                                        color: paymentMethod === method.key ? '#226533' : '#333',
                                    }}
                                >
                                    {method.label}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Content>

            {/* Footer với 2 nút */}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "#fff",
                    padding: "10px 12px",
                    borderTop: "2px solid #f0f0f0",
                    boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
                    display: "flex",
                    gap: 12,
                    zIndex: 1000,
                }}
            >
                {/* <Button
                    size="large"
                    style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 600,
                        border: "1px solid #226533",
                        color: "#226533",
                    }}
                    onClick={handlePaymentLater}
                >
                    Hủy
                </Button> */}
                <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(34, 101, 51, 0.3)",
                    }}
                    onClick={handlePayment}
                >
                    Hoàn thành
                </Button>
            </div>
        </Layout>
    );
}
