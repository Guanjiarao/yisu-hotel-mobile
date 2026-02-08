import { View, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

function Index() {
  const tags = ['亲子', '豪华', '商务', '度假', '温泉', '海景']
  
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
          <View className="login-btn" onClick={handleGoLogin}>登录/注册</View>
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