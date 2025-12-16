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
    Space,
    Table,
    Tag,
    Avatar,
    Empty,
    Popover
} from 'antd'
import {
    TrendingUp,
    Download,
    RefreshCw,
    Star,
    BarChart2,
    MessageSquare,
    Coffee,
    Home,
    FileText,
    User,
    ChevronLeft,
    ChevronRight,
    Calendar,
    MapPin
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
import XLSX from 'xlsx-js-style'

const { Content } = Layout
const { Title, Text } = Typography

dayjs.extend(isBetween)

// Custom scrollbar styles
const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.25);
    }
`

// MetricCard Component - Synced with Homes.js
const MetricCard = ({ icon: Icon, title, value, suffix = '', iconColor = '#faad14', iconBgClass = 'from-yellow-50 to-yellow-100' }) => {
    return (
        <Card
            bordered={false}
            className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-35 overflow-hidden"
            bodyStyle={{
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
            hoverable
        >
            <div className="flex items-start justify-between">
                <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBgClass} flex items-center justify-center flex-shrink-0`}
                >
                    <Icon size={22} strokeWidth={2} color={iconColor} />
                </div>
                <Text className="text-gray-500 text-lg font-medium tracking-wide mt-1">
                    {title}
                </Text>
            </div>
            <div>
                <Title
                    level={3}
                    className="text-gray-800 text-2xl font-semibold leading-none tracking-tight float-end"
                    style={{ margin: '12px 0 4px 0' }}
                >
                    {value}{suffix}
                </Title>
            </div>
        </Card>
    )
}

