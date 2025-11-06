import React, { useState, useEffect } from 'react'
import { Input, Button, Checkbox, Typography, App } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'

const { Title, Text } = Typography

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const { message } = App.useApp()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({ username: '', password: '' })

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/main/homes'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const validateForm = () => {
    const newErrors = { username: '', password: '' }
    let isValid = true

    if (!username || username.trim().length === 0) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập'
      isValid = false
    } else if (username.trim().length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự'
      isValid = false
    }

    if (!password || password.length === 0) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
      isValid = false
    } else if (password.length < 3) {
      newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    try {
      await login({
        username: username.trim(),
        password: password,
        remember: remember
      })

      message.success({
        content: `Chào mừng ${username}!`,
        duration: 2
      })

      const from = location.state?.from?.pathname || '/main/homes'
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 300)
    } catch (err) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại!'

      if (err.response) {
        const { status, data } = err.response

        if (status === 401) {
          const msg = data?.message || ''
          if (msg.includes('not found') || msg.includes('Admin not found')) {
            errorMessage = 'Tài khoản không tồn tại!'
          } else if (msg.includes('password') || msg.includes('Wrong password')) {
            errorMessage = 'Mật khẩu không chính xác!'
          } else {
            errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng!'
          }
        } else if (status === 403) {
          errorMessage = 'Tài khoản không có quyền truy cập!'
        } else if (status === 500) {
          errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau!'
        } else if (data?.message) {
          errorMessage = data.message
        }
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng!'
      } else if (err.message) {
        if (err.message.includes('not found') || err.message.includes('Admin not found')) {
          errorMessage = 'Tài khoản không tồn tại!'
        } else if (err.message.includes('password') || err.message.includes('Wrong password')) {
          errorMessage = 'Mật khẩu không chính xác!'
        } else {
          errorMessage = err.message
        }
      }

      message.error({
        content: errorMessage,
        duration: 3
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pl-3 pr-3">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-10">
        <Title
          level={2}
          className="text-center mb-2 font-bold text-gray-800 text-2xl sm:text-3xl"
          style={{ marginTop: 0 }}
        >
          Đăng nhập
        </Title>

        <Text className="block text-center text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
          Hệ thống quản lý nhà hàng
        </Text>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium text-sm sm:text-base mb-2">
              Tên đăng nhập
            </label>
            <Input
              placeholder="Nhập tên đăng nhập của bạn"
              size="large"
              className="rounded-lg border-gray-300 text-sm sm:text-base"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errors.username) setErrors({ ...errors, username: '' })
              }}
              onKeyPress={handleKeyPress}
              status={errors.username ? 'error' : ''}
            />
            {errors.username && (
              <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.username}</div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium text-sm sm:text-base mb-2">
              Mật khẩu
            </label>
            <Input.Password
              placeholder="Nhập mật khẩu của bạn"
              size="large"
              className="rounded-lg border-gray-300 text-sm sm:text-base"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: '' })
              }}
              onKeyPress={handleKeyPress}
              status={errors.password ? 'error' : ''}
            />
            {errors.password && (
              <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.password}</div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="text-gray-600 text-sm sm:text-base"
            >
              Ghi nhớ đăng nhập
            </Checkbox>
          </div>

          <div className="mt-6">
            <Button
              type="primary"
              block
              size="large"
              className="rounded-lg font-semibold border-0 h-11 sm:h-12 text-sm sm:text-base"
              onClick={handleLogin}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage