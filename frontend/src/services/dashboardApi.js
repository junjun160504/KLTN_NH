import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

/**
 * Dashboard API Service
 * Xử lý các API calls cho dashboard analytics
 */
export const dashboardApi = {
  /**
   * Lấy key metrics cho dashboard
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @returns {Promise<Object>} Key metrics data
   */
  getKeyMetrics: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching key metrics:', error)
      throw error
    }
  },

  /**
   * Lấy dữ liệu revenue chart với auto-groupBy
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {String} groupBy - Optional: 'hour'|'day'|'week'|'month'
   * @returns {Promise<Object>} Revenue chart data
   */
  getRevenueChart: async (startDate, endDate, groupBy) => {
    try {
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }

      if (groupBy) {
        params.groupBy = groupBy
      }

      const response = await axios.get(`${API_URL}/dashboard/revenue`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching revenue chart:', error)
      throw error
    }
  },

  /**
   * Lấy TOP N món bán chạy nhất
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {Number} limit - Số lượng món (default: 5)
   * @returns {Promise<Object>} Top dishes data
   */
  getTopDishes: async (startDate, endDate, limit = 5) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/top-dishes`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching top dishes:', error)
      throw error
    }
  },

  /**
   * Lấy phân bố trạng thái đơn hàng
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @returns {Promise<Object>} Order status distribution data
   */
  getOrderStatus: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/order-status`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching order status:', error)
      throw error
    }
  },

  /**
   * Lấy trạng thái bàn real-time
   * @returns {Promise<Object>} Table status data
   */
  getTableStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/table-status`)
      return response.data
    } catch (error) {
      console.error('Error fetching table status:', error)
      throw error
    }
  },

  /**
   * Lấy danh sách đơn hàng gần đây (24h)
   * @param {Number} limit - Số lượng đơn hàng (default: 5)
   * @returns {Promise<Object>} Recent orders data
   */
  getRecentOrders: async (limit = 5) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/recent-orders`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      throw error
    }
  },

  /**
   * Lấy performance metrics
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @returns {Promise<Object>} Performance metrics data
   */
  getPerformance: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/performance`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
      throw error
    }
  }
}
