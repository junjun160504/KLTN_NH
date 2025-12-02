import React, { useState, useEffect, useCallback } from 'react'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import { useAuth } from '../../../contexts/AuthContext'
import {
  Layout,
  Button,
  Input,
  Table,
  Modal,
  Form,
  Popconfirm,
  Pagination,
  ConfigProvider,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  App
} from 'antd'
import vi_VN from 'antd/lib/locale/vi_VN'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  UserOutlined,
  MailOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  EyeOutlined,
  CalendarOutlined,
  TableOutlined
} from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import { authService } from '../../../services/authService'

const { Content } = Layout
const REACT_APP_API_URL = process.env.REACT_APP_API_URL

const CustomersPage = () => {
  const { message } = App.useApp()
  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Quản lý khách hàng')
  const { canAccess } = useAuth()
  const [allCustomers, setAllCustomers] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [modalOpen, setModalOpen] = useState(false)
  const [addForm] = Form.useForm()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [editingCustomer, setEditingCustomer] = useState(null)

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const token = authService.getToken()
      console.log('TOKEN: ', token)
      const response = await axios.get(`${REACT_APP_API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('API Response:', response.data)
      if (response.data.status === 200) {
        const customers = Array.isArray(response.data.data?.customers)
          ? response.data.data.customers
          : []
        console.log('Customers data:', customers)
        setAllCustomers(customers)
        setCustomers(customers)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      message.error({
        content: 'Không thể tải danh sách khách hàng',
        duration: 3,
      })
      setAllCustomers([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [message])

  // Add customer
  const handleAddCustomer = async (values) => {
    try {
      const token = authService.getToken()
      const response = await axios.post(`${REACT_APP_API_URL}/customers`, {
        phone: values.phone,
        name: values.name || null,
        email: values.email || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 200 || response.data.status === 201) {
        message.success({
          content: 'Đã thêm khách hàng thành công',
          duration: 3,
        })
        setModalOpen(false)
        addForm.resetFields()
        fetchCustomers()
      }
    } catch (error) {
      if (error?.errorFields) return
      const errorMsg = error.response?.data?.message || 'Thêm khách hàng thất bại'
      message.error({
        content: errorMsg,
        duration: 3,
      })
    }
  }

  // Edit customer
  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    editForm.setFieldsValue({
      phone: customer.phone,
      name: customer.name || '',
      email: customer.email || ''
    })
    setEditModalOpen(true)
  }

  const handleEditCustomer = async () => {
    try {
      const values = await editForm.validateFields()
      const token = authService.getToken()
      const response = await axios.put(`${REACT_APP_API_URL}/customers/${editingCustomer.id}`, {
        phone: values.phone,
        name: values.name || null,
        email: values.email || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 200) {
        message.success({
          content: 'Đã sửa thông tin khách hàng thành công',
          duration: 3,
        })
        setEditModalOpen(false)
        editForm.resetFields()
        setEditingCustomer(null)
        fetchCustomers()
      }
    } catch (error) {
      if (error?.errorFields) return
      const errorMsg = error.response?.data?.message || 'Cập nhật khách hàng thất bại'
      message.error({
        content: errorMsg,
        duration: 3,
      })
    }
  }

  // Delete customer
  const handleDeleteCustomer = async (id) => {
    try {
      const token = authService.getToken()
      const response = await axios.delete(`${REACT_APP_API_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 200) {
        message.success({
          content: 'Đã xóa khách hàng thành công',
          duration: 3,
        })
        setAllCustomers(prev => prev.filter(item => item.id !== id))
        setCustomers(prev => prev.filter(item => item.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
      message.error({
        content: 'Xóa khách hàng thất bại',
        duration: 3,
      })
    }
  }

  // View detail
  const handleViewDetail = async (customer) => {
    try {
      setSelectedCustomer(customer)
      setDetailModalOpen(true)
      setLoadingDetail(true)
      const token = authService.getToken()
      const response = await axios.get(`${REACT_APP_API_URL}/customers/${customer.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 200) {
        setSelectedCustomer({
          ...customer,
          sessions: response.data.data.sessions || [],
          totalSessions: response.data.data.totalSessions || 0,
          totalOrders: response.data.data.totalOrders || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch customer history:', error)
      message.error({
        content: 'Không thể tải lịch sử đơn hàng',
        duration: 3,
      })
    } finally {
      setLoadingDetail(false)
    }
  }

  // Effects
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Filter
  useEffect(() => {
    const search = searchText.trim().toLowerCase()
    if (!search) {
      setCustomers(allCustomers)
      return
    }
    const filtered = allCustomers.filter((c) =>
      (c.phone || '').toLowerCase().includes(search) ||
      (c.name || '').toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search)
    )
    setCustomers(filtered)
  }, [searchText, allCustomers])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  // Statistics
  const statistics = {
    totalCustomers: Array.isArray(allCustomers) ? allCustomers.length : 0,
    totalPoints: Array.isArray(allCustomers) ? allCustomers.reduce((sum, c) => sum + (c.points || 0), 0) : 0,
    avgPoints: Array.isArray(allCustomers) && allCustomers.length > 0
      ? Math.round(allCustomers.reduce((sum, c) => sum + (c.points || 0), 0) / allCustomers.length)
      : 0,
    activeCustomers: Array.isArray(allCustomers) ? allCustomers.filter(c => (c.points || 0) > 0).length : 0
  }

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      align: 'center',
      width: '8%'
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: '20%',
      align: 'center',
      render: (phone) => (
        <div className="flex justify-center gap-2">
          <span className="font-medium">{phone}</span>
        </div>
      )
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      align: 'center',
      render: (name) => name || <span className="text-gray-400">—</span>
    },
    {
      title: 'Điểm',
      dataIndex: 'points',
      key: 'points',
      align: 'center',
      width: '12%',
      render: (points) => (
        <Tag color="orange" className="font-semibold">
          {points || 0}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '15%',
      align: 'center',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '—'
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      width: '20%',
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          {canAccess(['OWNER', 'MANAGER']) && (
            <Popconfirm
              title="Xác nhận xóa?"
              onConfirm={() => handleDeleteCustomer(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="customers" />
      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} pageTitle={pageTitle} />
        <Content style={{ marginTop: 64, padding: 20, background: '#f0f2f5' }}>
          {/* Statistics */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng khách hàng"
                  value={statistics.totalCustomers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng điểm"
                  value={statistics.totalPoints}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="TB/khách"
                  value={statistics.avgPoints}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="KH có điểm"
                  value={statistics.activeCustomers}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#226533' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filter & Actions */}
          <div className="mb-4 flex justify-between items-center gap-3 flex-wrap">
            <Input
              placeholder="Tìm kiếm SĐT, tên, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="max-w-md"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
              style={{ background: '#226533' }}
            >
              Thêm khách hàng
            </Button>
          </div>

          {/* Table */}
          <ConfigProvider locale={vi_VN}>
            <div className="bg-white rounded-lg shadow">
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={customers.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                pagination={false}
                scroll={{ y: 500 }}
              />
              {customers.length > 0 && (
                <div className="p-4 border-t flex justify-end">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={customers.length}
                    onChange={setCurrentPage}
                    onShowSizeChange={(_, size) => {
                      setCurrentPage(1)
                      setPageSize(size)
                    }}
                    showSizeChanger
                    pageSizeOptions={['10', '20', '50']}
                  />
                </div>
              )}
            </div>
          </ConfigProvider>

          {/* Add Modal */}
          <Modal
            title="Thêm khách hàng"
            open={modalOpen}
            onOk={() => addForm.submit()}
            onCancel={() => {
              setModalOpen(false)
              addForm.resetFields()
            }}
            okText="Thêm"
            cancelText="Hủy"
          >
            <Form form={addForm} layout="vertical" onFinish={handleAddCustomer}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập SĐT!' },
                  { pattern: /^0\d{9,10}$/, message: 'SĐT không hợp lệ!' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
              </Form.Item>
              <Form.Item label="Tên khách hàng" name="name">
                <Input prefix={<UserOutlined />} placeholder="Nhập tên (tùy chọn)" />
              </Form.Item>
              {/* <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="Nhập email (tùy chọn)" />
              </Form.Item> */}
            </Form>
          </Modal>

          {/* Edit Modal */}
          <Modal
            title="Chỉnh sửa khách hàng"
            open={editModalOpen}
            onOk={handleEditCustomer}
            onCancel={() => {
              setEditModalOpen(false)
              editForm.resetFields()
              setEditingCustomer(null)
            }}
            okText="Cập nhật"
            cancelText="Hủy"
          >
            <Form form={editForm} layout="vertical">
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập SĐT!' },
                  { pattern: /^0\d{9,10}$/, message: 'SĐT không hợp lệ!' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
              <Form.Item label="Tên khách hàng" name="name">
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              {/* <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item> */}
              {editingCustomer && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    Điểm tích lũy: <strong>{editingCustomer.points || 0}</strong>
                  </div>
                </div>
              )}
            </Form>
          </Modal>

          {/* Detail Modal */}
          <Modal
            title={
              <div className='flex flex-col'>
                <span>Chi tiết khách hàng</span>
                <span className='text-sm text-gray-500 mb-2'>{selectedCustomer?.name}</span>
              </div>
            }
            open={detailModalOpen}
            onCancel={() => {
              setDetailModalOpen(false)
              setSelectedCustomer(null)
            }}
            footer={null}
            width={900}
          >
            {selectedCustomer ? (
              <div>
                <Card className="mb-4">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div className="text-gray-500">Số điện thoại</div>
                      <div className="font-semibold">{selectedCustomer.phone}</div>
                    </Col>

                    <Col span={12}>
                      <div className="text-gray-500">Điểm tích lũy</div>
                      <div className="font-bold text-orange-600">{selectedCustomer.points || 0}</div>
                    </Col>
                  </Row>
                  {selectedCustomer.totalSessions > 0 && (
                    <Row gutter={[16, 16]} className="mt-4 pt-4 border-t">
                      <Col span={12}>
                        <div className="text-gray-500">Tổng số phiên</div>
                        <div className="font-semibold text-blue-600">{selectedCustomer.totalSessions}</div>
                      </Col>
                      <Col span={12}>
                        <div className="text-gray-500">Tổng số đơn</div>
                        <div className="font-semibold text-green-600">{selectedCustomer.totalOrders}</div>
                      </Col>
                    </Row>
                  )}
                </Card>

                <h3 className="font-semibold mb-3">Lịch sử theo phiên</h3>
                {loadingDetail ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : selectedCustomer.sessions && selectedCustomer.sessions.length > 0 ? (
                  <Table
                    size="small"
                    bordered
                    dataSource={selectedCustomer.sessions}
                    rowKey="session_id"
                    pagination={{ pageSize: 5 }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <Table
                          size="small"
                          dataSource={record.orders}
                          rowKey="id"
                          pagination={false}
                          columns={[
                            {
                              title: 'Mã đơn',
                              dataIndex: 'id',
                              key: 'id',
                              width: 80,
                              render: (id) => <span className="text-blue-600">#{id}</span>
                            },
                            {
                              title: 'Tổng tiền',
                              dataIndex: 'total_price',
                              key: 'total_price',
                              render: (price) => `${parseFloat(price || 0).toLocaleString('vi-VN')}đ`
                            },
                            {
                              title: 'Trạng thái',
                              dataIndex: 'status',
                              key: 'status',
                              render: (status) => {
                                const map = {
                                  NEW: { text: 'Mới', color: 'orange' },
                                  IN_PROGRESS: { text: 'Đang xử lý', color: 'blue' },
                                  DONE: { text: 'Hoàn tất', color: 'green' },
                                  PAID: { text: 'Đã thanh toán', color: 'purple' },
                                  CANCELLED: { text: 'Đã hủy', color: 'red' }
                                }
                                const config = map[status] || { text: status, color: 'default' }
                                return <Tag color={config.color}>{config.text}</Tag>
                              }
                            },
                            {
                              title: 'Thời gian',
                              dataIndex: 'created_at',
                              key: 'created_at',
                              render: (date) => dayjs(date).format('HH:mm:ss')
                            }
                          ]}
                        />
                      ),
                      rowExpandable: (record) => record.orders && record.orders.length > 0
                    }}
                    columns={[
                      {
                        title: 'Phiên',
                        dataIndex: 'session_id',
                        key: 'session_id',
                        width: 80,
                        render: (id) => <span className="font-medium">#{id}</span>
                      },
                      {
                        title: 'Bàn',
                        dataIndex: 'table_number',
                        key: 'table_number',
                        width: 80,
                        render: (num) => num ? (
                          <Tag icon={<TableOutlined />} color="blue">Bàn {num}</Tag>
                        ) : '—'
                      },
                      {
                        title: 'Số đơn',
                        dataIndex: 'order_count',
                        key: 'order_count',
                        width: 80,
                        align: 'center',
                        render: (count) => <Tag color="cyan">{count} đơn</Tag>
                      },
                      {
                        title: 'Tổng tiền',
                        dataIndex: 'total_amount',
                        key: 'total_amount',
                        render: (amount) => (
                          <span className="font-semibold text-green-600">
                            {parseFloat(amount || 0).toLocaleString('vi-VN')}đ
                          </span>
                        )
                      },
                      {
                        title: 'Trạng thái phiên',
                        dataIndex: 'session_status',
                        key: 'session_status',
                        render: (status) => {
                          const map = {
                            ACTIVE: { text: 'Đang hoạt động', color: 'processing' },
                            COMPLETED: { text: 'Hoàn thành', color: 'success' },
                            CANCELLED: { text: 'Đã hủy', color: 'error' }
                          }
                          const config = map[status] || { text: status, color: 'default' }
                          return <Tag color={config.color}>{config.text}</Tag>
                        }
                      },
                      {
                        title: 'Ngày',
                        dataIndex: 'session_created_at',
                        key: 'session_created_at',
                        render: (date) => (
                          <span>
                            <CalendarOutlined className="mr-1" />
                            {dayjs(date).format('DD/MM/YYYY HH:mm')}
                          </span>
                        )
                      }
                    ]}
                  />
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded">Chưa có lịch sử phiên nào</div>
                )}
              </div>
            ) : null}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  )
}

export default CustomersPage
