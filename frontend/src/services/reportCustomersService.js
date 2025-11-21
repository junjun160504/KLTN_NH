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
 */
export const getTopCustomers = async (limit = 10) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(
      `${API_BASE_URL}/dashboard/customers/top`,
      {
        params: { limit },
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
 */
export const getPointDistribution = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(
      `${API_BASE_URL}/dashboard/customers/point-distribution`,
      {
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
