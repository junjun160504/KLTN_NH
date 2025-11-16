import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

/**
 * 🎯 Update customer_id vào qr_session
 * Gọi sau khi customer đăng ký/đăng nhập thành công
 * 
 * @param {number} customerId - ID của customer vừa đăng ký
 * @returns {Promise<boolean>} - true nếu update thành công, false nếu thất bại
 */
export async function updateSessionCustomer(customerId) {
    try {
        // Lấy session từ localStorage
        const sessionData = localStorage.getItem('qr_session');

        if (!sessionData) {
            console.warn('⚠️ No qr_session found in localStorage');
            return false;
        }

        const session = JSON.parse(sessionData);
        const sessionId = session.id || session.session_id;

        if (!sessionId) {
            console.warn('⚠️ No session ID found in qr_session');
            return false;
        }

        // Gọi API update customer_id vào qr_session
        await axios.put(
            `${REACT_APP_API_URL}/qr-sessions/${sessionId}/customer`,
            { customer_id: customerId }
        );

        console.log('✅ Updated qr_session with customer_id:', customerId);
        return true;
    } catch (error) {
        console.error('⚠️ Failed to update qr_session:', error);
        return false;
    }
}

/**
 * 🎯 Lưu customer info vào localStorage
 * 
 * @param {object} customerData - Dữ liệu customer từ API
 * @returns {object} - Customer info đã format
 */
export function saveCustomerInfo(customerData) {
    const customerInfo = {
        id: customerData.id,
        phone: customerData.phone,
        name: customerData.name || null,
        loyalty_points: customerData.points || 0
    };

    localStorage.setItem('loyalty_customer', JSON.stringify(customerInfo));

    return customerInfo;
}

/**
 * 🎯 Lấy customer info từ localStorage
 * 
 * @returns {object|null} - Customer info hoặc null nếu không có
 */
export function getCustomerInfo() {
    try {
        const savedCustomer = localStorage.getItem('loyalty_customer');
        return savedCustomer ? JSON.parse(savedCustomer) : null;
    } catch (error) {
        console.error('Error parsing customer info:', error);
        localStorage.removeItem('loyalty_customer');
        return null;
    }
}

/**
 * 🎯 Clear customer info khỏi localStorage
 */
export function clearCustomerInfo() {
    localStorage.removeItem('loyalty_customer');
}
