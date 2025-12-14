import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

/**
 * Get loyalty program trend data
 */
export const getLoyaltyTrend = async (startDate, endDate) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(
      `${API_BASE_URL}/dashboard/customers/loyalty-trend`,
      {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD')
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching loyalty trend:', error)
    throw error
  }
}

/**
 * Get top customers by loyalty points
 * Supports date range filtering
 */
export const getTopCustomers = async (limit = 10, startDate = null, endDate = null) => {
  try {
    const token = localStorage.getItem('token')
    const params = { limit }

    if (startDate && endDate) {
      params.startDate = startDate.format('YYYY-MM-DD')
      params.endDate = endDate.format('YYYY-MM-DD')
    }

    const response = await axios.get(
      `${API_BASE_URL}/dashboard/customers/top`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching top customers:', error)
    throw error
  }
}

/**
 * Get point distribution by ranges
 * Supports date range filtering
 */
export const getPointDistribution = async (startDate = null, endDate = null) => {
  try {
    const token = localStorage.getItem('token')
    const params = {}

    if (startDate && endDate) {
      params.startDate = startDate.format('YYYY-MM-DD')
      params.endDate = endDate.format('YYYY-MM-DD')
    }

    const response = await axios.get(
      `${API_BASE_URL}/dashboard/customers/point-distribution`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching point distribution:', error)
    throw error
  }
}
