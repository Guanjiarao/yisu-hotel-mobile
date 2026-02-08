import { useState } from 'react'
import { View, Input, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { registerApi } from '../../services/user'
import './index.scss'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 返回首页
  const handleBack = () => {
    Taro.navigateBack({
      fail: () => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }
    })
  }

  // 注册
  const handleRegister = async () => {
    if (!name) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!email) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!phone) {
      Taro.showToast({ title: '请输入手机号码', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (!confirmPassword) {
      Taro.showToast({ title: '请输入确认密码', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码输入不一致', icon: 'none' })
      return
    }
    
    try {
      await registerApi({ name, email, phone, password })
      
      Taro.showToast({ 
        title: '注册成功', 
        icon: 'success',
        duration: 1500
      })
      
      // 延迟跳转到登录页
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1500)
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  // 跳转到登录页
  const handleGoLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  return (
    <View className="register-page-wrapper">
      <ScrollView scrollY className="register-page">
        {/* 顶部返回导航 */}
        <View className="back-nav" onClick={handleBack}>
          <Text className="back-icon">←</Text>
          <Text className="back-text">返回首页</Text>
        </View>

        {/* 注册卡片 */}
        <View className="register-card">
        {/* Logo 图标 */}
        <View className="logo-wrapper">
          <View className="logo-circle">
            <Text className="logo-icon">🏠</Text>
          </View>
        </View>

        {/* 标题 */}
        <View className="title-section">
          <View className="main-title">创建账户</View>
          <View className="sub-title">加入我们，开启您的旅程</View>
        </View>

        {/* 表单区域 */}
        <View className="form-section">
          {/* 姓名输入 */}
          <View className="input-group">
            <View className="input-label">姓名</View>
            <View className="input-wrapper">
              <Text className="input-icon">👤</Text>
              <Input
                className="input-field"
                type="text"
                placeholder="请输入您的姓名"
                placeholderClass="input-placeholder"
                value={name}
                onInput={(e) => setName(e.detail.value)}
              />
            </View>
          </View>

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

          {/* 手机号码输入 */}
          <View className="input-group">
            <View className="input-label">手机号码</View>
            <View className="input-wrapper">
              <Text className="input-icon">📱</Text>
              <Input
                className="input-field"
                type="number"
                placeholder="请输入您的手机号"
                placeholderClass="input-placeholder"
                value={phone}
                onInput={(e) => setPhone(e.detail.value)}
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
                password={!showPassword}
                placeholder="至少6位密码"
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

          {/* 确认密码输入 */}
          <View className="input-group">
            <View className="input-label">确认密码</View>
            <View className="input-wrapper">
              <Text className="input-icon">🔒</Text>
              <Input
                className="input-field"
                type="text"
                password={!showConfirmPassword}
                placeholder="再次输入密码"
                placeholderClass="input-placeholder"
                value={confirmPassword}
                onInput={(e) => setConfirmPassword(e.detail.value)}
              />
              <Text 
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </View>
          </View>
        </View>

        {/* 注册按钮 */}
        <Button className="register-button" onClick={handleRegister}>
          注册
        </Button>

        {/* 登录引导 */}
        <View className="login-guide">
          <Text className="guide-text">已有账户？</Text>
          <Text className="login-link" onClick={handleGoLogin}>立即登录</Text>
        </View>
      </View>

        {/* 底部协议 */}
        <View className="footer-agreement">
          <Text className="agreement-text">注册即表示您同意我们的 </Text>
          <Text className="agreement-link">服务条款</Text>
          <Text className="agreement-text"> 和 </Text>
          <Text className="agreement-link">隐私政策</Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Register
