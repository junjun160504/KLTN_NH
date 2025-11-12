import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import CustomDateRangePicker from '../../../components/CustomDateRangePicker'
import OrderList from '../../../components/management/OrderList'
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
  Typography
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
  CloseOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import axios from 'axios'

// Extend dayjs với isBetween plugin
dayjs.extend(isBetween)

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

const { Content } = Layout
const { Option } = Select
const { Text, Title } = Typography

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
  IN_PROGRESS: 'blue',
  PAID: 'purple',
  CANCELLED: 'red'
}

const SESSION_STATUS_MAP = {
  ACTIVE: 'Hoạt động',
  ENDED: 'Kết thúc'
}

const SESSION_STATUS_COLORS = {
  ACTIVE: 'green',
  ENDED: 'default'
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
  const [orderPanelOpen, setOrderPanelOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingNotes, setEditingNotes] = useState({})

  // ==================== POLLING HOOK ====================
  const { orders: pollingOrders, loading, refresh: refreshOrders } = useOrdersPolling(5000, true)

  // ==================== GROUP ORDERS BY SESSION ====================
  const sessions = useMemo(() => {
    // Group orders by qr_session_id
    const sessionMap = new Map()

    pollingOrders.forEach((order) => {
      const sessionId = order.qr_session_id || `no-session-${order.id}`
      // Format: #S0123 (pad to 4 digits)
      const sessionKey = sessionId.toString().startsWith('no-session-')
        ? `#S${String(order.id).padStart(4, '0')}`
        : `#S${String(sessionId).padStart(4, '0')}`

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          key: sessionKey,
          sessionId: sessionId,
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
        rawData: order
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

      // Date range filter
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
    const totalSessions = sessions.length
    const activeSessions = sessions.filter(s => s.sessionStatus === 'ACTIVE').length
    const totalOrders = pollingOrders.length
    const revenue = pollingOrders
      .filter(o => o.status === 'PAID')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

    return {
      totalSessions,
      activeSessions,
      totalOrders,
      revenue
    }
  }, [sessions, pollingOrders])

  // ==================== API FUNCTIONS ====================
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

  const handleViewDetail = useCallback((order) => {
    setSelectedOrder(order.rawData)
    setOrderPanelOpen(true)
    setEditingNotes({})
  }, [])

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

          // End session if all orders are paid/cancelled
          if (session.sessionStatus === 'ACTIVE') {
            try {
              await axios.put(`${REACT_APP_API_URL}/qr-sessions/${session.sessionId}/end`)
              message.success('Phiên đã kết thúc!')
            } catch (error) {
              console.error('[Sessions] End session error:', error)
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
  const handleIncreaseQuantity = async (orderItemId) => {
    message.info('Chức năng chỉnh sửa món ăn chỉ khả dụng trong trang Quản lý bàn')
  }

  const handleDecreaseQuantity = async (orderItemId) => {
    message.info('Chức năng chỉnh sửa món ăn chỉ khả dụng trong trang Quản lý bàn')
  }

  const handleRemoveItem = async (orderItemId) => {
    message.info('Chức năng xóa món ăn chỉ khả dụng trong trang Quản lý bàn')
  }

  const handleSaveNote = async (orderItemId, item) => {
    message.info('Chức năng ghi chú chỉ khả dụng trong trang Quản lý bàn')
  }

  const handleConfirmOrder = async (orderId) => {
    try {
      await axios.put(`${REACT_APP_API_URL}/staff/orders/${orderId}/confirm`)
      message.success('Đã xác nhận đơn hàng!')
      refreshOrders()
    } catch (err) {
      console.error('Failed to confirm order:', err)
      message.error('Xác nhận đơn hàng thất bại!')
    }
  }

  const handleCancelSingleOrder = async (orderId) => {
    modal.confirm({
      title: 'Xác nhận hủy đơn hàng',
      content: `Bạn có chắc chắn muốn hủy đơn hàng này?`,
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          await axios.put(`${REACT_APP_API_URL}/orders/${orderId}/cancel`, {
            reason: 'Admin hủy đơn từ quản lý phiên'
          })
          message.success('Đã hủy đơn hàng thành công!')
          refreshOrders()
        } catch (err) {
          console.error('Failed to cancel order:', err)
          message.error('Hủy đơn hàng thất bại!')
        }
      }
    })
  }

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date?.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get order status tag
  const getOrderStatusTag = (status) => {
    const statusMap = {
      NEW: { text: 'Chờ xác nhận', color: 'blue' },
      IN_PROGRESS: { text: 'Đang phục vụ', color: 'orange' },
      PAID: { text: 'Đã thanh toán', color: 'purple' },
      CANCELLED: { text: 'Đã hủy', color: 'red' }
    }
    const config = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // Reset về trang 1 khi thay đổi filters
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, dateRange, searchText])

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
              Xem chi tiết
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

  // ==================== ORDER PANEL COMPONENT ====================
  const OrderPanel = () => {
    if (!selectedOrder) return null

    // Format order as array for OrderList component
    const orders = [selectedOrder]

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
                  Đơn hàng {selectedOrder.code || `ORD-${String(selectedOrder.id).padStart(4, '0')}`}
                </Title>
                <Tag color={STATUS_COLORS[selectedOrder.status]}>
                  {STATUS_MAP.EN_TO_VI[selectedOrder.status] || selectedOrder.status}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Bàn {selectedOrder.table_number} • {selectedOrder.items?.length || 0} món
              </Text>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => {
                setOrderPanelOpen(false)
                setSelectedOrder(null)
                setEditingNotes({})
              }}
            />
          </div>
        </div>

        {/* Order Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <OrderList
            orders={orders}
            editingNotes={editingNotes}
            setEditingNotes={setEditingNotes}
            handleIncreaseQuantity={handleIncreaseQuantity}
            handleDecreaseQuantity={handleDecreaseQuantity}
            handleRemoveItem={handleRemoveItem}
            handleSaveNote={handleSaveNote}
            handleConfirmOrder={handleConfirmOrder}
            handleCancelSingleOrder={handleCancelSingleOrder}
            getOrderStatusTag={getOrderStatusTag}
            formatDate={formatDate}
          />
        </div>
      </div>
    )
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

                <CustomDateRangePicker value={dateRange} onChange={setDateRange} />
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

          {/* Order Detail Panel */}
          <Drawer
            title={null}
            placement="right"
            width={480}
            open={orderPanelOpen}
            onClose={() => {
              setOrderPanelOpen(false)
              setSelectedOrder(null)
              setEditingNotes({})
            }}
            closable={false}
            mask={true}
            maskClosable={true}
            bodyStyle={{ padding: 0, height: '100%', backgroundColor: '#fff' }}
            styles={{
              body: {
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: '#fff'
              }
            }}
          >
            <OrderPanel />
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  )
}

export default OrderSessionPage
