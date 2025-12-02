import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import AppHeader from '../../../components/AppHeader'
import AppSidebar from '../../../components/AppSidebar'
import CustomDateRangePicker from '../../../components/CustomDateRangePicker'
import useSidebarCollapse from '../../../hooks/useSidebarCollapse'
import * as reportReviewsService from '../../../services/reportReviewsService'
import {
    Layout,
    Card,
    Row,
    Col,
    Typography,
    Button,
    Spin,
    message,
    Tag,
    Table,
    Space
} from 'antd'
import {
    TrendingUp,
    Award,
    Download,
    RefreshCw,
    Star,
    AlertTriangle,
    BarChart2,
    MessageSquare,
    Coffee,
    ArrowUp,
    ArrowDown
} from 'react-feather'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend
} from 'recharts'
import * as XLSX from 'xlsx'

const { Content } = Layout
const { Title, Text } = Typography

dayjs.extend(isBetween)

// MetricCard Component - Synced with other report pages
const MetricCard = ({ icon: Icon, title, value, trend, trendLabel, valueSize = 'large', suffix = '', iconColor = '#faad14' }) => {
    return (
        <Card
            bordered={false}
            className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-40 overflow-hidden"
            bodyStyle={{
                height: '100%',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            <div className="flex items-start justify-between">
                <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${iconColor}15` }}
                >
                    <Icon size={22} style={{ color: iconColor }} />
                </div>
                {trend !== undefined && (
                    <div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                            }`}
                    >
                        {trend >= 0 ? (
                            <ArrowUp size={12} />
                        ) : (
                            <ArrowDown size={12} />
                        )}
                        <span>{Math.abs(trend).toFixed(1)}%</span>
                    </div>
                )}
            </div>

            <div>
                <div
                    className={`font-bold text-gray-800 ${valueSize === 'large' ? 'text-2xl' : 'text-xl'
                        }`}
                >
                    {value}{suffix}
                </div>
                <div className="text-gray-500 text-sm mt-1">{title}</div>
                {trendLabel && (
                    <div className="text-gray-400 text-xs mt-0.5">{trendLabel}</div>
                )}
            </div>
        </Card>
    )
}

