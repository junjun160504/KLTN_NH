import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import CustomDateRangePicker from '../../../components/CustomDateRangePicker'
import { useOrdersPolling } from '../../../hooks/useOrdersPolling'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import {
  Layout,
  Button,
  Space,
  Input,
  Select,
  Tag,
  App,
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Popconfirm,
  Pagination,
  ConfigProvider,
  Drawer,
  InputNumber
} from 'antd'
import vi_VN from 'antd/lib/locale/vi_VN'
import {
  SearchOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ShopOutlined,
  EyeOutlined,
  PlusOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { Download } from 'react-feather'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import axios from 'axios'

// Extend dayjs với isBetween plugin
dayjs.extend(isBetween)

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

const { Content } = Layout
const { Option } = Select

// ==================== STATUS MAPPING ====================
const STATUS_MAP = {
  EN_TO_VI: {
    NEW: 'Chờ xác nhận',
    IN_PROGRESS: 'Đang phục vụ',
    PAID: 'Đã thanh toán',
    CANCELLED: 'Đã hủy'
  },
  VI_TO_EN: {
    'Chờ xác nhận': 'NEW',
    'Đang phục vụ': 'IN_PROGRESS',
    'Đã thanh toán': 'PAID',
    'Đã hủy': 'CANCELLED'
  }
}

const STATUS_COLORS = {
  NEW: 'orange',
  IN_PROGRESS: 'green',
  PAID: 'purple',
  CANCELLED: 'red'
}

const SESSION_STATUS_MAP = {
  ACTIVE: 'Đang mở',
  ENDED: 'Đã đóng',
  COMPLETED: 'Đã đóng'
}

const SESSION_STATUS_COLORS = {
  ACTIVE: 'green',
  ENDED: 'default',
  COMPLETED: 'default'
}

function OrderSessionPage() {
  const { message, modal } = App.useApp()

  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Đơn hàng theo phiên')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchText, setSearchText] = useState('')

  // Custom date range for filtering - Default to today
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Expanded rows
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  // Order panel state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Edit item states
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingQuantity, setEditingQuantity] = useState({})
  const [updatingItemId, setUpdatingItemId] = useState(null)

  // ==================== POLLING HOOK ====================
  const { orders: pollingOrders, loading, refresh: refreshOrders } = useOrdersPolling(5000, true)

  // ==================== GROUP ORDERS BY SESSION ====================
  const sessions = useMemo(() => {
    // Group orders by qr_session_id
    const sessionMap = new Map()

    pollingOrders.forEach((order) => {
      // Use qr_session_id directly (number) or create fake key for grouping
      const sessionId = order.qr_session_id || `no-session-${order.id}`
      // Store the real numeric session ID (or null if no session)
      const realSessionId = order.qr_session_id || null

      // Format: #S0123 (pad to 4 digits)
      const sessionKey = String(sessionId).startsWith('no-session-')
        ? `#S${String(order.id).padStart(4, '0')}`
        : `#S${String(sessionId).padStart(4, '0')}`

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          key: sessionKey,
          sessionId: realSessionId, // Store real session ID (number or null)
          sessionCode: sessionKey, // Format: #S0123
          tableId: order.table_id,
          tableNumber: order.table_number,
          table: order.table_number ? `Bàn ${order.table_number}` : 'N/A',
          phone: order.customer_phone || '-',
          sessionStatus: order.session_status || 'ACTIVE',
          orders: [],
          totalAmount: 0,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        })
      }

      const session = sessionMap.get(sessionId)
      session.orders.push({
        id: order.id,
        code: `ORD-${String(order.id).padStart(4, '0')}`,
        totalAmount: parseFloat(order.total_amount || 0),
        total: `${parseFloat(order.total_amount || 0).toLocaleString('vi-VN')}đ`,
        status: order.status,
        statusVI: STATUS_MAP.EN_TO_VI[order.status] || order.status,
        createdAt: order.created_at,
        items: order.items || [],
        note: order.note || order.notes || '',
        rawData: order,
        phone: order.customer_phone || ''
      })

      session.totalAmount += parseFloat(order.total_amount || 0)

      // Update thời gian mới nhất
      if (order.updated_at > session.updatedAt) {
        session.updatedAt = order.updated_at
      }
    })

    // Convert Map to Array và format total
    return Array.from(sessionMap.values()).map(session => ({
      ...session,
      total: `${session.totalAmount.toLocaleString('vi-VN')}đ`,
      orderCount: session.orders.length
    }))
  }, [pollingOrders])

  // ==================== FILTER SESSIONS ====================
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Status filter (check if any order matches)
      const statusMatch = filterStatus === 'ALL'
        ? true
        : session.orders.some(order => order.status === filterStatus)

      // Date range filter - null = Tất cả
      let timeMatch = true
      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange
        const created = dayjs(session.createdAt)
        timeMatch = created.isBetween(start, end, null, '[]')
      }

      // Search filter
      const search = searchText.trim().toLowerCase()
      const searchMatch =
        !search ||
        session.sessionCode.toLowerCase().includes(search) ||
        session.phone.toLowerCase().includes(search) ||
        session.table.toLowerCase().includes(search) ||
        (session.tableNumber && session.tableNumber.toString().includes(search)) ||
        session.orders.some(order => order.code.toLowerCase().includes(search))

      return statusMatch && timeMatch && searchMatch
    })
  }, [sessions, filterStatus, dateRange, searchText])

  // ==================== STATISTICS ====================
  const statistics = useMemo(() => {
    // Filter sessions by date range first
    let sessionsInRange = sessions
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange
      sessionsInRange = sessions.filter(session => {
        const created = dayjs(session.createdAt)
        return created.isBetween(start, end, null, '[]')
      })
    }

    // Filter orders by date range
    let ordersInRange = pollingOrders
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange
      ordersInRange = pollingOrders.filter(order => {
        const created = dayjs(order.created_at)
        return created.isBetween(start, end, null, '[]')
      })
    }

    const totalSessions = sessionsInRange.length
    const activeSessions = sessionsInRange.filter(s => s.sessionStatus === 'ACTIVE').length
    const totalOrders = ordersInRange.length
    const revenue = ordersInRange
      .filter(o => o.status === 'PAID')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

    return {
      totalSessions,
      activeSessions,
      totalOrders,
      revenue
    }
  }, [sessions, pollingOrders, dateRange])

  // ==================== API FUNCTIONS ====================

  // Generate HTML template cho kitchen bill (MUST BE BEFORE printKitchenBill)
  const getKitchenBillHTML = useCallback((order, items) => {
    const now = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const totalItems = items.length
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    return `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Báo bếp - ${order.table}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            body { 
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
            }
            @media print {
              body { 
                width: 80mm;
                margin: 0 auto;
              }
            }
          </style>
        </head>
        <body class="bg-white p-4">
          <!-- Header -->
          <div class="text-center border-b-2 border-dashed border-gray-800 pb-3 mb-3">
            <h1 class="text-2xl font-bold mb-1">🍽️ NHÀ HÀNG</h1>
            <h2 class="text-xl font-bold">PHIẾU BÁO BẾP</h2>
          </div>

          <!-- Order Info -->
          <div class="space-y-2 mb-3 text-sm">
            <div class="flex justify-between items-center">
              <span class="font-semibold">Bàn:</span>
              <span class="text-xl font-bold">${order.table}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Đơn hàng:</span>
              <span class="font-mono">${order.code}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Thời gian:</span>
              <span>${now}</span>
            </div>
          </div>

          <!-- Items List -->
          <div class="space-y-3 mb-3">
            ${items.map(item => `
              <div class="border-b border-gray-300 pb-3">
                <div class="flex justify-between items-start mb-1">
                  <div class="font-bold text-base flex-1 pr-2">${item.name}</div>
                  <div class="text-2xl font-bold whitespace-nowrap">x${item.quantity}</div>
                </div>
                ${item.note ? `
                  <div class="text-sm italic text-gray-600 mt-2 pl-3 border-l-2 border-orange-400">
                    📝 ${item.note}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Footer -->
          <div class="border-t-2 border-dashed border-gray-800 pt-3 text-center text-sm">
            <div class="mb-2">━━━━━━━━━━━━━━━━━━━━</div>
            <div class="font-bold">
              Tổng: ${totalItems} món - ${totalQuantity} phần
            </div>
            <div class="mt-3 text-xs text-gray-600">
              In lúc: ${now}
            </div>
          </div>
        </body>
      </html>
    `
  }, [])

  // Print kitchen bill using iframe (same as Orders.js)
  const printKitchenBill = useCallback((order, items) => {
    if (!order || !items || items.length === 0) {
      message.error('Không có thông tin đơn hàng để in!')
      return
    }

    // Tạo iframe ẩn
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'

    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(getKitchenBillHTML(order, items))
    iframeDoc.close()

    // Trigger print sau khi load xong
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()

        // Xóa iframe sau khi in
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 500)
    }
  }, [getKitchenBillHTML, message])

  // Fetch chi tiết đơn hàng theo ID
  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setLoadingDetail(true)
      const response = await axios.get(`${REACT_APP_API_URL}/orders/${orderId}`)

      if (response.data.status === 200) {
        const order = response.data.data

        // Transform data để match với UI format
        const transformedOrder = {
          key: order.id.toString(),
          id: order.id,
          code: `ORD-${String(order.id).padStart(4, '0')}`,
          table: order.table_number ? `Bàn ${order.table_number}` : 'N/A',
          tableNumber: order.table_number,
          tableId: order.table_id,
          qrSessionId: order.qr_session_id,
          sessionStatus: order.session_status,
          phone: order.customer_phone || '-',
          point: order.loyalty_points_used || 0,
          // API trả về total_price (string), convert sang number
          totalAmount: parseFloat(order.total_price || 0),
          total: `${parseFloat(order.total_price || 0).toLocaleString('vi-VN')}đ`,
          status: order.status,
          statusVI: STATUS_MAP.EN_TO_VI[order.status] || order.status,
          createdAt: order.created_at || dayjs().toISOString(),
          updatedAt: order.updated_at,
          // API trả về unit_price (string), cần convert sang number
          items: (order.items || []).map(item => ({
            ...item,
            id: item.order_item_id || item.id,
            order_item_id: item.order_item_id || item.id,
            name: item.menu_item_name || item.name || 'N/A',
            imageUrl: item.image_url || '',
            price: parseFloat(item.unit_price || 0),
            quantity: item.quantity || 0
          })),
          note: order.note || '',
          rawData: order
        }

        setSelectedOrder(transformedOrder)
        return transformedOrder
      }
    } catch (error) {
      console.error('[Orders] Fetch detail error:', error)

      if (error.response?.status === 404) {
        message.error('Không tìm thấy đơn hàng')
      } else {
        message.error('Không thể tải chi tiết đơn hàng')
      }

      setSelectedOrder(null)
      return null
    } finally {
      setLoadingDetail(false)
    }
  }, [message])

  // Cập nhật số lượng món trong đơn
  const updateItemQuantityAPI = useCallback(async (orderId, orderItemId, quantity) => {
    try {
      setUpdatingItemId(orderItemId)
      const response = await axios.put(
        `${REACT_APP_API_URL}/orders/${orderId}/items/${orderItemId}`,
        { quantity }
      )

      if (response.data.status === 200) {
        message.success('Cập nhật số lượng thành công!')
        await fetchOrderDetails(orderId)
        refreshOrders()
        return true
      }
    } catch (error) {
      console.error('[Orders] Update item quantity error:', error)
      const errorMsg = error.response?.data?.message || 'Không thể cập nhật số lượng'
      message.error(errorMsg)
      return false
    } finally {
      setUpdatingItemId(null)
    }
  }, [fetchOrderDetails, refreshOrders, message])

  // Xóa món khỏi đơn
  const removeItemAPI = useCallback(async (orderId, orderItemId) => {
    try {
      const response = await axios.delete(
        `${REACT_APP_API_URL}/orders/${orderId}/items/${orderItemId}`
      )

      if (response.data.status === 200) {
        message.success('Xóa món thành công!')

        // Nếu xóa món cuối cùng, order sẽ bị xóa
        if (response.data.data?.order_deleted) {
          message.info('Đơn hàng đã bị xóa do không còn món nào')
          setSelectedOrder(null)
        } else {
          await fetchOrderDetails(orderId)
        }

        refreshOrders()
        return true
      }
    } catch (error) {
      console.error('[Orders] Remove item error:', error)
      const errorMsg = error.response?.data?.message || 'Không thể xóa món'
      message.error(errorMsg)
      return false
    }
  }, [fetchOrderDetails, refreshOrders, message])
  const cancelOrderAPI = useCallback(async (orderId, reason = '') => {
    try {
      const response = await axios.put(
        `${REACT_APP_API_URL}/orders/${orderId}/cancel`,
        { reason }
      )

      if (response.data.status === 200) {
        message.success('Hủy đơn hàng thành công!')
        refreshOrders()
        return true
      }
    } catch (error) {
      console.error('[Orders] Cancel order error:', error)
      const errorMsg = error.response?.data?.message || 'Không thể hủy đơn hàng'
      message.error(errorMsg)
      return false
    }
  }, [refreshOrders, message])

  const handleViewDetail = useCallback(async (order) => {
    await fetchOrderDetails(order.id)
    setEditingItemId(null)
    setEditingQuantity({})
  }, [fetchOrderDetails])

  const handlePaymentSession = useCallback((session) => {
    const orders = session.orders

    if (orders.length === 0) {
      message.warning('Phiên không có đơn hàng nào!')
      return
    }

    // Calculate statistics
    const totalItems = orders.flatMap(o => o.items || []).length
    const totalQuantity = orders.flatMap(o => o.items || []).reduce((sum, item) => sum + item.quantity, 0)

    // Separate orders by status
    const confirmedOrders = orders.filter(o => o.status === 'IN_PROGRESS')
    const newOrders = orders.filter(o => o.status === 'NEW')

    // Calculate total for confirmed orders only
    const totalAmount = confirmedOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Show confirmation modal with Japanese design (same as Tables.js)
    modal.confirm({
      title: null,
      icon: null,
      width: 460,
      centered: true,
      content: (
        <div className="py-2">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#fff7e6] to-[#ffe7ba] flex items-center justify-center shadow-[0_4px_12px_rgba(250,173,20,0.15)]">
              <DollarOutlined className="text-[28px] text-[#faad14]" />
            </div>
            <div className="text-xl font-semibold text-[#262626] tracking-tight mb-1.5">
              Xác nhận thanh toán
            </div>
            <div className="text-[13px] text-[#8c8c8c] font-normal">
              Vui lòng kiểm tra thông tin trước khi xác nhận
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-xl p-4 mb-5 border border-[#f0f0f0]">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#f0f0f0]">
              <div className="flex-1">
                <div className="text-xs text-[#8c8c8c] mb-1 font-medium">
                  Bàn
                </div>
                <div className="text-lg font-semibold text-[#1890ff] tracking-tight">
                  {session.table}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs text-[#8c8c8c] mb-1 font-medium">
                  Phiên
                </div>
                <div className="text-[15px] font-semibold text-[#262626] font-mono">
                  {session.sessionCode}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#595959] font-medium">
                  Tổng đơn hàng
                </span>
                <span className="text-[13px] text-[#262626] font-semibold">
                  {orders.length} đơn
                </span>
              </div>

              {confirmedOrders.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#52c41a] font-medium">
                    • Đã xác nhận
                  </span>
                  <span className="text-[13px] text-[#52c41a] font-semibold">
                    {confirmedOrders.length} đơn
                  </span>
                </div>
              )}

              {newOrders.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#ff4d4f] font-medium">
                    • Chưa xác nhận
                  </span>
                  <span className="text-[13px] text-[#ff4d4f] font-semibold">
                    {newOrders.length} đơn
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#595959] font-medium">
                  Số lượng món
                </span>
                <span className="text-[13px] text-[#262626] font-semibold">
                  {totalItems} món ({totalQuantity} phần)
                </span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#d9d9d9] to-transparent my-3" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-[#262626] font-semibold">
                Tổng thanh toán
              </span>
              <div className="text-2xl font-bold text-[#52c41a] tracking-tight">
                {Number(totalAmount)?.toLocaleString('vi-VN')}₫
              </div>
            </div>
          </div>

          {newOrders.length > 0 && (
            <div className="bg-[#fff7e6] border border-[#ffd591] rounded-lg p-3 px-4 flex items-start gap-2.5 mb-3">
              <span className="text-base leading-5">
                ⚠️
              </span>
              <div className="flex-1 text-[13px] text-[#d46b08] leading-relaxed">
                {newOrders.length} đơn chưa xác nhận sẽ tự động hủy khi thanh toán
              </div>
            </div>
          )}

          <div className="bg-[#e6f4ff] border border-[#91caff] rounded-lg p-3 px-4 flex items-start gap-2.5">
            <span className="text-base leading-5">
              💳
            </span>
            <div className="flex-1 text-[13px] text-[#0958d9] leading-relaxed">
              Xác nhận khách hàng đã thanh toán đầy đủ số tiền trên?
            </div>
          </div>
        </div>
      ),
      okText: 'Xác nhận thanh toán',
      okType: 'primary',
      cancelText: 'Quay lại',
      okButtonProps: {
        size: 'large',
        className: 'h-11 text-[15px] font-semibold rounded-lg bg-[#226533] border-[#226533] shadow-[0_2px_8px_rgba(34,101,51,0.25)] hover:bg-[#1a4d26]'
      },
      cancelButtonProps: {
        size: 'large',
        className: 'h-11 text-[15px] font-medium rounded-lg border border-[#d9d9d9]'
      },
      onOk: async () => {
        try {
          // Process payment for all confirmed orders
          const paymentPromises = confirmedOrders.map(order =>
            axios.put(`${REACT_APP_API_URL}/orders/${order.id}/status`, {
              status: 'PAID'
            })
          )

          // Cancel all NEW orders
          const cancelPromises = newOrders.map(order =>
            axios.put(`${REACT_APP_API_URL}/orders/${order.id}/cancel`, {
              reason: 'Hủy tự động khi thanh toán phiên'
            })
          )

          await Promise.all([...paymentPromises, ...cancelPromises])

          message.success(`Thanh toán thành công ${confirmedOrders.length} đơn hàng!`)

          // End session only if it has a real QR session ID (number)
          if (session.sessionId !== null && session.sessionStatus === 'ACTIVE') {
            try {
              await axios.put(`${REACT_APP_API_URL}/qr-sessions/${session.sessionId}/end`)
              message.success('Phiên đã kết thúc!')
            } catch (error) {
              console.error('[Sessions] End session error:', error)
              message.error('Không thể kết thúc phiên QR!')
            }
          }

          refreshOrders()
        } catch (error) {
          console.error('[Payment] Error:', error)
          message.error('Thanh toán thất bại!')
        }
      }
    })
  }, [modal, message, refreshOrders])

  // ==================== ORDER ITEM ACTIONS (Simplified - read-only for session view) ====================
  const handleConfirmOrder = async (orderId) => {
    try {
      // Get order info for printing before confirming
      const orderToPrint = selectedOrder || pollingOrders.find(o => o.id === orderId)

      await axios.put(`${REACT_APP_API_URL}/staff/orders/${orderId}/confirm`)
      message.success('Đã xác nhận đơn hàng!')

      // Print kitchen bill after confirming
      if (orderToPrint && orderToPrint.items && orderToPrint.items.length > 0) {
        const orderForPrint = {
          table: orderToPrint.table_number ? `Bàn ${orderToPrint.table_number}` : orderToPrint.table || 'N/A',
          code: `ORD-${String(orderId).padStart(4, '0')}`
        }
        printKitchenBill(orderForPrint, orderToPrint.items)
      }

      refreshOrders()
      // Refresh detail if drawer is open
      if (selectedOrder && selectedOrder.id === orderId) {
        await fetchOrderDetails(orderId)
      }
    } catch (err) {
      console.error('Failed to confirm order:', err)
      message.error('Xác nhận đơn hàng thất bại!')
    }
  }

  // Bắt đầu edit số lượng món
  const handleStartEditItem = useCallback((item) => {
    setEditingItemId(item.id)
    setEditingQuantity({ [item.id]: item.quantity })
  }, [])

  // Lưu số lượng mới
  const handleSaveItemQuantity = useCallback(async (orderId, item) => {
    const newQuantity = editingQuantity[item.id]

    if (newQuantity === undefined || newQuantity === item.quantity) {
      setEditingItemId(null)
      return
    }

    if (newQuantity < 0) {
      message.error('Số lượng không được âm!')
      return
    }

    if (newQuantity === 0) {
      modal.confirm({
        title: 'Xác nhận xóa món',
        content: `Số lượng = 0 sẽ xóa "${item.name}" khỏi đơn hàng. Bạn có chắc chắn?`,
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: async () => {
          const success = await removeItemAPI(orderId, item.id)
          if (success) {
            setEditingItemId(null)
            setEditingQuantity({})
          }
        }
      })
      return
    }

    const success = await updateItemQuantityAPI(orderId, item.id, newQuantity)
    if (success) {
      setEditingItemId(null)
      setEditingQuantity({})
    }
  }, [editingQuantity, updateItemQuantityAPI, removeItemAPI, modal, message])

  // Hủy edit
  const handleCancelEditItem = useCallback(() => {
    setEditingItemId(null)
    setEditingQuantity({})
  }, [])

  // Xóa món khỏi đơn
  const handleRemoveItem = useCallback((orderId, item) => {
    const orderItemId = item.order_item_id || item.id

    if (!orderItemId) {
      message.error('Không tìm thấy ID của món ăn!')
      return
    }

    modal.confirm({
      title: 'Xác nhận xóa món',
      content: `Bạn có chắc chắn muốn xóa "${item.name}" khỏi đơn hàng?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        await removeItemAPI(orderId, orderItemId)
      },
      onCancel: () => {
        console.log('Cancel remove item')
      }
    })
  }, [removeItemAPI, modal, message])

  // Reset về trang 1 khi thay đổi filters
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, dateRange, searchText])

  // ==================== EXPORT EXCEL ====================
  const handleExportExcel = useCallback(() => {
    try {
      // Lấy dữ liệu đã lọc hiện tại
      const exportData = filteredSessions

      if (exportData.length === 0) {
        message.warning('Không có dữ liệu để xuất!')
        return
      }

      // Style definitions
      const headerStyle = {
        fill: { fgColor: { rgb: "1890FF" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      }

      const dataCellStyle = {
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "D9D9D9" } },
          bottom: { style: "thin", color: { rgb: "D9D9D9" } },
          left: { style: "thin", color: { rgb: "D9D9D9" } },
          right: { style: "thin", color: { rgb: "D9D9D9" } }
        }
      }

      const centerCellStyle = {
        ...dataCellStyle,
        alignment: { horizontal: "center", vertical: "center" }
      }

      const numberCellStyle = {
        ...dataCellStyle,
        alignment: { horizontal: "right", vertical: "center" },
        numFmt: "#,##0"
      }

      const titleStyle = {
        fill: { fgColor: { rgb: "1890FF" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" }
      }

      const workbook = XLSX.utils.book_new()

      // ===== SHEET 1: DANH SÁCH PHIÊN =====
      const wsData = [[]]

      // Title row (merged)
      wsData.push(['DANH SÁCH PHIÊN ĂN'])
      wsData.push([])

      // Header row
      wsData.push([
        'Mã phiên',
        'Bàn',
        'SĐT khách',
        'Số đơn',
        'Tổng tiền (VNĐ)',
        'Thời gian bắt đầu',
        'Trạng thái phiên'
      ])

      // Data rows
      let totalRevenue = 0
      let totalSessions = exportData.length
      let activeSessions = 0

      exportData.forEach((session) => {
        const createdDate = dayjs(session.createdAt).format('YYYY-MM-DD HH:mm:ss')

        totalRevenue += session.totalAmount
        if (session.sessionStatus === 'ACTIVE') {
          activeSessions++
        }

        wsData.push([
          session.sessionCode || '',
          session.table || '',
          session.phone || '-',
          session.orderCount || 0,
          session.totalAmount || 0,
          createdDate,
          SESSION_STATUS_MAP[session.sessionStatus] || session.sessionStatus
        ])
      })

      // Add summary row
      wsData.push([])
      wsData.push([
        'Tổng cộng',
        `${totalSessions} phiên`,
        '',
        exportData.reduce((sum, s) => sum + (s.orderCount || 0), 0),
        totalRevenue,
        `Đang mở: ${activeSessions}`,
        ''
      ])

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Merge title
      ws['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
      ]

      // Column widths
      ws['!cols'] = [
        { wch: 15 },  // Mã phiên
        { wch: 10 },  // Bàn
        { wch: 15 },  // SĐT
        { wch: 10 },  // Số đơn
        { wch: 18 },  // Tổng tiền
        { wch: 20 },  // Thời gian
        { wch: 16 }   // Trạng thái
      ]

      // Apply styles
      const range = XLSX.utils.decode_range(ws['!ref'])

      // Title style (row 2)
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = titleStyle
      }

      // Header style (row 4)
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 3, c: C })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = headerStyle
      }

      // Data rows style
      for (let R = 4; R < range.e.r - 1; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) continue

          // Number columns: Số đơn, Tổng tiền
          if (C === 3 || C === 4) {
            ws[cellAddress].s = numberCellStyle
          }
          // Center columns: Mã phiên, Bàn, Số đơn, Trạng thái
          else if (C === 0 || C === 1 || C === 3 || C === 6) {
            ws[cellAddress].s = centerCellStyle
          }
          // Left-aligned: SĐT, Thời gian
          else {
            ws[cellAddress].s = dataCellStyle
          }
        }
      }

      // Summary row style
      const summaryRowIdx = range.e.r
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: summaryRowIdx, c: C })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "F0F0F0" } },
          font: { bold: true, sz: 11 },
          alignment: {
            horizontal: C === 0 ? "center" : (C === 3 || C === 4) ? "right" : "left",
            vertical: "center"
          },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          },
          numFmt: (C === 3 || C === 4) ? "#,##0" : undefined
        }
      }

      XLSX.utils.book_append_sheet(workbook, ws, 'Danh sách phiên')

      // ===== SHEET 2: CHI TIẾT ĐƠN HÀNG THEO PHIÊN =====
      const wsDetailData = [[]]

      // Title row (merged)
      wsDetailData.push(['CHI TIẾT ĐƠN HÀNG THEO PHIÊN'])
      wsDetailData.push([])

      // Header row
      wsDetailData.push([
        'Mã phiên',
        'Bàn',
        'Mã đơn',
        'Tổng tiền (VNĐ)',
        'Trạng thái đơn',
        'Thời gian tạo'
      ])

      // Data rows
      let totalOrders = 0
      let totalOrderRevenue = 0

      exportData.forEach((session) => {
        if (session.orders && session.orders.length > 0) {
          session.orders.forEach((order) => {
            const createdDate = dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')

            totalOrders++
            totalOrderRevenue += order.totalAmount || 0

            wsDetailData.push([
              session.sessionCode || '',
              session.table || '',
              order.code || '',
              order.totalAmount || 0,
              order.statusVI || '',
              createdDate
            ])
          })
        }
      })

      // Add summary row
      wsDetailData.push([])
      wsDetailData.push([
        'Tổng cộng',
        '',
        `${totalOrders} đơn`,
        totalOrderRevenue,
        '',
        ''
      ])

      const wsDetail = XLSX.utils.aoa_to_sheet(wsDetailData)

      // Merge title
      wsDetail['!merges'] = [
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ]

      // Column widths
      wsDetail['!cols'] = [
        { wch: 15 },  // Mã phiên
        { wch: 10 },  // Bàn
        { wch: 12 },  // Mã đơn
        { wch: 18 },  // Tổng tiền
        { wch: 16 },  // Trạng thái
        { wch: 20 }   // Thời gian
      ]

      // Apply styles for detail sheet
      const rangeDetail = XLSX.utils.decode_range(wsDetail['!ref'])

      // Title style (row 2) with green color
      for (let C = rangeDetail.s.c; C <= rangeDetail.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C })
        if (!wsDetail[cellAddress]) continue
        wsDetail[cellAddress].s = {
          fill: { fgColor: { rgb: "52C41A" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }

      // Header style (row 4) with green color
      for (let C = rangeDetail.s.c; C <= rangeDetail.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 3, c: C })
        if (!wsDetail[cellAddress]) continue
        wsDetail[cellAddress].s = {
          fill: { fgColor: { rgb: "52C41A" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }

      // Data rows style
      for (let R = 4; R < rangeDetail.e.r - 1; R++) {
        for (let C = rangeDetail.s.c; C <= rangeDetail.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!wsDetail[cellAddress]) continue

          // Number columns: Tổng tiền
          if (C === 3) {
            wsDetail[cellAddress].s = numberCellStyle
          }
          // Center columns: Mã phiên, Bàn, Mã đơn, Trạng thái
          else if (C === 0 || C === 1 || C === 2 || C === 4) {
            wsDetail[cellAddress].s = centerCellStyle
          }
          // Left-aligned: Thời gian
          else {
            wsDetail[cellAddress].s = dataCellStyle
          }
        }
      }

      // Summary row style
      const summaryDetailRowIdx = rangeDetail.e.r
      for (let C = rangeDetail.s.c; C <= rangeDetail.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: summaryDetailRowIdx, c: C })
        if (!wsDetail[cellAddress]) continue
        wsDetail[cellAddress].s = {
          fill: { fgColor: { rgb: "F0F0F0" } },
          font: { bold: true, sz: 11 },
          alignment: {
            horizontal: C === 0 ? "center" : C === 3 ? "right" : "left",
            vertical: "center"
          },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          },
          numFmt: C === 3 ? "#,##0" : undefined
        }
      }

      XLSX.utils.book_append_sheet(workbook, wsDetail, 'Chi tiết đơn hàng')

      // Generate filename
      const startDate = dateRange && dateRange[0] ? dateRange[0].format('DDMMYYYY') : dayjs().format('DDMMYYYY')
      const endDate = dateRange && dateRange[1] ? dateRange[1].format('DDMMYYYY') : dayjs().format('DDMMYYYY')
      const filename = `BaoCaoPhienAn_${startDate}_${endDate}.xlsx`

      // Export
      XLSX.writeFile(workbook, filename, { cellStyles: true })
      message.success(`Xuất Excel thành công: ${filename}`)
    } catch (error) {
      console.error('Export Excel error:', error)
      message.error('Xuất Excel thất bại!')
    }
  }, [filteredSessions, dateRange, message])

  // ==================== HELPER COMPONENTS ====================
  const StatusBadge = ({ status }) => {
    const statusVI = STATUS_MAP.EN_TO_VI[status] || status
    const color = STATUS_COLORS[status] || 'default'
    return <Tag color={color}>{statusVI}</Tag>
  }

  const SessionStatusBadge = ({ status }) => {
    const statusVI = SESSION_STATUS_MAP[status] || status
    const color = SESSION_STATUS_COLORS[status] || 'default'
    return <Tag color={color}>{statusVI}</Tag>
  }

  // ==================== TABLE COLUMNS ====================

  // Columns for main session table (Total: 100%)
  const sessionColumns = [
    {
      title: 'Mã phiên',
      dataIndex: 'sessionCode',
      key: 'sessionCode',
      width: '15%',
      align: 'left',
      render: (code) => <span className="font-semibold text-blue-600">{code}</span>
    },
    {
      title: 'Bàn',
      dataIndex: 'table',
      key: 'table',
      width: '10%',
      align: 'left',
      sorter: (a, b) => (parseInt(a.tableNumber) || 0) - (parseInt(b.tableNumber) || 0),
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'SĐT khách',
      dataIndex: 'phone',
      key: 'phone',
      width: '13%',
      align: 'left'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: '15%',
      align: 'right',
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (text, record) => (
        <div>
          <div className="font-bold" style={{ color: '#226533' }}>{text}</div>
          <div className="text-xs text-gray-500">{record.orderCount} đơn</div>
        </div>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '14%',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (time) => (
        <div className="text-gray-600 text-sm">
          <div>{dayjs(time).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-400">{dayjs(time).format('HH:mm')}</div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'sessionStatus',
      key: 'sessionStatus',
      width: '13%',
      align: 'left',
      render: (status) => <SessionStatusBadge status={status} />
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '20%',
      align: 'center',
      render: (_, session) => {
        // Check if session has orders that need payment
        const hasOrdersToPayment = session.orders.some(
          o => o.status === 'IN_PROGRESS' || o.status === 'DONE'
        )

        return (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined className="text-blue-600" />}
              onClick={() => {
                if (expandedRowKeys.includes(session.key)) {
                  setExpandedRowKeys(expandedRowKeys.filter(k => k !== session.key))
                } else {
                  setExpandedRowKeys([...expandedRowKeys, session.key])
                }
              }}
              title="Xem chi tiết"
            />
            {hasOrdersToPayment && (
              <Button
                type="primary"
                size="small"
                onClick={() => handlePaymentSession(session)}
                style={{ background: '#226533' }}
              >
                Thanh toán
              </Button>
            )}
          </Space>
        )
      }
    }
  ]

  // Columns for expanded order table (Total: 100%)
  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'code',
      key: 'code',
      width: '18%',
      render: (code) => <span className="font-medium text-gray-700 text-sm">{code}</span>
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: '18%',
      align: 'right',
      render: (text) => <span className="font-semibold text-green-700 text-sm">{text}</span>
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '22%',
      render: (time) => <span className="text-sm text-gray-600">{dayjs(time).format('HH:mm DD/MM/YYYY')}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: '17%',
      render: (status) => <StatusBadge status={status} />
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '25%',
      align: 'center',
      render: (_, order) => (
        <Space size="small">
          {/* Chờ xác nhận: Xem chi tiết + Hủy */}
          {order.status === 'NEW' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(order)}
              >
                Xem chi tiết
              </Button>
              <Popconfirm
                title="Hủy đơn hàng"
                description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                onConfirm={() => cancelOrderAPI(order.id, 'Hủy từ danh sách')}
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button danger size="small">
                  Hủy
                </Button>
              </Popconfirm>
            </>
          )}

          {/* Đang phục vụ, Đã thanh toán, Đã hủy: Chỉ xem chi tiết */}
          {(order.status === 'IN_PROGRESS' || order.status === 'PAID' || order.status === 'CANCELLED') && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(order)}
            >
              {/* Xem chi tiết */}
            </Button>
          )}
        </Space>
      )
    }
  ]

  // Expanded row render
  const expandedRowRender = (session) => {
    return (
      <div className="bg-gray-50 py-4 rounded">
        <div className="max-w-[98%] mx-auto">
          <Table
            rowKey="id"
            columns={orderColumns}
            dataSource={session.orders}
            pagination={false}
            size="small"
            bordered
            className="text-sm"
          />
        </div>
      </div>
    )
  }

  // ==================== RENDER DRAWER FOOTER ====================

  const renderDrawerFooter = () => {
    if (!selectedOrder) return null
    const { status, id } = selectedOrder

    if (status === 'CANCELLED' || status === 'PAID') {
      return <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
    }

    if (status === 'NEW') {
      return (
        <Space className='w-full justify-between'>
          <Popconfirm
            title='Hủy đơn hàng'
            description='Bạn có chắc chắn muốn hủy đơn hàng này?'
            onConfirm={() => cancelOrderAPI(id, 'Hủy từ chi tiết đơn hàng')}
            okText='Hủy đơn'
            cancelText='Không'
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Hủy đơn
            </Button>
          </Popconfirm>
          <Space>
            <Button
              type='primary'
              onClick={() => handleConfirmOrder(id)}
            >
              Xác nhận đơn
            </Button>
            <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
          </Space>
        </Space>
      )
    }

    if (status === 'IN_PROGRESS' || status === 'DONE') {
      return (
        <Space>
          <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
        </Space>
      )
    }

    return <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
  }

  // ==================== RENDER ====================
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="orders" />
      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />
        <Content className="mt-16 p-5 bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
          <Spin spinning={loading} tip="Đang tải danh sách phiên...">
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng phiên"
                    value={statistics.totalSessions}
                    prefix={<ShopOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Phiên đang hoạt động"
                    value={statistics.activeSessions}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng đơn hàng"
                    value={statistics.totalOrders}
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Doanh thu"
                    value={statistics.revenue}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#226533' }}
                    suffix="đ"
                  />
                </Card>
              </Col>
            </Row>

            {/* Filter Section */}
            <Card className="mb-4 shadow-sm">
              <Space wrap className="w-full justify-between">
                <Space wrap>
                  <Input
                    placeholder="Tìm mã phiên, SĐT, số bàn..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-64"
                    allowClear
                  />
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="w-40"
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="ALL">Tất cả trạng thái</Option>
                    <Option value="NEW">Chờ xác nhận</Option>
                    <Option value="IN_PROGRESS">Đang phục vụ</Option>
                    <Option value="PAID">Đã thanh toán</Option>
                    <Option value="CANCELLED">Đã hủy</Option>
                  </Select>
                </Space>

                <Space wrap>
                  <Button
                    icon={<Download size={16} />}
                    onClick={handleExportExcel}
                    className="rounded-lg h-8 flex items-center gap-1.5"
                  >
                    Xuất Excel
                  </Button>

                  <CustomDateRangePicker value={dateRange} onChange={setDateRange} />
                </Space>
              </Space>
            </Card>

            {/* Table View - Sessions with Expandable Orders */}
            <ConfigProvider locale={vi_VN}>
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <Table
                  rowKey="key"
                  loading={loading}
                  columns={sessionColumns}
                  dataSource={filteredSessions.slice(
                    (currentPage - 1) * pageSize,
                    currentPage * pageSize
                  )}
                  pagination={false}
                  bordered={false}
                  scroll={{ y: 600 }}
                  size="middle"
                  expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                    onExpand: (expanded, record) => {
                      if (expanded) {
                        setExpandedRowKeys([...expandedRowKeys, record.key])
                      } else {
                        setExpandedRowKeys(expandedRowKeys.filter(k => k !== record.key))
                      }
                    },
                    expandIcon: ({ expanded, onExpand, record }) => (
                      expanded ? (
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined style={{ transform: 'rotate(45deg)' }} />}
                          onClick={e => onExpand(record, e)}
                        />
                      ) : (
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={e => onExpand(record, e)}
                        />
                      )
                    )
                  }}
                  rowClassName={(record, index) =>
                    `transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`
                  }
                  className="modern-table"
                  locale={{
                    emptyText: (
                      <div className="py-12">
                        <div className="text-gray-400 text-6xl mb-4">📋</div>
                        <div className="text-gray-500 font-medium">
                          Không tìm thấy phiên nào
                        </div>
                        <div className="text-gray-400 text-sm mt-2">
                          Thử thay đổi bộ lọc hoặc tìm kiếm khác
                        </div>
                      </div>
                    )
                  }}
                />

                {/* Pagination */}
                {filteredSessions.length > 0 && (
                  <div className="border-t-2 border-gray-200 bg-transparent px-6 py-5">
                    <div className="flex justify-end flex-wrap gap-4">
                      <ConfigProvider locale={vi_VN}>
                        <Pagination
                          current={currentPage}
                          pageSize={pageSize}
                          total={filteredSessions.length}
                          onChange={(page, pageSize) => {
                            setCurrentPage(page)
                            setPageSize(pageSize)
                          }}
                          onShowSizeChange={(current, size) => {
                            setCurrentPage(1)
                            setPageSize(size)
                          }}
                          showSizeChanger
                          showQuickJumper
                          pageSizeOptions={['10', '20', '50', '100']}
                          className="custom-pagination"
                        />
                      </ConfigProvider>
                    </div>
                  </div>
                )}
              </div>
            </ConfigProvider>
          </Spin>

          {/* Drawer Chi tiết đơn hàng */}
          <Drawer
            title={
              <div className='flex items-center justify-between'>
                <span className='text-base font-semibold'>{selectedOrder?.code || ''}</span>
                {selectedOrder && <StatusBadge status={selectedOrder.status} />}
              </div>
            }
            open={!!selectedOrder}
            onClose={() => {
              setSelectedOrder(null)
              setEditingItemId(null)
              setEditingQuantity({})
            }}
            width={640}
            footer={!loadingDetail && renderDrawerFooter()}
          >
            {loadingDetail ? (
              <Spin spinning={true} tip='Đang tải chi tiết đơn hàng...'>
                <div style={{ minHeight: 200 }} />
              </Spin>
            ) : selectedOrder ? (
              <>
                {/* Thông tin tổng quan - Simple Card */}
                <Card size='small' className='mb-3'>
                  <Row gutter={[12, 6]}>
                    <Col xs={12} sm={8}>
                      <div className='text-xs text-gray-500 mb-0.5'>Bàn</div>
                      <div className='font-semibold text-sm'>{selectedOrder.table}</div>
                    </Col>
                    <Col xs={12} sm={8}>
                      <div className='text-xs text-gray-500 mb-0.5'>Số điện thoại</div>
                      <div className='text-sm'>{selectedOrder.phone}</div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div className='text-xs text-gray-500 mb-0.5'>Thời gian</div>
                      <div className='text-sm'>
                        {dayjs(selectedOrder.createdAt).format('HH:mm - DD/MM/YYYY')}
                      </div>
                    </Col>
                  </Row>
                  {selectedOrder.note && (
                    <div className='mt-2 pt-2 border-t border-gray-200'>
                      <div className='text-xs text-gray-500 mb-1'>Ghi chú đơn hàng</div>
                      <div className='text-xs text-orange-600 italic'>{selectedOrder.note}</div>
                    </div>
                  )}
                </Card>

                {/* Danh sách món ăn - Main Content */}
                <div className='mb-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-sm font-semibold text-gray-800 flex items-center'>
                      <ShoppingCartOutlined className='mr-1.5 text-blue-600 text-base' />
                      Danh sách món ({selectedOrder.items.length})
                    </h3>
                  </div>

                  <div className='space-y-2'>
                    {selectedOrder.items.map((item, index) => {
                      const isEditing = editingItemId === item.id
                      const isUpdating = updatingItemId === item.id
                      const canEdit = selectedOrder.status === 'NEW'

                      return (
                        <Card
                          key={item.id || index}
                          size='small'
                          hoverable={!isEditing}
                          className={`border border-gray-200 ${isEditing ? 'border-blue-400 shadow-md' : 'hover:border-blue-300 hover:shadow-sm'} transition-all duration-200`}
                        >
                          <div className='flex gap-2.5'>
                            {/* Image */}
                            <div className='flex-shrink-0'>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className='w-16 h-16 object-cover rounded-md border border-gray-200'
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div
                                className='w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center'
                                style={{ display: item.imageUrl ? 'none' : 'flex' }}
                              >
                                <ShoppingCartOutlined className='text-xl text-gray-400' />
                              </div>
                            </div>

                            {/* Content */}
                            <div className='flex-1 min-w-0'>
                              <div className='flex justify-between items-start mb-1.5'>
                                <h4 className='font-semibold text-gray-800 text-sm leading-tight pr-2'>
                                  {item.name}
                                </h4>
                                <div className='text-right flex-shrink-0'>
                                  <div className='text-red-600 font-bold text-base whitespace-nowrap'>
                                    {((item.price || 0) * (isEditing ? (editingQuantity[item.id] || item.quantity) : item.quantity || 0)).toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                              </div>

                              <div className='flex items-center gap-3 text-xs mb-2'>
                                <div className='flex items-center gap-1'>
                                  <span className='text-gray-500'>SL:</span>
                                  {isEditing ? (
                                    <InputNumber
                                      size='small'
                                      min={0}
                                      max={999}
                                      value={editingQuantity[item.id]}
                                      onChange={(val) => setEditingQuantity({ ...editingQuantity, [item.id]: val })}
                                      className='w-16'
                                      disabled={isUpdating}
                                    />
                                  ) : (
                                    <span className='font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs'>
                                      {item.quantity || 0}
                                    </span>
                                  )}
                                </div>
                                <div className='flex items-center gap-1'>
                                  <span className='text-gray-500'>Đơn giá:</span>
                                  <span className='font-medium text-gray-700'>
                                    {(item.price || 0).toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                              </div>

                              {/* Action buttons - Chỉ hiển thị khi status = NEW */}
                              {canEdit && (
                                <div className='flex gap-1 mt-2'>
                                  {isEditing ? (
                                    <>
                                      <Button
                                        type='primary'
                                        size='small'
                                        icon={<SaveOutlined />}
                                        onClick={() => handleSaveItemQuantity(selectedOrder.id, item)}
                                        loading={isUpdating}
                                        className='text-xs px-2'
                                      >
                                        Lưu
                                      </Button>
                                      <Button
                                        size='small'
                                        onClick={handleCancelEditItem}
                                        disabled={isUpdating}
                                        className='text-xs px-2'
                                      >
                                        Hủy
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        type='link'
                                        size='small'
                                        icon={<EditOutlined />}
                                        onClick={() => handleStartEditItem(item)}
                                        className='text-xs px-2'
                                      >
                                        Sửa SL
                                      </Button>
                                      <Button
                                        danger
                                        type='link'
                                        size='small'
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveItem(selectedOrder.id, item)}
                                        className='text-xs px-2'
                                      >
                                        Xóa
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}

                              {item.note && (
                                <div className='mt-1.5 pt-1.5 border-t border-gray-100'>
                                  <div className='text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1'>
                                    <span className='font-medium'>Ghi chú:</span>
                                    <span>{item.note}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Tổng tiền - Summary Card */}
                <Card className='mb-2'>
                  <div className='space-y-2'>
                    {selectedOrder.point > 0 && (
                      <div className='flex justify-between items-center pb-2 border-b'>
                        <span className='text-xs text-gray-600'>Điểm tích lũy sử dụng</span>
                        <span className='font-semibold text-sm text-orange-600'>
                          -{selectedOrder.point} điểm
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between items-center'>
                      <span className='text-base font-bold'>Tổng thanh toán</span>
                      <span className='text-2xl font-bold' style={{ color: '#226533' }}>
                        {selectedOrder.total}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Meta info - Compact */}
                {selectedOrder.updatedAt && (
                  <div className='mt-2 text-center'>
                    <span className='text-xs text-gray-400'>
                      Cập nhật lần cuối: {dayjs(selectedOrder.updatedAt).format('HH:mm DD/MM/YYYY')}
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  )
}

export default OrderSessionPage
