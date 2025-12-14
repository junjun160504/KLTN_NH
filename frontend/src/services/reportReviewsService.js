import axios from 'axios'
import { authService } from './authService'

const API_URL = process.env.REACT_APP_API_URL

const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${authService.getToken()}` }
})

// ========== RESTAURANT REVIEWS ==========

export const getRestaurantReviewStats = async (startDate, endDate) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/restaurant/stats`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD')
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching restaurant review stats:', error)
        throw error
    }
}

export const getRestaurantReviewTrend = async (startDate, endDate) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/restaurant/trend`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD')
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching restaurant review trend:', error)
        throw error
    }
}

export const getRecentRestaurantReviews = async (limit = 10) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/restaurant/recent`,
            {
                ...getAuthHeader(),
                params: { limit }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching recent restaurant reviews:', error)
        throw error
    }
}

// ========== MENU REVIEWS ==========

export const getMenuReviewStats = async (startDate, endDate) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/menu/stats`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD')
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching menu review stats:', error)
        throw error
    }
}

export const getMenuReviewTrend = async (startDate, endDate) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/menu/trend`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD')
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching menu review trend:', error)
        throw error
    }
}

export const getTopRatedMenuItems = async (limit = 10, startDate = null, endDate = null) => {
    try {
        const params = { limit }
        if (startDate && endDate) {
            params.startDate = startDate.format('YYYY-MM-DD')
            params.endDate = endDate.format('YYYY-MM-DD')
        }

        const response = await axios.get(
            `${API_URL}/dashboard/reviews/menu/top-rated`,
            {
                ...getAuthHeader(),
                params
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching top rated menu items:', error)
        throw error
    }
}

export const getLowestRatedMenuItems = async (limit = 5, startDate = null, endDate = null) => {
    try {
        const params = { limit }
        if (startDate && endDate) {
            params.startDate = startDate.format('YYYY-MM-DD')
            params.endDate = endDate.format('YYYY-MM-DD')
        }

        const response = await axios.get(
            `${API_URL}/dashboard/reviews/menu/lowest-rated`,
            {
                ...getAuthHeader(),
                params
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching lowest rated menu items:', error)
        throw error
    }
}

export const getRecentMenuReviews = async (limit = 10) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/menu/recent`,
            {
                ...getAuthHeader(),
                params: { limit }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching recent menu reviews:', error)
        throw error
    }
}

// ========== COMBINED ==========

export const getCombinedRatingDistribution = async (startDate, endDate) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/distribution`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD')
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching combined rating distribution:', error)
        throw error
    }
}

export const getRestaurantReviewsDetail = async (startDate, endDate, page = 1, limit = 10) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/restaurant/detail`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD'),
                    page,
                    limit
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching restaurant reviews detail:', error)
        throw error
    }
}

export const getMenuReviewsDetail = async (startDate, endDate, page = 1, limit = 10) => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard/reviews/menu/detail`,
            {
                ...getAuthHeader(),
                params: {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD'),
                    page,
                    limit
                }
            }
        )
        return response.data
    } catch (error) {
        console.error('Error fetching menu reviews detail:', error)
        throw error
    }
}
