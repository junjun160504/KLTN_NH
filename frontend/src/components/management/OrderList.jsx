import React, { useState } from 'react'
import { Button, Space, Typography, Input } from 'antd'
import {
  PlusOutlined,
  MinusOutlined,
  ClockCircleOutlined,
  FireOutlined,
  DownOutlined,
  UpOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons'

const { Text } = Typography
const { TextArea } = Input

/**
 * OrderList Component
 * Hiển thị danh sách đơn hàng của 1 bàn theo design mới
 * 
 * Props:
 * - orders: Array of order objects
 * - editingNotes: Object tracking note editing state
 * - setEditingNotes: Function to update editing notes
 * - handleIncreaseQuantity: Function to increase item quantity
 * - handleDecreaseQuantity: Function to decrease item quantity
 * - handleRemoveItem: Function to remove an item
 * - handleSaveNote: Function to save note
 * - handleConfirmOrder: Function to confirm NEW order
 * - handleCancelSingleOrder: Function to cancel order
 * - getOrderStatusTag: Function to render status tag
 * - formatDate: Function to format date string
 */
const OrderList = ({
  orders = [],
  editingNotes = {},
  setEditingNotes,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  handleRemoveItem,
  handleSaveNote,
  handleConfirmOrder,
  handleCancelSingleOrder,
  getOrderStatusTag,
  formatDate
}) => {
  // Track which orders are expanded
  const [expandedOrders, setExpandedOrders] = useState({})

  // Track which items are editing notes locally
  const [localEditingNotes, setLocalEditingNotes] = useState({})

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  // Get icon based on order status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'NEW':
        return <ClockCircleOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
      case 'IN_PROGRESS':
        return <FireOutlined style={{ fontSize: '16px', color: '#ff9800' }} />
      default:
        return <ClockCircleOutlined style={{ fontSize: '16px', color: '#999' }} />
    }
  }

  return (
    <>
      {orders.map((order) => {
        const isExpanded = expandedOrders[order.id]
        const visibleItems = isExpanded ? order.items : order.items?.slice(0, 1) || []
        const totalItems = order.items?.length || 0

        return (
          <div
            key={order.id}
            style={{
              marginBottom: '16px',
              marginTop: '16px',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              backgroundColor: '#fff',
              overflow: 'hidden'
            }}
          >
            {/* Order Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusIcon(order.status)}
                <Text strong style={{ fontSize: '15px' }}>
                  #{order.id}
                </Text>
                {getOrderStatusTag(order.status)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {order.status === 'NEW' && (
                  <>

                    <Button
                      size="small"
                      danger
                      type="text"
                      onClick={() => handleCancelSingleOrder(order.id)}
                      style={{ padding: '0 8px' }}
                    >
                      Hủy
                    </Button>

                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleConfirmOrder(order.id)}
                      style={{ padding: '0 12px' }}
                    >
                      Xác nhận
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div style={{ padding: '12px 16px' }}>
              {visibleItems.map((item) => {
                const orderItemId = item.id
                if (!orderItemId) return null

                const isEditable = order.status === 'NEW'
                const isEditingNote = localEditingNotes[orderItemId]

                return (
                  <div
                    key={`${order.id}-${orderItemId}`}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    {/* Item Image */}
                    <img
                      src={item.image_url || 'https://via.placeholder.com/60'}
                      alt={item.menu_item_name || item.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60x60.png?text=No+Image'
                      }}
                    />

                    {/* Item Info */}
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                        {item.menu_item_name || item.name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>
                        {Number(item.unit_price)?.toLocaleString('vi-VN')}đ
                      </Text>

                      {/* Note section */}
                      {isEditable ? (
                        <div style={{ marginTop: '8px' }}>
                          {isEditingNote ? (
                            <div>
                              <TextArea
                                id={`note-textarea-${orderItemId}`}
                                placeholder="Thêm ghi chú (VD: Không hành, ít cay...)"
                                defaultValue={item.note || ''}
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                style={{ fontSize: '12px', marginBottom: '6px' }}
                              />
                              <Space size={4}>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<SaveOutlined />}
                                  onClick={() => {
                                    handleSaveNote(orderItemId, item)
                                    setLocalEditingNotes(prev => {
                                      const updated = { ...prev }
                                      delete updated[orderItemId]
                                      return updated
                                    })
                                  }}
                                >
                                  Lưu
                                </Button>
                                <Button
                                  size="small"
                                  icon={<CloseOutlined />}
                                  onClick={() => {
                                    setLocalEditingNotes(prev => {
                                      const updated = { ...prev }
                                      delete updated[orderItemId]
                                      return updated
                                    })
                                  }}
                                >
                                  Hủy
                                </Button>
                              </Space>
                            </div>
                          ) : (
                            <div>
                              {item.note && (
                                <div style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#fff7e6',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#8c8c8c',
                                  marginBottom: '6px'
                                }}>
                                  💬 {item.note}
                                </div>
                              )}
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setLocalEditingNotes(prev => ({ ...prev, [orderItemId]: true }))}
                                style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                              >
                                {item.note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Read-only note for non-NEW orders
                        item.note && (
                          <div style={{
                            marginTop: '8px',
                            padding: '6px 10px',
                            backgroundColor: '#fff7e6',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#8c8c8c'
                          }}>
                            💬 {item.note}
                          </div>
                        )
                      )}
                    </div>

                    {/* Price & Quantity */}
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        {(item.unit_price * item.quantity)?.toLocaleString('vi-VN')}đ
                      </Text>

                      {isEditable ? (
                        <div>
                          <Space size={4} style={{ marginBottom: '8px' }}>
                            <Button
                              size="small"
                              icon={<MinusOutlined />}
                              onClick={() => handleDecreaseQuantity(orderItemId)}
                              disabled={item.quantity <= 1}
                              style={{ width: '24px', height: '24px', padding: 0 }}
                            />
                            <Text style={{ fontSize: '13px', minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                              {item.quantity}
                            </Text>
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => handleIncreaseQuantity(orderItemId)}
                              style={{ width: '24px', height: '24px', padding: 0 }}
                            />
                          </Space>
                          {/* Delete button */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveItem(orderItemId)}
                            >
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                          x {item.quantity}
                        </Text>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* "Xem thêm" button */}
              {totalItems > 1 && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => toggleOrderExpand(order.id)}
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    color: '#1890ff',
                    fontSize: '13px'
                  }}
                >
                  {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </Button>
              )}
            </div>

            {/* Order Footer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafafa'
              }}
            >
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {totalItems} món
              </Text>
              <Text strong style={{ fontSize: '15px' }}>
                Tổng: <span style={{ color: '#000' }}>{Number(order.total_price || 0)?.toLocaleString('vi-VN')}đ</span>
              </Text>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default OrderList
