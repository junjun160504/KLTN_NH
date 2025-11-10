import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Button,
  Rate,
  Input,
  List,
  Avatar,
  Modal,
  App,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

export default function CustomerReviewAllPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  // ✅ Get orderIds from location.state (array of order IDs)
  // Supports both single order and multiple orders
  const { orderIds } = location.state || {};

  // ✅ State
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]); // All items from orders
  const [itemReviews, setItemReviews] = useState({}); // { itemId: { rating, note } }

  // ✅ Đánh giá nhà hàng (chung cho tất cả orders)
  const [storeRating, setStoreRating] = useState(0);
  const [storeFeedback, setStoreFeedback] = useState("");

  // ✅ Track if review was already submitted
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);

  // ✅ Popup
  const [thankYouVisible, setThankYouVisible] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Generate unique key for localStorage based on orderIds
  const getReviewStorageKey = useCallback(() => {
    if (!orderIds || orderIds.length === 0) return null;
    const sortedIds = [...orderIds].sort((a, b) => a - b);
    return `review_draft_${sortedIds.join('_')}`;
  }, [orderIds]);

  // ✅ Load saved review from localStorage
  const loadSavedReview = useCallback(() => {
    const storageKey = getReviewStorageKey();
    if (!storageKey) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📥 Loaded saved review from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading saved review:', error);
    }
    return null;
  }, [getReviewStorageKey]);

  // ✅ Save review to localStorage (auto-save)
  const saveReviewToLocalStorage = useCallback(() => {
    const storageKey = getReviewStorageKey();
    if (!storageKey) return;

    try {
      const reviewData = {
        itemReviews,
        storeRating,
        storeFeedback,
        isSubmitted,
        submittedAt,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(reviewData));
      console.log('💾 Auto-saved review to localStorage');
    } catch (error) {
      console.error('Error saving review to localStorage:', error);
    }
  }, [itemReviews, storeRating, storeFeedback, isSubmitted, submittedAt, getReviewStorageKey]);

  // ✅ Clear saved review from localStorage (after submit)
  const clearSavedReview = useCallback(() => {
    const storageKey = getReviewStorageKey();
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      console.log('🗑️ Cleared saved review from localStorage');
    } catch (error) {
      console.error('Error clearing saved review:', error);
    }
  }, [getReviewStorageKey]);

  // ✅ Fetch order items from API
  const fetchOrderItems = useCallback(async () => {
    if (!orderIds || orderIds.length === 0) {
      message.warning("Không tìm thấy đơn hàng cần đánh giá!");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all orders in parallel
      const orderPromises = orderIds.map(orderId =>
        axios.get(`${REACT_APP_API_URL}/orders/${orderId}`)
      );

      const responses = await Promise.all(orderPromises);

      // Extract items from all orders and flatten
      const allItems = responses.flatMap(response => {
        const order = response.data.data;
        return (order.items || []).map(item => ({
          ...item,
          orderId: order.id,
          orderNumber: order.id,
        }));
      });

      setOrderItems(allItems);

      // ✅ Try to load saved review from localStorage
      const savedReview = loadSavedReview();

      if (savedReview) {
        // Restore saved reviews
        setItemReviews(savedReview.itemReviews || {});
        setStoreRating(savedReview.storeRating || 0);
        setStoreFeedback(savedReview.storeFeedback || "");
        setIsSubmitted(savedReview.isSubmitted || false);
        setSubmittedAt(savedReview.submittedAt || null);

        // Show different message based on submission status
        if (savedReview.isSubmitted) {
          message.success({
            content: '✅ Đánh giá đã gửi trước đó. Bạn có thể chỉnh sửa và gửi lại.',
            duration: 4,
          });
        } else {
          message.info({
            content: '📝 Đã tải bản nháp đánh giá trước đó',
            duration: 3,
          });
        }
      } else {
        // Initialize empty review state for each item
        const initialReviews = {};
        allItems.forEach(item => {
          initialReviews[item.id] = { rating: 0, note: "" };
        });
        setItemReviews(initialReviews);
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      message.error("Không thể tải thông tin đơn hàng!");
    } finally {
      setLoading(false);
    }
  }, [orderIds, message, loadSavedReview]);

  // ✅ Fetch on mount
  useEffect(() => {
    fetchOrderItems();
  }, [fetchOrderItems]);

  // ✅ Auto-save review to localStorage when data changes
  useEffect(() => {
    // Only save if we have items loaded (not during initial load)
    if (orderItems.length > 0) {
      // Debounce save to avoid too many writes
      const timeoutId = setTimeout(() => {
        saveReviewToLocalStorage();
      }, 500); // Save after 500ms of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [itemReviews, storeRating, storeFeedback, orderItems.length, saveReviewToLocalStorage]);

  // ✅ Handle rating change for specific item
  const handleRateFood = (itemId, value) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating: value }
    }));
  };

  // ✅ Handle note change for specific item
  const handleNoteFood = (itemId, value) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], note: value }
    }));
  };

  // ✅ Submit reviews
  const handleSubmit = async () => {
    // Check if at least one review is provided
    const hasItemReview = Object.values(itemReviews).some(
      review => review.rating > 0 || review.note.trim() !== ""
    );

    const hasStoreReview = storeRating > 0 || storeFeedback.trim() !== "";

    if (!hasItemReview && !hasStoreReview) {
      setWarningVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      // Prepare review data
      const reviewData = {
        // Item reviews (only items with rating or note)
        itemReviews: Object.entries(itemReviews)
          .filter(([_, review]) => review.rating > 0 || review.note.trim() !== "")
          .map(([itemId, review]) => ({
            orderItemId: parseInt(itemId),
            rating: review.rating,
            comment: review.note.trim()
          })),

        // Store review
        storeReview: hasStoreReview ? {
          rating: storeRating,
          comment: storeFeedback.trim()
        } : null
      };

      console.log("📤 Submitting reviews:", reviewData);

      // TODO: Call API to submit reviews
      // await axios.post(`${REACT_APP_API_URL}/reviews`, reviewData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ✅ Mark as submitted and save to localStorage (don't clear)
      setIsSubmitted(true);
      setSubmittedAt(Date.now());

      // Auto-save will trigger and save the submitted state
      // User can come back and edit later

      setThankYouVisible(true);

    } catch (error) {
      console.error("Error submitting reviews:", error);
      message.error("Không thể gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Handle clear draft (reset all reviews)
  const handleClearDraft = () => {
    Modal.confirm({
      title: 'Xóa bản nháp?',
      content: 'Bạn có chắc muốn xóa toàn bộ đánh giá đã nhập?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        // Reset all reviews to initial state
        const resetReviews = {};
        orderItems.forEach(item => {
          resetReviews[item.id] = { rating: 0, note: "" };
        });
        setItemReviews(resetReviews);
        setStoreRating(0);
        setStoreFeedback("");
        setIsSubmitted(false);
        setSubmittedAt(null);

        // Clear localStorage
        clearSavedReview();

        message.success('Đã xóa bản nháp đánh giá');
      }
    });
  }; return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* -------- HEADER -------- */}
      <Header
        style={{
          background: "#fff",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <Title
          level={5}
          style={{
            margin: 0,
            fontSize: 18,
            color: "#226533",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Đánh giá
        </Title>

        {/* Clear Draft Button */}
        {!loading && orderItems.length > 0 && (
          <Button
            type="text"
            onClick={handleClearDraft}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 13,
              color: "#ff4d4f",
              fontWeight: 500,
            }}
          >
            Xóa nháp
          </Button>
        )}
      </Header>

      {/* -------- CONTENT -------- */}
      <Content
        style={{
          padding: "16px",
          paddingTop: 70,
          paddingBottom: "100px",
        }}
      >
        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orderItems.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <Text type="secondary">Không tìm thấy món ăn nào để đánh giá</Text>
          </div>
        ) : (
          <>
            {/* ---- SUBMISSION STATUS BANNER ---- */}
            {isSubmitted && (
              <div
                style={{
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  border: "1px solid #bae6fd",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#0ea5e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  ✅
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 14, color: "#0369a1", display: "block" }}>
                    Đánh giá đã được gửi
                  </Text>
                  <Text style={{ fontSize: 12, color: "#0369a1" }}>
                    {submittedAt
                      ? `Gửi lúc ${new Date(submittedAt).toLocaleString('vi-VN')}`
                      : 'Bạn có thể chỉnh sửa và gửi lại'
                    }
                  </Text>
                </div>
              </div>
            )}

            {/* ---- ĐÁNH GIÁ MÓN ĂN ---- */}
            <div className="mb-6">
              <Title level={5} style={{ marginBottom: 12, color: "#226533", fontSize: 15 }}>
                Đánh giá món ăn
              </Title>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
                Đánh giá chất lượng từng món để giúp chúng tôi cải thiện
              </Text>

              <List
                itemLayout="vertical"
                dataSource={orderItems}
                renderItem={(item) => {
                  const review = itemReviews[item.id] || { rating: 0, note: "" };

                  return (
                    <List.Item
                      key={item.id}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 12,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Item Image */}
                        <Avatar
                          shape="square"
                          size={64}
                          src={item.image_url || "https://via.placeholder.com/64"}
                          style={{ borderRadius: 8, flexShrink: 0 }}
                        />

                        {/* Item Info & Review */}
                        <div className="flex-1 min-w-0">
                          {/* Item Name & Quantity */}
                          <div className="mb-2">
                            <Text strong style={{ fontSize: 14, color: "#333" }}>
                              {item.menu_item_name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                              ×{item.quantity}
                            </Text>
                            {orderIds.length > 1 && (
                              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                (Đơn #{item.orderNumber})
                              </Text>
                            )}
                          </div>

                          {/* Rating Stars */}
                          <Rate
                            value={review.rating}
                            onChange={(value) => handleRateFood(item.id, value)}
                            style={{ fontSize: 18, marginBottom: 8 }}
                          />

                          {/* Note Input */}
                          <Input.TextArea
                            rows={2}
                            placeholder="Món ăn có ngon không..."
                            value={review.note}
                            onChange={(e) => handleNoteFood(item.id, e.target.value)}
                            style={{
                              fontSize: 13,
                              borderRadius: 8,
                              resize: "none",
                            }}
                          />
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>

            {/* ---- ĐÁNH GIÁ NHÀ HÀNG ---- */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #f0f0f0",
              }}
            >
              <Title level={5} style={{ marginBottom: 12, color: "#226533", fontSize: 15 }}>
                Đánh giá nhà hàng
              </Title>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                Chia sẻ thêm về trải nghiệm của bạn với nhà hàng
              </Text>

              {/* Restaurant Rating */}
              <div className="mb-3">
                <Rate
                  value={storeRating}
                  onChange={(value) => setStoreRating(value)}
                  style={{ fontSize: 28 }}
                />
              </div>

              {/* Restaurant Feedback */}
              <TextArea
                rows={4}
                placeholder="Chia sẻ thêm về trải nghiệm của bạn với nhà hàng..."
                value={storeFeedback}
                onChange={(e) => setStoreFeedback(e.target.value)}
                style={{
                  fontSize: 13,
                  borderRadius: 8,
                  resize: "none",
                }}
              />
            </div>
          </>
        )}
      </Content>

      {/* -------- FOOTER (NÚT GỬI) -------- */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "12px 16px",
          borderTop: "2px solid #f0f0f0",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          zIndex: 1000,
        }}
      >
        <Button
          type="primary"
          block
          size="large"
          onClick={handleSubmit}
          loading={submitting}
          disabled={loading || orderItems.length === 0}
          style={{
            background: isSubmitted
              ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
              : "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            height: 48,
          }}
        >
          {isSubmitted ? '🔄 Cập nhật đánh giá' : 'Gửi đánh giá'}
        </Button>
      </div>

      {/* -------- POPUP CẢM ƠN -------- */}
      <Modal
        open={thankYouVisible}
        onCancel={() => {
          setThankYouVisible(false);
          navigate("/cus/homes");
        }}
        footer={null}
        centered
        width={360}
      >
        <div style={{ textAlign: "center", padding: "20px 12px" }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 20px",
              background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🎉
          </div>
          <Title level={4} style={{ color: "#226533", marginBottom: 8 }}>
            {isSubmitted ? 'Đã cập nhật đánh giá!' : 'Cảm ơn bạn đã đánh giá!'}
          </Title>
          <Text style={{ fontSize: 14, color: "#666" }}>
            {isSubmitted
              ? 'Đánh giá của bạn đã được cập nhật thành công 💚'
              : 'Ý kiến của bạn giúp chúng tôi phục vụ tốt hơn 💚'
            }
          </Text>
          <Button
            type="primary"
            size="large"
            block
            onClick={() => navigate("/cus/homes")}
            style={{
              marginTop: 24,
              background: "linear-gradient(135deg, #226533 0%, #2d8e47 100%)",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              height: 44,
            }}
          >
            Về trang chủ
          </Button>
        </div>
      </Modal>

      {/* -------- POPUP CẢNH BÁO -------- */}
      <Modal
        open={warningVisible}
        onCancel={() => setWarningVisible(false)}
        footer={null}
        centered
        width={340}
      >
        <div style={{ textAlign: "center", padding: "20px 12px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              background: "#fff3e0",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            ⚠️
          </div>
          <Title level={5} style={{ color: "#fa8c16", marginBottom: 8 }}>
            Hãy đánh giá cho chúng tôi nhé!
          </Title>
          <Text style={{ fontSize: 13, color: "#666" }}>
            Đánh giá của bạn rất quan trọng để chúng tôi cải thiện dịch vụ
          </Text>
          <Button
            type="primary"
            size="large"
            block
            onClick={() => setWarningVisible(false)}
            style={{
              marginTop: 20,
              background: "#fa8c16",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              height: 40,
            }}
          >
            Đồng ý
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
