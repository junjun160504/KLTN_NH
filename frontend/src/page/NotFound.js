import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <Result
                status="404"
                title={
                    <span style={{
                        fontSize: '72px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        404
                    </span>
                }
                subTitle={
                    <div style={{ color: '#ababab', fontSize: '18px', marginTop: '20px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                            Oops! Trang không tồn tại
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                            Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng
                        </div>
                    </div>
                }
                extra={
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        justifyContent: 'center',
                        marginTop: '32px'
                    }}>
                        <Button
                            type="default"
                            size="medium"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate(-1)}
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                padding: '0 32px',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}
                        >
                            Quay lại
                        </Button>
                        {/* <Button
                            type="primary"
                            size="medium"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/')}
                            style={{
                                borderRadius: '8px',
                                height: '48px',
                                padding: '0 32px',
                                fontSize: '16px',
                                fontWeight: '500',
                                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                border: 'none'
                            }}
                        >
                            Về trang chủ
                        </Button> */}
                    </div>
                }
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    padding: '60px 40px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}
            />
        </div>
    );
};

export default NotFoundPage;
