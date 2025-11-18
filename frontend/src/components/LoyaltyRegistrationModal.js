import React from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { StarFilled, UserOutlined, PhoneOutlined } from '@ant-design/icons';

/**
 * ✅ Loyalty Registration Modal Component
 * Reusable modal for customer loyalty registration
 * 
 * @param {boolean} visible - Modal visibility state
 * @param {function} onCancel - Callback when modal is cancelled
 * @param {function} onSubmit - Callback when form is submitted (receives { name, phone })
 * @param {boolean} loading - Loading state for submit button
 * @param {object} form - Ant Design form instance
 */
export default function LoyaltyRegistrationModal({
  visible,
  onCancel,
  onSubmit,
  loading = false,
  form
}) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <StarFilled className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800 m-0">Tích điểm thưởng</h3>
            <p className="text-xs text-gray-500 m-0">Nhập SĐT để nhận ưu đãi</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={420}
      centered
      className="japanese-modal"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        className="mt-4"
      >
        {/* Name Input - Optional */}
        <Form.Item
          name="name"
          label={
            <span className="text-sm font-medium text-gray-700">
              Tên khách hàng <span className="text-gray-400 font-normal">(Tùy chọn)</span>
            </span>
          }
          rules={[
            {
              max: 100,
              message: 'Tên không được quá 100 ký tự'
            },
            {
              pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
              message: 'Tên chỉ được chứa chữ cái và khoảng trắng'
            }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-800" />}
            placeholder="Nguyễn Văn A"
            size="large"
            className="rounded-lg"
          />
        </Form.Item>

        {/* Phone Input - Required */}
        <Form.Item
          name="phone"
          label={
            <span className="text-sm font-medium text-gray-800">
              Số điện thoại <span className="text-red-500"></span>
            </span>
          }
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^(0[3|5|7|8|9])[0-9]{8}$/,
              message: 'Số điện thoại không hợp lệ (VD: 0912345678)'
            }
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-purple-500" />}
            placeholder="0912345678"
            size="large"
            maxLength={10}
            className="rounded-lg"
          />
        </Form.Item>

        {/* Info Box */}
        <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-100">
          <p className="text-xs text-gray-600 m-0">
            💎 <strong>100 điểm</strong> cho mỗi <strong>10.000₫</strong> chi tiêu
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="large"
            onClick={onCancel}
            className="flex-1 rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 border-0"
          >
            Đăng ký
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
