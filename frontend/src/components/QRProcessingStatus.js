import React from 'react';
import { Spin, Alert, Card } from 'antd';
import { QrcodeOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * Component hiển thị trạng thái xử lý QR Code
 */
const QRProcessingStatus = ({
  isProcessing,
  error,
  onRetry,
  style = {}
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (isProcessing) {
    return (
      <Card
        style={{
          textAlign: 'center',
          margin: '20px auto',
          maxWidth: 400,
          ...style
        }}
        bodyStyle={{ padding: '40px 20px' }}
      >
        <Spin indicator={antIcon} size="large" />
        <div style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          <QrcodeOutlined style={{ marginRight: 8, fontSize: 20 }} />
          Đang xử lý QR Code...
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#999' }}>
          Vui lòng đợi trong giây lát
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        style={{
          textAlign: 'center',
          margin: '20px auto',
          maxWidth: 400,
          ...style
        }}
        bodyStyle={{ padding: '40px 20px' }}
      >
        <Alert
          message="Lỗi QR Code"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Thử lại
          </button>
        )}
      </Card>
    );
  }

  return null;
};

export default QRProcessingStatus;