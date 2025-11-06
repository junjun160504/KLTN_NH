import { useState, useCallback, useRef } from 'react'
import { usePolling } from './usePolling'
import axios from 'axios'

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

/**
 * Custom hook for polling tables and their orders
 * Fetches both table data and orders for each table
 * Smart comparison to only trigger re-render when data actually changes
 * @param {number} interval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 */
export const useTablesPolling = (interval = 5000, enabled = true) => {
  const [tables, setTables] = useState([])
  const [allTablesOrders, setAllTablesOrders] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const lastDataRef = useRef({ tables: null, orders: null })

  // Smart comparison for tables
  const hasTablesChanged = useCallback((newTables, oldTables) => {
    if (!oldTables) return true
    if (newTables.length !== oldTables.length) return true

    // Compare critical fields
    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i]
      const oldTable = oldTables.find(t => t.id === newTable.id)

      if (!oldTable) return true

      // Compare essential fields
      if (
        newTable.table_number !== oldTable.table_number ||
        newTable.is_active !== oldTable.is_active ||
        newTable.qr_code_url !== oldTable.qr_code_url
      ) {
        return true
      }
    }

    return false
  }, [])

  // Smart comparison for orders map
  const hasOrdersChanged = useCallback((newOrdersMap, oldOrdersMap) => {
    if (!oldOrdersMap) return true

    const newKeys = Object.keys(newOrdersMap)
    const oldKeys = Object.keys(oldOrdersMap)

    // Compare keys length
    if (newKeys.length !== oldKeys.length) return true

    // Compare orders for each table
    for (const tableId of newKeys) {
      const newOrders = newOrdersMap[tableId] || []
      const oldOrders = oldOrdersMap[tableId] || []

      if (newOrders.length !== oldOrders.length) return true

      // Deep compare orders
      for (let i = 0; i < newOrders.length; i++) {
        const newOrder = newOrders[i]
        const oldOrder = oldOrders.find(o => o.id === newOrder.id)

        if (!oldOrder) return true

        // Compare critical fields
        if (
          newOrder.status !== oldOrder.status ||
          newOrder.total_price !== oldOrder.total_price ||
          newOrder.items?.length !== oldOrder.items?.length
        ) {
          return true
        }
      }
    }

    return false
  }, [])

  // Fetch tables and orders
  const fetchTablesAndOrders = useCallback(async () => {
    try {
      // Fetch tables
      const tablesResponse = await axios.get(`${REACT_APP_API_URL}/tables`)
      const fetchedTables = tablesResponse.data.data || []

      // Fetch orders for all tables in parallel
      const ordersMap = {}
      await Promise.all(
        fetchedTables.map(async (table) => {
          try {
            const orderResponse = await axios.get(
              `${REACT_APP_API_URL}/orders/table/${table.id}`
            )
            if (orderResponse.data && orderResponse.data.data) {
              ordersMap[table.id] = orderResponse.data.data
            } else {
              ordersMap[table.id] = []
            }
          } catch (err) {
            // If 404 or error, set empty array
            console.warn(`No orders for table ${table.id}:`, err.message)
            ordersMap[table.id] = []
          }
        })
      )

      // Only update state if data has changed
      const tablesChanged = hasTablesChanged(fetchedTables, lastDataRef.current.tables)
      const ordersChanged = hasOrdersChanged(ordersMap, lastDataRef.current.orders)

      if (tablesChanged || ordersChanged) {
        console.log('📊 Tables/Orders data changed, updating state...')

        if (tablesChanged) {
          setTables(fetchedTables)
          lastDataRef.current.tables = fetchedTables
        }

        if (ordersChanged) {
          setAllTablesOrders(ordersMap)
          lastDataRef.current.orders = ordersMap
        }
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch tables and orders:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [hasTablesChanged, hasOrdersChanged])

  // Use polling hook
  const { trigger } = usePolling(
    fetchTablesAndOrders,
    interval,
    enabled,
    {
      runOnMount: true,
      onError: (err) => setError(err)
    }
  )

  // Helper function to update single table orders (for manual refresh)
  const updateSingleTableOrders = useCallback(async (tableId) => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/orders/table/${tableId}`)

      if (response.data && response.data.data) {
        setAllTablesOrders(prev => ({
          ...prev,
          [tableId]: response.data.data
        }))

        // Update ref
        lastDataRef.current.orders = {
          ...lastDataRef.current.orders,
          [tableId]: response.data.data
        }
      }
    } catch (err) {
      console.warn(`Failed to update orders for table ${tableId}:`, err.message)
    }
  }, [])

  return {
    tables,
    allTablesOrders,
    loading,
    error,
    refresh: trigger,
    updateSingleTableOrders
  }
}

export default useTablesPolling