const ReportReviewPage = () => {
    const [collapsed, setCollapsed] = useSidebarCollapse()
    const [pageTitle] = useState('Báo Cáo Đánh Giá')

    // Date Range State
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(6, 'day').startOf('day'),
        dayjs().endOf('day')
    ])

    // Loading State
    const [loading, setLoading] = useState(false)

    // Data States - Reviews
    const [restaurantReviewStats, setRestaurantReviewStats] = useState({
        totalReviews: 0,
        avgRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        growth: { reviews: 0, rating: 0 }
    })
    const [menuReviewStats, setMenuReviewStats] = useState({
        totalReviews: 0,
        avgRating: 0,
        reviewedItems: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        growth: { reviews: 0, rating: 0 }
    })
    const [topRatedItems, setTopRatedItems] = useState([])
    const [lowRatedItems, setLowRatedItems] = useState([])
    const [reviewTrendData, setReviewTrendData] = useState([])
    const [ratingDistribution, setRatingDistribution] = useState({ restaurant: [], menu: [] })

    // ==================== DATA FETCHING ====================
    const fetchReviewsData = async () => {
        setLoading(true)
        try {
            const [start, end] = dateRange

            // Fetch all review data in parallel
            const [
                restaurantStatsRes,
                menuStatsRes,
                topRatedRes,
                lowRatedRes,
                restaurantTrendRes,
                menuTrendRes,
                ratingDistRes
            ] = await Promise.all([
                reportReviewsService.getRestaurantReviewStats(start, end),
                reportReviewsService.getMenuReviewStats(start, end),
                reportReviewsService.getTopRatedMenuItems(10, start, end),
                reportReviewsService.getLowestRatedMenuItems(5, start, end),
                reportReviewsService.getRestaurantReviewTrend(start, end),
                reportReviewsService.getMenuReviewTrend(start, end),
                reportReviewsService.getCombinedRatingDistribution(start, end)
            ])

            if (restaurantStatsRes.success) {
                setRestaurantReviewStats(restaurantStatsRes.data)
            }

            if (menuStatsRes.success) {
                setMenuReviewStats(menuStatsRes.data)
            }

            if (topRatedRes.success) {
                setTopRatedItems(topRatedRes.data)
            }

            if (lowRatedRes.success) {
                setLowRatedItems(lowRatedRes.data)
            }

            // Set rating distribution
            if (ratingDistRes.success) {
                setRatingDistribution(ratingDistRes.data)
            }

            // Combine trend data
            if (restaurantTrendRes.success && menuTrendRes.success) {
                const combinedTrend = restaurantTrendRes.data.map(r => {
                    const menuData = menuTrendRes.data.find(m => m.date === r.date) || { count: 0, avgRating: 0 }
                    return {
                        date: r.date,
                        restaurantCount: r.count,
                        restaurantRating: r.avgRating,
                        menuCount: menuData.count,
                        menuRating: menuData.avgRating
                    }
                })
                setReviewTrendData(combinedTrend)
            }
        } catch (error) {
            console.error('Error fetching reviews data:', error)
            message.error('Không thể tải dữ liệu đánh giá')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReviewsData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange])

    const handleRefresh = async () => {
        await fetchReviewsData()
        message.success('Đã làm mới dữ liệu')
    }

    // ====== Export Excel ======
    const handleExport = () => {
        try {
            const wb = XLSX.utils.book_new()
            const [start, end] = dateRange

            // ========== 1️⃣ SHEET "THỐNG KÊ ĐÁNH GIÁ" ==========
            const statsHeaders = ['Loại', 'Tổng đánh giá', 'Điểm TB', '5 sao', '4 sao', '3 sao', '2 sao', '1 sao']

            const statsDataRows = [
                [
                    'Nhà hàng',
                    restaurantReviewStats.totalReviews || 0,
                    restaurantReviewStats.avgRating || 0,
                    restaurantReviewStats.distribution?.[5] || 0,
                    restaurantReviewStats.distribution?.[4] || 0,
                    restaurantReviewStats.distribution?.[3] || 0,
                    restaurantReviewStats.distribution?.[2] || 0,
                    restaurantReviewStats.distribution?.[1] || 0
                ],
                [
                    'Món ăn',
                    menuReviewStats.totalReviews || 0,
                    menuReviewStats.avgRating || 0,
                    menuReviewStats.distribution?.[5] || 0,
                    menuReviewStats.distribution?.[4] || 0,
                    menuReviewStats.distribution?.[3] || 0,
                    menuReviewStats.distribution?.[2] || 0,
                    menuReviewStats.distribution?.[1] || 0
                ]
            ]

            const statsWsData = [
                [`THỐNG KÊ ĐÁNH GIÁ (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`],
                [],
                statsHeaders,
                ...statsDataRows
            ]

            const statsWs = XLSX.utils.aoa_to_sheet(statsWsData)
            statsWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
            statsWs['!cols'] = [
                { wch: 12 }, { wch: 14 }, { wch: 10 },
                { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
            ]
            XLSX.utils.book_append_sheet(wb, statsWs, 'Thống kê đánh giá')

            // ========== 2️⃣ SHEET "TOP MÓN ĂN ĐÁNH GIÁ CAO" ==========
            const topHeaders = ['STT', 'Tên món', 'Điểm TB', 'Số lượt đánh giá']
            const topDataRows = topRatedItems.map((item, index) => [
                index + 1,
                item.name || '',
                item.avgRating || 0,
                item.reviewCount || 0
            ])

            const topWsData = [
                [`TOP MÓN ĂN ĐÁNH GIÁ CAO (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`],
                [],
                topHeaders,
                ...topDataRows
            ]

            const topWs = XLSX.utils.aoa_to_sheet(topWsData)
            topWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
            topWs['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 18 }]
            XLSX.utils.book_append_sheet(wb, topWs, 'Top món đánh giá cao')

            // ========== 3️⃣ SHEET "MÓN ĂN CẦN CẢI THIỆN" ==========
            const lowHeaders = ['STT', 'Tên món', 'Điểm TB', 'Số lượt đánh giá']
            const lowDataRows = lowRatedItems.map((item, index) => [
                index + 1,
                item.name || '',
                item.avgRating || 0,
                item.reviewCount || 0
            ])

            const lowWsData = [
                [`MÓN ĂN CẦN CẢI THIỆN (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`],
                [],
                lowHeaders,
                ...lowDataRows
            ]

            const lowWs = XLSX.utils.aoa_to_sheet(lowWsData)
            lowWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
            lowWs['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 18 }]
            XLSX.utils.book_append_sheet(wb, lowWs, 'Món cần cải thiện')

            // File name
            const fileName = `BaoCaoDanhGia_${start.format('DDMMYYYY')}_${end.format('DDMMYYYY')}.xlsx`
            XLSX.writeFile(wb, fileName)

            message.success('Xuất báo cáo thành công!')
        } catch (error) {
            message.error('Có lỗi xảy ra khi xuất báo cáo')
            console.error('Export error:', error)
        }
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <AppSidebar collapsed={collapsed} currentPageKey="report_reviews" />

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
                    {/* Header & Filters */}
                    <div className="mb-6 flex justify-between items-start gap-3 flex-wrap">
                        <div>
                            <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                                Báo Cáo Đánh Giá
                            </Title>
                            <Text className="text-gray-500">
                                Phân tích đánh giá nhà hàng và món ăn từ khách hàng
                            </Text>
                        </div>

                        <div className="flex gap-3 items-center">
                            <CustomDateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                            />
                            <Button
                                icon={<Download size={16} />}
                                onClick={handleExport}
                                className="rounded-lg h-8 flex items-center gap-1.5"
                            >
                                Xuất Excel
                            </Button>
                            <Button
                                type="primary"
                                icon={<RefreshCw size={16} />}
                                loading={loading}
                                onClick={handleRefresh}
                                className="rounded-lg h-8 flex items-center gap-1.5"
                            >
                                Làm mới
                            </Button>
                        </div>
                    </div>

                    <Spin spinning={loading}>
                        {/* Review Summary Cards */}
                        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={Star}
                                    title="Đánh giá Nhà hàng"
                                    value={restaurantReviewStats?.avgRating || 0}
                                    suffix="/5"
                                    // trend={restaurantReviewStats?.growth?.rating}
                                    // trendLabel={`${restaurantReviewStats?.totalReviews || 0} đánh giá`}
                                    iconColor="#faad14"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={Star}
                                    title="Đánh giá Món ăn"
                                    value={menuReviewStats?.avgRating || 0}
                                    suffix="/5"
                                    // trend={menuReviewStats?.growth?.rating}
                                    // trendLabel={`${menuReviewStats?.totalReviews || 0} đánh giá`}
                                    iconColor="#1890ff"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={MessageSquare}
                                    title="Tổng Đánh giá"
                                    value={(restaurantReviewStats?.totalReviews || 0) + (menuReviewStats?.totalReviews || 0)}
                                    // trend={restaurantReviewStats?.growth?.reviews}
                                    // trendLabel="Trong khoảng thời gian"
                                    iconColor="#52c41a"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={Coffee}
                                    title="Món được review"
                                    value={menuReviewStats?.reviewedItems || 0}
                                    suffix=" món"
                                    // trendLabel="Có đánh giá từ khách hàng"
                                    iconColor="#722ed1"
                                />
                            </Col>
                        </Row>

                        {/* Review Trend Chart */}
                        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                            <Col span={24}>
                                <Card
                                    title={
                                        <Space>
                                            <TrendingUp size={18} style={{ color: '#faad14' }} />
                                            <span className='text-base'>Xu hướng Đánh giá theo thời gian</span>
                                        </Space>
                                    }
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: '24px' }}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={reviewTrendData}>
                                            <defs>
                                                <linearGradient id="reviewTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#faad14" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#faad14" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="menuTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 12, fill: '#8c8c8c' }}
                                                stroke="#e8e8e8"
                                                tickLine={false}
                                                tickFormatter={(value) => dayjs(value).format('DD/MM')}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12, fill: '#8c8c8c' }}
                                                stroke="#e8e8e8"
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#fff',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                    padding: '12px'
                                                }}
                                                labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                                                formatter={(value, name) => {
                                                    const nameMap = {
                                                        restaurantCount: 'ĐG Nhà hàng',
                                                        menuCount: 'ĐG Món ăn',
                                                        restaurantRating: 'TB Nhà hàng',
                                                        menuRating: 'TB Món ăn'
                                                    }
                                                    return [value, nameMap[name] || name]
                                                }}
                                            />
                                            <Legend
                                                formatter={(value) => {
                                                    const nameMap = {
                                                        restaurantCount: 'ĐG Nhà hàng',
                                                        menuCount: 'ĐG Món ăn',
                                                        restaurantRating: 'TB Nhà hàng',
                                                        menuRating: 'TB Món ăn'
                                                    }
                                                    return nameMap[value] || value
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="restaurantCount"
                                                name="restaurantCount"
                                                stroke="#faad14"
                                                fill="url(#reviewTrendGradient)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="menuCount"
                                                name="menuCount"
                                                stroke="#1890ff"
                                                fill="url(#menuTrendGradient)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>

                        {/* Rating Distribution */}
                        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                            <Col xs={24} lg={12}>
                                <Card
                                    title={
                                        <Space>
                                            <BarChart2 size={18} style={{ color: '#722ed1' }} />
                                            <span className='text-base'>Phân bố Đánh giá Nhà hàng</span>
                                        </Space>
                                    }
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: '24px' }}
                                >
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={ratingDistribution.restaurant || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="rating"
                                                tick={{ fontSize: 12, fill: '#8c8c8c' }}
                                                tickFormatter={(value) => `${value} ⭐`}
                                            />
                                            <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                                            <Tooltip
                                                formatter={(value) => [`${value} đánh giá`, 'Số lượng']}
                                                contentStyle={{
                                                    background: '#fff',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#faad14" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                            <Col xs={24} lg={12}>
                                <Card
                                    title={
                                        <Space>
                                            <BarChart2 size={18} style={{ color: '#1890ff' }} />
                                            <span className='text-base'>Phân bố Đánh giá Món ăn</span>
                                        </Space>
                                    }
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: '24px' }}
                                >
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={ratingDistribution.menu || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="rating"
                                                tick={{ fontSize: 12, fill: '#8c8c8c' }}
                                                tickFormatter={(value) => `${value} ⭐`}
                                            />
                                            <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                                            <Tooltip
                                                formatter={(value) => [`${value} đánh giá`, 'Số lượng']}
                                                contentStyle={{
                                                    background: '#fff',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#1890ff" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>

                        {/* Top & Low Rated Items */}
                        {/* <Row gutter={[24, 24]}>
                            <Col xs={24} lg={12}>
                                <Card
                                    title={
                                        <Space>
                                            <Award size={18} style={{ color: '#52c41a' }} />
                                            <span>Top Món ăn được đánh giá cao (≥4.5⭐)</span>
                                        </Space>
                                    }
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    }}
                                    bodyStyle={{ padding: '0' }}
                                >
                                    <Table
                                        dataSource={topRatedItems.slice(0, 8)}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            {
                                                title: 'Món ăn',
                                                dataIndex: 'name',
                                                key: 'name',
                                                align: 'left',
                                                render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
                                            },
                                            {
                                                title: 'Điểm TB',
                                                dataIndex: 'avgRating',
                                                key: 'avgRating',
                                                width: 100,
                                                align: 'center',
                                                render: (value) => (
                                                    <Tag color="success" style={{ margin: 0 }}>
                                                        <Star size={12} style={{ marginRight: 4 }} />
                                                        {Number(value).toFixed(1)}
                                                    </Tag>
                                                )
                                            },
                                            {
                                                title: 'Lượt ĐG',
                                                dataIndex: 'reviewCount',
                                                key: 'reviewCount',
                                                width: 80,
                                                align: 'center'
                                            }
                                        ]}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} lg={12}>
                                <Card
                                    title={
                                        <Space>
                                            <AlertTriangle size={18} style={{ color: '#f5222d' }} />
                                            <span>Món ăn cần cải thiện (&lt;4⭐)</span>
                                        </Space>
                                    }
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: '0' }}
                                >
                                    <Table
                                        dataSource={lowRatedItems.slice(0, 8)}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            {
                                                title: 'Món ăn',
                                                dataIndex: 'name',
                                                key: 'name',
                                                render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
                                            },
                                            {
                                                title: 'Điểm TB',
                                                dataIndex: 'avgRating',
                                                key: 'avgRating',
                                                width: 100,
                                                align: 'center',
                                                render: (value) => (
                                                    <Tag color="error" style={{ margin: 0 }}>
                                                        <Star size={12} style={{ marginRight: 4 }} />
                                                        {Number(value).toFixed(1)}
                                                    </Tag>
                                                )
                                            },
                                            {
                                                title: 'Lượt ĐG',
                                                dataIndex: 'reviewCount',
                                                key: 'reviewCount',
                                                width: 80,
                                                align: 'center'
                                            }
                                        ]}
                                    />
                                </Card>
                            </Col>
                        </Row> */}
                    </Spin>
                </Content>
            </Layout>
        </Layout>
    )
}

export default ReportReviewPage
