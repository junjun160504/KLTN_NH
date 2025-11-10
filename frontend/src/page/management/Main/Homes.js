import React, { useState } from 'react'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Badge,
  Segmented,
  Progress
} from 'antd'
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Award,
  CheckCircle,
  Package
} from 'react-feather'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const { Content } = Layout
const { Title, Text } = Typography

const Home = () => {
  const [collapsed, setCollapsed] = useSidebarCollapse()
  const [pageTitle] = useState('Tổng quan')
  const [timeRange, setTimeRange] = useState('today')
  const [revenueViewType, setRevenueViewType] = useState('hour') // hour, day, month
  const [revenueChartType, setRevenueChartType] = useState('area') // area, bar

  // Mock data - Japanese restaurant style
  const todayStats = {
    orders: 156,
    revenue: 45820000,
    customers: 234,
    avgOrderValue: 195812,
    completionRate: 94.2,
    peakHour: '12:00 - 13:00'
  }

  const revenueByHour = [
    { hour: '06:00', value: 1200000, orders: 8 },
    { hour: '07:00', value: 2800000, orders: 15 },
    { hour: '08:00', value: 3500000, orders: 18 },
    { hour: '09:00', value: 2100000, orders: 12 },
    { hour: '10:00', value: 1800000, orders: 10 },
    { hour: '11:00', value: 4200000, orders: 22 },
    { hour: '12:00', value: 8900000, orders: 45 },
    { hour: '13:00', value: 7200000, orders: 38 },
    { hour: '14:00', value: 3100000, orders: 16 },
    { hour: '15:00', value: 1500000, orders: 8 },
    { hour: '16:00', value: 1200000, orders: 6 },
    { hour: '17:00', value: 2800000, orders: 14 },
    { hour: '18:00', value: 5600000, orders: 28 },
    { hour: '19:00', value: 8100000, orders: 42 },
    { hour: '20:00', value: 6800000, orders: 35 },
    { hour: '21:00', value: 4200000, orders: 21 },
    { hour: '22:00', value: 2100000, orders: 11 }
  ]

  const revenueByDay = [
    { day: 'T2', label: 'Thứ 2', value: 28500000, orders: 145 },
    { day: 'T3', label: 'Thứ 3', value: 32100000, orders: 168 },
    { day: 'T4', label: 'Thứ 4', value: 29800000, orders: 152 },
    { day: 'T5', label: 'Thứ 5', value: 35200000, orders: 178 },
    { day: 'T6', label: 'Thứ 6', value: 42500000, orders: 215 },
    { day: 'T7', label: 'Thứ 7', value: 48900000, orders: 248 },
    { day: 'CN', label: 'Chủ nhật', value: 45820000, orders: 232 }
  ]

  const revenueByMonth = [
    { month: 'T1', label: 'Tháng 1', value: 580000000, orders: 2940 },
    { month: 'T2', label: 'Tháng 2', value: 520000000, orders: 2630 },
    { month: 'T3', label: 'Tháng 3', value: 650000000, orders: 3290 },
    { month: 'T4', label: 'Tháng 4', value: 720000000, orders: 3640 },
    { month: 'T5', label: 'Tháng 5', value: 680000000, orders: 3440 },
    { month: 'T6', label: 'Tháng 6', value: 590000000, orders: 2980 },
    { month: 'T7', label: 'Tháng 7', value: 710000000, orders: 3590 },
    { month: 'T8', label: 'Tháng 8', value: 750000000, orders: 3790 },
    { month: 'T9', label: 'Tháng 9', value: 690000000, orders: 3490 },
    { month: 'T10', label: 'Tháng 10', value: 820000000, orders: 4150 },
    { month: 'T11', label: 'Tháng 11', value: 780000000, orders: 3950 },
    { month: 'T12', label: 'Tháng 12', value: 890000000, orders: 4500 }
  ]

  // Get current revenue data based on view type
  const getCurrentRevenueData = () => {
    switch (revenueViewType) {
      case 'hour':
        return revenueByHour.map(item => ({ name: item.hour, value: item.value, orders: item.orders }))
      case 'day':
        return revenueByDay.map(item => ({ name: item.label, value: item.value, orders: item.orders }))
      case 'month':
        return revenueByMonth.map(item => ({ name: item.label, value: item.value, orders: item.orders }))
      default:
        return revenueByHour.map(item => ({ name: item.hour, value: item.value, orders: item.orders }))
    }
  }

  const topDishes = [
    { id: 1, name: 'Phở Bò Đặc Biệt', sold: 45, revenue: 4950000, image: '🍜', trend: '+12%' },
    { id: 2, name: 'Bún Chả Hà Nội', sold: 38, revenue: 3420000, image: '🍲', trend: '+8%' },
    { id: 3, name: 'Cơm Gà Xối Mỡ', sold: 32, revenue: 2880000, image: '🍗', trend: '+5%' },
    { id: 4, name: 'Bánh Mì Pate', sold: 28, revenue: 840000, image: '🥖', trend: '+3%' },
    { id: 5, name: 'Cà Phê Sữa Đá', sold: 67, revenue: 1675000, image: '☕', trend: '+15%' }
  ]

  const tableStatus = [
    { status: 'occupied', count: 12, label: 'Đang sử dụng', color: '#52c41a' },
    { status: 'reserved', count: 5, label: 'Đã đặt trước', color: '#1890ff' },
    { status: 'available', count: 8, label: 'Còn trống', color: '#d9d9d9' },
    { status: 'cleaning', count: 2, label: 'Đang dọn', color: '#faad14' }
  ]

  const recentOrders = [
    { id: '#ORD-1247', table: 'B05', time: '13:45', amount: 425000, status: 'completed', items: 4 },
    { id: '#ORD-1246', table: 'B12', time: '13:42', amount: 680000, status: 'cooking', items: 6 },
    { id: '#ORD-1245', table: 'B08', time: '13:38', amount: 195000, status: 'completed', items: 2 },
    { id: '#ORD-1244', table: 'B03', time: '13:35', amount: 890000, status: 'serving', items: 8 },
    { id: '#ORD-1243', table: 'B15', time: '13:30', amount: 340000, status: 'completed', items: 3 }
  ]

  const orderStatusData = [
    { name: 'Mới', value: 24, color: '#1890ff' },
    { name: 'Đang nấu', value: 18, color: '#faad14' },
    { name: 'Đang phục vụ', value: 12, color: '#52c41a' },
    { name: 'Hoàn thành', value: 102, color: '#8c8c8c' }
  ]

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: '#52c41a',
      cooking: '#faad14',
      serving: '#1890ff',
      pending: '#d9d9d9'
    }
    return colors[status] || '#d9d9d9'
  }

  const getStatusText = (status) => {
    const texts = {
      completed: 'Hoàn thành',
      cooking: 'Đang nấu',
      serving: 'Đang phục vụ',
      pending: 'Chờ xử lý'
    }
    return texts[status] || status
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppSidebar collapsed={collapsed} currentPageKey="homes" />

      <Layout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          pageTitle={pageTitle}
        />

        <Content
          style={{
            marginTop: 64,
            padding: '24px',
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto'
          }}
        >
          {/* Time Range Selector */}
          <div className="mb-6">
            <Segmented
              value={timeRange}
              onChange={setTimeRange}
              options={[
                { label: 'Hôm nay', value: 'today' },
                { label: 'Tuần này', value: 'week' },
                { label: 'Tháng này', value: 'month' }
              ]}
              size="large"
              style={{
                background: '#fff',
                padding: '2px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            />
          </div>

          {/* Key Metrics Cards - Japanese Minimalist Design */}
          <Row gutter={[20, 20]} className="mb-6">
            {/* Card 1: Đơn hàng */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '16px',
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)',
                  height: '160px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
                bodyStyle={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShoppingCart size={22} strokeWidth={2} color="#1890ff" />
                  </div>
                  <Text style={{
                    color: '#8c8c8c',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.3px',
                    marginTop: '4px'
                  }}>
                    Đơn hàng
                  </Text>
                </div>
                <div>
                  <Title
                    level={2}
                    style={{
                      color: '#262626',
                      margin: '12px 0 4px 0',
                      fontSize: '32px',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '-0.5px'
                    }}
                  >
                    {todayStats.orders}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2L6 10M6 2L9 5M6 2L3 5" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 6)" />
                    </svg>
                    <Text style={{ color: '#52c41a', fontSize: '12px', fontWeight: 500 }}>
                      23%
                    </Text>
                    <Text style={{ color: '#bfbfbf', fontSize: '12px' }}>
                      từ hôm qua
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Card 2: Doanh thu */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '16px',
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)',
                  height: '160px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
                bodyStyle={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DollarSign size={22} strokeWidth={2} color="#1890ff" />
                  </div>
                  <Text style={{
                    color: '#8c8c8c',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.3px',
                    marginTop: '4px'
                  }}>
                    Doanh thu
                  </Text>
                </div>
                <div>
                  <Title
                    level={2}
                    style={{
                      color: '#262626',
                      margin: '12px 0 4px 0',
                      fontSize: '24px',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '-0.3px'
                    }}
                  >
                    {formatCurrency(todayStats.revenue)}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2L6 10M6 2L9 5M6 2L3 5" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 6)" />
                    </svg>
                    <Text style={{ color: '#52c41a', fontSize: '12px', fontWeight: 500 }}>
                      18%
                    </Text>
                    <Text style={{ color: '#bfbfbf', fontSize: '12px' }}>
                      từ hôm qua
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Card 3: Khách hàng */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '16px',
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)',
                  height: '160px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
                bodyStyle={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={22} strokeWidth={2} color="#1890ff" />
                  </div>
                  <Text style={{
                    color: '#8c8c8c',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.3px',
                    marginTop: '4px'
                  }}>
                    Khách hàng
                  </Text>
                </div>
                <div>
                  <Title
                    level={2}
                    style={{
                      color: '#262626',
                      margin: '12px 0 4px 0',
                      fontSize: '32px',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '-0.5px'
                    }}
                  >
                    {todayStats.customers}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2L6 10M6 2L9 5M6 2L3 5" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 6)" />
                    </svg>
                    <Text style={{ color: '#52c41a', fontSize: '12px', fontWeight: 500 }}>
                      15%
                    </Text>
                    <Text style={{ color: '#bfbfbf', fontSize: '12px' }}>
                      từ hôm qua
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Card 4: Trung bình/đơn */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '16px',
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)',
                  height: '160px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
                bodyStyle={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <TrendingUp size={22} strokeWidth={2} color="#1890ff" />
                  </div>
                  <Text style={{
                    color: '#8c8c8c',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.3px',
                    marginTop: '4px'
                  }}>
                    Trung bình/đơn
                  </Text>
                </div>
                <div>
                  <Title
                    level={2}
                    style={{
                      color: '#262626',
                      margin: '12px 0 4px 0',
                      fontSize: '24px',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '-0.3px'
                    }}
                  >
                    {formatCurrency(todayStats.avgOrderValue)}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2L6 10M6 2L9 5M6 2L3 5" stroke="#52c41a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 6 6)" />
                    </svg>
                    <Text style={{ color: '#52c41a', fontSize: '12px', fontWeight: 500 }}>
                      8%
                    </Text>
                    <Text style={{ color: '#bfbfbf', fontSize: '12px' }}>
                      từ hôm qua
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Revenue Statistics Chart */}
          <Row gutter={[20, 20]} className="mb-6">
            <Col xs={24} lg={16}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '16px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)'
                }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TrendingUp size={18} strokeWidth={2} color="#1890ff" />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: '16px', color: '#262626', display: 'block', lineHeight: 1.3 }}>
                          Thống kê doanh thu
                        </Text>
                        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {revenueViewType === 'hour' && 'Theo giờ trong ngày'}
                          {revenueViewType === 'day' && 'Theo ngày trong tuần'}
                          {revenueViewType === 'month' && 'Theo tháng trong năm'}
                        </Text>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* View Type Filter */}
                      <Segmented
                        value={revenueViewType}
                        onChange={setRevenueViewType}
                        options={[
                          {
                            label: (
                              <div style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} strokeWidth={2} />
                                <span style={{ fontSize: '13px' }}>Giờ</span>
                              </div>
                            ),
                            value: 'hour'
                          },
                          {
                            label: (
                              <div style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span style={{ fontSize: '13px' }}>Ngày</span>
                              </div>
                            ),
                            value: 'day'
                          },
                          {
                            label: (
                              <div style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                  <line x1="8" y1="14" x2="8" y2="14" />
                                  <line x1="12" y1="14" x2="12" y2="14" />
                                  <line x1="16" y1="14" x2="16" y2="14" />
                                </svg>
                                <span style={{ fontSize: '13px' }}>Tháng</span>
                              </div>
                            ),
                            value: 'month'
                          }
                        ]}
                        size="middle"
                        style={{
                          background: '#fafafa',
                          borderRadius: '8px',
                          padding: '2px'
                        }}
                      />

                      {/* Chart Type Filter */}
                      <Segmented
                        value={revenueChartType}
                        onChange={setRevenueChartType}
                        options={[
                          {
                            label: (
                              <div style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 12 L7 8 L13 14 L21 6" />
                                  <path d="M3 22 L21 22" strokeLinecap="round" />
                                </svg>
                                <span style={{ fontSize: '13px' }}>Diện tích</span>
                              </div>
                            ),
                            value: 'area'
                          },
                          {
                            label: (
                              <div style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="6" y="14" width="4" height="8" />
                                  <rect x="14" y="8" width="4" height="14" />
                                  <line x1="3" y1="22" x2="21" y2="22" strokeLinecap="round" />
                                </svg>
                                <span style={{ fontSize: '13px' }}>Cột</span>
                              </div>
                            ),
                            value: 'bar'
                          }
                        ]}
                        size="middle"
                        style={{
                          background: '#fafafa',
                          borderRadius: '8px',
                          padding: '2px'
                        }}
                      />
                    </div>
                  </div>
                }
                bodyStyle={{ padding: '24px' }}
              >
                <ResponsiveContainer width="100%" height={340}>
                  {revenueChartType === 'area' ? (
                    <AreaChart data={getCurrentRevenueData()}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1890ff" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1890ff" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#8c8c8c' }}
                        stroke="#e8e8e8"
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#8c8c8c' }}
                        stroke="#e8e8e8"
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '8px' }}
                        itemStyle={{ color: '#1890ff', fontSize: '13px' }}
                        formatter={(value, name) => {
                          if (name === 'value') return [formatCurrency(value), 'Doanh thu']
                          return [value, 'Đơn hàng']
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#1890ff"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        dot={{ fill: '#1890ff', strokeWidth: 2, r: 4, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={getCurrentRevenueData()}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1890ff" stopOpacity={1} />
                          <stop offset="100%" stopColor="#69b1ff" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#8c8c8c' }}
                        stroke="#e8e8e8"
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#8c8c8c' }}
                        stroke="#e8e8e8"
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#262626', fontWeight: 600, marginBottom: '8px' }}
                        itemStyle={{ color: '#1890ff', fontSize: '13px' }}
                        formatter={(value, name) => {
                          if (name === 'value') return [formatCurrency(value), 'Doanh thu']
                          return [value, 'Đơn hàng']
                        }}
                        cursor={{ fill: 'rgba(24, 144, 255, 0.05)' }}
                      />
                      <Bar
                        dataKey="value"
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>

                {/* Summary Stats */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Tổng doanh thu
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#262626' }}>
                      {formatCurrency(getCurrentRevenueData().reduce((acc, item) => acc + item.value, 0))}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Tổng đơn hàng
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#262626' }}>
                      {getCurrentRevenueData().reduce((acc, item) => acc + item.orders, 0)}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Trung bình
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#262626' }}>
                      {formatCurrency(getCurrentRevenueData().reduce((acc, item) => acc + item.value, 0) / getCurrentRevenueData().length)}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '4px' }}>
                      Cao nhất
                    </Text>
                    <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                      {formatCurrency(Math.max(...getCurrentRevenueData().map(item => item.value)))}
                    </Text>
                  </div>
                </div>

                {/* Performance Metrics - Integrated */}
                <div style={{ marginTop: '24px' }}>
                  <Text strong style={{ fontSize: '14px', color: '#262626', display: 'block', marginBottom: '16px' }}>
                    Hiệu suất hoạt động
                  </Text>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <div style={{
                        padding: '16px',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #f0f0f0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          margin: '0 auto 12px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircle size={24} strokeWidth={2} color="#1890ff" />
                        </div>
                        <Title level={3} style={{ color: '#262626', margin: '0 0 4px', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.3px' }}>
                          {todayStats.completionRate}%
                        </Title>
                        <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                          Tỷ lệ hoàn thành
                        </Text>
                        <Progress
                          percent={todayStats.completionRate}
                          strokeColor="#1890ff"
                          trailColor="#f0f0f0"
                          showInfo={false}
                          strokeWidth={6}
                        />
                        <Text style={{ fontSize: '11px', color: '#52c41a', marginTop: '8px', display: 'block' }}>
                          +2.4% từ tuần trước
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div style={{
                        padding: '16px',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #f0f0f0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          margin: '0 auto 12px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Clock size={24} strokeWidth={2} color="#1890ff" />
                        </div>
                        <Title level={3} style={{ color: '#262626', margin: '0 0 4px', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.3px' }}>
                          18
                        </Title>
                        <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                          Thời gian TB (phút)
                        </Text>
                        <Progress
                          percent={75}
                          strokeColor="#1890ff"
                          trailColor="#f0f0f0"
                          showInfo={false}
                          strokeWidth={6}
                        />
                        <Text style={{ fontSize: '11px', color: '#52c41a', marginTop: '8px', display: 'block' }}>
                          Giảm 3 phút
                        </Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div style={{
                        padding: '16px',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #f0f0f0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          margin: '0 auto 12px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Users size={24} strokeWidth={2} color="#1890ff" />
                        </div>
                        <Title level={3} style={{ color: '#262626', margin: '0 0 4px', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.3px' }}>
                          87%
                        </Title>
                        <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                          Lấp đầy bàn
                        </Text>
                        <Progress
                          percent={87}
                          strokeColor="#1890ff"
                          trailColor="#f0f0f0"
                          showInfo={false}
                          strokeWidth={6}
                        />
                        <Text style={{ fontSize: '11px', color: '#52c41a', marginTop: '8px', display: 'block' }}>
                          +5% từ tuần trước
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>

            {/* Table Status & Order Status */}
            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '16px'
                }}
                title={<div className="flex items-center">
                  <div style={{
                    background: '#fff7e6',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px'
                  }}>
                    <Package size={18} color="#fa8c16" strokeWidth={2.5} />
                  </div>
                  <Text strong>Tình trạng bàn</Text>
                </div>}
              >
                <Row gutter={[8, 8]}>
                  {tableStatus.map((item) => (
                    <Col span={12} key={item.status}>
                      <div
                        style={{
                          background: '#fafafa',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          border: `2px solid ${item.color}`
                        }}
                      >
                        <Title level={2} style={{ margin: 0, color: item.color }}>
                          {item.count}
                        </Title>
                        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {item.label}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                title={<div className="flex items-center">
                  <div style={{
                    background: '#f6ffed',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px'
                  }}>
                    <CheckCircle size={18} color="#52c41a" strokeWidth={2.5} />
                  </div>
                  <Text strong>Trạng thái đơn hàng</Text>
                </div>}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4">
                  {orderStatusData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between mb-2"
                    >
                      <div className="flex items-center">
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: item.color,
                            marginRight: '8px'
                          }}
                        />
                        <Text style={{ fontSize: '13px' }}>{item.name}</Text>
                      </div>
                      <Text strong style={{ fontSize: '14px' }}>
                        {item.value}
                      </Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Top Dishes & Recent Orders */}
          <Row gutter={[16, 16]}>
            {/* Top Selling Dishes */}
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                title={
                  <div className="flex items-center">
                    <div style={{
                      background: '#fff1f0',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px'
                    }}>
                      <Award size={18} color="#ff4d4f" strokeWidth={2.5} />
                    </div>
                    <Text strong style={{ fontSize: '16px' }}>Món bán chạy</Text>
                  </div>
                }
              >
                <div>
                  {topDishes.map((dish, index) => (
                    <div
                      key={dish.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        background: index % 2 === 0 ? '#fafafa' : '#fff',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '20px'
                        }}
                      >
                        {dish.image}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: '14px', display: 'block' }}>
                          {dish.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Đã bán: {dish.sold} • {formatCurrency(dish.revenue)}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Badge
                          count={dish.trend}
                          style={{
                            background: '#52c41a',
                            fontSize: '11px',
                            padding: '0 6px'
                          }}
                        />
                        <div style={{ marginTop: '4px' }}>
                          <Award
                            size={16}
                            color={index === 0 ? '#faad14' : index === 1 ? '#d9d9d9' : '#cd7f32'}
                            strokeWidth={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Recent Orders */}
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                title={
                  <div className="flex items-center">
                    <div style={{
                      background: '#e6f7ff',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '8px'
                    }}>
                      <Clock size={18} color="#1890ff" strokeWidth={2.5} />
                    </div>
                    <Text strong style={{ fontSize: '16px' }}>Đơn hàng gần đây</Text>
                  </div>
                }
              >
                <Table
                  dataSource={recentOrders}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  columns={[
                    {
                      title: 'Mã đơn',
                      dataIndex: 'id',
                      key: 'id',
                      render: (text) => (
                        <Text strong style={{ fontSize: '13px' }}>
                          {text}
                        </Text>
                      )
                    },
                    {
                      title: 'Bàn',
                      dataIndex: 'table',
                      key: 'table',
                      render: (text) => (
                        <Tag color="blue" style={{ fontSize: '12px' }}>
                          {text}
                        </Tag>
                      )
                    },
                    {
                      title: 'Thời gian',
                      dataIndex: 'time',
                      key: 'time',
                      render: (text) => (
                        <Text style={{ fontSize: '12px' }}>{text}</Text>
                      )
                    },
                    {
                      title: 'Số món',
                      dataIndex: 'items',
                      key: 'items',
                      render: (text) => (
                        <Text style={{ fontSize: '12px' }}>{text} món</Text>
                      )
                    },
                    {
                      title: 'Tổng tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (value) => (
                        <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
                          {formatCurrency(value)}
                        </Text>
                      )
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => (
                        <Tag
                          color={getStatusColor(status)}
                          style={{
                            fontSize: '11px',
                            border: 'none',
                            borderRadius: '4px'
                          }}
                        >
                          {getStatusText(status)}
                        </Tag>
                      )
                    }
                  ]}
                  scroll={{ x: 600 }}
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Home