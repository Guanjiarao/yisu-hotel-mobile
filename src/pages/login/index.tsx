import  { useState } from 'react'
import { View, Input, Text } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import './index.scss'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 返回首页
  const handleBack = () => {
    Taro.navigateBack({
      fail: () => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }
    })
  }

  // 登录
  const handleLogin = () => {
    if (!email) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    // TODO: 实际登录逻辑
    Taro.showToast({ title: '登录成功', icon: 'success' })
  }

  // 忘记密码
  const handleForgotPassword = () => {
    Taro.showToast({ title: '功能开发中', icon: 'none' })
  }

  // 立即注册
  const handleRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className="login-page">
      {/* 顶部返回导航 */}
      <View className="back-nav" onClick={handleBack}>
        <Text className="back-icon">←</Text>
        <Text className="back-text">返回首页</Text>
      </View>

      {/* 登录卡片 */}
      <View className="login-card">
        {/* Logo 图标 */}
        <View className="logo-wrapper">
          <View className="logo-circle">
            <Text className="logo-icon">🏠</Text>
          </View>
        </View>

        {/* 标题 */}
        <View className="title-section">
          <View className="main-title">欢迎回来</View>
          <View className="sub-title">登录您的账户继续预订</View>
        </View>

        {/* 表单区域 */}
        <View className="form-section">
          {/* 邮箱输入 */}
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

          {/* 密码输入 */}
          <View className="input-group">
            <View className="input-label">密码</View>
            <View className="input-wrapper">
              <Text className="input-icon">🔒</Text>
              <Input
                className="input-field"
                type="text" 
                password={!showPassword}  // <--- 核心修改在这里
                placeholder="请输入您的密码"
                placeholderClass="input-placeholder"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
              />
              <Text 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </View>
          </View>

          {/* 忘记密码 */}
          <View className="forgot-password" onClick={handleForgotPassword}>
            忘记密码?
          </View>
        </View>

        {/* 登录按钮 */}
        <View className="login-button">
          <Button type="primary" block onClick={handleLogin}>
            登录
          </Button>
        </View>

        {/* 注册引导 */}
        <View className="register-guide">
          <Text className="guide-text">还没有账户？</Text>
          <Text className="register-link" onClick={handleRegister}>立即注册</Text>
        </View>
      </View>

      {/* 底部协议 */}
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
