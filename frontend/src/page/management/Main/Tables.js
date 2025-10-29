import React, { useState, useEffect } from 'react'
import {
  Layout,
  Button,
  Space,
  Typography,
  Input,
  Tag,
  message,
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
  Col
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
  MinusOutlined,
  BellOutlined
} from '@ant-design/icons'
import axios from 'axios'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'

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

  const [collapsed, setCollapsed] = useState(false)
  const [pageTitle] = useState('Quản lý bàn')
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addForm] = Form.useForm()

  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [editingTable, setEditingTable] = useState(null)

  // Order panel state
  const [orderPanelOpen, setOrderPanelOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [currentOrderItems, setCurrentOrderItems] = useState([])
  const [tableOrders, setTableOrders] = useState([]) // Lưu orders của bàn đang chọn
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [allTablesOrders, setAllTablesOrders] = useState({}) // Lưu orders của tất cả bàn {table_id: [orders]}

  // Note editing state - track which notes have been modified
  const [editingNotes, setEditingNotes] = useState({}) // { [orderItemId]: { value: string, originalValue: string, isSaving: boolean } }

  // Menu selection state
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [addingItem, setAddingItem] = useState(false) // Loading state khi thêm món

  // ================= API =================
  async function fetchTables() {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/tables`);
      const tablesData = res.data.data || [];
      setTables(tablesData);

      // Fetch orders cho tất cả các bàn
      const ordersMap = {};
      await Promise.all(
        tablesData.map(async (table) => {
          try {
            const orderRes = await axios.get(`${REACT_APP_API_URL}/orders/table/${table.id}`);
            if (orderRes.data && orderRes.data.data) {
              // Filter: Chỉ lấy orders active (không hiển thị CANCELLED)
              const activeOrders = orderRes.data.data.filter(
                order => order.status !== 'CANCELLED' && order.status !== 'PAID'
              );
              ordersMap[table.id] = activeOrders;
            }
          } catch (err) {
            console.error(`Failed to fetch orders for table ${table.id}:`, err);
            ordersMap[table.id] = [];
          }
        })
      );
      setAllTablesOrders(ordersMap);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh sách bàn");
    } finally {
      setLoading(false);
    }
  }

  // Update single table orders (optimize performance)
  async function updateSingleTableOrders(tableId) {
    try {
      const orderRes = await axios.get(`${REACT_APP_API_URL}/orders/table/${tableId}`);
      if (orderRes.data && orderRes.data.data) {
        // Filter: Chỉ lấy orders active
        const activeOrders = orderRes.data.data.filter(
          order => order.status !== 'CANCELLED' && order.status !== 'PAID'
        );

        // Chỉ update state cho table này
        setAllTablesOrders(prev => ({
          ...prev,
          [tableId]: activeOrders
        }));
      }
    } catch (err) {
      console.error(`Failed to update orders for table ${tableId}:`, err);
    }
  }

  async function handleDeleteTable(id) {
    try {
      await axios.delete(`${REACT_APP_API_URL}/tables/${id}`);
      message.success("Xóa bàn thành công");
      fetchTables();
    } catch (err) {
      console.error("API DELETE error:", err);
      const errorMsg = err.response?.data?.message || "Xóa bàn thất bại";
      message.error(errorMsg);
    }
  }

  // Thêm bàn mới
  const handleAddTable = async () => {
    try {
      const values = await addForm.validateFields();
      await axios.post(`${REACT_APP_API_URL}/tables`, {
        table_number: values.table_number,
      });
      message.success("Thêm bàn mới thành công! QR code đã được tạo tự động.");
      setDrawerOpen(false);
      addForm.resetFields();
      fetchTables();
    } catch (err) {
      if (err?.errorFields) return;
      const errorMsg = err.response?.data?.message || "Thêm bàn mới thất bại!";
      message.error(errorMsg);
    }
  };

  // Mở popup chỉnh sửa
  const openEditDrawer = (table, e) => {
    if (e) e.stopPropagation() // Prevent table card click
    setEditingTable(table)
    editForm.setFieldsValue({
      table_number: table.table_number,
      is_active: table.is_active
    })
    setEditDrawerOpen(true)
  }

  // Sửa bàn
  const handleEditTable = async () => {
    try {
      const values = await editForm.validateFields()
      await axios.put(`${REACT_APP_API_URL}/tables/${editingTable.id}`, {
        table_number: values.table_number,
        is_active: values.is_active
      })
      message.success('Cập nhật bàn thành công!')
      setEditDrawerOpen(false)
      editForm.resetFields()
      fetchTables()
    } catch (err) {
      if (err?.errorFields) return
      const errorMsg = err.response?.data?.message || 'Cập nhật bàn thất bại!'
      message.error(errorMsg)
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

  // ================= Fetch Orders by Table =================
  const fetchOrdersByTable = async (tableId, forceUpdate = false) => {
    try {
      setLoadingOrders(true)
      const response = await axios.get(`${REACT_APP_API_URL}/orders/table/${tableId}`)

      if (response.data && response.data.data) {
        // Filter: Chỉ lấy orders KHÔNG bị CANCELLED (bỏ qua đơn đã hủy)
        const activeOrders = response.data.data.filter(
          order => order.status !== 'CANCELLED' && order.status !== 'PAID'
        )


        // Nếu có orders, load items của order đầu tiên (hoặc combine tất cả items)
        let newItems = []
        if (activeOrders.length > 0) {
          // Combine tất cả items từ các orders active
          newItems = activeOrders.flatMap(order =>
            (order.items || []).map(item => ({
              id: item.menu_item_id || item.id, // menu_item_id để hiển thị
              order_item_id: item.id, // order_item.id để update/delete
              name: item.name || item.menu_item_name,
              quantity: item.quantity,
              price: item.unit_price,
              image: item.image_url || item.image || 'https://via.placeholder.com/70',
              note: item.note || '', // Thêm note field
              order_id: order.id,
              order_status: order.status
            }))
          )
        }

        // So sánh với data cũ để quyết định có cần update UI không
        const hasChanges = forceUpdate || !areOrderItemsEqual(currentOrderItems, newItems)

        if (hasChanges) {
          setTableOrders(activeOrders)
          setCurrentOrderItems(newItems)
        } else {
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      message.error('Không thể tải thông tin đơn hàng')
      setTableOrders([])
      setCurrentOrderItems([])
    } finally {
      setLoadingOrders(false)
    }
  }

  // Helper function to compare order items
  const areOrderItemsEqual = (oldItems, newItems) => {
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
  }

  // const handleCreateOrder = async () => {
  //   if (!selectedTable || cartItems.length === 0) {
  //     message.warning('Vui lòng chọn món trước khi tạo đơn')
  //     return
  //   }

  //   try {
  //     setLoadingMenu(true)
  //     const orderData = {
  //       table_id: selectedTable.id,
  //       items: cartItems.map(item => ({
  //         menu_item_id: item.id,
  //         quantity: item.quantity,
  //         note: item.note || ''
  //       }))
  //     }

  //     await axios.post(`${REACT_APP_API_URL}/orders/admin/create`, orderData)
  //     message.success('Tạo đơn hàng thành công!')

  //     // Reset state
  //     setMenuModalOpen(false)
  //     setCartItems([])
  //     setSelectedCategory('all')
  //     fetchTables() // Refresh tables

  //     // Refresh orders - force update vì vừa tạo order mới
  //     if (selectedTable) {
  //       fetchOrdersByTable(selectedTable.id, true)
  //     }
  //   } catch (err) {
  //     console.error('Failed to create order:', err)
  //     const errorMsg = err.response?.data?.message || 'Tạo đơn hàng thất bại!'
  //     message.error(errorMsg)
  //   } finally {
  //     setLoadingMenu(false)
  //   }
  // }

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

    const qrImageUrl = `${replaceUrlServer(REACT_APP_API_URL)}${table.qr_code_url}`

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
      const qrImageUrl = `${replaceUrlServer(REACT_APP_API_URL)}${table.qr_code_url}`
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

      // Update allTablesOrders để table status hiển thị đúng
      setAllTablesOrders(prev => {
        const tableOrders = prev[selectedTable.id] || []
        const updatedOrders = tableOrders.map(order => {
          if (order.id === item.order_id) {
            const updatedItems = (order.items || []).map(orderItem =>
              orderItem.id === orderItemId
                ? { ...orderItem, quantity: newQuantity }
                : orderItem
            )
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0)
            return { ...order, items: updatedItems, total_price: newTotal }
          }
          return order
        })
        return { ...prev, [selectedTable.id]: updatedOrders }
      })
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

      // Update allTablesOrders
      setAllTablesOrders(prev => {
        const tableOrders = prev[selectedTable.id] || []
        const updatedOrders = tableOrders.map(order => {
          if (order.id === item.order_id) {
            const updatedItems = (order.items || []).map(orderItem =>
              orderItem.id === orderItemId
                ? { ...orderItem, quantity: newQuantity }
                : orderItem
            )
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0)
            return { ...order, items: updatedItems, total_price: newTotal }
          }
          return order
        })
        return { ...prev, [selectedTable.id]: updatedOrders }
      })
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

      // Update allTablesOrders
      setAllTablesOrders(prev => {
        const tableOrders = prev[selectedTable.id] || []

        // Nếu là item cuối cùng hoặc order bị xóa, remove order khỏi list
        if (isLastItem || response.data?.data?.deleted || response.data?.message?.includes('deleted')) {
          const updatedOrders = tableOrders.filter(order => order.id !== item.order_id)
          return { ...prev, [selectedTable.id]: updatedOrders }
        }

        // Nếu không, chỉ remove item khỏi order
        const updatedOrders = tableOrders.map(order => {
          if (order.id === item.order_id) {
            const updatedItems = (order.items || []).filter(orderItem => orderItem.id !== orderItemId)
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0)
            return { ...order, items: updatedItems, total_price: newTotal }
          }
          return order
        })
        return { ...prev, [selectedTable.id]: updatedOrders }
      })

      // Nếu xóa món cuối cùng, đóng panel
      if (isLastItem || response.data?.data?.deleted || response.data?.message?.includes('deleted')) {
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
      // Kiểm tra xem món đã có trong order chưa (theo menu_item_id)
      const existingItem = currentOrderItems.find((i) => i.id === menuItem.id)

      if (existingItem) {
        // Nếu món đã có trong order, tăng số lượng
        if (!existingItem.order_item_id) {
          console.error('Existing item missing order_item_id:', existingItem)
          message.error('Lỗi: Không tìm thấy ID của món trong đơn hàng')
          return
        }
        await handleIncreaseQuantity(existingItem.order_item_id)
      } else {
        // Nếu món chưa có, tạo order mới với item này
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
        const newOrder = response.data.data
        const newOrderItem = newOrder.items[newOrder?.items?.length - 1]

        // Optimistic UI update - Thêm item mới vào currentOrderItems
        const newItem = {
          id: menuItem.id, // menu_item_id
          order_item_id: newOrderItem.id, // order_item.id
          name: menuItem.name,
          quantity: 1,
          price: menuItem.price,
          image: menuItem.image_url || 'https://via.placeholder.com/70',
          note: newOrderItem.note || '', // Thêm note field
          order_id: newOrder.id,
          order_status: newOrder.status
        }

        setCurrentOrderItems(prev => [...prev, newItem])

        // Update allTablesOrders để table card hiển thị đúng
        setAllTablesOrders(prev => {
          const tableOrders = prev[selectedTable.id] || []
          // Kiểm tra order đã tồn tại chưa
          const existingOrderIndex = tableOrders.findIndex(o => o.id === newOrder.id)

          if (existingOrderIndex >= 0) {
            // Order đã tồn tại, update items và total
            const updatedOrders = [...tableOrders]
            updatedOrders[existingOrderIndex] = {
              ...updatedOrders[existingOrderIndex],
              items: [...(updatedOrders[existingOrderIndex].items || []), newOrderItem],
              total_price: (updatedOrders[existingOrderIndex].total_price || 0) + (menuItem.price * 1)
            }
            return { ...prev, [selectedTable.id]: updatedOrders }
          } else {
            // Order mới, thêm vào list
            return {
              ...prev,
              [selectedTable.id]: [...tableOrders, newOrder]
            }
          }
        })
      }
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
              <span class="text-xl font-bold">${table.table_number}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Đơn hàng:</span>
              <span class="font-mono">#${order.order_id}</span>
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
  }

  const handleNotifyKitchen = async () => {
    const order = getTableOrder(selectedTable)

    if (!order) {
      message.warning('Không tìm thấy đơn hàng!')
      return
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status === 'IN_PROGRESS') {
      message.info('Đơn hàng đã được xác nhận trước đó!')
      // Vẫn cho phép in lại bill
      printKitchenBill(order, selectedTable, currentOrderItems)
      return
    }

    if (order.status !== 'NEW') {
      message.warning('Chỉ có thể báo bếp cho đơn hàng mới!')
      return
    }

    try {
      setLoadingOrders(true)

      // 1. Confirm order (NEW → IN_PROGRESS)
      await axios.put(`${REACT_APP_API_URL}/staff/orders/${order.order_id}/confirm`)

      message.success('Đã xác nhận đơn hàng!')

      // 2. Print kitchen bill
      printKitchenBill(order, selectedTable, currentOrderItems)

      // 3. Update UI - chỉ update table hiện tại
      await updateSingleTableOrders(selectedTable.id)
    } catch (err) {
      console.error('Failed to notify kitchen:', err)
      const errorMsg = err.response?.data?.message || 'Gửi thông báo bếp thất bại!'
      message.error(errorMsg)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleCancelOrder = async () => {
    const order = getTableOrder(selectedTable)

    if (!order) {
      message.warning('Không tìm thấy đơn hàng!')
      return
    }

    // Show confirmation modal
    modal.confirm({
      title: 'Xác nhận hủy đơn hàng',
      content: `Bạn có chắc chắn muốn hủy đơn hàng #${order.order_id} của bàn ${selectedTable.table_number}?`,
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        try {
          setLoadingOrders(true)

          await axios.put(`${REACT_APP_API_URL}/orders/${order.order_id}/cancel`, {
            reason: 'Admin hủy đơn từ quản lý bàn'
          })

          message.success('Đã hủy đơn hàng thành công!')

          // Chỉ update table hiện tại thay vì fetch tất cả
          await updateSingleTableOrders(selectedTable.id)

          // Close order panel if no more orders
          const updatedOrders = allTablesOrders[selectedTable.id] || []
          if (updatedOrders.length === 0) {
            setOrderPanelOpen(false)
          }
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
    const order = getTableOrder(selectedTable)

    if (!order) {
      message.warning('Không tìm thấy đơn hàng!')
      return
    }

    const total = calculateTotal()
    const itemCount = currentOrderItems.length
    const totalQuantity = currentOrderItems.reduce((sum, item) => sum + item.quantity, 0)

    // Show confirmation modal with Japanese design (Tailwind CSS)
    modal.confirm({
      title: null,
      icon: null,
      width: 420,
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
            {/* Table & Order ID */}
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
                  Đơn hàng
                </div>
                <div className="text-[15px] font-semibold text-[#262626] font-mono">
                  #{order.order_id}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-[#595959] font-medium">
                Số lượng món
              </span>
              <span className="text-[13px] text-[#262626] font-semibold">
                {itemCount} món ({totalQuantity} phần)
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#d9d9d9] to-transparent my-3" />

            {/* Total Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#262626] font-semibold">
                Tổng thanh toán
              </span>
              <div className="text-2xl font-bold text-[#52c41a] tracking-tight">
                {Number(total)?.toLocaleString('vi-VN')}₫
              </div>
            </div>
          </div>

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

          await axios.put(`${REACT_APP_API_URL}/orders/${order.order_id}/status`, {
            status: 'PAID'
          })

          message.success('Đã cập nhật trạng thái thanh toán!')

          // Chỉ update table hiện tại thay vì fetch tất cả
          await updateSingleTableOrders(selectedTable.id)

          // Close order panel
          setOrderPanelOpen(false)
        } catch (err) {
          console.error('Failed to update payment status:', err)
          const errorMsg = err.response?.data?.message || 'Cập nhật trạng thái thất bại!'
          message.error(errorMsg)
        } finally {
          setLoadingOrders(false)
        }
      }
    })
  }

  const calculateTotal = () => {
    return currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
      return 'occupied' // Viền xanh
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
    const totalAmount = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)

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
    fetchTables();
    // Fetch menu categories và items 1 lần khi component mount
    fetchCategories();
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const replaceUrlServer = (url) => {
    return url.replace('/api', '')
  }

  // ================= Order Status Tag =================
  const getOrderStatusTag = (status) => {
    const statusMap = {
      NEW: { text: 'Chờ xác nhận', color: 'orange' },
      IN_PROGRESS: { text: 'Đang chế biến', color: 'blue' },
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
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa'
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        danger: true
      }
    ]

    return (
      <Badge.Ribbon
        text={status === 'inactive' ? 'Tạm ngừng' : null}
        color="red"
        style={{ display: status === 'inactive' ? 'block' : 'none' }}
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
                zIndex: 10,
                color: '#666'
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

    const order = getTableOrder(selectedTable)
    const total = calculateTotal()

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
        {/* Header */}
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
                {order && getOrderStatusTag(order.status)}
              </div>
              {order && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Đơn hàng #{order.order_id} • {formatDate(order.created_at)}
                </Text>
              )}
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => {
                setOrderPanelOpen(false)
                setMenuModalOpen(false) // Đóng cả modal chọn món
                setEditingNotes({}) // Clear editing notes
              }}
            />
          </div>

          {/* Add Item Button - Bottom Right */}
          <Button
            type="text"
            icon={<PlusOutlined style={{ fontSize: '20px', fontWeight: 'bold' }} />}
            onClick={() => {
              setMenuModalOpen(true)
              // Menu đã được fetch sẵn khi component mount
            }}
            style={{
              position: 'absolute',
              bottom: '-42px',
              right: '16px',
              color: '#226533',
              padding: '4px 8px'
            }}
          />
        </div>

        {/* Order Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>Đang tải đơn hàng...</Text>
            </div>
          ) : currentOrderItems.length > 0 ? (
            <>
              {/* Order Items */}
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  Danh sách món ({currentOrderItems.length})
                </Text>
                <div style={{ marginTop: 12 }}>
                  {currentOrderItems.map((item) => {
                    // CRITICAL: order_item_id phải tồn tại và unique
                    // Không được fallback về menu_item_id vì nhiều items có thể cùng menu_item_id
                    const orderItemId = item.order_item_id

                    if (!orderItemId) {
                      console.error('Missing order_item_id for item:', item)
                      return null // Skip rendering items without valid ID
                    }

                    // Key MUST be unique - use order_item_id (not menu_item_id)
                    // Combining with order_id for extra safety
                    const uniqueKey = `${item.order_id}-${orderItemId}`

                    return (
                      <Card
                        key={uniqueKey}
                        size="small"
                        className="mb-2.5 rounded-lg overflow-hidden border border-[#f0f0f0] hover:border-[#d9d9d9] transition-all duration-200"
                        bodyStyle={{ padding: '12px' }}
                      >
                        <div className="flex gap-3">
                          {/* Item Image */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-[70px] h-[70px] object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/70x70.png?text=No+Image'
                            }}
                          />

                          {/* Item Info */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <Text strong className="text-sm block mb-1">
                                {item.name}
                              </Text>
                              <Text type="secondary" className="text-xs">
                                {item.price?.toLocaleString('vi-VN')}đ
                              </Text>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex justify-between items-center mt-2">
                              <Space size="small">
                                <Button
                                  size="small"
                                  icon={<MinusOutlined />}
                                  onClick={() => handleDecreaseQuantity(orderItemId)}
                                  disabled={item.quantity <= 1}
                                  className="w-7 h-7 flex items-center justify-center rounded-md"
                                />
                                <Text strong className="text-[13px] min-w-[25px] text-center">
                                  {item.quantity}
                                </Text>
                                <Button
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => handleIncreaseQuantity(orderItemId)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md"
                                />
                              </Space>

                              <Space>
                                <Text strong className="text-[#1890ff] text-sm">
                                  {(item.price * item.quantity)?.toLocaleString('vi-VN')}đ
                                </Text>
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveItem(orderItemId)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md"
                                />
                              </Space>
                            </div>
                          </div>
                        </div>

                        {/* Note Section - Japanese Design with Save Button */}
                        <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                          <div className="flex gap-2">
                            <Input.TextArea
                              id={`note-textarea-${orderItemId}`}
                              placeholder="💬 Thêm ghi chú cho món ăn..."
                              defaultValue={item.note || ''}
                              onFocus={() => {
                                // Đánh dấu đang editing - hiện nút Lưu/Hủy
                                if (!editingNotes[orderItemId]) {
                                  setEditingNotes(prev => ({
                                    ...prev,
                                    [orderItemId]: { isEditing: true, isSaving: false }
                                  }))
                                }
                              }}
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              className="text-[13px] leading-relaxed flex-1"
                              style={{
                                borderRadius: '6px',
                                borderColor: editingNotes[orderItemId] ? '#1890ff' : '#e8e8e8',
                                backgroundColor: '#fafafa',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            />
                            {editingNotes[orderItemId] && (
                              <Space size="small" className="self-start">
                                <Button
                                  size="small"
                                  onClick={() => {
                                    // Hủy thay đổi - reset input về giá trị ban đầu
                                    const textarea = document.getElementById(`note-textarea-${orderItemId}`)
                                    if (textarea) {
                                      textarea.value = item.note || ''
                                    }
                                    // Xóa editing state
                                    setEditingNotes(prev => {
                                      const updated = { ...prev }
                                      delete updated[orderItemId]
                                      return updated
                                    })
                                  }}
                                  className="h-7 px-3 rounded-md flex items-center justify-center"
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 500
                                  }}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={editingNotes[orderItemId]?.isSaving}
                                  onClick={() => handleSaveNote(orderItemId, item)}
                                  className="h-7 px-3 rounded-md bg-[#1890ff] hover:bg-[#40a9ff] flex items-center justify-center"
                                  style={{
                                    minWidth: '60px',
                                    fontSize: '12px',
                                    fontWeight: 500
                                  }}
                                >
                                  {editingNotes[orderItemId]?.isSaving ? 'Đang lưu...' : 'Lưu'}
                                </Button>
                              </Space>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>

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
                  // Menu đã được fetch sẵn khi component mount
                }}
                style={{
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  borderRadius: '12px'
                  // textTransform: 'uppercase'
                }}
              >
                Thêm đơn hàng
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentOrderItems.length > 0 && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space style={{ width: '100%' }} size="middle">
                <Button
                  size="medium"
                  icon={<BellOutlined />}
                  onClick={handleNotifyKitchen}
                  style={{ flex: 1 }}
                >
                  Báo bếp
                </Button>
                <Button
                  size="medium"
                  danger
                  onClick={handleCancelOrder}
                  style={{ flex: 1 }}
                >
                  Hủy đơn
                </Button>
              </Space>
              <Button
                type="primary"
                size="large"
                block
                icon={<DollarOutlined />}
                onClick={handlePayment}
                style={{
                  height: '48px',
                  fontSize: '15px',
                  fontWeight: 'bold'
                }}
              >
                Thanh toán • {Number(total)?.toLocaleString('vi-VN')}đ
              </Button>
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
                    <Option value="available">
                      <Tag color="default">Trống</Tag>
                    </Option>
                    <Option value="occupied">
                      <Tag color="green">Đang sử dụng</Tag>
                    </Option>
                    <Option value="inactive">
                      <Tag color="red">Tạm ngừng</Tag>
                    </Option>
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
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ background: '#226533' }}
                    onClick={() => setDrawerOpen(true)}
                  >
                    Thêm bàn mới
                  </Button>
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
                    <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                      {filteredTables.filter((t) => getTableStatus(t) === 'occupied').length}
                    </span>{' '}
                    đang sử dụng
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
                  <Form.Item label="QR Code hiện tại">
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={`${replaceUrlServer(REACT_APP_API_URL)}${editingTable.qr_code_url}`}
                        alt="Current QR"
                        style={{ width: 180, height: 180, border: '1px solid #d9d9d9', borderRadius: 8 }}
                      />
                      <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                        QR Code cho bàn {editingTable.table_number}
                      </div>
                    </div>
                  </Form.Item>
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