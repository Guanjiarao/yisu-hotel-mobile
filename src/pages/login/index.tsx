import React, { useState } from 'react'
import { View, Input, Text } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import './index.scss'
import { useAuthStore } from '../../store/auth' // 路径按你项目实际改

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loginWithEmail = useAuthStore((s) => s.loginWithEmail)

  // 返回首页
  const handleBack = () => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.reLaunch({ url: '/pages/index/index' })
    Taro.reLaunch({ url: '/pages/index/index' })
    return
    // eslint-disable-next-line no-unreachable
    Taro.navigateBack({
      fail: () => {
        Taro.redirectTo({ url: '/pages/index/index' })
      },
    })
    }
  }

  const handleLogin = async () => {
    if (!email) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '登录中...' })

    const ok = await loginWithEmail(email, password)

    Taro.hideLoading()

    if (ok) {
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        handleBack()
      }, 1500)
    }
  }

  const handleForgotPassword = () => {
    Taro.showToast({ title: '请联系管理员重置', icon: 'none' })
  }

  const handleRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className="login-page">
      <View className="back-nav" onClick={handleBack}>
        <Text className="back-icon">←</Text>
        <Text className="back-text">返回首页</Text>
      </View>

      <View className="login-card">
        <View className="logo-wrapper">
          <View className="logo-circle">
            <Text className="logo-icon">🏠</Text>
          </View>
        </View>

        <View className="title-section">
          <View className="main-title">欢迎回来</View>
          <View className="sub-title">登录您的账户继续预订</View>
        </View>

        <View className="form-section">
          <View className="input-group">
            <View className="input-label">邮箱地址</View>
            <View className="input-wrapper">
              <Text className="input-icon">✉️</Text>
              <Input
                className="input-field"
                type="text"
                placeholder="请输入您的邮箱"
                placeholderClass="input-placeholder"
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
              />
            </View>
          </View>

          <View className="input-group">
            <View className="input-label">密码</View>
            <View className="input-wrapper">
              <Text className="input-icon">🔒</Text>
              <Input
                className="input-field"
                type="text"
                password={!showPassword}
                placeholder="请输入您的密码"
                placeholderClass="input-placeholder"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
              />
              <Text className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </View>
          </View>

          <View className="forgot-password" onClick={handleForgotPassword}>
            忘记密码?
          </View>
        </View>

        <View className="login-button">
          <Button type="primary" block onClick={handleLogin}>
            登录
          </Button>
        </View>

        <View className="register-guide">
          <Text className="guide-text">还没有账户？</Text>
          <Text className="register-link" onClick={handleRegister}>
            立即注册
          </Text>
        </View>
      </View>

      <View className="footer-agreement">
        <Text className="agreement-text">登录即表示您同意我们的 </Text>
        <Text className="agreement-link">服务条款</Text>
        <Text className="agreement-text"> 和 </Text>
        <Text className="agreement-link">隐私政策</Text>
      </View>
    </View>
  )
}

export default Login
