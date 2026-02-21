import { View, Input, Button, Image, Picker, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Calendar } from '@nutui/nutui-react-taro'

import '@nutui/nutui-react-taro/dist/style.css'
import '@nutui/nutui-react-taro/dist/esm/calendar/style/css'
import '@nutui/nutui-react-taro/dist/esm/popup/style/css'

import './index.scss'
import { useAuthStore } from '../../store/auth'
import { useLocationStore } from '../../store/location'
import { useSearchStore } from '../../store/search'

function Index() {
  const tags = ['亲子', '豪华', '商务', '度假', '温泉', '海景']

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const userInfo = useAuthStore((s) => s.userInfo)
  const checkLoginStatus = useAuthStore((s) => s.checkLoginStatus)
  const locateAndRegeo = useLocationStore((s) => s.locateAndRegeo)
  const locating = useLocationStore((s) => s.locating)

  const filters = useSearchStore((s) => s.filters)
  const setCity = useSearchStore((s) => s.setCity)
  const setKeyword = useSearchStore((s) => s.setKeyword)
  const toggleTag = useSearchStore((s) => s.toggleTag)
  const setDateRange = useSearchStore((s) => s.setDateRange)

  useDidShow(() => {
    checkLoginStatus()
    locateAndRegeo().then(() => {
      const addr = useLocationStore.getState().address
      if (addr?.city) {
        setCity({ city: addr.city, adcode: addr.adcode })
      }
    })
  })

  const handleCityChange = (e) => {
    const selectedRegion = e.detail.value
    console.log('用户选择的地区:', selectedRegion)
    
    if (selectedRegion && selectedRegion.length > 0) {
      // 提取市级名称（index 1）
      // 兼容直辖市：如果 index 1 为空或与 index 0 相同，则使用 index 0
      let cityName = selectedRegion[1] || selectedRegion[0]
      
      // 如果是直辖市（省市同名），使用第一个元素
      if (selectedRegion[0] === selectedRegion[1]) {
        cityName = selectedRegion[0]
      }
      
      // 确保城市名称包含"市"字（如果原本就有则不重复添加）
      if (cityName && !cityName.endsWith('市') && !cityName.endsWith('自治区') && !cityName.endsWith('特别行政区')) {
        // 对于一些特殊情况，保持原样
        if (!['北京', '上海', '天津', '重庆'].includes(cityName)) {
          // 非直辖市的情况，如果后端需要带"市"，这里可以添加
          // cityName = cityName + '市'
        }
      }
      
      console.log('最终提取的城市名:', cityName)
      
      // 调用 Store 的方法更新城市
      setCity({ city: cityName })
      
      Taro.showToast({ 
        title: `已切换至${cityName}`, 
        icon: 'success',
        duration: 1500
      })
    }
  }

  const handlePickDate = () => {
    setIsCalendarOpen(true)
  }

  // ✅ 完美适配 NutUI 的确认逻辑
  const handleConfirmDate = (param: any) => {
    // NutUI 返回的是字符串数组，例如 ['2026-02-17', '2026-02-19']
    if (param && param.length === 2) {
      // 兼容处理：确保取到的是字符串日期
      let checkIn = typeof param[0] === 'string' ? param[0] : (param[0]?.[3] || '')
      let checkOut = typeof param[1] === 'string' ? param[1] : (param[1]?.[3] || '')
      
      if (checkIn && checkOut) {
        setDateRange({ checkIn, checkOut })
      }
    }
    setIsCalendarOpen(false)
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

  // ✅ 生成 NutUI 需要的起始和结束日期格式 (YYYY-MM-DD)
  const getStartDate = () => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getEndDate = () => {
    const date = new Date()
    date.setMonth(date.getMonth() + 6)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

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
          <Picker 
            mode="region" 
            onChange={handleCityChange}
          >
            <View className="form-item">
              <View className="form-icon">📍</View>
              <View className="form-content">
                <View className="form-label">目的地</View>
                {locating ? (
                  <View className="debug-text">定位中...</View>
                ) : (
                  <View className="form-value">
                    {filters.city || '选择城市'}
                    <Text className="picker-arrow">▼</Text>
                  </View>
                )}
              </View>
            </View>
          </Picker>

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

        {/* 👇 看这里！你的地址标签完好无损地在这里！👇 */}
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

      {/* ✅ 去掉了惹祸的 Popup，直接用极其干净的 NutUI 日历 */}
      <Calendar
        visible={isCalendarOpen}
        type="range"
        startDate={getStartDate()}
        endDate={getEndDate()}
        onClose={() => setIsCalendarOpen(false)}
        onConfirm={handleConfirmDate}
      />
    </View>
  )
}

export default Index