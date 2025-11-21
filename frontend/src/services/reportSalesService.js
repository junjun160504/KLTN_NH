import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

/**
 * Report Sales API Service
 * Xử lý các API calls cho báo cáo bán hàng chi tiết
 */
export const reportSalesService = {
  /**
   * Lấy dữ liệu xu hướng kinh doanh
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {String} groupBy - 'hour' | 'day' | 'week' | 'month'
   * @returns {Promise<Object>} Business trend data với summary metrics
   */
  getBusinessTrend: async (startDate, endDate, groupBy = 'day') => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/sales/trend`, {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          groupBy
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching business trend:', error)
      throw error
    }
  },

  /**
   * Lấy doanh thu theo món ăn (TOP N)
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {Number} limit - Số lượng món (default: 15)
   * @returns {Promise<Object>} Dish revenue data với growth metrics
   */
  getDishRevenue: async (startDate, endDate, limit = 15) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/sales/dishes`, {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          limit
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching dish revenue:', error)
      throw error
    }
  },

  /**
   * Lấy doanh thu theo danh mục
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @returns {Promise<Object>} Category revenue data với percentages
   */
  getCategoryRevenue: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/sales/categories`, {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD')
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching category revenue:', error)
      throw error
    }
  }
}

export default reportSalesService
