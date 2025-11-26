import React, { useEffect } from 'react';
import { Typography } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    CloseCircleOutlined,
    CloseOutlined,
    ShoppingOutlined,
    PhoneOutlined,
    CreditCardOutlined,
    StarOutlined
} from '@ant-design/icons';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

const { Text } = Typography;

// Icon and color mapping
const getToastConfig = (type) => {
    const configs = {
        [NOTIFICATION_TYPES.SUCCESS]: {
            icon: <CheckCircleOutlined />,
            color: '#52c41a',
            bgColor: '#f6ffed',
            borderColor: '#b7eb8f'
        },
        [NOTIFICATION_TYPES.ERROR]: {
            icon: <CloseCircleOutlined />,
            color: '#ff4d4f',
            bgColor: '#fff2f0',
            borderColor: '#ffccc7'
        },
        [NOTIFICATION_TYPES.WARNING]: {
            icon: <ExclamationCircleOutlined />,
            color: '#faad14',
            bgColor: '#fffbe6',
            borderColor: '#ffe58f'
        },
        [NOTIFICATION_TYPES.INFO]: {
            icon: <InfoCircleOutlined />,
            color: '#1890ff',
            bgColor: '#e6f7ff',
            borderColor: '#91d5ff'
        },
        [NOTIFICATION_TYPES.ORDER_NEW]: {
            icon: <ShoppingOutlined />,
            color: '#52c41a',
            bgColor: '#f6ffed',
            borderColor: '#b7eb8f'
        },
        [NOTIFICATION_TYPES.ORDER_UPDATE]: {
            icon: <ShoppingOutlined />,
            color: '#1890ff',
            bgColor: '#e6f7ff',
            borderColor: '#91d5ff'
        },
        [NOTIFICATION_TYPES.CALL_STAFF]: {
            icon: <PhoneOutlined />,
            color: '#ff4d4f',
            bgColor: '#fff2f0',
            borderColor: '#ffccc7'
        },
        [NOTIFICATION_TYPES.PAYMENT]: {
            icon: <CreditCardOutlined />,
            color: '#52c41a',
            bgColor: '#f6ffed',
            borderColor: '#b7eb8f'
        },
        [NOTIFICATION_TYPES.REVIEW]: {
            icon: <StarOutlined />,
            color: '#faad14',
            bgColor: '#fffbe6',
            borderColor: '#ffe58f'
        }
    };

    return configs[type] || configs[NOTIFICATION_TYPES.INFO];
};

const ToastItem = ({ toast, onClose, onClick }) => {
    const config = getToastConfig(toast.type);
    const duration = toast.duration || 5000;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.id, duration, onClose]);

    const handleClick = () => {
        if (toast.actionUrl) {
            onClick(toast);
        }
    };

    return (
        <div
            style={{
                width: 380,
                minHeight: 80,
                background: config.bgColor,
                borderRadius: 8,
                boxShadow: '0 6px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                position: 'relative',
                overflow: 'hidden',
                cursor: toast.actionUrl ? 'pointer' : 'default',
                borderLeft: `4px solid ${config.borderColor}`,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                marginBottom: 12
            }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                if (toast.actionUrl) {
                    e.currentTarget.style.transform = 'translateX(-4px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)';
                }
            }}
            onMouseLeave={(e) => {
                if (toast.actionUrl) {
                    e.currentTarget.style.transform = 'translateX(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)';
                }
            }}
        >
            {/* Icon */}
            <div style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.8)',
                marginTop: 2,
                color: config.color
            }}>
                {config.icon}
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 0,
                paddingRight: 24
            }}>
                <Text strong style={{
                    fontSize: 14,
                    lineHeight: 1.4,
                    color: '#262626',
                    fontWeight: 600,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                }}>
                    {toast.title}
                </Text>
                {toast.message && (
                    <Text style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: '#595959',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                    }}>
                        {toast.message}
                    </Text>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose(toast.id);
                }}
                aria-label="Close"
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: '#8c8c8c',
                    transition: 'all 0.2s',
                    padding: 0
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.color = '#262626';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#8c8c8c';
                }}
            >
                <CloseOutlined style={{ fontSize: 12 }} />
            </button>

            {/* Progress Bar */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    background: config.color,
                    animation: `shrink ${duration}ms linear`,
                    transformOrigin: 'left'
                }} />
            </div>

            {/* Keyframes for animations */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </div>
    );
};

const ToastNotification = () => {
    const navigate = useNavigate();
    const { toasts, removeToast, markAsRead } = useNotifications();

    const handleToastClick = async (toast) => {
        if (toast.actionUrl) {
            // Mark as read if not already read
            if (!toast.isRead) {
                markAsRead(toast.id);
                // Also call API to persist
                await notificationService.markAsRead(toast.id);
            }

            navigate(toast.actionUrl);
            removeToast(toast.id);
        }
    };

    // Only show max 3 toasts (already handled in context, but double-check)
    const visibleToasts = toasts.slice(0, 3);

    if (visibleToasts.length === 0) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none'
        }}>
            {visibleToasts.map((toast, index) => (
                <div key={toast.id} style={{
                    pointerEvents: 'auto',
                    zIndex: 103 - index,
                    animationDelay: `${index * 0.1}s`
                }}>
                    <ToastItem
                        toast={toast}
                        onClose={removeToast}
                        onClick={handleToastClick}
                    />
                </div>
            ))}
        </div>
    );
};

export default ToastNotification;
