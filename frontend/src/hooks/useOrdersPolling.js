import { useState, useCallback, useRef } from 'react'
import { usePolling } from './usePolling'
import axios from 'axios'

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

/**
 * Custom hook for polling orders data
 * Smart comparison to only trigger re-render when data actually changes
 * @param {number} interval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 */
export const useOrdersPolling = (interval = 5000, enabled = true) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const lastDataRef = useRef(null)

  // Smart comparison function
  const hasDataChanged = useCallback((newData, oldData) => {
    if (!oldData) return true
    if (newData.length !== oldData.length) return true

    // Deep comparison of orders
    for (let i = 0; i < newData.length; i++) {
      const newOrder = newData[i]
      const oldOrder = oldData.find(o => o.id === newOrder.id)

      if (!oldOrder) return true

      // Compare critical fields
      if (
        newOrder.status !== oldOrder.status ||
        newOrder.total_amount !== oldOrder.total_amount ||
        newOrder.items?.length !== oldOrder.items?.length ||
        newOrder.updated_at !== oldOrder.updated_at ||
        newOrder.qr_session_id !== oldOrder.qr_session_id ||
        newOrder.session_status !== oldOrder.session_status
      ) {
        return true
      }
    }

    return false
  }, [])

  // Fetch orders function
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/orders`)
      const fetchedOrders = response.data.data || []

      // Transform orders (keep all fields needed by UI)
      const transformedOrders = fetchedOrders.map((order) => ({
        id: order.id,
        qr_session_id: order.qr_session_id, // ✅ Add this
        session_status: order.session_status, // ✅ Add this
        table_id: order.table_id,
        table_number: order.table_number,
        customer_phone: order.customer_phone,
        loyalty_points_used: order.loyalty_points_used || 0,
        status: order.status,
        total_amount: parseFloat(order.total_price || 0), // Convert to number
        items: order.items || [],
        created_at: order.created_at,
        updated_at: order.updated_at,
        payment_method: order.payment_method,
        note: order.note,
        notes: order.notes
      }))

      // Only update state if data has changed
      if (hasDataChanged(transformedOrders, lastDataRef.current)) {
        console.log('📊 Orders data changed, updating state...')
        setOrders(transformedOrders)
        lastDataRef.current = transformedOrders
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [hasDataChanged])

  // Use polling hook
  const { trigger } = usePolling(
    fetchOrders,
    interval,
    enabled,
    {
      runOnMount: true,
      onError: (err) => setError(err)
    }
  )

  return {
    orders,
    loading,
    error,
    refresh: trigger
  }
}

export default useOrdersPolling
