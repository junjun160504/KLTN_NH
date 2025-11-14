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
  }
}
