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
  const [qrSessionId, setQrSessionId] = useState(null); // ✅ Store qr_session_id for restaurant review

  // ✅ Đánh giá nhà hàng (chung cho tất cả orders)
  const [storeRating, setStoreRating] = useState(0);
  const [storeFeedback, setStoreFeedback] = useState("");

  // ✅ Track if review was already submitted
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);

  // ✅ Popup
  const [warningVisible, setWarningVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Generate unique key for localStorage for each order (for item reviews)
  // Strategy: Save each order's reviews separately to avoid losing data when orderIds change
  const getReviewStorageKeyForOrder = useCallback((orderId) => {
    return `review_draft_order_${orderId}`;
  }, []);

  // ✅ Key cho đánh giá nhà hàng theo session_id (mỗi phiên có đánh giá riêng)
  const getRestaurantReviewKey = useCallback(() => {
    return qrSessionId ? `restaurant_review_session_${qrSessionId}` : 'restaurant_review_common';
  }, [qrSessionId]);

  // ✅ Load saved review from localStorage
  // Strategy: Load reviews from each order separately, then merge
  const loadSavedReview = useCallback(() => {
    if (!orderIds || orderIds.length === 0) return null;

    try {
      // Merge item reviews from all orders
      let mergedItemReviews = {};
      let isSubmittedData = false;
      let submittedAtData = null;

      // Load reviews from each order
      orderIds.forEach(orderId => {
        const storageKey = getReviewStorageKeyForOrder(orderId);
        const saved = localStorage.getItem(storageKey);

        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge item reviews
          mergedItemReviews = { ...mergedItemReviews, ...(parsed.itemReviews || {}) };
          // If any order was submitted, mark as submitted
          if (parsed.isSubmitted) {
            isSubmittedData = true;
            submittedAtData = parsed.submittedAt || submittedAtData;
          }
          console.log(`📥 Loaded item reviews from order ${orderId}:`, parsed);
        }
      });

      // Load đánh giá nhà hàng từ key theo session (mỗi phiên riêng biệt)
      const restaurantReviewKey = getRestaurantReviewKey();
      const restaurantReview = localStorage.getItem(restaurantReviewKey);
      let storeRatingData = 0;
      let storeFeedbackData = "";

      if (restaurantReview) {
        const parsed = JSON.parse(restaurantReview);
        storeRatingData = parsed.rating || 0;
        storeFeedbackData = parsed.feedback || "";
        console.log('📥 Loaded restaurant review from localStorage (session-specific):', parsed);
      }

      return {
        itemReviews: mergedItemReviews,
        storeRating: storeRatingData,
        storeFeedback: storeFeedbackData,
        isSubmitted: isSubmittedData,
        submittedAt: submittedAtData,
      };
    } catch (error) {
      console.error('Error loading saved review:', error);
    }
    return null;
  }, [orderIds, getReviewStorageKeyForOrder, getRestaurantReviewKey]);

  // ✅ Save review to localStorage (auto-save)
  // Strategy: Save each order's item reviews separately to avoid data loss
  const saveReviewToLocalStorage = useCallback(() => {
    if (!orderIds || orderIds.length === 0) return;

    try {
      // Group item reviews by orderId
      const reviewsByOrder = {};

      orderItems.forEach(item => {
        const orderId = item.orderId;
        const itemReview = itemReviews[item.id];

        if (!reviewsByOrder[orderId]) {
          reviewsByOrder[orderId] = {};
        }

        if (itemReview) {
          reviewsByOrder[orderId][item.id] = itemReview;
        }
      });

      // Save each order's reviews separately
      Object.entries(reviewsByOrder).forEach(([orderId, reviews]) => {
        const storageKey = getReviewStorageKeyForOrder(parseInt(orderId));
        const data = {
          itemReviews: reviews,
          isSubmitted,
          submittedAt,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`💾 Auto-saved reviews for order ${orderId}`);
      });

      // Save đánh giá nhà hàng vào key theo session (mỗi phiên riêng)
      const restaurantReviewKey = getRestaurantReviewKey();
      const restaurantReviewData = {
        rating: storeRating,
        feedback: storeFeedback,
        timestamp: Date.now(),
      };
      localStorage.setItem(restaurantReviewKey, JSON.stringify(restaurantReviewData));
      console.log('💾 Auto-saved restaurant review to localStorage (session-specific):', restaurantReviewKey);
    } catch (error) {
      console.error('Error saving review to localStorage:', error);
    }
  }, [orderIds, orderItems, itemReviews, storeRating, storeFeedback, isSubmitted, submittedAt, getReviewStorageKeyForOrder, getRestaurantReviewKey]);

  // ✅ Clear saved review from localStorage (after submit)
  const clearSavedReview = useCallback(() => {
    if (!orderIds || orderIds.length === 0) return;

    try {
      // Clear reviews for each order
      orderIds.forEach(orderId => {
        const storageKey = getReviewStorageKeyForOrder(orderId);
        localStorage.removeItem(storageKey);
        console.log(`🗑️ Cleared saved review for order ${orderId}`);
      });
    } catch (error) {
      console.error('Error clearing saved review:', error);
    }
  }, [orderIds, getReviewStorageKeyForOrder]);

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

      // ✅ Extract qr_session_id from first order (all orders should have same session)
      if (responses.length > 0 && responses[0].data.data.qr_session_id) {
        setQrSessionId(responses[0].data.data.qr_session_id);
      }

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
        // if (savedReview.isSubmitted) {
        //   message.success({
        //     content: '✅ Đánh giá đã gửi trước đó. Bạn có thể chỉnh sửa và gửi lại.',
        //     duration: 4,
        //   });
        // } else {
        //   message.info({
        //     content: '📝 Đã tải bản nháp đánh giá trước đó',
        //     duration: 3,
        //   });
        // }
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

  // Fetch on mount
  useEffect(() => {
    fetchOrderItems();
  }, [fetchOrderItems]);

  // Auto-save review to localStorage when data changes
  useEffect(() => {
    // Only save if we have items loaded (not during initial load)
    if (orderItems.length > 0) {
      // Debounce save to avoid too many writes
      const timeoutId = setTimeout(() => {
        saveReviewToLocalStorage();
      }, 500); // Save after 500ms of no changes

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemReviews, storeRating, storeFeedback, orderItems.length]);

  // Handle rating change for specific item
  const handleRateFood = (itemId, value) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating: value }
    }));
  };

  // Handle note change for specific item
  const handleNoteFood = (itemId, value) => {
    setItemReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], note: value }
    }));
  };

  // Submit reviews
  const handleSubmit = async () => {
    // ✅ Check if at least one rating is provided (rating is REQUIRED, note is optional)
    const hasItemReview = Object.values(itemReviews).some(
      review => review.rating > 0
    );

    const hasStoreReview = storeRating > 0;

    if (!hasItemReview && !hasStoreReview) {
      setWarningVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      // ========================================
      // SUBMIT ITEM REVIEWS (món ăn)
      // ========================================
      // ✅ Only submit items with rating > 0 (rating is required, note is optional)
      const itemReviewsToSubmit = Object.entries(itemReviews)
        .filter(([_, review]) => review.rating > 0)
        .map(([orderItemId, review]) => {
          // Find the corresponding order_item to get menu_item_id
          const orderItem = orderItems.find(item => item.id === parseInt(orderItemId));

          if (!orderItem) {
            console.warn(`Order item ${orderItemId} not found!`);
            return null;
          }

          return {
            item_id: orderItem.menu_item_id,        // ✅ Map orderItemId → menu_item_id
            qr_session_id: qrSessionId,             // ✅ Add qr_session_id
            rating: review.rating || 0,
            comment: review.note?.trim() || null
          };
        })
        .filter(review => review !== null); // Remove nulls

      console.log("📤 Submitting item reviews (UPSERT):", itemReviewsToSubmit);

      // ✅ Call API for each item review (backend will handle UPSERT)
      const itemReviewPromises = itemReviewsToSubmit.map(reviewData =>
        axios.post(`${REACT_APP_API_URL}/review/menu`, reviewData)
          .then(response => {
            const isUpdate = response.data.data?.isUpdate;
            console.log(`✅ ${isUpdate ? 'Updated' : 'Created'} review for item ${reviewData.item_id}`);
            return { success: true, isUpdate, data: reviewData };
          })
          .catch(error => {
            console.error(`Failed to submit review for item ${reviewData.item_id}:`, error);
            return { success: false, error: true, data: reviewData };
          })
      );

      const itemReviewResults = await Promise.all(itemReviewPromises);

      const successCount = itemReviewResults.filter(r => r.success).length;
      const failCount = itemReviewResults.filter(r => r.error).length;
      const updateCount = itemReviewResults.filter(r => r.success && r.isUpdate).length;
      const createCount = itemReviewResults.filter(r => r.success && !r.isUpdate).length;

      console.log(`✅ Item reviews: ${createCount} created, ${updateCount} updated, ${failCount} failed`);

      // ========================================
      // SUBMIT RESTAURANT REVIEW (nhà hàng)
      // ========================================
      let restaurantReviewSuccess = false;
      let restaurantIsUpdate = false;

      if (hasStoreReview && qrSessionId) {
        const restaurantReviewData = {
          qr_session_id: qrSessionId,
          rating: storeRating,
          comment: storeFeedback?.trim() || null
        };

        console.log("📤 Submitting restaurant review (UPSERT):", restaurantReviewData);

        try {
          const response = await axios.post(`${REACT_APP_API_URL}/review`, restaurantReviewData);
          restaurantIsUpdate = response.data.data?.isUpdate;
          restaurantReviewSuccess = true;
          console.log(`✅ ${restaurantIsUpdate ? 'Updated' : 'Created'} restaurant review`);
        } catch (error) {
          console.error("Failed to submit restaurant review:", error);
          // Don't throw, continue to show success for item reviews
        }
      }

      // ========================================
      // SUCCESS HANDLING
      // ========================================

      // ✅ Mark as submitted and save to localStorage (don't clear)
      setIsSubmitted(true);
      setSubmittedAt(Date.now());

      // Auto-save will trigger and save the submitted state
      // User can come back and edit later

      // ✅ Show smart success message
      if (failCount > 0) {
        message.warning(`Đã gửi ${successCount}/${itemReviewsToSubmit.length} đánh giá món ăn thành công`);
      } else if (updateCount > 0 || restaurantIsUpdate) {
        // If any review was updated, show update message
        message.success('Đã cập nhật đánh giá thành công! 🎉', 3);
      } else {
        // All new reviews
        message.success('Cảm ơn bạn đã đánh giá! 🎉', 3);
      }

      // ✅ Navigate to Bills page after review (better UX than navigate(-1))
      // User can see their orders and optionally continue to payment or home
      setTimeout(() => {
        navigate('/cus/bills');
      }, 1500);

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
      content: 'Bạn có chắc muốn xóa toàn bộ đánh giá đã nhập? (Đánh giá nhà hàng sẽ được giữ lại)',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        // Reset item reviews to initial state
        const resetReviews = {};
        orderItems.forEach(item => {
          resetReviews[item.id] = { rating: 0, note: "" };
        });
        setItemReviews(resetReviews);
        setIsSubmitted(false);
        setSubmittedAt(null);

        // Clear item reviews localStorage
        clearSavedReview();

        // Keep restaurant review (don't reset storeRating and storeFeedback)

        message.success('Đã xóa bản nháp đánh giá món ăn (giữ nguyên đánh giá nhà hàng)');
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
          onClick={() => navigate('/cus/bills')}
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
        {/* {!loading && orderItems.length > 0 && (
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
        )} */}
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
            {/* ---- ĐÁNH GIÁ MÓN ĂN ---- */}
            <div className="mb-6">
              <Title level={5} style={{ marginBottom: 12, color: "#226533", fontSize: 15 }}>
                Đánh giá món ăn <span style={{ color: "#ff4d4f" }}>*</span>
              </Title>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
                Đánh giá số sao là bắt buộc, góp ý thêm là tùy chọn
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
                            {/* <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                              ×{item.quantity}
                            </Text> */}
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
                            placeholder="Góp ý thêm (không bắt buộc)..."
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
                Đánh giá số sao nếu muốn, góp ý thêm là tùy chọn
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
                placeholder="Góp ý thêm (không bắt buộc)..."
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
          {isSubmitted ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
        </Button>
      </div>

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
            Vui lòng đánh giá số sao!
          </Title>
          <Text style={{ fontSize: 13, color: "#666" }}>
            Bạn cần đánh giá ít nhất 1 sao cho món ăn hoặc nhà hàng để gửi đánh giá
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
