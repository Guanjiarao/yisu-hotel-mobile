import React, { useState } from 'react'
import { View, Input, Button, Image } from '@tarojs/components' // 👈 引入 Image 组件
import Taro, { useDidShow } from '@tarojs/taro' // 👈 引入 useDidShow 生命周期
import './index.scss'

function Index() {
  // 1. 定义一个状态，用来存用户信息
  const [userInfo, setUserInfo] = useState<any>(null)

  const tags = ['亲子', '豪华', '商务', '度假', '温泉', '海景']
  
  // 🔴 这里的 IP 必须换成你阿里云的公网 IP，端口 3001
  const baseUrl = 'http://116.62.19.40:3001' 

  // 2. 核心逻辑：每次页面显示时，都检查一下有没有登录
  useDidShow(() => {
    checkLoginStatus()
  })

  const checkLoginStatus = () => {
    // 先看本地有没有 Token
    const token = Taro.getStorageSync('token')
    
    if (token) {
      // 有 Token，去后端问问是谁
      Taro.request({
        url: `${baseUrl}/api/user/info`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}` // 带上令牌
        },
        success: (res) => {
          if (res.data.success) {
            // ✅ 登录有效，存入状态
            console.log('自动登录成功:', res.data.data)
            setUserInfo(res.data.data)
          } else {
            // ❌ Token 过期了，清理掉
            Taro.removeStorageSync('token')
            setUserInfo(null)
          }
        },
        fail: () => {
          // 网络错误等情况，也当没登录处理
          setUserInfo(null)
        }
      })
    } else {
      // 没 Token，肯定是未登录
      setUserInfo(null)
    }
  }
  
  // 跳转登录页
  const handleGoLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }
  
  const hotDestinations = [
    { city: '北京', count: '1200+家酒店' },
    { city: '上海', count: '1300+家酒店' },
    { city: '三亚', count: '800+家酒店' },
    { city: '成都', count: '950+家酒店' },
  ]

  return (
    <View className="hotel-home">
      {/* 顶部 Hero 区域 */}
      <View className="hero-section">
        {/* 顶部导航栏 */}
        <View className="top-nav">
          <View className="nav-title">酒店预订</View>
          
          {/* 3. UI 变化：如果有 userInfo，显示头像和名字；否则显示登录按钮 */}
          {userInfo ? (
            <View className="user-profile">
              <Image className="user-avatar" src={userInfo.avatar} />
              <View className="user-name">Hi, {userInfo.username}</View>
            </View>
          ) : (
            <View className="login-btn" onClick={handleGoLogin}>登录/注册</View>
          )}
        </View>

        {/* Hero 文案 */}
        <View className="hero-content">
          <View className="hero-title">发现理想住宿</View>
          <View className="hero-subtitle">精选全球优质酒店，开启完美旅程</View>
        </View>
      </View>

      {/* 主内容区域 */}
      <View className="main-content">
        {/* 悬浮搜索卡片 */}
        <View className="search-card">
          {/* 目的地 */}
          <View className="form-item">
            <View className="form-icon">📍</View>
            <View className="form-content">
              <View className="form-label">目的地</View>
              <View className="form-value">北京</View>
            </View>
          </View>

          <View className="divider" />

          {/* 日期 */}
          <View className="form-item">
            <View className="form-icon">📅</View>
            <View className="form-content">
              <View className="form-label">入住 - 离店</View>
              <View className="form-value">2月7日 - 2月8日</View>
            </View>
          </View>

          <View className="divider" />

          {/* 搜索框 */}
          <View className="search-input-wrapper">
            <View className="search-icon">🔍</View>
            <Input
              className="search-input"
              placeholder="搜索酒店名称或关键词"
              placeholderClass="search-placeholder"
            />
          </View>

          {/* 热门推荐标签 */}
          <View className="tags-section">
            <View className="tags-label">热门推荐</View>
            <View className="tags-container">
              {tags.map((tag, index) => (
                <View key={index} className="tag-item">
                  {tag}
                </View>
              ))}
            </View>
          </View>

          {/* 查询按钮 */}
          <Button className="search-button">
            查询酒店
          </Button>
        </View>

        {/* 热门目的地 */}
        <View className="hot-destinations">
          <View className="section-title">热门目的地</View>
          <View className="destinations-grid">
            {hotDestinations.map((dest, index) => (
              <View key={index} className="destination-card">
                <View className="destination-city">{dest.city}</View>
                <View className="destination-count">{dest.count}</View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

export default Index