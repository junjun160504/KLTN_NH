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
  InputNumber,
  Select,
  Tag,
  Drawer,
  message,
  Modal,
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Popconfirm,
  Pagination,
  ConfigProvider
} from 'antd'
import vi_VN from 'antd/lib/locale/vi_VN'
import {
  SearchOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ShopOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import axios from 'axios'

// Extend dayjs với isBetween plugin
dayjs.extend(isBetween)

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

const { Content } = Layout
const { Option } = Select

// ==================== STATUS MAPPING ====================
// Backend database statuses: NEW, IN_PROGRESS, DONE, PAID, CANCELLED
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
  DONE: 'green',
  PAID: 'purple',
  CANCELLED: 'red'
}

// Icons are defined inline where needed to keep design explicit

function OrderPage() {
  const [modal, contextHolder] = Modal.useModal()

  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Đơn hàng')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchText, setSearchText] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalThanhToan, setModalThanhToan] = useState({ open: false, order: null })

  // Custom date range for filtering - Default to today (00:00:00 - 23:59:59)
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Edit item states
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingQuantity, setEditingQuantity] = useState({})
  const [updatingItemId, setUpdatingItemId] = useState(null)

  // ==================== POLLING HOOK ====================
  // Use polling hook for real-time order updates (replaces manual fetchOrders)
  const { orders: pollingOrders, loading, refresh: refreshOrders } = useOrdersPolling(5000, true)

  // Transform polling data to UI format with useMemo
  const orders = useMemo(() => {
    return pollingOrders.map((order) => ({
      key: order.id.toString(),
      id: order.id,
      code: `#PN${String(order.id).padStart(5, '0')}`,
      table: order.table_number ? `Bàn ${order.table_number}` : 'N/A',
      tableNumber: order.table_number,
      phone: order.customer_phone || '-',
      point: order.loyalty_points_used || 0,
      totalAmount: Number(order.total_amount) || 0, // Ensure it's a number
      total: `${Number(order.total_amount || 0).toLocaleString('vi-VN')}đ`,
      status: order.status,
      statusVI: STATUS_MAP.EN_TO_VI[order.status] || order.status,
      createdAt: order.created_at || dayjs().toISOString(),
      items: order.items || [],
      note: order.note || order.notes || '',
      rawData: order
    }))
  }, [pollingOrders])

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

  // Print kitchen bill using iframe (same as Tables.js)
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
  }, [getKitchenBillHTML])

  const updateOrderStatusAPI = useCallback(async (orderId, newStatus) => {
    try {
      // Lấy adminId từ localStorage khi thanh toán
      let adminId = null
      if (newStatus === 'PAID') {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : null
        adminId = user?.id || null
      }

      const response = await axios.put(
        `${REACT_APP_API_URL}/orders/${orderId}/status`,
        { status: newStatus, adminId: adminId }
      )

      if (response.data.status === 200) {
        message.success('Cập nhật trạng thái thành công!')
        refreshOrders()
        return true
      }
    } catch (error) {
      console.error('[Orders] Update status error:', error)
      message.error('Không thể cập nhật trạng thái đơn hàng')
      return false
    }
  }, [refreshOrders])

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
          code: `#PN${String(order.id).padStart(5, '0')}`,
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
            id: item.order_item_id || item.id, // Đảm bảo có id
            order_item_id: item.order_item_id || item.id, // Giữ lại order_item_id
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
  }, [])

  // Hủy đơn hàng
  const cancelOrderAPI = useCallback(async (orderId, reason = '') => {
    try {
      const response = await axios.put(
        `${REACT_APP_API_URL}/orders/${orderId}/cancel`,
        { reason }
      )

      if (response.data.status === 200) {
        message.success('Hủy đơn hàng thành công!')
        refreshOrders()
        // Refresh detail nếu đang xem
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null)
        }
        return true
      }
    } catch (error) {
      console.error('[Orders] Cancel order error:', error)
      const errorMsg = error.response?.data?.message || 'Không thể hủy đơn hàng'
      message.error(errorMsg)
      return false
    }
  }, [refreshOrders, selectedOrder])

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
  }, [fetchOrderDetails, refreshOrders])

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
  }, [fetchOrderDetails, refreshOrders])

  // No need for useEffect - polling hook handles it automatically

  // Reset về trang 1 khi thay đổi filters
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, dateRange, searchText])

  // ==================== COMPUTED VALUES (useMemo) ====================

  const filteredOrders = useMemo(() => {
    console.log('=== FILTER DEBUG ===');
    console.log('dateRange:', dateRange);
    if (dateRange && dateRange.length === 2) {
      console.log('Start:', dateRange[0].format('DD/MM/YYYY HH:mm:ss'));
      console.log('End:', dateRange[1].format('DD/MM/YYYY HH:mm:ss'));
    }
    console.log('filterStatus:', filterStatus);
    console.log('orders count:', orders.length);

    return orders.filter((o) => {
      const statusMatch = filterStatus === 'ALL' ? true : o.status === filterStatus

      // Date range filter logic with time precision
      let timeMatch = true
      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange
        const created = dayjs(o.createdAt)
        timeMatch = created.isBetween(start, end, null, '[]') // inclusive both sides

        if (o.code === orders[0]?.code) { // Log first order for debugging
          console.log('---');
          console.log('Sample order:', o.code);
          console.log('Created:', created.format('DD/MM/YYYY HH:mm:ss'));
          console.log('Start:', start.format('DD/MM/YYYY HH:mm:ss'));
          console.log('End:', end.format('DD/MM/YYYY HH:mm:ss'));
          console.log('Match:', timeMatch);
          console.log('---');
        }
      }

      const search = searchText.trim().toLowerCase()
      const searchMatch =
        !search ||
        o.code.toLowerCase().includes(search) ||
        o.phone.toLowerCase().includes(search) ||
        o.table.toLowerCase().includes(search) ||
        (o.tableNumber && o.tableNumber.toString().includes(search))

      return statusMatch && timeMatch && searchMatch
    })
  }, [orders, filterStatus, dateRange, searchText])

  const statistics = useMemo(() => {
    const totalOrders = orders.length
    const newOrders = orders.filter(o => o.status === 'NEW').length
    const processingOrders = orders.filter(o => o.status === 'IN_PROGRESS').length
    const completedOrders = orders.filter(o => o.status === 'PAID').length
    const revenue = orders
      .filter(o => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0)

    return {
      totalOrders,
      newOrders,
      processingOrders,
      completedOrders,
      revenue
    }
  }, [orders])

  // ==================== HELPER COMPONENTS ====================

  const StatusBadge = ({ status }) => {
    const statusVI = STATUS_MAP.EN_TO_VI[status] || status
    const color = STATUS_COLORS[status] || 'default'
    return (
      <Tag color={color}>
        {statusVI}
      </Tag>
    )
  }

  // ==================== TABLE COLUMNS ====================

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'code',
      key: 'code',
      width: '11%',
      align: 'left',
      sorter: (a, b) => (a.code || '').localeCompare(b.code || '', 'vi'),
      render: (code) => <span className='font-semibold text-blue-600'>{code}</span>
    },
    {
      title: 'Bàn',
      dataIndex: 'table',
      key: 'table',
      width: '10%',
      align: 'left',
      sorter: (a, b) => (parseInt(a.tableNumber) || 0) - (parseInt(b.tableNumber) || 0),
      render: (text) => <span className='font-medium'>{text}</span>
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      align: 'left',
      width: '12%'
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'point',
      key: 'point',
      width: '14%',
      align: 'center',
      render: (point) => (
        <span className='text-orange-600 font-medium'>{point} điểm</span>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: '12%',
      align: 'center',
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (text) => (
        <span className='font-bold' style={{ color: '#226533' }}>
          {text}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: '14%',
      align: 'left',
      render: (status) => <StatusBadge status={status} />
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '12%',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (time) => (
        <div className='text-gray-600 text-sm'>
          <div>{dayjs(time).format('DD/MM/YYYY')}</div>
          <div className='text-xs text-gray-400'>{dayjs(time).format('HH:mm')}</div>
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '14%',
      align: 'center',
      render: (_, record) => (
        <Space size='small' wrap>
          <Button
            type='text'
            size='small'
            icon={<EyeOutlined className='text-blue-600' />}
            onClick={() => handleViewDetails(record.id)}
            title="Chi tiết"
          />
          {record.status === 'NEW' && (
            <Popconfirm
              title='Hủy đơn hàng'
              description='Bạn có chắc chắn muốn hủy đơn hàng này?'
              onConfirm={() => cancelOrderAPI(record.id, 'Hủy từ danh sách đơn hàng')}
              okText='Hủy đơn'
              cancelText='Không'
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                type='text'
                size='small'
                icon={<CloseCircleOutlined />}
                title="Hủy"
              />
            </Popconfirm>
          )}
          {(record.status === 'IN_PROGRESS' || record.status === 'DONE') && (
            <Button
              type='primary'
              size='small'
              onClick={() => handlePaymentConfirm(record)}
              style={{ background: '#226533' }}
            >
              Thanh toán
            </Button>
          )}
        </Space>
      )
    }
  ]

  // ==================== EVENT HANDLERS ====================

  // Xem chi tiết đơn hàng
  const handleViewDetails = useCallback(async (orderId) => {
    await fetchOrderDetails(orderId)
  }, [fetchOrderDetails])

  const handleUpdateStatus = useCallback(async (orderId, newStatus) => {
    // Lấy thông tin đơn hàng trước khi update
    let orderToPrint = null
    if (newStatus === 'IN_PROGRESS') {
      // Tìm order từ danh sách hoặc selectedOrder
      orderToPrint = selectedOrder?.id === orderId
        ? selectedOrder
        : orders.find(o => o.id === orderId)
    }

    const success = await updateOrderStatusAPI(orderId, newStatus)
    if (success) {
      // Nếu xác nhận đơn (NEW → IN_PROGRESS), in bill báo bếp
      if (newStatus === 'IN_PROGRESS' && orderToPrint) {
        printKitchenBill(orderToPrint, orderToPrint.items)
      }

      // Refresh detail view nếu đang mở
      if (selectedOrder && selectedOrder.id === orderId) {
        await fetchOrderDetails(orderId)
      }
    }
  }, [updateOrderStatusAPI, selectedOrder, fetchOrderDetails, orders, printKitchenBill])

  const handlePaymentConfirm = useCallback((order) => {
    modal.confirm({
      title: 'Xác nhận thanh toán',
      content: `Xác nhận thanh toán cho đơn hàng ${order.code}?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        await handleUpdateStatus(order.id, 'PAID')
        setModalThanhToan({ open: false, order: null })
      }
    })
  }, [handleUpdateStatus, modal])

  // Hủy đơn hàng
  const handleCancelOrder = useCallback((order) => {
    modal.confirm({
      title: 'Xác nhận hủy đơn hàng',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.code}</strong>?</p>
          <p className='text-red-600 text-sm mt-2'>Lưu ý: Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận"</p>
        </div>
      ),
      okText: 'Xác nhận hủy',
      cancelText: 'Không',
      okButtonProps: { danger: true },
      onOk: async () => {
        await cancelOrderAPI(order.id, 'Hủy bởi quản trị viên')
      }
    })
  }, [cancelOrderAPI, modal])

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
      message.error('Số lượng không được âm')
      return
    }

    if (newQuantity === 0) {
      // Xóa món nếu số lượng = 0
      modal.confirm({
        title: 'Xác nhận xóa món',
        content: `Số lượng = 0 sẽ xóa món "${item.name}" khỏi đơn hàng. Bạn có chắc chắn?`,
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
  }, [editingQuantity, updateItemQuantityAPI, removeItemAPI, modal])

  // Hủy edit
  const handleCancelEditItem = useCallback(() => {
    setEditingItemId(null)
    setEditingQuantity({})
  }, [])

  // Xóa món khỏi đơn
  const handleRemoveItem = useCallback((orderId, item) => {
    console.log('=== handleRemoveItem called ===')
    console.log('orderId:', orderId)
    console.log('item:', item)
    console.log('item.id:', item.id)
    console.log('item.order_item_id:', item.order_item_id)

    // Lấy đúng ID của order item
    const orderItemId = item.order_item_id || item.id

    if (!orderItemId) {
      console.error('Missing order item ID!')
      message.error('Không tìm thấy ID món ăn')
      return
    }

    modal.confirm({
      title: 'Xác nhận xóa món',
      content: `Bạn có chắc chắn muốn xóa "${item.name}" khỏi đơn hàng?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        console.log('Confirmed delete, calling API with orderItemId:', orderItemId)
        await removeItemAPI(orderId, orderItemId)
      },
      onCancel: () => {
        console.log('Delete cancelled')
      }
    })
  }, [removeItemAPI, modal])

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
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleCancelOrder(selectedOrder)}
          >
            Hủy đơn
          </Button>
          <Space>
            <Button
              type='primary'
              onClick={() => handleUpdateStatus(id, 'IN_PROGRESS')}
            >
              Xác nhận đơn
            </Button>
            <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
          </Space>
        </Space>
      )
    }

    if (status === 'IN_PROGRESS') {
      return (
        <Space>
          <Button
            type='primary'
            onClick={() => handleUpdateStatus(id, 'DONE')}
          >
            Hoàn tất món
          </Button>
          <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
        </Space>
      )
    }

    if (status === 'DONE') {
      return (
        <Space>
          <Button
            type='primary'
            onClick={() => handlePaymentConfirm(selectedOrder)}
          >
            Thanh toán
          </Button>
          <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
        </Space>
      )
    }

    return <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
  }

  // ==================== RENDER ====================

  return (
    <>
      {contextHolder}
      <Layout style={{ minHeight: '100vh' }}>
        <AppSidebar collapsed={collapsed} currentPageKey='orders' />
        <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
          <AppHeader
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            pageTitle={pageTitle}
          />
          <Content className='mt-16 p-5 bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto'>
            <Spin spinning={loading} tip='Đang tải danh sách đơn hàng...'>

              {/* Statistics Cards */}
              <Row gutter={[16, 16]} className='mb-6'>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title='Tổng đơn hàng'
                      value={statistics.totalOrders}
                      prefix={<ShopOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title='Chờ xác nhận'
                      value={statistics.newOrders}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title='Đang phục vụ'
                      value={statistics.processingOrders}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title='Doanh thu'
                      value={statistics.revenue}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#226533' }}
                      suffix='đ'
                    />
                  </Card>
                </Col>
              </Row>

              {/* Filter Section */}
              <Card className='mb-4 shadow-sm'>
                <Space wrap className='w-full justify-between'>
                  <Space wrap>
                    <Input
                      placeholder='Tìm mã đơn, SĐT, số bàn...'
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className='w-64'
                      allowClear
                    />
                    <Select
                      value={filterStatus}
                      onChange={setFilterStatus}
                      className='w-40'
                      suffixIcon={<FilterOutlined />}
                    >
                      <Option value='ALL'>Tất cả trạng thái</Option>
                      <Option value='NEW'>Chờ xác nhận</Option>
                      <Option value='IN_PROGRESS'>Đang phục vụ</Option>

                      <Option value='PAID'>Đã thanh toán</Option>
                      <Option value='CANCELLED'>Đã hủy</Option>
                    </Select>
                  </Space>

                  {/* Custom date range picker - Positioned at far right */}
                  <CustomDateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </Space>
              </Card>

              {/* Table View - Simple Order List */}
              <ConfigProvider locale={vi_VN}>
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                  <Table
                    key={`table-${filterStatus}-${dateRange?.[0]?.format('YYYYMMDD') || ''}-${dateRange?.[1]?.format('YYYYMMDD') || ''}-${searchText}-${currentPage}`}
                    rowKey='id'
                    loading={loading}
                    columns={columns}
                    dataSource={filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    pagination={false}
                    bordered={false}
                    scroll={{ y: 600 }}
                    size="middle"
                    tableLayout="fixed"
                    rowClassName={(record, index) =>
                      `transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                    }
                    className="modern-table"
                    locale={{
                      emptyText: (
                        <div className="py-12">
                          <div className="text-gray-400 text-6xl mb-4">📋</div>
                          <div className="text-gray-500 font-medium">Không tìm thấy đơn hàng nào</div>
                          <div className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm khác</div>
                        </div>
                      )
                    }}
                  />

                  {/* Pagination tách riêng với đường line phân cách */}
                  {filteredOrders.length > 0 && (
                    <div className="border-t-2 border-gray-200 bg-transparent px-6 py-5">
                      <div className="flex justify-end flex-wrap gap-4">
                        {/* Pagination Component */}
                        <ConfigProvider locale={vi_VN}>
                          <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredOrders.length}
                            onChange={(page, pageSize) => {
                              setCurrentPage(page);
                              setPageSize(pageSize);
                            }}
                            onShowSizeChange={(current, size) => {
                              setCurrentPage(1);
                              setPageSize(size);
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
              onClose={() => setSelectedOrder(null)}
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

            {/* Modal Thanh toán */}
            <Modal
              title='Xác nhận thanh toán'
              open={modalThanhToan.open}
              onCancel={() => setModalThanhToan({ open: false, order: null })}
              footer={null}
            >
              {modalThanhToan.order && (
                <div>
                  <p className='text-lg mb-4'>
                    Xác nhận thanh toán cho đơn hàng <strong>{modalThanhToan.order.code}</strong>?
                  </p>
                  <div className='bg-gray-50 p-4 rounded mb-4'>
                    <div className='flex justify-between mb-2'>
                      <span>Bàn:</span>
                      <strong>{modalThanhToan.order.table}</strong>
                    </div>
                    <div className='flex justify-between mb-2'>
                      <span>Tổng tiền:</span>
                      <strong className='text-red-600 text-xl'>{modalThanhToan.order.total}</strong>
                    </div>
                  </div>
                  <Space className='w-full justify-end'>
                    <Button onClick={() => setModalThanhToan({ open: false, order: null })}>
                      Hủy
                    </Button>
                    <Button
                      type='primary'
                      onClick={() => handlePaymentConfirm(modalThanhToan.order)}
                    >
                      Xác nhận thanh toán
                    </Button>
                  </Space>
                </div>
              )}
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </>
  )
}

export default OrderPage
