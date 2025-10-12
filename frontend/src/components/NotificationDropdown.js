import React, { useState } from 'react';
import { List, Typography, Button, Space, Tabs, Empty, Tag } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    ShoppingOutlined,
    PhoneOutlined,
    CreditCardOutlined,
    StarOutlined,
    InboxOutlined,
    SettingOutlined,
    CloseOutlined,
    CheckOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

const { Text } = Typography;

// Icon mapping for notification types
const getNotificationIcon = (type, priority) => {
    const iconProps = {
        style: { fontSize: 20 }
    };

    const iconMap = {
        [NOTIFICATION_TYPES.ORDER_NEW]: <ShoppingOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />,
        [NOTIFICATION_TYPES.ORDER_UPDATE]: <ShoppingOutlined {...iconProps} style={{ ...iconProps.style, color: '#1890ff' }} />,
        [NOTIFICATION_TYPES.CALL_STAFF]: <PhoneOutlined {...iconProps} style={{ ...iconProps.style, color: '#ff4d4f' }} />,
        [NOTIFICATION_TYPES.PAYMENT]: <CreditCardOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />,
        [NOTIFICATION_TYPES.REVIEW]: <StarOutlined {...iconProps} style={{ ...iconProps.style, color: '#faad14' }} />,
        [NOTIFICATION_TYPES.INVENTORY]: <InboxOutlined {...iconProps} style={{ ...iconProps.style, color: '#722ed1' }} />,
        [NOTIFICATION_TYPES.SYSTEM]: <SettingOutlined {...iconProps} style={{ ...iconProps.style, color: '#8c8c8c' }} />,
        [NOTIFICATION_TYPES.SUCCESS]: <CheckCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />,
        [NOTIFICATION_TYPES.ERROR]: <ExclamationCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#ff4d4f' }} />,
        [NOTIFICATION_TYPES.WARNING]: <ExclamationCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#faad14' }} />,
        [NOTIFICATION_TYPES.INFO]: <InfoCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#1890ff' }} />
    };

    return iconMap[type] || <InfoCircleOutlined {...iconProps} />;
};

// Priority badge
const getPriorityTag = (priority) => {
    if (!priority) return null;

    const priorityConfig = {
        high: { color: 'red', text: 'Khẩn' },
        medium: { color: 'orange', text: 'Trung bình' },
        low: { color: 'default', text: 'Thấp' }
    };

    const config = priorityConfig[priority];
    if (!config) return null;

    return <Tag color={config.color} style={{ fontSize: 11 }}>{config.text}</Tag>;
};

// Time ago formatter
const formatTimeAgo = (timestamp) => {

    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

    return date.toLocaleDateString('vi-VN');
};

