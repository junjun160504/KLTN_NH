import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import {
  Layout,
  Button,
  Space,
  Typography,
  Input,
  Tag,
  Drawer,
  Form,
  Select,
  Badge,
  Card,
  Divider,
  Empty,
  Dropdown,
  Modal,
  Menu,
  Row,
  Col,
  App,
} from 'antd'
import {
  PlusOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  MoreOutlined,
  BellOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import { useTablesPolling } from '../../../hooks/useTablesPolling'
import OrderList from '../../../components/management/OrderList'
import { Switch } from 'antd'
import { useAuth } from '../../../contexts/AuthContext'
import { printInvoice } from '../../../components/InvoicePrinter'
import { getImageUrl } from '../../../utils/imageUrlHelper'

const { Content } = Layout
const { Text, Title } = Typography
const { Option } = Select

const REACT_APP_API_URL = process.env.REACT_APP_API_URL

// CSS để ẩn scrollbar
const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .compact-menu .ant-menu-item {
    height: 20px !important;
    line-height: 20px !important;
    padding: 0 16px !important;
    margin: 0 !important;
    font-size: 13px !important;
  }
  .compact-menu .ant-menu-item-selected {
    height: 20px !important;
    line-height: 20px !important;
  }
  
  /* Skeleton loading for menu items */
  .skeleton-card {
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  
  .skeleton-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    animation: skeleton-loading 1.5s infinite;
  }
  
  @keyframes skeleton-loading {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
  
  .skeleton-image {
    width: 100%;
    height: 160px;
    background: #e0e0e0;
  }
  
  .skeleton-text {
    height: 14px;
    background: #e0e0e0;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  
  .skeleton-text-short {
    height: 13px;
    background: #e0e0e0;
    border-radius: 4px;
    width: 60%;
  }
  
  /* Fade transition for menu items */
  .menu-items-container {
    transition: opacity 0.3s ease-in-out;
  }
  
  .menu-items-loading {
    opacity: 0;
  }
  
  .menu-items-loaded {
    opacity: 1;
  }
`

const TablesPage = () => {
  // Use useModal hook for Modal.confirm
  const [modal, contextHolder] = Modal.useModal()
  const { message } = App.useApp() // Use App hook for message
  const { user, canAccess } = useAuth() // Get current logged-in admin
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Quản lý bàn')

  // Use polling hook for tables and orders
  const {
    tables: pollingTables,
    allTablesOrders: pollingAllTablesOrders,
    loading: pollingLoading,
    refresh: refreshTables,
    updateSingleTableOrders
  } = useTablesPolling(5000, true)

  // Transform polling data
  const tables = useMemo(() => pollingTables, [pollingTables])
  const allTablesOrders = useMemo(() => pollingAllTablesOrders, [pollingAllTablesOrders])
  const loading = pollingLoading

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addForm] = Form.useForm()

  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [editingTable, setEditingTable] = useState(null)
  const [regeneratingQR, setRegeneratingQR] = useState(false)
  const [newQRUrl, setNewQRUrl] = useState(null)

  // Order panel state
  const [orderPanelOpen, setOrderPanelOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [currentOrderItems, setCurrentOrderItems] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // 🎯 State để lưu lựa chọn của customer về việc dùng điểm (từ URL params)
  const [customerWantsUsePoints, setCustomerWantsUsePoints] = useState(false)

  // Note editing state - track which notes have been modified
  const [editingNotes, setEditingNotes] = useState({})

  // Menu selection state
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  // Print invoice state
  const [shouldPrintInvoice, setShouldPrintInvoice] = useState(true)

  // ================= API =================
  // No need for fetchTables - polling hook handles it automatically

  async function handleDeleteTable(id) {
    try {
      await axios.delete(`${REACT_APP_API_URL}/tables/${id}`)
      message.success({
        content: 'Xóa bàn thành công!',
        duration: 2,
      })
      refreshTables()
    } catch (err) {
      console.error("API DELETE error:", err);
      const errorMsg = err.response?.data?.message || "Xóa bàn thất bại!";
      message.error({
        content: `${errorMsg}`,
        duration: 3,
      });
    }
  }

  // Thêm bàn mới
  const handleAddTable = async () => {
    try {
      const values = await addForm.validateFields();
      await axios.post(`${REACT_APP_API_URL}/tables`, {
        table_number: values.table_number,
      });
      message.success({
        content: 'Thêm bàn mới thành công! QR code đã được tạo tự động.',
        duration: 3,
      })
      setDrawerOpen(false)
      addForm.resetFields()
      refreshTables()
    } catch (err) {
      if (err?.errorFields) return
      const errorMsg = err.response?.data?.message || 'Thêm bàn mới thất bại!'
      message.error({
        content: `${errorMsg}`,
        duration: 3,
      });
    }
  };

  // Mở popup chỉnh sửa
  const openEditDrawer = (table, e) => {
    if (e) e.stopPropagation() // Prevent table card click
    setEditingTable(table)
    setNewQRUrl(null)
    editForm.setFieldsValue({
      table_number: table.table_number,
      is_active: table.is_active
    })
    setEditDrawerOpen(true)
  }

  // Tạo lại QR Code
  const handleRegenerateQR = async () => {
    try {
      setRegeneratingQR(true)

      const response = await axios.put(`${REACT_APP_API_URL}/tables/${editingTable.id}`, {
        table_number: editingTable.table_number,
        is_active: editingTable.is_active,
        regenerate_qr: true
      })

      // Update new QR URL from response
      if (response.data?.data?.qr_code_url) {
        setNewQRUrl(response.data.data.qr_code_url)
        message.success({
          content: 'Tạo lại QR Code thành công!',
          duration: 3,
        })

        // Update editingTable with new QR
        setEditingTable({
          ...editingTable,
          qr_code_url: response.data.data.qr_code_url
        })

        // Refresh tables list
        refreshTables()
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Tạo lại QR Code thất bại!'
      message.error({
        content: `❌ ${errorMsg}`,
        duration: 3,
      })
    } finally {
      setRegeneratingQR(false)
    }
  }

  // Sửa bàn
  const handleEditTable = async () => {
    try {
      const values = await editForm.validateFields()

      // Prepare update data (without regenerate_qr, use button instead)
      const updateData = {
        table_number: values.table_number,
        is_active: values.is_active,
      }

      await axios.put(`${REACT_APP_API_URL}/tables/${editingTable.id}`, updateData)

      message.success({
        content: 'Cập nhật bàn thành công!',
        duration: 2,
      })

      setEditDrawerOpen(false)
      editForm.resetFields()
      setNewQRUrl(null)
      refreshTables()
    } catch (err) {
      if (err?.errorFields) return
      const errorMsg = err.response?.data?.message || 'Cập nhật bàn thất bại!'
      message.error({
        content: `❌ ${errorMsg}`,
        duration: 3,
      })
    }
  }

  // ================= Menu Selection APIs =================
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${REACT_APP_API_URL}/menu/cus/menus/categories`)
      setCategories(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      message.error('Không tải được danh mục món ăn')
    }
  }

  const fetchMenuItems = async (categoryId = null) => {
    try {
      setLoadingMenu(true)

      let url = `${REACT_APP_API_URL}/menu/cus/menus/all`
      if (categoryId) {
        url = `${REACT_APP_API_URL}/menu/cus/menus/category/${categoryId}`
      }
      const res = await axios.get(url)

      // Simulate minimum loading time for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300))

      setMenuItems(res.data.data || [])
      setLoadingMenu(false)
    } catch (err) {
      console.error('Failed to fetch menu items:', err)
      message.error('Không tải được danh sách món ăn')
      setLoadingMenu(false)
    }
  }

  // Helper function to handle category change with duplicate check
  const handleCategoryChange = (categoryId) => {
    // Only fetch if category actually changed
    if (categoryId === selectedCategory) {
      return
    }

    setSelectedCategory(categoryId)
    fetchMenuItems(categoryId === 'all' ? null : categoryId)
  }

  // Helper function to compare order items (wrapped in useCallback)
  const areOrderItemsEqual = useCallback((oldItems, newItems) => {
    if (oldItems.length !== newItems.length) return false

    // Sort by order_item_id for consistent comparison
    const sortedOld = [...oldItems].sort((a, b) => (a.order_item_id || 0) - (b.order_item_id || 0))
    const sortedNew = [...newItems].sort((a, b) => (a.order_item_id || 0) - (b.order_item_id || 0))

    // Compare each item
    return sortedOld.every((oldItem, index) => {
      const newItem = sortedNew[index]
      return (
        oldItem.order_item_id === newItem.order_item_id &&
        oldItem.quantity === newItem.quantity &&
        oldItem.order_status === newItem.order_status
      )
    })
  }, [])

  // ================= Fetch Orders by Table =================
  const fetchOrdersByTable = useCallback(async (tableId, forceUpdate = false) => {
    try {
      setLoadingOrders(true)
      const response = await axios.get(`${REACT_APP_API_URL}/orders/table/${tableId}`)

      if (response.data && response.data.data) {
        // Backend đã filter orders của ACTIVE session, không cần filter thêm ở đây
        const orders = response.data.data

        // Nếu có orders, load items của order đầu tiên (hoặc combine tất cả items)
        let newItems = []
        if (orders.length > 0) {
          // Combine tất cả items từ các orders
          newItems = orders.flatMap(order =>
            (order.items || []).map(item => ({
              id: item.menu_item_id || item.id, // menu_item_id để hiển thị
              order_item_id: item.id, // order_item.id để update/delete
              name: item.name || item.menu_item_name,
              quantity: item.quantity,
              price: item.unit_price,
              image: item.image_url || item.image || 'https://via.placeholder.com/70',
              note: item.note || '',
              order_id: order.id,
              order_status: order.status
            }))
          )
        }

        // So sánh với data cũ để quyết định có cần update UI không
        const hasChanges = forceUpdate || !areOrderItemsEqual(currentOrderItems, newItems)

        if (hasChanges) {
          setCurrentOrderItems(newItems)
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      message.error('Không thể tải thông tin đơn hàng')
      setCurrentOrderItems([])
    } finally {
      setLoadingOrders(false)
    }
  }, [currentOrderItems, areOrderItemsEqual, message])


  // ================= Table Card Actions =================
  const handleTableClick = (table) => {
    setSelectedTable(table)
    setOrderPanelOpen(true)
    setEditingNotes({}) // Clear editing notes when switching tables
    // Luôn fetch orders từ API mỗi khi click vào table
    // API sẽ trả về data mới nhất, logic bên trong sẽ so sánh và chỉ update UI nếu có thay đổi
    fetchOrdersByTable(table.id)
  }

  const handlePrintQR = (table, e) => {
    if (e) e.stopPropagation()

    if (!table.qr_code_url) {
      message.error('Bàn này chưa có mã QR!')
      return
    }

    const qrImageUrl = getQRImageUrl(table.qr_code_url)

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
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In QR - Bàn ${table.table_number}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px 20px;
            }
            h1 {
              font-size: 32px;
              margin: 0 0 10px 0;
              color: #333;
            }
            img {
              width: 300px;
              height: 300px;
              border: 2px solid #ddd;
              border-radius: 8px;
              margin: 20px 0;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            .table-info {
              font-size: 28px;
              font-weight: bold;
              color: #1890ff;
              margin: 15px 0;
            }
            p {
              font-size: 16px;
              color: #666;
              margin: 10px 0 0 0;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="table-info">Bàn ${table.table_number}</div>
            <img src="${qrImageUrl}" alt="QR Code Bàn ${table.table_number}" />
            <p>Quét mã QR để xem thực đơn và đặt món</p>
          </div>
        </body>
      </html>
    `)
    iframeDoc.close()

    // Đợi ảnh load xong rồi trigger print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()

        // Xóa iframe sau khi in (hoặc cancel)
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 500)
    }
  }

  // In tất cả QR code của các bàn
  const handlePrintAllQR = () => {
    const tablesWithQR = tables.filter(table => table.qr_code_url)

    if (tablesWithQR.length === 0) {
      message.error('Không có bàn nào có mã QR!')
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

    // Generate HTML cho tất cả QR
    const qrPages = tablesWithQR.map((table) => {
      const qrImageUrl = getQRImageUrl(table.qr_code_url)
      return `
        <div class="qr-container">
          <h1>🍽️ Nhà hàng</h1>
          <div class="table-info">Bàn ${table.table_number}</div>
          <img src="${qrImageUrl}" alt="QR Code Bàn ${table.table_number}" />
          <p>Quét mã QR để xem thực đơn và đặt món</p>
        </div>
      `
    }).join('')

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In tất cả QR Code</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px 20px;
              page-break-after: always;
            }
            .qr-container:last-child {
              page-break-after: auto;
            }
            h1 {
              font-size: 32px;
              margin: 0 0 10px 0;
              color: #333;
            }
            img {
              width: 300px;
              height: 300px;
              border: 2px solid #ddd;
              border-radius: 8px;
              margin: 20px 0;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            .table-info {
              font-size: 28px;
              font-weight: bold;
              color: #1890ff;
              margin: 15px 0;
            }
            p {
              font-size: 16px;
              color: #666;
              margin: 10px 0 0 0;
            }
          </style>
        </head>
        <body>
          ${qrPages}
        </body>
      </html>
    `)
    iframeDoc.close()

    // Đợi tất cả ảnh load xong rồi trigger print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()

        // Xóa iframe sau khi in
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 1000) // Tăng timeout để đảm bảo tất cả ảnh đã load
    }

    message.success(`Đang chuẩn bị in ${tablesWithQR.length} mã QR...`)
  }

  const handleDeleteClick = (table, e) => {
    if (e) e.stopPropagation()

    modal.confirm({
      title: 'Xác nhận xóa bàn',
      content: `Bạn có chắc chắn muốn xóa bàn ${table.table_number}?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => handleDeleteTable(table.id)
    })
  }

  // ================= Order Item Actions =================
  const handleIncreaseQuantity = async (orderItemId) => {
    // Tìm item bằng order_item_id (KHÔNG fallback về menu_item_id)
    const item = currentOrderItems.find(i => i.order_item_id === orderItemId)

    if (!item || !item.order_id) {
      console.error('Item not found with order_item_id:', orderItemId)
      message.error('Không tìm thấy thông tin món ăn')
      return
    }

    const newQuantity = item.quantity + 1

    // Optimistic UI update - Cập nhật ngay lập tức
    setCurrentOrderItems(prev =>
      prev.map(i =>
        i.order_item_id === orderItemId
          ? { ...i, quantity: newQuantity }
          : i
      )
    )

    try {
      // Gọi API để sync với backend
      await axios.put(
        `${REACT_APP_API_URL}/orders/${item.order_id}/items/${orderItemId}`,
        { quantity: newQuantity }
      )

      // Success message
      message.success({
        content: `Đã tăng số lượng "${item.name}" lên ${newQuantity}`,
        duration: 2,
      })

      // Refresh orders for this table to update status
      await updateSingleTableOrders(selectedTable.id)
    } catch (err) {
      console.error('Failed to increase quantity:', err)
      const errorMsg = err.response?.data?.message || 'Cập nhật số lượng thất bại!'
      message.error(errorMsg)

      // Revert UI nếu API fail
      setCurrentOrderItems(prev =>
        prev.map(i =>
          i.order_item_id === orderItemId
            ? { ...i, quantity: item.quantity }
            : i
        )
      )
    }
  }

  const handleDecreaseQuantity = async (orderItemId) => {
    // Tìm item bằng order_item_id (KHÔNG fallback)
    const item = currentOrderItems.find(i => i.order_item_id === orderItemId)

    if (!item || !item.order_id) {
      message.error('Không tìm thấy thông tin món ăn')
      return
    }

    if (item.quantity <= 1) {
      message.warning('Số lượng tối thiểu là 1. Vui lòng xóa món nếu muốn bỏ.')
      return
    }

    const newQuantity = item.quantity - 1

    // Optimistic UI update - Cập nhật ngay lập tức
    setCurrentOrderItems(prev =>
      prev.map(i =>
        i.order_item_id === orderItemId
          ? { ...i, quantity: newQuantity }
          : i
      )
    )

    try {
      // Gọi API để sync với backend
      await axios.put(
        `${REACT_APP_API_URL}/orders/${item.order_id}/items/${orderItemId}`,
        { quantity: newQuantity }
      )

      // Success message
      message.success({
        content: `Đã giảm số lượng "${item.name}" xuống ${newQuantity}`,
        duration: 2,
      })

      // Refresh orders for this table
      await updateSingleTableOrders(selectedTable.id)
    } catch (err) {
      console.error('Failed to decrease quantity:', err)
      const errorMsg = err.response?.data?.message || 'Cập nhật số lượng thất bại!'
      message.error(errorMsg)

      // Revert UI nếu API fail
      setCurrentOrderItems(prev =>
        prev.map(i =>
          i.order_item_id === orderItemId
            ? { ...i, quantity: item.quantity }
            : i
        )
      )
    }
  }

  const handleRemoveItem = async (orderItemId) => {
    // Tìm item bằng order_item_id
    const item = currentOrderItems.find(i => i.order_item_id === orderItemId)

    if (!item || !item.order_id) {
      message.error('Không tìm thấy thông tin món ăn')
      return
    }

    // Kiểm tra xem đây có phải item cuối cùng không
    const isLastItem = currentOrderItems.length === 1

    // Optimistic UI update - Xóa item khỏi giao diện ngay lập tức
    setCurrentOrderItems(prev =>
      prev.filter(i => i.order_item_id !== orderItemId)
    )

    try {
      // Gọi API để xóa item
      const response = await axios.delete(
        `${REACT_APP_API_URL}/orders/${item.order_id}/items/${orderItemId}`
      )

      // Success message
      message.success({
        content: `🗑️ Đã xóa "${item.name}" khỏi đơn hàng`,
        duration: 2,
      })

      // Refresh orders for this table
      await updateSingleTableOrders(selectedTable.id)

      // Nếu xóa món cuối cùng, đóng panel
      if (isLastItem || response.data?.data?.deleted || response.data?.message?.includes('deleted')) {
        message.info({
          content: '📋 Đơn hàng đã được xóa do không còn món nào',
          duration: 3,
        })
        setSelectedTable(null)
        setOrderPanelOpen(false)
      }
    } catch (err) {
      console.error('Failed to remove item:', err)
      const errorMsg = err.response?.data?.message || 'Xóa món thất bại!'
      message.error(errorMsg)

      // Revert UI - thêm lại item đã xóa
      setCurrentOrderItems(prev => [...prev, item])
    }
  }

  // ================= Add Item to Order =================
  const handleAddItemToOrder = async (menuItem) => {
    if (!selectedTable) {
      message.error('Vui lòng chọn bàn trước')
      return
    }

    if (addingItem) return // Prevent double click

    setAddingItem(true)

    try {
      // Get all orders for this table
      const orders = allTablesOrders[selectedTable.id] || []

      // Find if there's a NEW order (pending confirmation)
      const newOrder = orders.find(o => o.status === 'NEW')

      if (newOrder) {
        // If there's a NEW order, check if item already exists in that order
        const itemsInNewOrder = currentOrderItems.filter(i => i.order_id === newOrder.id)
        const existingItem = itemsInNewOrder.find(i => i.id === menuItem.id)

        if (existingItem) {
          // Item exists in NEW order - increase quantity
          await handleIncreaseQuantity(existingItem.order_item_id)
          return
        }
      }

      // Create new order with this item
      // This happens when:
      // 1. No orders exist yet
      // 2. No NEW orders (all are IN_PROGRESS/DONE) - creates new order automatically
      // 3. Item doesn't exist in existing NEW order
      const orderData = {
        table_id: selectedTable.id,
        items: [
          {
            menu_item_id: menuItem.id,
            quantity: 1
          }
        ]
      }

      const response = await axios.post(
        `${REACT_APP_API_URL}/orders/admin/create`,
        orderData
      )

      // Lấy order và item mới tạo
      const createdOrder = response.data.data
      const newOrderItem = createdOrder.items[createdOrder?.items?.length - 1]

      // Optimistic UI update - Thêm item mới vào currentOrderItems
      const newItem = {
        id: menuItem.id, // menu_item_id
        order_item_id: newOrderItem.id, // order_item.id
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        image: menuItem.image_url || 'https://via.placeholder.com/70',
        note: newOrderItem.note || '',
        order_id: createdOrder.id,
        order_status: createdOrder.status
      }

      setCurrentOrderItems(prev => [...prev, newItem])

      // Success message with context
      if (orders.some(o => o.status === 'IN_PROGRESS' || o.status === 'DONE')) {
        message.success({
          content: `Đã tạo đơn hàng mới với món "${menuItem.name}"`,
          duration: 2,
        })
      } else {
        message.success({
          content: `Đã thêm "${menuItem.name}" vào đơn hàng`,
          duration: 2,
        })
      }

      // Refresh orders for this table
      await updateSingleTableOrders(selectedTable.id)

    } catch (err) {
      console.error('Failed to add item:', err)
      const errorMsg = err.response?.data?.message || 'Thêm món thất bại!'
      message.error(errorMsg)
    } finally {
      setAddingItem(false)
    }
  }

  // ================= Note Actions =================
  const handleSaveNote = async (orderItemId, item) => {
    // Lấy giá trị từ textarea khi nhấn "Lưu"
    const textarea = document.getElementById(`note-textarea-${orderItemId}`)
    if (!textarea) return

    const newNote = textarea.value.trim()
    const originalNote = (item.note || '').trim()

    // Check if note actually changed
    if (newNote === originalNote) {
      // No change, just clear editing state
      setEditingNotes(prev => {
        const updated = { ...prev }
        delete updated[orderItemId]
        return updated
      })
      message.info('Không có thay đổi')
      return
    }

    // Set saving state
    setEditingNotes(prev => ({
      ...prev,
      [orderItemId]: { isEditing: true, isSaving: true }
    }))

    try {
      // Call API to update note - sử dụng endpoint staff/orders
      await axios.put(
        `${REACT_APP_API_URL}/staff/orders/item/${orderItemId}`,
        {
          quantity: item.quantity,
          note: newNote || null
        }
      )

      // Update currentOrderItems with new note
      setCurrentOrderItems(prev =>
        prev.map(i =>
          i.order_item_id === orderItemId
            ? { ...i, note: newNote }
            : i
        )
      )

      // Clear editing state
      setEditingNotes(prev => {
        const updated = { ...prev }
        delete updated[orderItemId]
        return updated
      })

      message.success('Đã lưu ghi chú', 1.5)
    } catch (err) {
      console.error('Failed to save note:', err)
      message.error('Lưu ghi chú thất bại!')

      // Keep editing state but remove saving flag
      setEditingNotes(prev => ({
        ...prev,
        [orderItemId]: { isEditing: true, isSaving: false }
      }))
    }
  }

  // ================= Cart Actions =================

  // Print kitchen bill using iframe
  const printKitchenBill = (order, table, items) => {
    if (!order || !table || !items || items.length === 0) {
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
    iframeDoc.write(getKitchenBillHTML(order, table, items))
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
  }

  // ================= Print Invoice with QR Code =================
  const handlePrintInvoice = async () => {
    try {
      if (!selectedTable || !currentOrderItems || currentOrderItems.length === 0) {
        message.warning('Không có đơn hàng để in hóa đơn!')
        return
      }

      // Get orders for the selected table
      const orders = allTablesOrders[selectedTable.id] || []
      const confirmedOrders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'DONE')

      if (confirmedOrders.length === 0) {
        message.warning('Không có đơn hàng đã xác nhận để in hóa đơn!')
        return
      }

      const confirmedTotal = confirmedOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)

      // Get session info to get QR code
      const sessionData = localStorage.getItem('qr_session')
      let qrCodeUrl = null

      if (sessionData) {
        const { session_id } = JSON.parse(sessionData)

        // Get session details with QR code
        try {
          const sessionResponse = await axios.get(`${REACT_APP_API_URL}/qr-sessions/${session_id}`)
          if (sessionResponse.data?.data?.qr_code_url) {
            qrCodeUrl = sessionResponse.data.data.qr_code_url
          }
        } catch (err) {
          console.warn('Could not fetch session QR code:', err)
        }
      }

      // Prepare invoice data
      const invoiceData = {
        sessionId: orders[0]?.session_id || 'N/A',
        tableNumber: selectedTable.table_number,
        items: currentOrderItems
          .filter(item => item.order_status === 'IN_PROGRESS' || item.order_status === 'DONE')
          .map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        totalAmount: confirmedTotal,
        discount: 0,
        tax: 0,
        serviceFee: 0,
        finalAmount: confirmedTotal,
        paymentTime: new Date().toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        staffName: user?.name || user?.username || 'Nhân viên',
        qrCodeUrl: qrCodeUrl // Add QR code URL
      }

      // Print invoice
      printInvoice(invoiceData)

      message.success({
        content: '🖨️ Đang in hóa đơn...',
        duration: 2
      })
    } catch (error) {
      console.error('Print invoice error:', error)
      message.error('Không thể in hóa đơn. Vui lòng thử lại.')
    }
  }

  // Generate HTML template cho kitchen bill
  const getKitchenBillHTML = (order, table, items) => {
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
          <title>Báo bếp - Bàn ${table.table_number}</title>
          <style>
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            
            body { 
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.4;
            }
            
            @media print {
              body { 
                width: 80mm;
                margin: 0 auto;
              }
            }

            .container {
              padding: 12px;
              background: white;
            }

            /* Header */
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .header h1 {
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 4px 0;
            }

            .header h2 {
              font-size: 18px;
              font-weight: 800;
              margin: 0;
            }

            /* Order Info */
            .order-info {
              margin-bottom: 10px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 6px 0;
              font-size: 13px;
            }

            .info-label {
              font-weight: 700;
            }

            .info-value {
              font-weight: 700;
            }

            .table-number {
              font-size: 20px;
              font-weight: 800;
            }

            /* Items List */
            .items-list {
              margin-bottom: 10px;
            }

            .item {
              border-bottom: 1px solid #ccc;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 4px;
            }

            .item-name {
              font-weight: 800;
              font-size: 15px;
              flex: 1;
              padding-right: 8px;
            }

            .item-quantity {
              font-size: 24px;
              font-weight: 800;
              white-space: nowrap;
            }

            .item-note {
              font-size: 13px;
              font-style: italic;
              color: #555;
              margin-top: 6px;
              padding-left: 10px;
              border-left: 3px solid #ff9800;
              font-weight: 600;
            }

            /* Footer */
            .footer {
              border-top: 2px dashed #000;
              padding-top: 10px;
              text-align: center;
            }

            .divider {
              margin-bottom: 8px;
              font-weight: 600;
            }

            .total {
              font-weight: 800;
              font-size: 15px;
              margin-bottom: 10px;
            }

            .print-time {
              font-size: 12px;
              color: #666;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>🍽️ NHÀ HÀNG PHƯƠNG NAM</h1>
              <h2>PHIẾU BÁO BẾP</h2>
            </div>

            <!-- Order Info -->
            <div class="order-info">
              <div class="info-row">
                <span class="info-label">Bàn:</span>
                <span class="table-number">${table.table_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Đơn hàng:</span>
                <span class="info-value">#${order.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Thời gian:</span>
                <span class="info-value">${now}</span>
              </div>
            </div>

            <!-- Items List -->
            <div class="items-list">
              ${items.map(item => `
                <div class="item">
                  <div class="item-header">
                    <div class="item-name">${item.name || item.menu_item_name}</div>
                    <div class="item-quantity">x${item.quantity}</div>
                  </div>
                  ${item.note ? `
                    <div class="item-note">
                      📝 ${item.note}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="divider">━━━━━━━━━━━━━━━━━━━━</div>
              <div class="total">
                Tổng: ${totalItems} món - ${totalQuantity} phần
              </div>
              <div class="print-time">
                In lúc: ${now}
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Confirm a single order (for NEW status)
  const handleConfirmOrder = async (orderId) => {
    try {
      setLoadingOrders(true)

      await axios.put(`${REACT_APP_API_URL}/staff/orders/${orderId}/confirm`)

      message.success('Đã xác nhận đơn hàng!')

      // Get order details for printing
      const orders = allTablesOrders[selectedTable.id] || []
      const order = orders.find(o => o.id === orderId)
      if (order) {
        printKitchenBill(order, selectedTable, order.items || [])
      }

      // Update table data
      await updateSingleTableOrders(selectedTable.id)
    } catch (err) {
      console.error('Failed to confirm order:', err)
      const errorMsg = err.response?.data?.message || 'Xác nhận đơn hàng thất bại!'
      message.error(errorMsg)
    } finally {
      setLoadingOrders(false)
    }
  }

  // Cancel a single order
  const handleCancelSingleOrder = async (orderId) => {
    modal.confirm({
      title: 'Xác nhận hủy đơn hàng',
      content: `Bạn có chắc chắn muốn hủy đơn hàng #${orderId}?`,
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          setLoadingOrders(true)

          await axios.put(`${REACT_APP_API_URL}/orders/${orderId}/cancel`, {
            reason: 'Admin hủy đơn từ quản lý bàn'
          })

          message.success('Đã hủy đơn hàng thành công!')

          await updateSingleTableOrders(selectedTable.id)
        } catch (err) {
          console.error('Failed to cancel order:', err)
          const errorMsg = err.response?.data?.message || 'Hủy đơn hàng thất bại!'
          message.error(errorMsg)
        } finally {
          setLoadingOrders(false)
        }
      }
    })
  }


  const handlePayment = async () => {
    // Get all orders from polling data
    const orders = allTablesOrders[selectedTable.id] || []

    if (orders.length === 0) {
      message.warning('Không tìm thấy đơn hàng!')
      return
    }

    // Calculate statistics
    const totalItems = currentOrderItems.length
    const totalQuantity = currentOrderItems.reduce((sum, item) => sum + item.quantity, 0)

    // Separate orders by status
    const confirmedOrders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'DONE')
    const newOrders = orders.filter(o => o.status === 'NEW')

    // Calculate total for confirmed orders only
    const totalAmount = confirmedOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)

    // Get session info
    const sessionId = orders[0]?.qr_session_id

    // 🎯 Lấy thông tin customer và điểm từ session
    let customerPoints = 0
    let customerPhone = null
    let customerName = null

    try {
      const sessionResponse = await axios.get(`${REACT_APP_API_URL}/qr-sessions/${sessionId}`)
      const customerId = sessionResponse.data?.data?.customer_id

      if (customerId) {
        const customerResponse = await axios.get(`${REACT_APP_API_URL}/customers/${customerId}`)
        customerPoints = customerResponse.data?.data?.points || 0
        customerPhone = customerResponse.data?.data?.phone || null
        customerName = customerResponse.data?.data?.name || null
      }
    } catch (error) {
      console.log('Không lấy được thông tin điểm:', error)
    }

    // 🎯 Tính discount nếu dùng hết điểm
    // Logic mới: 1 điểm = 3,000đ | Tối thiểu 30 điểm
    const calculateDiscount = (points) => {
      const MIN_POINTS_TO_REDEEM = 30; // Tối thiểu 30 điểm
      const DISCOUNT_PER_POINT = 3000; // 1 điểm = 3,000đ

      if (points < MIN_POINTS_TO_REDEEM) return 0; // Chưa đủ điểm để đổi

      const discount = points * DISCOUNT_PER_POINT;
      return Math.min(discount, totalAmount); // Không vượt quá tổng tiền
    }

    const maxDiscount = calculateDiscount(customerPoints)

    // 🎯 Sử dụng state đã lưu từ khi mở order panel (không đọc từ URL vì đã bị clear)
    // customerWantsUsePoints được set khi click notification và mở panel
    const customerWantsPoints = customerWantsUsePoints

    // 🎯 Sử dụng ref để lưu giá trị toggle (vì modal không re-render)
    let usePointsValue = customerWantsPoints

    const handleTogglePoints = (checked) => {
      usePointsValue = checked
      // Update hiển thị số tiền
      const amountElement = document.getElementById('modal-final-amount')
      if (amountElement) {
        const finalAmount = totalAmount - (checked ? maxDiscount : 0)
        amountElement.textContent = `${Number(finalAmount)?.toLocaleString('vi-VN')}₫`
      }
    }

    // Show confirmation modal with Japanese design (Tailwind CSS)
    modal.confirm({
      title: null,
      icon: null,
      width: 460,
      centered: true,
      content: (
        <div className="py-2">
          {/* Header with icon */}
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

          {/* Order Info Card */}
          <div className="bg-[#fafafa] rounded-xl p-4 mb-5 border border-[#f0f0f0]">
            {/* Table & Session ID */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#f0f0f0]">
              <div className="flex-1">
                <div className="text-xs text-[#8c8c8c] mb-1 font-medium">
                  Bàn
                </div>
                <div className="text-lg font-semibold text-[#1890ff] tracking-tight">
                  {selectedTable.table_number}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-xs text-[#8c8c8c] mb-1 font-medium">
                  Phiên
                </div>
                <div className="text-[15px] font-semibold text-[#262626] font-mono">
                  #{sessionId}
                </div>
              </div>
            </div>

            {/* Orders Summary */}
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

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#d9d9d9] to-transparent my-3" />

            {/* 🎯 LOYALTY POINTS SECTION */}
            {customerPoints > 0 && (
              <>
                <div className="bg-[#fff7e6] rounded-lg p-3 mb-3 border border-[#ffd591]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-[#d46b08] font-semibold">
                      💎 Điểm tích lũy: {customerPoints?.toLocaleString('vi-VN')} điểm
                    </span>
                  </div>

                  {customerPoints >= 30 ? (
                    // ✅ Đủ điểm để đổi
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-[#ad6800] mb-1">
                          Dùng hết điểm giảm:
                        </div>
                        <div className="text-sm font-semibold text-[#d46b08]">
                          -{maxDiscount?.toLocaleString('vi-VN')}₫
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          id="use-points-toggle"
                          defaultChecked={customerWantsPoints}
                          onChange={(e) => handleTogglePoints(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d46b08]"></div>
                      </label>
                    </div>
                  ) : (
                    // ⚠️ Chưa đủ điểm để đổi (< 30 điểm)
                    <div className="text-xs text-[#ad6800]">
                      ℹ️ Cần tối thiểu 30 điểm để đổi (còn thiếu {30 - customerPoints} điểm)
                    </div>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#d9d9d9] to-transparent my-3" />
              </>
            )}

            {/* Total Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#262626] font-semibold">
                Tổng thanh toán
              </span>
              <div id="modal-final-amount" className="text-2xl font-bold text-[#52c41a] tracking-tight">
                {Number(customerWantsPoints ? totalAmount - maxDiscount : totalAmount)?.toLocaleString('vi-VN')}₫
              </div>
            </div>
          </div>

          {/* Warning about unconfirmed orders */}
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

          {/* Confirmation Message */}
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
          setLoadingOrders(true)

          // Get sessionId from first order (all orders share same session)
          const orders = allTablesOrders[selectedTable.id] || []
          if (orders.length === 0 || !orders[0].qr_session_id) {
            message.error('Không tìm thấy phiên làm việc')
            setLoadingOrders(false)
            return
          }

          // Validate admin is logged in
          if (!user?.id) {
            message.error('Không tìm thấy thông tin admin. Vui lòng đăng nhập lại.')
            setLoadingOrders(false)
            return
          }

          const sessionId = orders[0].qr_session_id

          // 🎯 Lấy giá trị từ ref (không phải từ DOM)
          const shouldUsePoints = usePointsValue

          // 🎯 Call payment API with useAllPoints flag
          const response = await axios.post(`${REACT_APP_API_URL}/payment/admin`, {
            sessionId,
            adminId: user.id,
            useAllPoints: shouldUsePoints // 🎯 Truyền flag dùng điểm
          })

          if (response.data.status === 200) {
            const paymentResult = response.data.data

            // 🎯 Hiển thị thông báo thành công với thông tin điểm
            let successMessage = 'Thanh toán thành công!'

            if (paymentResult.pointsUsed > 0) {
              successMessage = `Thanh toán thành công! Đã dùng ${paymentResult.pointsUsed} điểm (giảm ${paymentResult.discountFromPoints?.toLocaleString('vi-VN')}₫)`
            }

            if (paymentResult.pointsEarned > 0) {
              successMessage += ` | Tích thêm ${paymentResult.pointsEarned} điểm`
            }

            // Show success message with details
            message.success({
              content: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {successMessage}
                  </div>
                </div>
              ),
              duration: 5
            })

            // ✅ Print invoice if shouldPrintInvoice is true
            if (shouldPrintInvoice) {
              try {
                // Calculate confirmed total from orders
                const orders = allTablesOrders[selectedTable.id] || [];
                const confirmedOrders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'DONE');
                const confirmedTotal = confirmedOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);

                // Prepare invoice data
                const invoiceData = {
                  sessionId: sessionId,
                  tableNumber: selectedTable.table_number,
                  items: currentOrderItems
                    .filter(item => item.order_status === 'IN_PROGRESS' || item.order_status === 'DONE')
                    .map(item => ({
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                  totalAmount: confirmedTotal,
                  discount: 0, // Có thể thêm logic giảm giá nếu cần
                  tax: 0,
                  serviceFee: 0,
                  finalAmount: confirmedTotal,
                  paymentTime: new Date().toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }),
                  staffName: user?.name || user?.username || 'Nhân viên'
                };

                // Print invoice
                printInvoice(invoiceData);

                message.info({
                  content: '🖨️ Đang in hóa đơn...',
                  duration: 2
                });
              } catch (printError) {
                console.error('Print invoice error:', printError);
                message.warning('Không thể in hóa đơn. Vui lòng thử lại.');
              }
            }

            // Close order panel and refresh tables
            setOrderPanelOpen(false)
            setMenuModalOpen(false)
            refreshTables()
          } else {
            message.error({
              content: response.data.message || 'Thanh toán thất bại',
              duration: 3
            })
          }
        } catch (err) {
          console.error('Payment error:', err)
          const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi thanh toán'
          message.error({
            content: `❌ ${errorMsg}`,
            duration: 3
          })
        } finally {
          setLoadingOrders(false)
        }
      }
    })
  }

  // ================= Table Status Logic =================
  const getTableStatus = (table) => {
    if (!table.is_active) {
      return 'inactive' // Badge đỏ
    }

    // Kiểm tra có order active không (từ API)
    const orders = allTablesOrders[table.id] || []
    const hasActiveOrder = orders.length > 0

    if (hasActiveOrder) {
      // Kiểm tra nếu có order nào ở trạng thái NEW
      const hasNewOrder = orders.some(order => order.status === 'NEW')
      if (hasNewOrder) {
        return 'pending' // Màu cam - có order chờ xác nhận
      }
      return 'occupied' // Màu xanh - tất cả order đã xác nhận
    }
    return 'available' // Xám
  }

  const getTableOrder = (table) => {
    const orders = allTablesOrders[table.id] || []
    if (orders.length === 0) return null

    // Return order đầu tiên hoặc tổng hợp thông tin
    const firstOrder = orders[0]

    // Tính tổng items và total từ tất cả orders
    const allItems = orders.flatMap(order => order.items || [])

    // Chỉ tính tổng cho orders đã xác nhận (IN_PROGRESS, DONE)
    const totalAmount = orders.reduce((sum, order) => {
      if (order.status === 'IN_PROGRESS' || order.status === 'DONE') {
        return sum + Number(order.total_price || 0)
      }
      return sum
    }, 0)

    return {
      order_id: firstOrder.id,
      status: firstOrder.status,
      items: allItems,
      total: totalAmount,
      created_at: firstOrder.created_at
    }
  }

  // ================= Effect =================
  useEffect(() => {
    // No need to fetch tables - polling hook handles it automatically
    // Just fetch menu categories and items once on mount
    fetchCategories()
    fetchMenuItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Auto-open order panel when navigating from notification
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tableId = params.get('tableId')
    const shouldOpenPanel = params.get('openPanel') === 'true'
    const useAllPoints = params.get('useAllPoints') === 'true' // 🎯 Đọc useAllPoints từ URL
    const printBill = params.get('printBill') === 'true' // 🖨️ Đọc printBill từ URL

    if (tableId && shouldOpenPanel && tables.length > 0) {
      // Find table by ID
      const targetTable = tables.find(t => t.id === parseInt(tableId))

      if (targetTable) {
        console.log('📱 Opening order panel for table:', targetTable.table_number)
        console.log('💎 Customer wants to use points:', useAllPoints)
        console.log('🖨️ Customer wants to print bill:', printBill)

        // 🎯 Lưu lựa chọn của customer vào state
        setCustomerWantsUsePoints(useAllPoints)
        // 🖨️ Set print invoice based on customer's choice
        setShouldPrintInvoice(printBill)

        // Open order panel
        setSelectedTable(targetTable)
        setOrderPanelOpen(true)
        setEditingNotes({})

        // Fetch orders for this table
        fetchOrdersByTable(targetTable.id)

        // Clean URL params after opening
        navigate(location.pathname, { replace: true })
      } else {
        console.warn('⚠️ Table not found:', tableId)
        message.warning('Không tìm thấy bàn')
        // Clean URL params
        navigate(location.pathname, { replace: true })
      }
    }
  }, [location.search, tables, navigate, location.pathname, message, fetchOrdersByTable])

  // Auto-refresh orders khi modal đang mở và có thay đổi từ polling
  useEffect(() => {
    if (!orderPanelOpen || !selectedTable) return

    // Lấy orders mới từ polling data
    const newOrders = allTablesOrders[selectedTable.id] || []

    // Transform orders thành items format
    const newItems = newOrders.flatMap(order =>
      (order.items || []).map(item => ({
        id: item.menu_item_id || item.id,
        order_item_id: item.id,
        name: item.name || item.menu_item_name,
        quantity: item.quantity,
        price: item.unit_price,
        image: item.image_url || item.image || 'https://via.placeholder.com/70',
        note: item.note || '',
        order_id: order.id,
        order_status: order.status
      }))
    )

    // So sánh với current items
    const hasChanges = !areOrderItemsEqual(currentOrderItems, newItems)

    if (hasChanges) {
      // Update UI
      setCurrentOrderItems(newItems)
    }
  }, [allTablesOrders, orderPanelOpen, selectedTable, currentOrderItems, areOrderItemsEqual])

  // ================= Filter logic =================
  const filteredTables = tables.filter((t) => {
    const search = searchText.trim().toLowerCase()
    const searchMatch =
      !search || (t.table_number || '').toLowerCase().includes(search)

    let statusMatch = true
    if (statusFilter !== 'all') {
      const tableStatus = getTableStatus(t)
      statusMatch = statusFilter === tableStatus
    }
    return searchMatch && statusMatch
  })

  // Helper to get QR image URL (handle both local and Cloudinary)
  const getQRImageUrl = (qrCodeUrl) => {
    return getImageUrl(qrCodeUrl)
  }

  // ================= Order Status Tag =================
  const getOrderStatusTag = (status) => {
    const statusMap = {
      NEW: { text: 'Chờ xác nhận', color: 'orange' },
      IN_PROGRESS: { text: 'Đang phục vụ', color: 'green' },
      DONE: { text: 'Hoàn thành', color: 'green' },
      PAID: { text: 'Đã thanh toán', color: 'success' }
    }
    const config = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // ================= Table Card Component =================
  const TableCard = ({ table }) => {
    const status = getTableStatus(table)
    const order = getTableOrder(table)

    // Styling based on status
    const cardStyles = {
      available: {
        borderColor: '#d9d9d9',
        backgroundColor: '#fafafa',
        cursor: 'pointer'
      },
      pending: {
        borderColor: '#fa8c16',
        borderWidth: '3px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(250, 140, 22, 0.2)'
      },
      occupied: {
        borderColor: '#52c41a',
        borderWidth: '3px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(82, 196, 26, 0.2)'
      },
      inactive: {
        borderColor: '#ff4d4f',
        backgroundColor: '#fff2f0',
        cursor: 'not-allowed',
        opacity: 0.7
      }
    }

    const currentStyle = cardStyles[status] || cardStyles.available

    // Menu click handler để prevent propagation
    const handleMenuClick = ({ key, domEvent }) => {
      // Stop event propagation để không trigger card click
      if (domEvent) {
        domEvent.stopPropagation()
      }

      // Execute action based on key
      switch (key) {
        case 'print':
          handlePrintQR(table, domEvent)
          break
        case 'edit':
          openEditDrawer(table, domEvent)
          break
        case 'delete':
          handleDeleteClick(table, domEvent)
          break
        default:
          break
      }
    }

    // Menu items for Dropdown
    const menuItems = [
      {
        key: 'print',
        icon: <PrinterOutlined />,
        label: 'In QR',
        disabled: !table.qr_code_url
      },
      canAccess(['OWNER', 'MANAGER']) && {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa'
      },
      canAccess(['OWNER', 'MANAGER']) && {
        type: 'divider'
      },
      canAccess(['OWNER', 'MANAGER']) && {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        danger: true
      }
    ].filter(Boolean) // Remove null/undefined items

    return (
      <Badge.Ribbon
        text={status === 'inactive' ? 'Tạm ngừng' : null}
        color="red"
        placement="start" // Hiển thị bên trái thay vì bên phải
        style={{
          display: status === 'inactive' ? 'block' : 'none',
        }}
      >
        <Card
          hoverable={status !== 'inactive'}
          onClick={() => status !== 'inactive' && handleTableClick(table)}
          style={{
            height: '180px',
            ...currentStyle,
            transition: 'all 0.3s',
            position: 'relative'
          }}
          bodyStyle={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px'
          }}
        >
          {/* Action Menu - Top Right */}
          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleMenuClick
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: '18px' }} />}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10, // ✅ Đủ để hiển thị trên Card content
                color: '#666',
              }}
            />
          </Dropdown>

          {/* Header: Table Number */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Title level={2} style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>
              {table.table_number}
            </Title>
          </div>

          {/* Body: Order Info */}
          {order && (
            <div
              style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
                marginTop: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ShoppingCartOutlined />
                <Text style={{ fontSize: '12px' }}>{order.items.length} món</Text>
              </div>
              <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                {Number(order.total)?.toLocaleString('vi-VN')}đ
              </Text>
            </div>
          )}
        </Card>
      </Badge.Ribbon>
    )
  }

  // ================= Order Panel Component =================
  const OrderPanel = () => {
    if (!selectedTable) return null

    // Get all orders from polling data
    const orders = allTablesOrders[selectedTable.id] || []
    console.log('Rendering OrderPanel with orders:', orders)

    // Get session info from first order (all orders share same session)
    const sessionInfo = orders.length > 0 ? {
      id: orders[0].qr_session_id,
      status: orders[0].session_status,
      table_number: orders[0].table_number
    } : null

    // Calculate total for confirmed orders only (IN_PROGRESS, DONE)
    const grandTotal = orders.reduce((sum, order) => {
      if (order.status === 'IN_PROGRESS' || order.status === 'DONE') {
        return sum + Number(order.total_price || 0)
      }
      return sum
    }, 0)

    // Format created_at
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

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with Session Info */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
                  Bàn {selectedTable.table_number}
                </Title>
                {sessionInfo && (
                  <Tag color={sessionInfo.status === 'ACTIVE' ? 'green' : 'default'}>
                    {sessionInfo.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}
                  </Tag>
                )}
              </div>
              {sessionInfo && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Phiên #{sessionInfo.id} • {orders.length} đơn hàng
                </Text>
              )}
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => {
                setOrderPanelOpen(false)
                setMenuModalOpen(false)
                setEditingNotes({})
              }}
            />
          </div>

          {/* Add Item Button - Show when session is ACTIVE (not paid yet)
              - If no orders: creates first order
              - If has NEW orders: adds to existing NEW order
              - If all orders are IN_PROGRESS/DONE: creates new order automatically
          */}
          {sessionInfo?.status === 'ACTIVE' && (
            <Button
              type="text"
              icon={<PlusOutlined style={{ fontSize: '20px', fontWeight: 'bold' }} />}
              onClick={() => {
                setMenuModalOpen(true)
              }}
              style={{
                position: 'absolute',
                bottom: '-42px',
                right: '16px',
                color: '#226533',
                padding: '4px 8px'
              }}
            />
          )}
        </div>

        {/* Order Content - List of Orders */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>Đang tải đơn hàng...</Text>
            </div>
          ) : orders.length > 0 ? (
            <>
              {/* Use OrderList component */}
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

              <Divider />
            </>
          ) : (
            // Empty State - Show icon and "Add items" button
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '34px',
                marginTop: '60px'
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '48px', color: '#1890ff' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ marginBottom: '-8px' }}>✓</div>
                      <div style={{ marginBottom: '-8px' }}>✓</div>
                      <div>✓</div>
                    </div>
                  </div>
                  {/* Pencil icon */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      width: '28px',
                      height: '28px',
                      backgroundColor: '#ff9800',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: 'white'
                    }}
                  >
                    ✎
                  </div>
                </div>
              </div>

              {/* Button */}
              <Button
                type="primary"
                size="medium"
                icon={<PlusOutlined />}
                onClick={() => {
                  setMenuModalOpen(true)
                }}
                style={{
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  borderRadius: '12px'
                }}
              >
                Thêm đơn hàng
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {orders.length > 0 && orders.some(o => o.status !== 'NEW' && o.status !== 'CANCELLED') && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {/* Print Invoice Switch - Compact design */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: '#fafafa',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PrinterOutlined style={{ fontSize: '14px', color: '#595959' }} />
                  <Text style={{ fontSize: '13px', fontWeight: '500', color: '#595959' }}>
                    Tự động in hóa đơn
                  </Text>
                </div>
                <Switch
                  size="small"
                  checked={shouldPrintInvoice}
                  onChange={(checked) => setShouldPrintInvoice(checked)}
                />
              </div>

              {/* Action Buttons Row - Print Invoice & Payment */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Print Invoice Button - Only show if there are confirmed orders */}
                {orders.some(o => o.status === 'IN_PROGRESS' || o.status === 'DONE') && (
                  <Button
                    size="large"
                    icon={<PrinterOutlined />}
                    onClick={handlePrintInvoice}
                    style={{
                      flex: 1,
                      height: '50px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '2px solid #226533',
                      color: '#226533',
                      background: '#fff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    In hóa đơn
                  </Button>
                )}

                {/* Payment Button */}
                <Button
                  type="primary"
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={handlePayment}
                  style={{
                    flex: orders.some(o => o.status === 'IN_PROGRESS' || o.status === 'DONE') ? 1 : 'auto',
                    width: orders.some(o => o.status === 'IN_PROGRESS' || o.status === 'DONE') ? 'auto' : '100%',
                    height: '50px',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #226533 0%, #2d8e47 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(34, 101, 51, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  Thanh toán
                </Button>
              </div>
            </Space>
          </div>
        )}
      </div>
    )
  }

  // ================= Render =================
  return (
    <>
      {contextHolder}
      <Layout style={{ minHeight: '100vh' }}>
        {/* CSS để ẩn scrollbar */}
        <style>{hideScrollbarStyle}</style>

        {/* Sidebar */}
        <AppSidebar collapsed={collapsed} currentPageKey="tables" />

        <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
          {/* Header */}
          <AppHeader
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            pageTitle={pageTitle}
          />

          <Content
            style={{
              marginTop: 64,
              padding: 20,
              background: '#f0f2f5',
              minHeight: 'calc(100vh - 64px)',
              overflow: 'auto'
            }}
          >
            {/* Filters */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {/* Search & Filter */}
                <Space>
                  <Input.Search
                    placeholder="Tìm số bàn..."
                    style={{ width: 250 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />

                  <Select
                    value={statusFilter}
                    style={{ width: 180 }}
                    onChange={(val) => setStatusFilter(val)}
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="available">Trống</Option>
                    <Option value="pending">Chờ xác nhận</Option>
                    <Option value="occupied">Đang phục vụ</Option>
                    <Option value="inactive">Tạm ngừng</Option>
                  </Select>
                </Space>

                {/* Actions */}
                <Space>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrintAllQR}
                  >
                    In tất cả QR
                  </Button>
                  {canAccess(['OWNER', 'MANAGER']) && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ background: '#226533' }}
                      onClick={() => setDrawerOpen(true)}
                    >
                      Thêm bàn mới
                    </Button>
                  )}
                </Space>
              </div>

              {/* Stats */}
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <Space size="large">
                  <Text>
                    <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                      {filteredTables.length}
                    </span>{' '}
                    bàn
                  </Text>
                  <Text>
                    <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                      {filteredTables.filter((t) => getTableStatus(t) === 'pending').length}
                    </span>{' '}
                    chờ xác nhận
                  </Text>
                  <Text>
                    <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                      {filteredTables.filter((t) => getTableStatus(t) === 'occupied').length}
                    </span>{' '}
                    đang phục vụ
                  </Text>
                  <Text>
                    <span style={{ fontWeight: 'bold', color: '#999' }}>
                      {filteredTables.filter((t) => getTableStatus(t) === 'available').length}
                    </span>{' '}
                    trống
                  </Text>
                  <Text>
                    <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
                      {filteredTables.filter((t) => getTableStatus(t) === 'inactive').length}
                    </span>{' '}
                    tạm ngừng
                  </Text>
                </Space>
              </div>
            </div>

            {/* Grid Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}
            >
              {loading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                  <Text>Đang tải...</Text>
                </div>
              ) : filteredTables.length === 0 ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Empty description="Không tìm thấy bàn nào" />
                </div>
              ) : (
                filteredTables.map((table) => <TableCard key={table.id} table={table} />)
              )}
            </div>

            {/* Drawer thêm bàn mới */}
            <Drawer
              title="Thêm bàn mới"
              placement="right"
              width={600}
              open={drawerOpen}
              onClose={() => {
                setDrawerOpen(false);
                addForm.resetFields();
              }}
              footer={
                <div style={{ textAlign: "right" }}>
                  <Button
                    onClick={() => {
                      setDrawerOpen(false);
                      addForm.resetFields();
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Hủy
                  </Button>
                  <Button type="primary" onClick={handleAddTable}>
                    Thêm
                  </Button>
                </div>
              }
            >
              <Form
                form={addForm}
                layout="vertical"
                initialValues={{}}
              >
                <Form.Item
                  label="Số bàn"
                  name="table_number"
                  rules={[
                    { required: true, message: "Nhập số bàn!" },
                    { pattern: /^[A-Za-z0-9\s]+$/, message: "Số bàn chỉ chứa chữ, số và khoảng trắng!" }
                  ]}
                >
                  <Input placeholder="Ví dụ: B01, VIP-1, Bàn 05..." />
                </Form.Item>
                <div style={{
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 16
                }}>
                  <Text style={{ color: '#52c41a', fontSize: 14 }}>
                    💡 QR Code sẽ được tạo tự động khi tạo bàn mới
                  </Text>
                </div>
              </Form>
            </Drawer>

            {/* Drawer chỉnh sửa bàn */}
            <Drawer
              title="Chỉnh sửa bàn"
              placement="right"
              width={600}
              open={editDrawerOpen}
              onClose={() => {
                setEditDrawerOpen(false);
                editForm.resetFields();
                setEditingTable(null);
              }}
              footer={
                <div style={{ textAlign: "right" }}>
                  <Button
                    onClick={() => {
                      setEditDrawerOpen(false);
                      editForm.resetFields();
                      setEditingTable(null);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Hủy
                  </Button>
                  <Button type="primary" onClick={handleEditTable}>
                    Lưu
                  </Button>
                </div>
              }
            >
              <Form
                form={editForm}
                layout="vertical"
              >
                <Form.Item
                  label="Số bàn"
                  name="table_number"
                  rules={[
                    { required: true, message: "Nhập số bàn!" },
                    { pattern: /^[A-Za-z0-9\s]+$/, message: "Số bàn chỉ chứa chữ, số và khoảng trắng!" }
                  ]}
                >
                  <Input placeholder="Ví dụ: B01, VIP-1, Bàn 05..." />
                </Form.Item>
                <Form.Item
                  label="Trạng thái"
                  name="is_active"
                  rules={[{ required: true, message: "Chọn trạng thái!" }]}
                >
                  <Select>
                    <Option value={1}>Hoạt động</Option>
                    <Option value={0}>Tạm ngừng</Option>
                  </Select>
                </Form.Item>
                {editingTable?.qr_code_url && (
                  <>
                    <Form.Item label="QR Code">
                      <div className="flex flex-col items-center gap-4">
                        {/* QR Code Image */}
                        <div className="relative">
                          <img
                            src={getQRImageUrl(newQRUrl || editingTable.qr_code_url)}
                            alt="Current QR"
                            className="w-48 h-48 border-2 border-gray-300 rounded-lg shadow-sm"
                          />
                          {newQRUrl && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Mới
                            </div>
                          )}
                        </div>



                        {/* Regenerate Button */}
                        <Button
                          type="default"
                          loading={regeneratingQR}
                          onClick={handleRegenerateQR}
                        >
                          {regeneratingQR ? 'Đang tạo QR mới...' : 'Tạo lại QR Code'}
                        </Button>


                      </div>
                    </Form.Item>
                  </>
                )}
              </Form>
            </Drawer>

            {/* Drawer: Menu Selection - Simplified Layout */}
            <Drawer
              title={
                <Title level={4} style={{ margin: 0 }}>
                  {/* Chọn món cho Bàn {selectedTable?.table_number} */}
                  Thực đơn
                </Title>
              }
              placement="left"
              open={menuModalOpen}
              onClose={() => {
                setMenuModalOpen(false)
                setSelectedCategory('all')
              }}
              width={`calc(100vw - 480px)`}
              styles={{
                body: {
                  padding: 0,
                  height: '100%',
                  overflow: 'hidden',
                  backgroundColor: '#fff'
                }
              }}
              closable={true}
              mask={false}
              maskClosable={false}
              zIndex={1000} // Cao hơn order panel (1000) để menu không bị che
            >
              <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                {/* Left: Categories Menu */}
                <div>
                </div>
                <div
                  style={{
                    width: '220px',
                    borderRight: '1px solid #f0f0f0',
                    backgroundColor: '#fafafa',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: '100%',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    marginTop: '12px'
                  }}
                  className="hide-scrollbar"
                >
                  <Menu
                    mode="vertical"
                    selectedKeys={[selectedCategory === 'all' ? 'all' : String(selectedCategory)]}
                    style={{
                      borderRight: 'none',
                      backgroundColor: '#fafafa',
                      height: '100%'
                    }}
                    className="[&_.ant-menu-item]:!py-[6px] [&_.ant-menu-item]:!px-4 [&_.ant-menu-item]:!h-10 [&_.ant-menu-item]:!m-1 [&_.ant-menu-item]:flex [&_.ant-menu-item]:items-center"
                    items={[
                      {
                        key: 'all',
                        label: 'Tất cả món',
                        onClick: () => handleCategoryChange('all')
                      },
                      ...categories.map((cat) => ({
                        key: String(cat.id),
                        label: cat.name,
                        onClick: () => handleCategoryChange(cat.id)
                      }))
                    ]}
                  />
                </div>

                {/* Right: Menu Items Grid */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '20px',
                    backgroundColor: '#fff',
                    height: '100%',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                  className="hide-scrollbar"
                >
                  {/* Show skeleton cards when loading, otherwise show real items or empty state */}
                  {loadingMenu ? (
                    <Row gutter={[32, 24]}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Col key={`skeleton-${i}`} xs={24} sm={12} md={8} lg={8} xl={8}>
                          <div className="skeleton-card">
                            <div className="skeleton-image" />
                            <div style={{ padding: '12px' }}>
                              <div className="skeleton-text" style={{ width: '80%' }} />
                              <div className="skeleton-text-short" />
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  ) : menuItems.length === 0 ? (
                    <Empty description="Không có món ăn" style={{ marginTop: 60 }} />
                  ) : (
                    <Row
                      gutter={[32, 24]}
                      className="menu-items-container menu-items-loaded"
                    >
                      {menuItems.map((item) => (
                        <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={8}>
                          <Card
                            hoverable
                            cover={
                              <img
                                alt={item.name}
                                src={item.image_url || 'https://via.placeholder.com/250'}
                                style={{ height: 160, objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/250?text=No+Image'
                                }}
                              />
                            }
                            onClick={() => handleAddItemToOrder(item)}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <div style={{ minHeight: 60 }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 14,
                                  display: 'block',
                                  marginBottom: 4,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  width: '100%'
                                }}
                                title={item.name}
                              >
                                {item.name}
                              </Text>
                              <Text style={{ fontSize: 13, color: '#f10b0bff', fontWeight: 'bold' }}>
                                {Number(item.price)?.toLocaleString('vi-VN')}đ
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </div>
            </Drawer>

            {/* Drawer: Order Panel */}
            <Drawer
              title={null}
              placement="right"
              width={480}
              open={orderPanelOpen}
              onClose={() => {
                setOrderPanelOpen(false)
                setMenuModalOpen(false) // Đóng modal chọn món khi đóng order panel
                setEditingNotes({}) // Clear editing notes
              }}
              closable={false}
              mask={true} // Hiển thị mask để có thể click outside
              maskClosable={true} // Cho phép đóng khi click vào mask
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
    </>
  )
}

export default TablesPage