import * as reportReviewsService from '../services/reportReviews.service.js'

/**
 * Get restaurant review statistics
 */
export const getRestaurantReviewStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getRestaurantReviewStats(startDate, endDate)
        res.json(result)
    } catch (error) {
        console.error('Error in getRestaurantReviewStats:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get restaurant review trend
 */
export const getRestaurantReviewTrend = async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getRestaurantReviewTrend(startDate, endDate)
        res.json(result)
    } catch (error) {
        console.error('Error in getRestaurantReviewTrend:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get recent restaurant reviews
 */
export const getRecentRestaurantReviews = async (req, res) => {
    try {
        const { limit = 10 } = req.query
        const result = await reportReviewsService.getRecentRestaurantReviews(parseInt(limit))
        res.json(result)
    } catch (error) {
        console.error('Error in getRecentRestaurantReviews:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get menu review statistics
 */
export const getMenuReviewStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getMenuReviewStats(startDate, endDate)
        res.json(result)
    } catch (error) {
        console.error('Error in getMenuReviewStats:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get menu review trend
 */
export const getMenuReviewTrend = async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getMenuReviewTrend(startDate, endDate)
        res.json(result)
    } catch (error) {
        console.error('Error in getMenuReviewTrend:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get top rated menu items
 */
export const getTopRatedMenuItems = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query
        const result = await reportReviewsService.getTopRatedMenuItems(
            parseInt(limit),
            startDate || null,
            endDate || null
        )
        res.json(result)
    } catch (error) {
        console.error('Error in getTopRatedMenuItems:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get lowest rated menu items
 */
export const getLowestRatedMenuItems = async (req, res) => {
    try {
        const { limit = 5, startDate, endDate } = req.query
        const result = await reportReviewsService.getLowestRatedMenuItems(
            parseInt(limit),
            startDate || null,
            endDate || null
        )
        res.json(result)
    } catch (error) {
        console.error('Error in getLowestRatedMenuItems:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get recent menu reviews
 */
export const getRecentMenuReviews = async (req, res) => {
    try {
        const { limit = 10 } = req.query
        const result = await reportReviewsService.getRecentMenuReviews(parseInt(limit))
        res.json(result)
    } catch (error) {
        console.error('Error in getRecentMenuReviews:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get combined rating distribution
 */
export const getCombinedRatingDistribution = async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getCombinedRatingDistribution(startDate, endDate)
        res.json(result)
    } catch (error) {
        console.error('Error in getCombinedRatingDistribution:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get restaurant reviews detail by date range
 */
export const getRestaurantReviewsDetail = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getRestaurantReviewsDetail(
            startDate,
            endDate,
            parseInt(page),
            parseInt(limit)
        )
        res.json(result)
    } catch (error) {
        console.error('Error in getRestaurantReviewsDetail:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

/**
 * Get menu reviews detail by date range
 */
export const getMenuReviewsDetail = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            })
        }

        const result = await reportReviewsService.getMenuReviewsDetail(
            startDate,
            endDate,
            parseInt(page),
            parseInt(limit)
        )
        res.json(result)
    } catch (error) {
        console.error('Error in getMenuReviewsDetail:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