const ReportReviewPage = () => {
    const [collapsed, setCollapsed] = useSidebarCollapse()
    const [pageTitle] = useState('Báo Cáo Đánh Giá')

    // Date Range State
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(29, 'day').startOf('day'),
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

    // Restaurant Reviews Detail
    const [restaurantReviewsDetail, setRestaurantReviewsDetail] = useState({
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    })
    const [restaurantDetailPage, setRestaurantDetailPage] = useState(1)

    // Menu Reviews Detail
    const [menuReviewsDetail, setMenuReviewsDetail] = useState({
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    })
    const [menuDetailPage, setMenuDetailPage] = useState(1)

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
                ratingDistRes,
                restaurantDetailRes,
                menuDetailRes
            ] = await Promise.all([
                reportReviewsService.getRestaurantReviewStats(start, end),
                reportReviewsService.getMenuReviewStats(start, end),
                reportReviewsService.getTopRatedMenuItems(10, start, end),
                reportReviewsService.getLowestRatedMenuItems(5, start, end),
                reportReviewsService.getRestaurantReviewTrend(start, end),
                reportReviewsService.getMenuReviewTrend(start, end),
                reportReviewsService.getCombinedRatingDistribution(start, end),
                reportReviewsService.getRestaurantReviewsDetail(start, end, restaurantDetailPage, 10),
                reportReviewsService.getMenuReviewsDetail(start, end, menuDetailPage, 10)
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

            // Set restaurant reviews detail
            if (restaurantDetailRes.success) {
                setRestaurantReviewsDetail(restaurantDetailRes.data)
            }

            // Set menu reviews detail
            if (menuDetailRes.success) {
                setMenuReviewsDetail(menuDetailRes.data)
            }
        } catch (error) {
            console.error('Error fetching reviews data:', error)
            message.error('Không thể tải dữ liệu đánh giá')
        } finally {
            setLoading(false)
        }
    }

    // Fetch restaurant reviews detail when page changes
    const fetchRestaurantReviewsDetail = async (page) => {
        try {
            const [start, end] = dateRange
            const res = await reportReviewsService.getRestaurantReviewsDetail(start, end, page, 10)
            if (res.success) {
                setRestaurantReviewsDetail(res.data)
            }
        } catch (error) {
            console.error('Error fetching restaurant reviews detail:', error)
        }
    }

    // Fetch menu reviews detail when page changes
    const fetchMenuReviewsDetail = async (page) => {
        try {
            const [start, end] = dateRange
            const res = await reportReviewsService.getMenuReviewsDetail(start, end, page, 10)
            if (res.success) {
                setMenuReviewsDetail(res.data)
            }
        } catch (error) {
            console.error('Error fetching menu reviews detail:', error)
        }
    }

    useEffect(() => {
        fetchReviewsData()
        // Reset page when date range changes
        setRestaurantDetailPage(1)
        setMenuDetailPage(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange])

    // Handle restaurant detail page change
    const handleRestaurantDetailPageChange = (page) => {
        setRestaurantDetailPage(page)
        fetchRestaurantReviewsDetail(page)
    }

    // Handle menu detail page change
    const handleMenuDetailPageChange = (page) => {
        setMenuDetailPage(page)
        fetchMenuReviewsDetail(page)
    }

    const handleRefresh = async () => {
        await fetchReviewsData()
        message.success('Đã làm mới dữ liệu')
    }

    // ====== Export Excel ======
    const handleExport = () => {
        try {
            const wb = XLSX.utils.book_new()
            const [start, end] = dateRange

            // ========== COMMON BORDER STYLE ==========
            const thinBorder = {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
            }

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

            // Create worksheet with proper cell objects for styling
            const statsWs = {}

            // Title row (row 0) - merged across all columns
            const statsTitleText = `THỐNG KÊ ĐÁNH GIÁ (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`
            statsWs['A1'] = {
                v: statsTitleText,
                t: 's',
                s: {
                    font: { bold: true, sz: 14 },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                }
            }
            // Fill empty merged cells with border
            for (let i = 1; i < statsHeaders.length; i++) {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
                statsWs[cellRef] = {
                    v: '',
                    t: 's',
                    s: { border: thinBorder }
                }
            }

            // Header row (row 2, index 1)
            statsHeaders.forEach((header, colIdx) => {
                const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIdx })
                statsWs[cellRef] = {
                    v: header,
                    t: 's',
                    s: {
                        fill: { fgColor: { rgb: 'D9E8FB' } },
                        font: { bold: true, sz: 11 },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: thinBorder
                    }
                }
            })

            // Data rows (starting from row 3, index 2)
            statsDataRows.forEach((row, rowIdx) => {
                row.forEach((val, colIdx) => {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 2, c: colIdx })

                    statsWs[cellRef] = {
                        v: val,
                        t: typeof val === 'number' ? 'n' : 's',
                        s: {
                            alignment: {
                                horizontal: colIdx === 0 ? 'left' : 'center',
                                vertical: 'center'
                            },
                            border: thinBorder
                        }
                    }

                    // Number format
                    if (typeof val === 'number' && colIdx === 2) {
                        statsWs[cellRef].z = '#,##0.0'
                    } else if (typeof val === 'number') {
                        statsWs[cellRef].z = '#,##0'
                    }
                })
            })

            // Set range for worksheet
            const statsTotalRowIdx = statsDataRows.length + 1
            statsWs['!ref'] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: { r: statsTotalRowIdx, c: statsHeaders.length - 1 }
            })

            // Merge title cell across all columns
            statsWs['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: statsHeaders.length - 1 } }
            ]

            // Set column widths
            statsWs['!cols'] = [
                { wch: 12 }, { wch: 14 }, { wch: 10 },
                { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
            ]

            // Set row heights
            const statsRowHeights = [{ hpt: 25 }]
            for (let i = 0; i <= statsDataRows.length; i++) {
                statsRowHeights.push({ hpt: 22 })
            }
            statsWs['!rows'] = statsRowHeights

            XLSX.utils.book_append_sheet(wb, statsWs, 'Thống kê đánh giá')

            // ========== 2️⃣ SHEET "TOP MÓN ĂN ĐÁNH GIÁ CAO" ==========
            const topHeaders = ['STT', 'Tên món', 'Điểm TB', 'Số lượt đánh giá']
            const topDataRows = topRatedItems.map((item, index) => [
                index + 1,
                item.name || '',
                item.avgRating || 0,
                item.reviewCount || 0
            ])

            // Create worksheet with proper cell objects for styling
            const topWs = {}

            // Title row (row 0) - merged across all columns
            const topTitleText = `TOP MÓN ĂN ĐÁNH GIÁ CAO (${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')})`
            topWs['A1'] = {
                v: topTitleText,
                t: 's',
                s: {
                    font: { bold: true, sz: 14 },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                }
            }
            // Fill empty merged cells with border
            for (let i = 1; i < topHeaders.length; i++) {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
                topWs[cellRef] = {
                    v: '',
                    t: 's',
                    s: { border: thinBorder }
                }
            }

            // Header row (row 2, index 1)
            topHeaders.forEach((header, colIdx) => {
                const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIdx })
                topWs[cellRef] = {
                    v: header,
                    t: 's',
                    s: {
                        fill: { fgColor: { rgb: 'D9E8FB' } },
                        font: { bold: true, sz: 11 },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: thinBorder
                    }
                }
            })

            // Data rows (starting from row 3, index 2)
            topDataRows.forEach((row, rowIdx) => {
                row.forEach((val, colIdx) => {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 2, c: colIdx })

                    let horizontalAlign = 'right'
                    if (colIdx === 0) horizontalAlign = 'center' // STT
                    else if (colIdx === 1) horizontalAlign = 'left' // Tên món

                    topWs[cellRef] = {
                        v: val,
                        t: typeof val === 'number' ? 'n' : 's',
                        s: {
                            alignment: {
                                horizontal: horizontalAlign,
                                vertical: 'center'
                            },
                            border: thinBorder
                        }
                    }

                    // Number format
                    if (typeof val === 'number' && colIdx === 2) {
                        topWs[cellRef].z = '#,##0.0'
                    } else if (typeof val === 'number' && colIdx === 3) {
                        topWs[cellRef].z = '#,##0'
                    }
                })
            })

            // Set range for worksheet
            const topTotalRowIdx = topDataRows.length + 1
            topWs['!ref'] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: { r: topTotalRowIdx, c: topHeaders.length - 1 }
            })

            // Merge title cell across all columns
            topWs['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: topHeaders.length - 1 } }
            ]

            // Set column widths
            topWs['!cols'] = [
                { wch: 6 },  // STT
                { wch: 35 }, // Tên món
                { wch: 10 }, // Điểm TB
                { wch: 18 }  // Số lượt đánh giá
            ]

            // Set row heights
            const topRowHeights = [{ hpt: 25 }]
            for (let i = 0; i <= topDataRows.length; i++) {
                topRowHeights.push({ hpt: 22 })
            }
            topWs['!rows'] = topRowHeights

            XLSX.utils.book_append_sheet(wb, topWs, 'Top món đánh giá cao')

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
                    {/* Custom Scrollbar Styles */}
                    <style>{scrollbarStyles}</style>

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
                        <Row gutter={[20, 20]} className="mb-6">
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={Star}
                                    title="ĐG Nhà hàng"
                                    value={restaurantReviewStats?.avgRating || 0}
                                    suffix="/5"
                                    iconColor="#faad14"
                                    iconBgClass="from-yellow-50 to-yellow-100"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={Star}
                                    title="ĐG Món ăn"
                                    value={menuReviewStats?.avgRating || 0}
                                    suffix="/5"
                                    iconColor="#1890ff"
                                    iconBgClass="from-blue-50 to-blue-100"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={MessageSquare}
                                    title="Tổng Đánh giá"
                                    value={(restaurantReviewStats?.totalReviews || 0) + (menuReviewStats?.totalReviews || 0)}
                                    iconColor="#52c41a"
                                    iconBgClass="from-emerald-50 to-emerald-100"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <MetricCard
                                    icon={Coffee}
                                    title="Món được review"
                                    value={menuReviewStats?.reviewedItems || 0}
                                    suffix=" món"
                                    iconColor="#722ed1"
                                    iconBgClass="from-purple-50 to-purple-100"
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

                        {/* Chi tiết đánh giá nhà hàng & món ăn */}
                        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                            {/* Chi tiết đánh giá nhà hàng */}
                            <Col xs={24} lg={12}>
                                <Card
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: '0' }}
                                >
                                    {/* Card Header */}
                                    <div style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid #f0f0f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Home size={16} style={{ color: '#fa8c16' }} />
                                                </div>
                                                <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
                                                    Chi tiết Đánh giá Nhà hàng
                                                </span>
                                            </div>
                                        </div>
                                        <Tag color="blue" style={{
                                            borderRadius: 6,
                                            padding: '4px 12px',
                                            fontSize: 13,
                                            fontWeight: 500
                                        }}>
                                            {restaurantReviewsDetail.pagination?.total || 0} đánh giá
                                        </Tag>
                                    </div>

                                    {restaurantReviewsDetail.reviews?.length > 0 ? (
                                        <>
                                            {/* Table Header */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1.5fr 1fr 2fr 1fr',
                                                padding: '12px 20px',
                                                background: '#fafafa',
                                                borderBottom: '1px solid #f0f0f0',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: '#000',
                                                letterSpacing: '0.5px'
                                            }}>
                                                <span style={{ textAlign: 'center' }} >Khách hàng</span>
                                                <span style={{ textAlign: 'center' }}>Đánh giá</span>
                                                <span style={{ marginLeft: 80 }}>Nội dung</span>
                                                <span style={{ textAlign: 'right' }}>Thời gian</span>
                                            </div>

                                            {/* Table Body */}
                                            <div className="custom-scrollbar" style={{ maxHeight: 450, overflowY: 'auto' }}>
                                                {restaurantReviewsDetail.reviews.slice(0, 10).map((review, index) => (
                                                    <Popover
                                                        key={review.id}
                                                        placement="left"
                                                        trigger="hover"
                                                        mouseEnterDelay={0.3}
                                                        overlayStyle={{ maxWidth: 380 }}
                                                        content={
                                                            <div style={{ padding: '4px 0' }}>
                                                                {/* Header */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                                                                    <div style={{
                                                                        width: 44,
                                                                        height: 44,
                                                                        borderRadius: '50%',
                                                                        background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <User size={20} style={{ color: '#1890ff' }} />
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#262626' }}>
                                                                            {review.customerName || 'Khách hàng'}
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#8c8c8c' }}>
                                                                            <MapPin size={12} /> Bàn {review.tableNumber || '-'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Rating */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                                    <span style={{ fontSize: 13, color: '#595959' }}>Đánh giá:</span>
                                                                    <div style={{ display: 'flex', gap: 2 }}>
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <Star
                                                                                key={star}
                                                                                size={16}
                                                                                fill={star <= review.rating ? '#faad14' : 'none'}
                                                                                color={star <= review.rating ? '#faad14' : '#d9d9d9'}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span style={{ fontWeight: 600, color: '#faad14' }}>({review.rating}/5)</span>
                                                                </div>
                                                                {/* Comment */}
                                                                <div style={{ marginBottom: 12 }}>
                                                                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>Nhận xét:</div>
                                                                    <div style={{
                                                                        background: '#fafafa',
                                                                        borderRadius: 8,
                                                                        padding: '10px 12px',
                                                                        fontSize: 13,
                                                                        color: review.comment ? '#262626' : '#bfbfbf',
                                                                        fontStyle: review.comment ? 'normal' : 'italic',
                                                                        lineHeight: 1.6,
                                                                        maxHeight: 120,
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        {review.comment || 'Không có nhận xét'}
                                                                    </div>
                                                                </div>
                                                                {/* Date */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8c8c8c' }}>
                                                                    <Calendar size={12} />
                                                                    {dayjs(review.createdAt).format('HH:mm - DD/MM/YYYY')}
                                                                </div>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1.5fr 1fr 2fr 1fr',
                                                                padding: '14px 20px',
                                                                borderBottom: index < 9 ? '1px solid #f5f5f5' : 'none',
                                                                alignItems: 'center',
                                                                transition: 'background 0.2s',
                                                                cursor: 'pointer'
                                                            }}
                                                            className="hover:bg-blue-50"
                                                        >
                                                            {/* Customer Info */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <div style={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    borderRadius: '50%',
                                                                    background: '#f0f5ff',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    <User size={16} style={{ color: '#1890ff' }} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>
                                                                        {review.customerName || 'Khách hàng'}
                                                                    </div>
                                                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                                                        Bàn {review.tableNumber || '-'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Rating */}
                                                            <div style={{ textAlign: 'center' }}>
                                                                <Tag
                                                                    style={{
                                                                        margin: 0,
                                                                        borderRadius: 6,
                                                                        padding: '2px 10px',
                                                                        fontSize: 13,
                                                                        fontWeight: 500,
                                                                        background: review.rating >= 4 ? '#f6ffed' : review.rating >= 3 ? '#fffbe6' : '#fff2f0',
                                                                        color: review.rating >= 4 ? '#52c41a' : review.rating >= 3 ? '#faad14' : '#ff4d4f',
                                                                        border: `1px solid ${review.rating >= 4 ? '#b7eb8f' : review.rating >= 3 ? '#ffe58f' : '#ffccc7'}`
                                                                    }}
                                                                >
                                                                    {review.rating} ⭐
                                                                </Tag>
                                                            </div>

                                                            {/* Comment */}
                                                            <div style={{
                                                                fontSize: 13,
                                                                color: review.comment ? '#595959' : '#bfbfbf',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                paddingRight: 12
                                                            }}>
                                                                {review.comment || 'Không có nhận xét'}
                                                            </div>

                                                            {/* Date */}
                                                            <div style={{ textAlign: 'right', fontSize: 13, color: '#8c8c8c' }}>
                                                                {dayjs(review.createdAt).format('DD/MM/YYYY')}
                                                            </div>
                                                        </div>
                                                    </Popover>
                                                ))}
                                            </div>

                                            {/* Footer with Pagination */}
                                            <div style={{
                                                padding: '12px 20px',
                                                borderTop: '1px solid #f0f0f0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: '#fafafa'
                                            }}>
                                                <span style={{ fontSize: 13, color: '#8c8c8c' }}>
                                                    Hiển thị {Math.min(10, restaurantReviewsDetail.reviews?.length || 0)} đánh giá mới nhất
                                                </span>
                                                {restaurantReviewsDetail.pagination?.totalPages > 1 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            disabled={restaurantDetailPage <= 1}
                                                            onClick={() => handleRestaurantDetailPageChange(restaurantDetailPage - 1)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#595959' }}
                                                        >
                                                            <ChevronLeft size={14} /> Trước
                                                        </Button>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            background: '#fff',
                                                            borderRadius: 6,
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            border: '1px solid #d9d9d9'
                                                        }}>
                                                            Trang {restaurantDetailPage}/{restaurantReviewsDetail.pagination?.totalPages}
                                                        </span>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            disabled={restaurantDetailPage >= restaurantReviewsDetail.pagination?.totalPages}
                                                            onClick={() => handleRestaurantDetailPageChange(restaurantDetailPage + 1)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#595959' }}
                                                        >
                                                            Sau <ChevronRight size={14} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="Không có đánh giá trong khoảng thời gian này"
                                            style={{ padding: '40px 0' }}
                                        />
                                    )}
                                </Card>
                            </Col>

                            {/* Chi tiết đánh giá món ăn */}
                            <Col xs={24} lg={12}>
                                <Card
                                    style={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: '0' }}
                                >
                                    {/* Card Header */}
                                    <div style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid #f0f0f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Coffee size={16} style={{ color: '#1890ff' }} />
                                                </div>
                                                <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>
                                                    Chi tiết Đánh giá Món ăn
                                                </span>
                                            </div>
                                        </div>
                                        <Tag color="blue" style={{
                                            borderRadius: 6,
                                            padding: '4px 12px',
                                            fontSize: 13,
                                            fontWeight: 500
                                        }}>
                                            {menuReviewsDetail.pagination?.total || 0} đánh giá
                                        </Tag>
                                    </div>

                                    {menuReviewsDetail.reviews?.length > 0 ? (
                                        <>
                                            {/* Table Header */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1.8fr 0.8fr 1.8fr 0.8fr',
                                                padding: '12px 20px',
                                                background: '#fafafa',
                                                borderBottom: '1px solid #f0f0f0',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: '#000',
                                                letterSpacing: '0.5px'
                                            }}>
                                                <span style={{ textAlign: 'center' }}>Món ăn</span>
                                                <span style={{ textAlign: 'center' }}>Đánh giá</span>
                                                <span style={{ marginLeft: 80 }}>Nội dung</span>
                                                <span style={{ textAlign: 'right' }}>Ngày</span>
                                            </div>

                                            {/* Table Body */}
                                            <div className="custom-scrollbar" style={{ maxHeight: 450, overflowY: 'auto' }}>
                                                {menuReviewsDetail.reviews.slice(0, 10).map((review, index) => (
                                                    <Popover
                                                        key={review.id}
                                                        placement="left"
                                                        trigger="hover"
                                                        mouseEnterDelay={0.3}
                                                        overlayStyle={{ maxWidth: 400 }}
                                                        content={
                                                            <div style={{ padding: '4px 0' }}>
                                                                {/* Header with Image */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                                                                    <Avatar
                                                                        size={56}
                                                                        src={review.itemImage}
                                                                        style={{
                                                                            flexShrink: 0,
                                                                            borderRadius: 10,
                                                                            border: '2px solid #f0f0f0'
                                                                        }}
                                                                    >
                                                                        {review.itemName?.charAt(0)}
                                                                    </Avatar>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#262626', marginBottom: 2 }}>
                                                                            {review.itemName}
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#8c8c8c' }}>
                                                                            <User size={12} /> {review.customerName}
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8c8c8c' }}>
                                                                            <MapPin size={11} /> Bàn {review.tableNumber || '-'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Rating */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                                    <span style={{ fontSize: 13, color: '#595959' }}>Đánh giá:</span>
                                                                    <div style={{ display: 'flex', gap: 2 }}>
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <Star
                                                                                key={star}
                                                                                size={16}
                                                                                fill={star <= review.rating ? '#faad14' : 'none'}
                                                                                color={star <= review.rating ? '#faad14' : '#d9d9d9'}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span style={{ fontWeight: 600, color: '#faad14' }}>({review.rating}/5)</span>
                                                                </div>
                                                                {/* Comment */}
                                                                <div style={{ marginBottom: 12 }}>
                                                                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>Nhận xét:</div>
                                                                    <div style={{
                                                                        background: '#fafafa',
                                                                        borderRadius: 8,
                                                                        padding: '10px 12px',
                                                                        fontSize: 13,
                                                                        color: review.comment ? '#262626' : '#bfbfbf',
                                                                        fontStyle: review.comment ? 'normal' : 'italic',
                                                                        lineHeight: 1.6,
                                                                        maxHeight: 120,
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        {review.comment || 'Không có nhận xét'}
                                                                    </div>
                                                                </div>
                                                                {/* Date */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8c8c8c' }}>
                                                                    <Calendar size={12} />
                                                                    {dayjs(review.createdAt).format('HH:mm - DD/MM/YYYY')}
                                                                </div>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1.8fr 0.8fr 1.8fr 0.8fr',
                                                                padding: '14px 20px',
                                                                borderBottom: index < 9 ? '1px solid #f5f5f5' : 'none',
                                                                alignItems: 'center',
                                                                transition: 'background 0.2s',
                                                                cursor: 'pointer'
                                                            }}
                                                            className="hover:bg-blue-50"
                                                        >
                                                            {/* Menu Item Info */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                                                <Avatar
                                                                    size={40}
                                                                    src={review.itemImage}
                                                                    style={{
                                                                        flexShrink: 0,
                                                                        borderRadius: 8,
                                                                        border: '1px solid #f0f0f0'
                                                                    }}
                                                                >
                                                                    {review.itemName?.charAt(0)}
                                                                </Avatar>
                                                                <div style={{ overflow: 'hidden' }}>
                                                                    <div style={{
                                                                        fontWeight: 500,
                                                                        fontSize: 14,
                                                                        color: '#262626',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis'
                                                                    }}>
                                                                        {review.itemName}
                                                                    </div>
                                                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                                                        {review.customerName} - Bàn {review.tableNumber || '-'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Rating */}
                                                            <div style={{ textAlign: 'center' }}>
                                                                <Tag
                                                                    style={{
                                                                        margin: 0,
                                                                        borderRadius: 6,
                                                                        padding: '2px 10px',
                                                                        fontSize: 13,
                                                                        fontWeight: 500,
                                                                        background: review.rating >= 4 ? '#f6ffed' : review.rating >= 3 ? '#fffbe6' : '#fff2f0',
                                                                        color: review.rating >= 4 ? '#52c41a' : review.rating >= 3 ? '#faad14' : '#ff4d4f',
                                                                        border: `1px solid ${review.rating >= 4 ? '#b7eb8f' : review.rating >= 3 ? '#ffe58f' : '#ffccc7'}`
                                                                    }}
                                                                >
                                                                    {review.rating} ⭐
                                                                </Tag>
                                                            </div>

                                                            {/* Comment */}
                                                            <div style={{
                                                                fontSize: 13,
                                                                color: review.comment ? '#595959' : '#bfbfbf',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                paddingRight: 12
                                                            }}>
                                                                {review.comment || 'Không có nhận xét'}
                                                            </div>

                                                            {/* Date */}
                                                            <div style={{ textAlign: 'right', fontSize: 13, color: '#8c8c8c' }}>
                                                                {dayjs(review.createdAt).format('DD/MM/YYYY')}
                                                            </div>
                                                        </div>
                                                    </Popover>
                                                ))}
                                            </div>

                                            {/* Footer with Pagination */}
                                            <div style={{
                                                padding: '12px 20px',
                                                borderTop: '1px solid #f0f0f0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: '#fafafa'
                                            }}>
                                                <span style={{ fontSize: 13, color: '#8c8c8c' }}>
                                                    Hiển thị {Math.min(10, menuReviewsDetail.reviews?.length || 0)} đánh giá mới nhất
                                                </span>
                                                {menuReviewsDetail.pagination?.totalPages > 1 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            disabled={menuDetailPage <= 1}
                                                            onClick={() => handleMenuDetailPageChange(menuDetailPage - 1)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#595959' }}
                                                        >
                                                            <ChevronLeft size={14} /> Trước
                                                        </Button>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            background: '#fff',
                                                            borderRadius: 6,
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            border: '1px solid #d9d9d9'
                                                        }}>
                                                            Trang {menuDetailPage}/{menuReviewsDetail.pagination?.totalPages}
                                                        </span>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            disabled={menuDetailPage >= menuReviewsDetail.pagination?.totalPages}
                                                            onClick={() => handleMenuDetailPageChange(menuDetailPage + 1)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#595959' }}
                                                        >
                                                            Sau <ChevronRight size={14} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="Không có đánh giá trong khoảng thời gian này"
                                            style={{ padding: '40px 0' }}
                                        />
                                    )}
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
