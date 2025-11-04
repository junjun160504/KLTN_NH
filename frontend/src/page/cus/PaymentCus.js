import React, { useState, useEffect } from "react";
import {
    Layout,
    Typography,
    Button,
    Modal,
    Spin,
    App,
} from "antd";
import {
    ArrowLeftOutlined,
    DollarOutlined,
    BankOutlined,
    QrcodeOutlined,
    CreditCardOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// CSS animations
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

// Inject CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = pulseAnimation;
    document.head.appendChild(style);
}

// Format giá tiền
const formatPrice = (price) => {
    return Math.round(price).toLocaleString('vi-VN');
};

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp(); // ✅ Use App hook for message

    // Nhận data từ BillsCus page
    const { totalPrice: initialTotal = 0, unpaidOrders = [] } = location.state || {};

    // State
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH', 'BANKING', 'QR', 'CARD'
    const [loading, setLoading] = useState(false);
    const [usePoints, setUsePoints] = useState(false); // Dùng điểm hay không

    // QR Code Modal State
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    // ✅ Loyalty Points State - Fetch from API
    const [customerPoints, setCustomerPoints] = useState(0);
    const [loadingPoints, setLoadingPoints] = useState(true);

    // ✅ Fetch customer loyalty points on mount
    useEffect(() => {
        const fetchCustomerPoints = async () => {
            try {
                setLoadingPoints(true);

                // Get customer info from localStorage
                const savedCustomer = localStorage.getItem('loyalty_customer');
                if (!savedCustomer) {
                    console.log('No loyalty customer found in localStorage');
                    setCustomerPoints(0);
                    setLoadingPoints(false);
                    return;
                }

                const customer = JSON.parse(savedCustomer);
                const phone = customer.phone;

                if (!phone) {
                    console.log('No phone number found');
                    setCustomerPoints(0);
                    setLoadingPoints(false);
                    return;
                }

                // Call API to get latest points
                const response = await axios.get(
                    `${REACT_APP_API_URL}/customers/me/${phone}`
                );

                if (response.status === 200) {
                    const latestData = response.data.data;
                    const points = latestData.points || 0;

                    // Update state
                    setCustomerPoints(points);

                    // Update localStorage with latest data
                    localStorage.setItem('loyalty_customer', JSON.stringify({
                        id: latestData.id,
                        phone: latestData.phone,
                        loyalty_points: points,
                    }));

                    console.log(`✅ Customer points loaded: ${points} điểm`);
                }
            } catch (error) {
                console.error('Error fetching customer points:', error);

                if (error.response?.status === 404) {
                    console.log('Customer not found - clearing localStorage');
                    localStorage.removeItem('loyalty_customer');
                    setCustomerPoints(0);
                } else {
                    message.warning('Không thể tải điểm tích lũy!');
                    setCustomerPoints(0);
                }
            } finally {
                setLoadingPoints(false);
            }
        };

        fetchCustomerPoints();
    }, [message]); // ✅ Add message to dependencies

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
        // {
        //     key: 'QR',
        //     label: 'Quét QR',
        //     icon: <QrcodeOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
        // },
        // {
        //     key: 'CARD',
        //     label: 'Quẹt thẻ',
        //     icon: <CreditCardOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
        // },
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
            message.error("Thanh toán thất bại!");
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
                content: "Đã gửi yêu cầu thanh toán!",
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
            // Nếu là BANKING hoặc QR → Hiển thị mã QR
            if (paymentMethod === 'BANKING' || paymentMethod === 'QR') {
                setQrLoading(true);
                setQrModalVisible(true);

                try {
                    // Gọi API thanh toán cho order đầu tiên để lấy QR code
                    const firstOrder = unpaidOrders[0];
                    const response = await axios.post(`${REACT_APP_API_URL}/payment`, {
                        order_id: firstOrder.id,
                        method: paymentMethod,
                        amount: finalAmount,
                        print_bill: false
                    });

                    // Kiểm tra và lưu thông tin QR
                    if (response.data.data && response.data.data["qr_data"]) {
                        setQrData(response.data.data.qr_data);
                        console.log("QR data set successfully:", response.data.data.qr_data);
                    } else {
                        console.error("QR data not found in response");
                        message.error("Không tìm được thông tin QR");
                    }
                } catch (error) {
                    console.error("API call error:", error);
                    message.error("Lỗi khi tạo mã QR");
                } finally {
                    setQrLoading(false);
                }

                return; // Không tự động quay về, đợi user đóng modal
            }

            // CARD hoặc phương thức khác
            // TODO: Implement logic cho CARD

            // Gọi API thanh toán cho từng order
            const paymentPromises = unpaidOrders.map(order =>
                axios.post(`${REACT_APP_API_URL}/payment`, {
                    order_id: order.id,
                    method: paymentMethod,
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
            setQrLoading(false);
            throw error;
        }
    };

    // Tải QR code về máy
    const handleDownloadQR = async () => {
        try {
            if (!qrData?.qr_code_url) {
                message.error("Không có mã QR để tải!");
                return;
            }

            // Tải ảnh về từ URL
            const response = await fetch(qrData.qr_code_url);
            const blob = await response.blob();

            // Tạo link download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR_Payment_${qrData.bank_info?.amount || 'unknown'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            message.success("Đã tải mã QR về máy!");
        } catch (error) {
            console.error("Download QR error:", error);
            message.error("Không thể tải mã QR!");
        }
    };

    // Đóng modal QR
    const handleCloseQRModal = () => {
        setQrModalVisible(false);
        // ✅ Giữ nguyên trang PaymentCus, không navigate
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
                        {loadingPoints ? (
                            <Spin size="small" tip="Đang tải điểm..." />
                        ) : customerPoints > 0 ? (
                            <>
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
                            </>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <Text style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
                                    💡 Bạn chưa có điểm tích lũy. Đăng ký ngay để nhận ưu đãi!
                                </Text>
                            </div>
                        )}
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

            {/* QR Code Modal - Modern Design */}
            <Modal
                open={qrModalVisible}
                onCancel={handleCloseQRModal}
                footer={null}
                centered
                width="95%"
                style={{
                    maxWidth: 720,
                    top: 20,
                }}
                closable={false}
                styles={{
                    body: {
                        padding: 0,
                        borderRadius: 16,
                        overflow: 'hidden'
                    },
                    content: {
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    },
                    mask: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                    }
                }}
                destroyOnHidden
            >

                {qrLoading ? (
                    // Loading State
                    <div style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9ff 100%)',
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            margin: '0 auto 24px',
                            background: 'linear-gradient(135deg, #226533 0%, #2d8e47 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 2s infinite',
                        }}>
                            <QrcodeOutlined style={{ fontSize: 36, color: '#fff' }} />
                        </div>
                        <Title level={4} style={{ margin: '0 0 8px', color: '#226533', fontWeight: 600 }}>
                            Đang tạo mã QR
                        </Title>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            Vui lòng đợi trong giây lát...
                        </Text>
                    </div>
                ) : qrData ? (
                    // QR Code Content
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9ff 100%)',
                        position: 'relative',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 16px 12px',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #226533 0%, #2d8e47 100%)',
                            color: '#fff',
                            position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                opacity: 0.3,
                            }} />
                            <QrcodeOutlined style={{ fontSize: 24, marginBottom: 4, position: 'relative', zIndex: 1 }} />
                            <Title level={5} style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: 16, position: 'relative', zIndex: 1 }}>
                                Quét mã để thanh toán
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, position: 'relative', zIndex: 1 }}>
                                Số tiền: {formatPrice(qrData.bank_info?.amount || 0)}đ
                            </Text>
                        </div>

                        {/* QR Code Container */}
                        <div style={{ padding: '24px 20px 20px' }}>
                            <div
                                style={{
                                    background: '#fff',
                                    padding: 16,
                                    borderRadius: 20,
                                    border: '1px solid #e8f4e8',
                                    marginBottom: 16,
                                    textAlign: 'center',
                                    boxShadow: '0 8px 32px rgba(34, 101, 51, 0.08)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Corner decorations */}
                                <div style={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    width: 16,
                                    height: 16,
                                    border: '3px solid #226533',
                                    borderRight: 'none',
                                    borderBottom: 'none',
                                    borderRadius: '4px 0 0 0',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    width: 16,
                                    height: 16,
                                    border: '3px solid #226533',
                                    borderLeft: 'none',
                                    borderBottom: 'none',
                                    borderRadius: '0 4px 0 0',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 12,
                                    left: 12,
                                    width: 16,
                                    height: 16,
                                    border: '3px solid #226533',
                                    borderRight: 'none',
                                    borderTop: 'none',
                                    borderRadius: '0 0 0 4px',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 12,
                                    width: 16,
                                    height: 16,
                                    border: '3px solid #226533',
                                    borderLeft: 'none',
                                    borderTop: 'none',
                                    borderRadius: '0 0 4px 0',
                                }} />

                                <img
                                    src={qrData.qr_code_url}
                                    alt="QR Code"
                                    style={{
                                        width: 320,
                                        height: 320,
                                        display: 'block',
                                        borderRadius: 8,
                                    }}
                                />
                                <Text style={{
                                    marginTop: 12,
                                    color: '#666',
                                    fontSize: 13,
                                    display: 'block'
                                }}>
                                    Quét bằng app ngân hàng
                                </Text>
                            </div>

                            {/* Quick Action Buttons */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                            }}>
                                <Button
                                    icon={<DownloadOutlined />}
                                    size="large"
                                    onClick={handleDownloadQR}
                                    style={{
                                        height: 48,
                                        borderRadius: 12,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        border: '2px solid #e8f4e8',
                                        background: '#fff',
                                        color: '#226533',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 16px rgba(34, 101, 51, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                    }}
                                >
                                    Tải về
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleCloseQRModal}
                                    style={{
                                        height: 48,
                                        borderRadius: 12,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        background: 'linear-gradient(135deg, #226533 0%, #2d8e47 100%)',
                                        border: 'none',
                                        boxShadow: '0 4px 16px rgba(34, 101, 51, 0.3)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(34, 101, 51, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 16px rgba(34, 101, 51, 0.3)';
                                    }}
                                >
                                    Hoàn thành
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : !qrLoading ? (
                    // Error State
                    <div style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            margin: '0 auto 24px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{ fontSize: 36, color: '#fff' }}>❌</Text>
                        </div>
                        <Title level={4} style={{ margin: '0 0 8px', color: '#dc2626', fontWeight: 600 }}>
                            Không thể tạo mã QR
                        </Title>
                        <Text style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
                            Đã xảy ra lỗi khi tạo mã QR thanh toán
                        </Text>
                        <Button
                            type="primary"
                            onClick={handleCloseQRModal}
                            style={{
                                background: '#dc2626',
                                borderColor: '#dc2626',
                                borderRadius: 8,
                                height: 40,
                                paddingLeft: 24,
                                paddingRight: 24,
                            }}
                        >
                            Đóng
                        </Button>
                    </div>
                ) : null}
            </Modal>
        </Layout>
    );
}