const NotificationDropdown = ({ onClose }) => {
    const navigate = useNavigate();
    const {
        filteredNotifications,
        unreadCount,
        setFilter,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotifications();

    const [activeTab, setActiveTab] = useState('all');

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        markAllAsRead();
        // Also call API to persist
        await notificationService.markAllAsRead();
    };

    // Handle notification click
    const handleNotificationClick = async (notification) => {
        // Mark as read (both local and API)
        if (!notification.isRead) {
            markAsRead(notification.id);
            // Also call API to persist
            await notificationService.markAsRead(notification.id);
        }

        // Navigate if has action URL
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            onClose?.();
        }
    };

    // Handle delete
    const handleDelete = async (e, notificationId) => {
        e.stopPropagation();
        deleteNotification(notificationId);
        // Also call API to persist
        await notificationService.deleteNotification(notificationId);
    };

    // Handle mark as read
    const handleMarkAsRead = async (e, notificationId) => {
        e.stopPropagation();
        markAsRead(notificationId);
        // Also call API to persist
        await notificationService.markAsRead(notificationId);
    };

    // Tab change handler
    const handleTabChange = (key) => {
        setActiveTab(key);
        setFilter(key);
    };

    // Tabs configuration
    const tabItems = [
        {
            key: 'all',
            label: `Tất cả`
        },
        {
            key: 'unread',
            label: `Chưa đọc (${unreadCount})`
        },
        {
            key: NOTIFICATION_TYPES.CALL_STAFF,
            label: 'Gọi nhân viên'
        },
        {
            key: 'ORDERS', // Special filter for both ORDER_NEW and ORDER_UPDATE
            label: 'Đơn hàng'
        },
        {
            key: NOTIFICATION_TYPES.PAYMENT,
            label: 'Thanh toán'
        }
    ];

    return (
        <div style={{
            width: 420,
            maxHeight: 600,
            background: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideDown 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fafafa'
            }}>
                <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
                <Space size={8}>
                    {unreadCount > 0 && (
                        <Button
                            type="link"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={handleMarkAllAsRead}
                            style={{ padding: '4px 8px' }}
                        >
                            Đánh dấu tất cả
                        </Button>
                    )}
                    <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        style={{ padding: '4px 8px' }}
                    />
                </Space>
            </div>

            {/* Tabs Filter */}
            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                size="small"
                items={tabItems}
                tabBarStyle={{
                    marginBottom: 0,
                    borderBottom: '1px solid #f0f0f0',
                    background: '#fff',
                    padding: '0 8px'
                }}
                moreIcon={null}
            />

            {/* Notification List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 450
            }}>
                {filteredNotifications.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có thông báo"
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <List
                        dataSource={filteredNotifications}
                        renderItem={(item) => (
                            <List.Item
                                key={item.id}
                                style={{
                                    padding: 0,
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                    background: !item.isRead ? '#e6f7ff' : '#fff',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = !item.isRead ? '#d6f0ff' : '#fafafa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = !item.isRead ? '#e6f7ff' : '#fff';
                                }}
                                onClick={() => handleNotificationClick(item)}
                            >
                                {!item.isRead && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: "50%",
                                        transform: 'translateY(-50%)',
                                        width: "1.5px",
                                        height: '90%',
                                        background: '#226533',
                                        borderRadius: '0 2px 2px 0'
                                    }} />
                                )}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    padding: '12px 16px',
                                    width: '100%'
                                }}>
                                    {/* Icon */}
                                    <div style={{
                                        flexShrink: 0,
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f5f5f5',
                                        borderRadius: '50%',
                                        transition: 'all 0.2s'
                                    }}>
                                        {getNotificationIcon(item.type, item.priority)}
                                    </div>

                                    {/* Content */}
                                    <div style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <Text strong style={{
                                                fontSize: 14,
                                                lineHeight: 1.4,
                                                color: '#262626',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {item.title}
                                            </Text>
                                            {/* {getPriorityTag(item.priority)} */}
                                        </div>

                                        <Text style={{
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                            color: '#595959',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {item.message}
                                        </Text>

                                        <Text type="secondary" style={{
                                            fontSize: 12,
                                            color: '#8c8c8c',
                                            marginTop: 2
                                        }}>
                                            {formatTimeAgo(item.timestamp)}
                                        </Text>
                                    </div>

                                    {/* Actions */}
                                    <div style={{
                                        display: 'flex',
                                        gap: 4,
                                        opacity: 0,
                                        transition: 'opacity 0.2s'
                                    }}
                                        className="notification-actions"
                                    >
                                        {!item.isRead && (
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<CheckOutlined />}
                                                onClick={(e) => handleMarkAsRead(e, item.id)}
                                                title="Đánh dấu đã đọc"
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 4
                                                }}
                                            />
                                        )}
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => handleDelete(e, item.id)}
                                            title="Xóa"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 4
                                            }}
                                        />
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
                <div style={{
                    padding: 8,
                    borderTop: '1px solid #f0f0f0',
                    background: '#fafafa',
                    textAlign: 'center'
                }}>
                    <Button
                        type="link"
                        danger
                        size="small"
                        onClick={clearAll}
                        style={{ width: '100%' }}
                    >
                        Xóa tất cả thông báo
                    </Button>
                </div>
            )}

            {/* CSS for hover effect on actions */}
            <style>{`
                .ant-list-item:hover .notification-actions {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default NotificationDropdown;
