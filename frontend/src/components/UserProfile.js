import React from 'react';
import { Dropdown, Avatar, Typography, Space, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

/**
 * User Profile Dropdown Component
 * Hiển thị avatar, username, role và menu dropdown
 */
const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/main/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'OWNER':
        return 'text-red-600 bg-red-100';
      case 'MANAGER':
        return 'text-blue-600 bg-blue-100';
      case 'STAFF':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'OWNER':
        return 'Chủ';
      case 'MANAGER':
        return 'Quản lý';
      case 'STAFF':
        return 'Nhân viên';
      default:
        return role;
    }
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <Text strong>{user.username}</Text>
          <br />
          <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
            {getRoleLabel(user.role)}
          </span>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
      onClick: () => navigate('/main/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button type="text" className="flex items-center gap-2 h-auto p-2">
        <Avatar
          style={{
            backgroundColor: '#1890ff',
            cursor: 'pointer',
          }}
          icon={<UserOutlined />}
        >
          {user.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Space direction="vertical" size={0} className="hidden sm:flex text-left">
          <Text strong className="text-sm">
            {user.name}
          </Text>
          <Text type="secondary" className="text-xs">
            {getRoleLabel(user.role)}
          </Text>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default UserProfile;
