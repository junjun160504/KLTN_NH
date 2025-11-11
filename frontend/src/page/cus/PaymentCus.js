import React, { useState, useEffect } from "react";
import {
    Layout,
    Typography,
    Button,
    Modal,
    Spin,
    App,
    Form,
} from "antd";
import {
    ArrowLeftOutlined,
    DollarOutlined,
    BankOutlined,
    QrcodeOutlined,
    DownloadOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import LoyaltyRegistrationModal from "../../components/LoyaltyRegistrationModal";
import notificationService from "../../services/notificationService";

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
    const { message, modal } = App.useApp(); // ✅ Use App hook for message and modal

    // Nhận data từ BillsCus page
    const { unpaidOrders = [] } = location.state || {};

    console.log("Unpaid Orders:", unpaidOrders);

    // ✅ Lọc chỉ lấy các đơn đã được xác nhận (không phải NEW)
    const confirmedOrders = unpaidOrders.filter(order => order.status !== 'NEW');

    // ✅ Tính lại tổng tiền chỉ từ các đơn đã xác nhận
    const confirmedTotal = confirmedOrders.reduce((sum, order) => {
        return sum + (order.total_price || 0);
    }, 0);

    // State
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH', 'BANKING', 'QR', 'CARD'
    const [loading, setLoading] = useState(false);
    const [usePoints, setUsePoints] = useState(false); // Dùng điểm hay không

    // QR Code Modal State
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    // ✅ Waiting for Confirmation Modal State
    const [waitingModalVisible, setWaitingModalVisible] = useState(false);

    // ✅ Loyalty Points State - Fetch from API
    const [customerPoints, setCustomerPoints] = useState(0);
    const [customerInfo, setCustomerInfo] = useState(null); // ✅ Store full customer info
    const [loadingPoints, setLoadingPoints] = useState(true);

    // ✅ Loyalty Registration Modal State
    const [isLoyaltyModalVisible, setIsLoyaltyModalVisible] = useState(false);
    const [isLoyaltyLoading, setIsLoyaltyLoading] = useState(false);
    const [form] = Form.useForm();

    // ✅ Fetch customer loyalty points - ALWAYS from API (Real-time)
    const fetchCustomerPoints = React.useCallback(async () => {
        try {
            setLoadingPoints(true);

            // Get customer phone from localStorage
            const savedCustomer = localStorage.getItem('loyalty_customer');
            if (!savedCustomer) {
                console.log('No loyalty customer found in localStorage');
                setCustomerPoints(0);
                setCustomerInfo(null);
                setLoadingPoints(false);
                return;
            }

            const customer = JSON.parse(savedCustomer);
            const phone = customer.phone;

            if (!phone) {
                console.log('No phone number found');
                setCustomerPoints(0);
                setCustomerInfo(null);
                setLoadingPoints(false);
                return;
            }

            // ✅ Call API to get LATEST points from database (Real-time)
            const response = await axios.get(
                `${REACT_APP_API_URL}/customers/me/${phone}`
            );

            if (response.status === 200) {
                const latestData = response.data.data;
                const realtimePoints = latestData.points || 0;

                // ✅ Update state with real-time data
                setCustomerPoints(realtimePoints);
                setCustomerInfo({
                    name: latestData.name || null,
                    phone: latestData.phone,
                });

                // ✅ Update localStorage with latest data (for offline fallback)
                localStorage.setItem('loyalty_customer', JSON.stringify({
                    id: latestData.id,
                    phone: latestData.phone,
                    name: latestData.name || null,
                    loyalty_points: realtimePoints,
                }));

                console.log(`✅ [Real-time] Customer points loaded from API:`, realtimePoints);
            }
        } catch (error) {
            console.error('❌ Error fetching customer points from API:', error);

            if (error.response?.status === 404) {
                console.log('Customer not found - clearing localStorage');
                localStorage.removeItem('loyalty_customer');
                setCustomerPoints(0);
                setCustomerInfo(null);
            } else {
                message.warning({
                    content: 'Không thể tải điểm thưởng! Vui lòng thử lại.',
                    duration: 3
                });
                setCustomerPoints(0);
                setCustomerInfo(null);
            }
        } finally {
            setLoadingPoints(false);
        }
    }, [message]);

    // ✅ Fetch on mount and when page becomes visible (user returns)
    useEffect(() => {
        fetchCustomerPoints();

        // ✅ Re-fetch when user returns to this page (visibility change)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('📱 Page visible - Re-fetching customer points...');
                fetchCustomerPoints();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchCustomerPoints]);

    // ✅ Check if orders have been reviewed
    const checkIfReviewed = React.useCallback((orderIds) => {
        if (!orderIds || orderIds.length === 0) return false;

        const sortedIds = [...orderIds].sort((a, b) => a - b);
        const storageKey = `review_draft_${sortedIds.join('_')}`;
        const saved = localStorage.getItem(storageKey);

        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            return data.isSubmitted || false;
        } catch {
            return false;
        }
    }, []);

    // ✅ Listen for payment confirmation from admin via Socket.IO
    useEffect(() => {
        const handleSessionPaid = (notification) => {
            console.log('💰 Notification received:', notification);

            // Check if this is a session_paid event
            if (notification.type !== 'session_paid') {
                return; // Ignore other event types
            }

            const data = notification.data || notification;

            const {
                sessionId,
                ordersConfirmed,
                ordersCancelled,
                totalAmount: paidAmount,
                message: paymentMessage
            } = data;

            // Validate session matches current session
            const sessionData = localStorage.getItem("qr_session");
            if (sessionData) {
                const { session_id } = JSON.parse(sessionData);
                if (session_id && Number(session_id) !== Number(sessionId)) {
                    console.warn('⚠️ Payment notification for different session, ignoring');
                    return;
                }
            }

            // Close waiting modal if visible
            setWaitingModalVisible(false);
            setLoading(false);

            // ✅ Extract order IDs for review
            // ordersConfirmed from socket is array of objects: [{ id, status, totalPrice }, ...]
            // Need to extract just the IDs
            const orderIdsForReview = ordersConfirmed && ordersConfirmed.length > 0
                ? ordersConfirmed.map(o => o.id)
                : confirmedOrders.map(o => o.id);

            const hasReviewed = checkIfReviewed(orderIdsForReview);

            // Show success modal with auto-redirect
            const successModal = modal.success({
                title: '🎉 Thanh toán thành công!',
                width: 460,
                centered: true,
                content: (
                    <div style={{ padding: '20px 0' }}>
                        <div style={{
                            fontSize: '15px',
                            marginBottom: '20px',
                            textAlign: 'center',
                            color: '#52c41a',
                            fontWeight: 500
                        }}>
                            {paymentMessage || `Cảm ơn quý khách! Tổng tiền: ${formatPrice(paidAmount)}₫`}
                        </div>

                        {/* Payment Details */}
                        <div style={{
                            backgroundColor: '#f5f5f5',
                            padding: '16px',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            border: '1px solid #e8f4e8'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#666', fontSize: '13px' }}>Phiên:</span>
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>#{sessionId}</span>
                            </div>

                            {ordersConfirmed && ordersConfirmed.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#52c41a', fontSize: '13px' }}>✓ Đơn đã thanh toán:</span>
                                    <span style={{ fontWeight: 600, color: '#52c41a', fontSize: '13px' }}>
                                        {ordersConfirmed.length} đơn
                                    </span>
                                </div>
                            )}

                            {ordersCancelled && ordersCancelled.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#ff4d4f', fontSize: '13px' }}>✗ Đơn đã hủy:</span>
                                    <span style={{ fontWeight: 600, color: '#ff4d4f', fontSize: '13px' }}>
                                        {ordersCancelled.length} đơn
                                    </span>
                                </div>
                            )}

                            <div style={{
                                borderTop: '1px solid #d9d9d9',
                                paddingTop: '12px',
                                marginTop: '12px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ fontSize: '15px', fontWeight: 600 }}>Tổng thanh toán:</span>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: '#52c41a' }}>
                                    {formatPrice(paidAmount)}₫
                                </span>
                            </div>
                        </div>

                        {/* ✅ Smart Review Prompt - Only if NOT reviewed yet */}
                        {!hasReviewed && (
                            <div style={{
                                background: 'linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                marginBottom: '16px',
                                border: '1px solid #ffd591',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <div style={{
                                    fontSize: 28,
                                    lineHeight: 1,
                                }}>⭐</div>
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ fontSize: 13, display: 'block', color: '#d46b08' }}>
                                        Chia sẻ trải nghiệm của bạn nhé!
                                    </Text>
                                    <Text style={{ fontSize: 11, color: '#fa8c16' }}>
                                        Chỉ mất 30 giây để đánh giá
                                    </Text>
                                </div>
                            </div>
                        )}

                        {/* Countdown message */}
                        <div style={{
                            textAlign: 'center',
                            color: '#8c8c8c',
                            fontSize: '13px',
                            fontStyle: 'italic'
                        }}>
                            Tự động chuyển về trang chủ sau 30 giây...
                        </div>
                    </div>
                ),
                okText: hasReviewed ? 'Về trang chủ' : undefined,
                okButtonProps: hasReviewed ? {
                    style: {
                        background: 'linear-gradient(135deg, #226533 0%, #2d8e47 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        height: '40px',
                        fontWeight: 600,
                        width: '100%',
                    }
                } : undefined,
                footer: !hasReviewed ? (
                    <div style={{ display: 'flex', gap: 10, padding: '8px 0 0' }}>
                        <Button
                            size="large"
                            onClick={() => {
                                successModal.destroy();
                                navigate('/cus/reviews', {
                                    state: { orderIds: orderIdsForReview }
                                });
                            }}
                            style={{
                                flex: 1,
                                height: 46,
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 600,
                                border: '2px solid #fa8c16',
                                color: '#fa8c16',
                                background: '#fff',
                            }}
                        >
                            ⭐ Đánh giá
                        </Button>

                        <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                                successModal.destroy();
                                localStorage.removeItem('qr_session');
                                localStorage.removeItem('cart');
                                navigate('/cus/homes');
                            }}
                            style={{
                                flex: 1,
                                height: 46,
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #226533 0%, #2d8e47 100%)',
                                border: 'none',
                            }}
                        >
                            Về trang chủ
                        </Button>
                    </div>
                ) : undefined,
                onOk: () => {
                    // Clear session data
                    localStorage.removeItem('qr_session');
                    localStorage.removeItem('cart');

                    // Redirect to home
                    navigate('/cus/homes');
                }
            });

            // Auto-redirect after 3 seconds
            setTimeout(() => {
                successModal.destroy();

                // Clear session data
                localStorage.removeItem('qr_session');
                localStorage.removeItem('cart');

                // Redirect to home
                navigate('/cus/homes');
            }, 3000000);
        };

        // Register listener (returns cleanup function)
        const removeListener = notificationService.addListener(handleSessionPaid);

        console.log('✅ Payment confirmation listener registered');

        // Cleanup on unmount
        return () => {
            if (removeListener) {
                removeListener();
                console.log('🔌 Payment confirmation listener removed');
            }
        };
    }, [navigate, message, modal, checkIfReviewed, confirmedOrders]);

    // Tính toán
    // ✅ Dùng confirmedTotal thay vì initialTotal để chỉ tính đơn đã xác nhận
    const totalAmount = confirmedTotal;

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

            // ✅ Kiểm tra có đơn hàng đã xác nhận không
            if (confirmedOrders.length === 0) {
                message.warning({
                    content: "Không có đơn hàng nào đã được xác nhận để thanh toán!",
                    duration: 4
                });
                return;
            }

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
                    order_ids: confirmedOrders.map(o => o.id) // ✅ Chỉ gửi ID của đơn đã xác nhận
                })
            };

            // Gửi request tạo notification
            await axios.post(`${REACT_APP_API_URL}/notifications`, notificationData);

            // ✅ Hiển thị modal đang chờ xác nhận
            setWaitingModalVisible(true);

            message.info({
                content: '📨 Đã gửi yêu cầu thanh toán đến nhân viên',
                duration: 3
            });

            // ✅ Đợi event 'session_paid' từ Socket.IO
            // Listener đã được đăng ký trong useEffect
            // Sẽ tự động đóng modal và redirect khi admin xác nhận

        } catch (error) {
            console.error("Cash payment notification error:", error);
            setWaitingModalVisible(false);
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
                    // ✅ Gọi API thanh toán cho order đầu tiên ĐÃ XÁC NHẬN để lấy QR code
                    const firstOrder = confirmedOrders[0];

                    if (!firstOrder) {
                        message.warning("Không có đơn hàng nào đã được xác nhận để thanh toán!");
                        setQrLoading(false);
                        setQrModalVisible(false);
                        return;
                    }

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

            // ✅ Gọi API thanh toán cho từng order ĐÃ XÁC NHẬN
            if (confirmedOrders.length === 0) {
                message.warning("Không có đơn hàng nào đã được xác nhận để thanh toán!");
                return;
            }

            const paymentPromises = confirmedOrders.map(order =>
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
    };

    const handleLoyaltySubmit = async (values) => {
        try {
            const phone = values.phone.trim();
            const name = values.name ? values.name.trim() : null;

            setIsLoyaltyLoading(true);

            // Call API to register customer
            const response = await axios.post(`${REACT_APP_API_URL}/customers`, {
                phone: phone,
                name: name,
            });

            if (response.status === 201 || response.status === 200) {
                const customerData = response.data.data;

                // Save to localStorage
                const customerInfoData = {
                    id: customerData.id,
                    phone: customerData.phone,
                    name: customerData.name || null,
                    loyalty_points: customerData.loyalty_points || 0,
                };
                localStorage.setItem('loyalty_customer', JSON.stringify(customerInfoData));

                // Update state to reflect new customer
                setCustomerInfo({
                    name: customerData.name || null,
                    phone: customerData.phone,
                });
                setCustomerPoints(customerData.loyalty_points || 0);

                message.success({
                    content: response.status === 201
                        ? 'Đăng ký thành công!'
                        : 'Cập nhật thông tin thành công!',
                    duration: 3,
                });

                // Close modal and reset form
                setIsLoyaltyModalVisible(false);
                form.resetFields();
            }
        } catch (error) {
            console.error("Error registering loyalty:", error);
            message.error({
                content: 'Có lỗi xảy ra. Vui lòng thử lại.',
                duration: 3,
            });
        } finally {
            setIsLoyaltyLoading(false);
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

                {/* Thông tin khách hàng và Điểm tích lũy - GỘP THÀNH 1 Ô */}
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
                    {/* ========== THÔNG TIN KHÁCH HÀNG ========== */}
                    {loadingPoints ? (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <Spin size="small" tip="Đang tải thông tin..." />
                        </div>
                    ) : customerInfo ? (
                        <div
                            style={{
                                marginBottom: 16,
                                paddingBottom: 16,
                                borderBottom: "1px solid #f0f0f0",
                            }}
                        >
                            <Text style={{ fontSize: 14, color: "#666", display: "block", marginBottom: 12 }}>
                                Thông tin khách hàng
                            </Text>

                            {/* Tên khách hàng */}
                            {customerInfo.name && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 8,
                                    }}
                                >
                                    <Text style={{ fontSize: 13, color: "#999" }}>Tên khách hàng:</Text>
                                    <Text strong style={{ fontSize: 14, color: "#333" }}>
                                        {customerInfo.name}
                                    </Text>
                                </div>
                            )}

                            {/* Số điện thoại */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontSize: 13, color: "#999" }}>Số điện thoại:</Text>
                                <Text strong style={{ fontSize: 14, color: "#333" }}>
                                    {customerInfo.phone}
                                </Text>
                            </div>
                        </div>
                    ) : null}

                    {/* ========== DÙNG ĐIỂM TÍCH LŨY ========== */}
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
                                    💡 Bạn chưa có điểm tích lũy.{' '}
                                    <span
                                        onClick={() => setIsLoyaltyModalVisible(true)}
                                        style={{
                                            color: "#667eea",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                            fontStyle: "normal",
                                        }}
                                    >
                                        Đăng ký ngay
                                    </span>
                                    {' '}để nhận ưu đãi!
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

            {/* ========================================
                WAITING OVERLAY - Japanese Minimalism
                ======================================== */}
            {waitingModalVisible && (
                <div
                    className="fixed inset-0 z-[9999] bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
                    style={{
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div className="text-center px-6 max-w-xs">
                        {/* Single Spin - Ant Design */}
                        <Spin
                            size="large"
                            style={{
                                fontSize: 48,
                            }}
                        />

                        {/* Minimalist Text */}
                        <div className="mt-8 space-y-2">
                            <p className="text-base font-medium text-gray-800 tracking-wide">
                                Đang xử lý
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Đang chờ xác nhận từ nhân viên
                            </p>
                        </div>
                    </div>

                    {/* Minimal CSS */}
                    <style jsx>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                    `}</style>
                </div>
            )}

            {/* QR Code Modal - Modern Design */}
            <Modal
                open={qrModalVisible}
                // onCancel={handleCloseQRModal}
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
                        {/* Close Button - Top Right */}
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined style={{ fontSize: 24, color: '#fff' }} />}
                            onClick={handleCloseQRModal}
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 10,
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0, 0, 0, 0.2)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: '50%',
                                border: 'none',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />

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
                                    Xác nhận thanh toán
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

            {/* ========== LOYALTY REGISTRATION MODAL ========== */}
            <LoyaltyRegistrationModal
                visible={isLoyaltyModalVisible}
                onCancel={() => {
                    setIsLoyaltyModalVisible(false);
                    form.resetFields();
                }}
                onSubmit={handleLoyaltySubmit}
                loading={isLoyaltyLoading}
                form={form}
            />
        </Layout>
    );
}
