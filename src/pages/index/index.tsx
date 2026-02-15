import { View, Input, Button, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'
import { useAuthStore } from '../../store/auth'
import { useLocationStore } from '../../store/location'
import { useSearchStore } from '../../store/search'

function Index() {
  const tags = ['亲子', '豪华', '商务', '度假', '温泉', '海景']

  const userInfo = useAuthStore((s) => s.userInfo)
  const checkLoginStatus = useAuthStore((s) => s.checkLoginStatus)
  const locateAndRegeo = useLocationStore((s) => s.locateAndRegeo)
  const address = useLocationStore((s) => s.address)
  const locating = useLocationStore((s) => s.locating)

  const filters = useSearchStore((s) => s.filters)
  const setCity = useSearchStore((s) => s.setCity)
  const setKeyword = useSearchStore((s) => s.setKeyword)
  const toggleTag = useSearchStore((s) => s.toggleTag)
  const setDateRange = useSearchStore((s) => s.setDateRange)


  const showCity = address?.city || '选择城市'

  useDidShow(() => {
    checkLoginStatus()
    locateAndRegeo().then(() => {
      const addr = useLocationStore.getState().address
      if (addr?.city) {
        setCity({ city: addr.city, adcode: addr.adcode })
      }
    })
  })

  const handlePickCity = () => {
    // 你后续做城市选择页就跳转，这里先用 toast 提示
    Taro.showToast({ title: '这里可以跳转城市选择页', icon: 'none' })
    // Taro.navigateTo({ url: '/pages/city/index' })
  }

  const handleChooseHotCity = (city: string) => {
    setCity({ city })
  }

  const handlePickDate = () => {
    setDateRange({ checkIn: '2026-02-07', checkOut: '2026-02-08' })
    Taro.showToast({ title: '已选择日期', icon: 'none' })
  }

  const handleSearch = () => {
    const { city, keyword, tags, dateRange } = useSearchStore.getState().filters

    if (!city) {
      Taro.showToast({ title: '请先选择目的地', icon: 'none' })
      return
    }

    const params = new URLSearchParams({
      city,
      keyword: keyword || '',
      tags: tags.join(','),
      checkIn: dateRange.checkIn || '',
      checkOut: dateRange.checkOut || '',
    })

    Taro.navigateTo({ url: `/pages/hotel-lists/index?${params.toString()}` })
  }


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
          <View className="form-item" onClick={handlePickCity}>
            <View className="form-icon">📍</View>
            <View className="form-content">
              <View className="form-label">目的地</View>
              {locating ? (
                <View className="debug-text">定位中...</View>
              ) : (
                <View className="form-value">{filters.city || '选择城市'}</View>
              )}
            </View>
          </View>


          <View className="divider" />

          <View className="form-item" onClick={handlePickDate}>
            <View className="form-icon">📅</View>
            <View className="form-content">
              <View className="form-label">入住 - 离店</View>
              <View className="form-value">
                {filters.dateRange.checkIn && filters.dateRange.checkOut
                  ? `${filters.dateRange.checkIn} - ${filters.dateRange.checkOut}`
                  : '请选择日期'}
              </View>
            </View>
          </View>


          <View className="divider" />

          <View className="search-input-wrapper">
            <View className="search-icon">🔍</View>
            <Input
              className="search-input"
              placeholder="搜索酒店名称或关键词"
              placeholderClass="search-placeholder"
              value={filters.keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />

          </View>

          <View className="tags-section">
            <View className="tags-label">热门推荐</View>
            <View className="tags-container">
              {tags.map((tag, index) => {
                const active = filters.tags.includes(tag)
                return (
                  <View
                    key={index}
                    className={`tag-item ${active ? 'tag-active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </View>
                )
              })}

            </View>
          </View>

          <Button className="search-button" onClick={handleSearch}>查询酒店</Button>
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
