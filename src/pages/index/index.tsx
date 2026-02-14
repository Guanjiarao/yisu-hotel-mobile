import { View, Input, Button, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'
import { useAuthStore } from '../../store/auth' 
import { useLocationStore } from '../../store/location'

function Index() {
  const tags = ['亲子', '豪华', '商务', '度假', '温泉', '海景']

  const userInfo = useAuthStore((s) => s.userInfo)
  const checkLoginStatus = useAuthStore((s) => s.checkLoginStatus)
  const locateAndRegeo = useLocationStore((s) => s.locateAndRegeo)
  const address = useLocationStore((s) => s.address)
  const locating = useLocationStore((s) => s.locating)
const error = useLocationStore((s) => s.error)

  
  const showCity = address?.city || '选择城市'

  useDidShow(() => {
    checkLoginStatus()
    locateAndRegeo().then(() => {
      console.log('address:', useLocationStore.getState().address)
    })
  })

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
      <View className="hero-section">
        <View className="top-nav">
          <View className="nav-title">酒店预订</View>

          {userInfo ? (
            <View className="user-profile">
              <Image className="user-avatar" src={userInfo.avatar} />
              <View className="user-name">Hi, {userInfo.username}</View>
            </View>
          ) : (
            <View className="login-btn" onClick={handleGoLogin}>
              登录/注册
            </View>
          )}
        </View>

        <View className="hero-content">
          <View className="hero-title">发现理想住宿</View>
          <View className="hero-subtitle">精选全球优质酒店，开启完美旅程</View>
        </View>
      </View>

      <View className="main-content">
        <View className="search-card">
          <View className="form-item">
            <View className="form-icon">📍</View>
            <View className="form-content">
              <View className="form-label">目的地</View>
                <View className="form-value">
                {showCity}
              </View>
                {locating && <View className="debug-text">定位中...</View>}
            </View>
          </View>

          <View className="divider" />

          <View className="form-item">
            <View className="form-icon">📅</View>
            <View className="form-content">
              <View className="form-label">入住 - 离店</View>
              <View className="form-value">2月7日 - 2月8日</View>
            </View>
          </View>

          <View className="divider" />

          <View className="search-input-wrapper">
            <View className="search-icon">🔍</View>
            <Input
              className="search-input"
              placeholder="搜索酒店名称或关键词"
              placeholderClass="search-placeholder"
            />
          </View>

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

          <Button className="search-button">查询酒店</Button>
        </View>

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
