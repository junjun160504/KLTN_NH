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
  Modal
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

// Mock data cho orders (tạm thời)
const MOCK_ORDERS = {
  1: {
    order_id: 101,
    status: 'NEW',
    items: [
      {
        id: 1,
        name: 'Kem McSundae sốt Sôcôla',
        quantity: 1,
        price: 25000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      },
      {
        id: 2,
        name: 'McNuggets 4 miếng',
        quantity: 1,
        price: 20000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      },
      {
        id: 3,
        name: 'Sữa Tươi',
        quantity: 1,
        price: 20000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      }
    ],
    total: 65000,
    created_at: '2025-10-21 14:30:00'
  },
  5: {
    order_id: 102,
    status: 'IN_PROGRESS',
    items: [
      {
        id: 4,
        name: 'Big Mac',
        quantity: 2,
        price: 89000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      },
      {
        id: 5,
        name: 'French Fries (L)',
        quantity: 1,
        price: 45000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      }
    ],
    total: 223000,
    created_at: '2025-10-21 14:15:00'
  },
  9: {
    order_id: 103,
    status: 'NEW',
    items: [
      {
        id: 6,
        name: 'McFlurry Oreo',
        quantity: 1,
        price: 35000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      },
      {
        id: 7,
        name: 'Coca Cola (M)',
        quantity: 2,
        price: 25000,
        image: 'https://product.hstatic.net/1000093072/product/nom_cu_hu_dua_tom_thit_c27e302f8c144b2cad41006fa569596e_medium.jpg'
      }
    ],
    total: 85000,
    created_at: '2025-10-21 14:45:00'
  }
}

const TablesPage = () => {
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

  // ================= API =================
  async function fetchTables() {
    try {
      setLoading(true);
      const res = await axios.get(`${REACT_APP_API_URL}/tables`);
      setTables(res.data.data || []);
    } catch (err) {
      console.error("API GET error:", err);
      message.error("Không tải được danh sách bàn");
    } finally {
      setLoading(false);
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
    e.stopPropagation() // Prevent table card click
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

  // ================= Table Card Actions =================
  const handleTableClick = (table) => {
    setSelectedTable(table)
    const order = MOCK_ORDERS[table.id]
    if (order && order.items) {
      setCurrentOrderItems([...order.items])
    } else {
      setCurrentOrderItems([])
    }
    setOrderPanelOpen(true)
  }

  const handlePrintQR = (table, e) => {
    e.stopPropagation()
    if (!table.qr_code_url) {
      message.error('Bàn này chưa có mã QR!')
      return
    }
    message.info(`In QR cho bàn ${table.table_number}`)
    // Implement print logic here (sử dụng lại logic cũ nếu cần)
  }

  const handleDeleteClick = (table, e) => {
    if (e) e.stopPropagation()

    Modal.confirm({
      title: 'Xác nhận xóa bàn',
      content: `Bạn có chắc chắn muốn xóa bàn ${table.table_number}?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleDeleteTable(table.id)
    })
  }

  // ================= Order Item Actions =================
  const handleIncreaseQuantity = (itemId) => {
    setCurrentOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  const handleDecreaseQuantity = (itemId) => {
    setCurrentOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    )
  }

  const handleRemoveItem = (itemId) => {
    Modal.confirm({
      title: 'Xác nhận xóa món',
      content: 'Bạn có chắc chắn muốn xóa món này khỏi đơn hàng?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setCurrentOrderItems((prev) => prev.filter((item) => item.id !== itemId))
        message.success('Đã xóa món khỏi đơn hàng')
      }
    })
  }

  const handleNotifyKitchen = () => {
    message.success('Đã gửi thông báo xuống bếp!')
    // TODO: Implement API call to notify kitchen
  }

  const handlePayment = () => {
    message.info('Chức năng thanh toán đang được phát triển...')
    // TODO: Implement payment logic
  }

  const calculateTotal = () => {
    return currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // ================= Table Status Logic =================
  const getTableStatus = (table) => {
    // Kiểm tra có order không (mock data)
    const hasOrder = MOCK_ORDERS[table.id]

    if (!table.is_active) {
      return 'inactive' // Badge đỏ
    }
    if (hasOrder) {
      return 'occupied' // Viền xanh
    }
    return 'available' // Xám
  }

  const getTableOrder = (table) => {
    return MOCK_ORDERS[table.id] || null
  }

  // ================= Effect =================
  useEffect(() => {
    fetchTables();
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

    // Menu items for Dropdown
    const menuItems = [
      {
        key: 'print',
        icon: <PrinterOutlined />,
        label: 'In QR',
        disabled: !table.qr_code_url,
        onClick: () => handlePrintQR(table, null)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa',
        onClick: () => openEditDrawer(table, null)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        danger: true,
        onClick: () => handleDeleteClick(table, null)
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
            menu={{ items: menuItems }}
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
                {order.total.toLocaleString('vi-VN')}đ
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
            backgroundColor: '#fafafa'
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
                  Đơn hàng #{order.order_id} • {order.created_at}
                </Text>
              )}
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setOrderPanelOpen(false)}
            />
          </div>
        </div>

        {/* Order Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {currentOrderItems.length > 0 ? (
            <>
              {/* Order Items */}
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  Danh sách món ({currentOrderItems.length})
                </Text>
                <div style={{ marginTop: 12 }}>
                  {currentOrderItems.map((item) => (
                    <Card
                      key={item.id}
                      size="small"
                      style={{
                        marginBottom: '10px',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                      bodyStyle={{ padding: '10px' }}
                    >
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Item Image */}
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '70px',
                            height: '70px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/70x70.png?text=No+Image'
                          }}
                        />

                        {/* Item Info */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <Text strong style={{ fontSize: '14px', display: 'block' }}>
                              {item.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.price.toLocaleString('vi-VN')}đ
                            </Text>
                          </div>

                          {/* Quantity Controls */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size="small">
                              <Button
                                size="small"
                                icon={<MinusOutlined />}
                                onClick={() => handleDecreaseQuantity(item.id)}
                                disabled={item.quantity <= 1}
                              />
                              <Text strong style={{ fontSize: '13px', minWidth: '25px', textAlign: 'center' }}>
                                {item.quantity}
                              </Text>
                              <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => handleIncreaseQuantity(item.id)}
                              />
                            </Space>

                            <Space>
                              <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                              </Text>
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveItem(item.id)}
                              />
                            </Space>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Divider />
            </>
          ) : (
            <Empty
              description="Bàn này chưa có đơn hàng"
              style={{ marginTop: '60px' }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
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
                Thanh toán • {total.toLocaleString('vi-VN')}đ
              </Button>
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
                  icon={<PlusOutlined />}
                  style={{ flex: 1 }}
                >
                  Thêm món
                </Button>
                <Button
                  size="medium"
                  danger
                  style={{ flex: 1 }}
                >
                  Hủy đơn
                </Button>
              </Space>
            </Space>
          </div>
        )}
      </div>
    )
  }

  // ================= Render =================
  return (
    <Layout style={{ minHeight: '100vh' }}>
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

          {/* Drawer: Order Panel */}
          <Drawer
            title={null}
            placement="right"
            width={480}
            open={orderPanelOpen}
            onClose={() => setOrderPanelOpen(false)}
            closable={false}
            bodyStyle={{ padding: 0, height: '100%' }}
            styles={{
              body: {
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
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

export default TablesPage