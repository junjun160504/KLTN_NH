import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Lấy danh sách đơn hàng
export const getAllOrders = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.status) params.append("status", filters.status);
        if (filters.table_id) params.append("table_id", filters.table_id);
        if (filters.qr_session_id) params.append("qr_session_id", filters.qr_session_id);
        if (filters.limit) params.append("limit", filters.limit);
        if (filters.offset) params.append("offset", filters.offset);

        const response = await axios.get(`${API_URL}/orders?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching order detail:", error);
        throw error;
    }
};

// Tạo đơn hàng mới
export const createOrder = async (orderData) => {
    try {
        const response = await axios.post(`${API_URL}/orders`, orderData);
        return response.data;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await axios.patch(`${API_URL}/orders/${orderId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

// Hủy đơn hàng
export const cancelOrder = async (orderId) => {
    try {
        const response = await axios.delete(`${API_URL}/orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("Error cancelling order:", error);
        throw error;
    }
};

export default {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder,
};
