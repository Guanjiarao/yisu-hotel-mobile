import React, { useState } from 'react'
import { View, Input, Text } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import './index.scss'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ⚠️⚠️⚠️ 这里的 IP 必须是你阿里云的公网 IP，端口要对应 server.js 里的端口 (3001)
  const baseUrl = 'http://116.62.19.40:3001' 

  // 返回首页
  const handleBack = () => {
    Taro.navigateBack({
      fail: () => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }
    })
  }

  // 登录逻辑 (核心修改部分)
  const handleLogin = () => {
    // 1. 前端基础校验
    if (!email) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    // 2. 显示加载中
    Taro.showLoading({ title: '登录中...' })

    // 3. 发送请求给阿里云后端
    Taro.request({
      url: `${baseUrl}/api/user/login`, // 对应后端的登录接口
      method: 'POST',
      data: {
        email: email,
        password: password
      },
      success: (res) => {
        Taro.hideLoading() // 隐藏加载圈

        // res.data 是后端返回的 JSON，包含 { success, msg, data }
        if (res.data.success) {
          // ✅ 登录成功
          Taro.showToast({ title: '登录成功', icon: 'success' })

          // 4. 保存 Token 和用户信息到本地存储
          // 以后所有接口请求都要带上这个 Token
          Taro.setStorageSync('token', res.data.data.token)
          Taro.setStorageSync('userInfo', res.data.data)

          // 5. 延迟 1.5秒 后跳转，让用户看清“登录成功”
          setTimeout(() => {
            handleBack() // 跳回上一页（通常是首页）
          }, 1500)

        } else {
          // ❌ 登录失败 (密码错误 或 用户不存在)
          // res.data.msg 是后端返回的具体错误原因，比如 "密码错误"
          Taro.showToast({ 
            title: res.data.msg || '登录失败', 
            icon: 'none',
            duration: 2000 
          })
        }
      },
      fail: (err) => {
        // 网络不通，或者 IP 写错了
        Taro.hideLoading()
        console.error('登录请求失败:', err)
        Taro.showToast({ 
          title: '连接服务器失败，请检查网络', 
          icon: 'none' 
        })
      }
    })
  }

  // 忘记密码
  const handleForgotPassword = () => {
    Taro.showToast({ title: '请联系管理员重置', icon: 'none' })
  }

  // 立即注册
  const handleRegister = () => {
    // 跳转去注册页 (假设你还没写，先写个提示或者跳转)
    // Taro.navigateTo({ url: '/pages/register/index' })
    Taro.showToast({ title: '注册功能即将上线', icon: 'none' })
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
                password={!showPassword} 
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