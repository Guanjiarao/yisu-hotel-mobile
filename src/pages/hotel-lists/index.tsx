import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad, getCurrentInstance } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { useLocationStore } from '../../store/location'
import './index.scss'

interface Hotel {
  id: string
  name: string
  nameEn: string
  image: string
  rating: number
  reviewCount: number
  location: string
  distance: string
  tags: string[]
  originalPrice?: number
  currentPrice: number
  hasPromotion: boolean
}

function HotelLists() {
  const [city, setCity] = useState('定位中...')
  const [keyword, setKeyword] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [statusBarHeight, setStatusBarHeight] = useState(0)

  const address = useLocationStore((s) => s.address)

  useLoad(() => {
    // 获取状态栏高度
    const systemInfo = Taro.getSystemInfoSync()
    setStatusBarHeight(systemInfo.statusBarHeight || 0)

    // 获取路由参数并解码
    const instance = getCurrentInstance()
    const params = instance.router?.params || {}

    // 处理 city 参数
    let cityParam = ''
    if (params.city) {
      try {
        cityParam = decodeURIComponent(params.city)
      } catch (e) {
        cityParam = params.city
      }
    }
    
    // city 优先级：路由参数 > store 中的定位城市 > "定位中..."
    if (cityParam) {
      setCity(cityParam)
    } else if (address?.city) {
      setCity(address.city)
    } else {
      setCity('定位中...')
    }

    // 处理 keyword 参数
    if (params.keyword) {
      try {
        setKeyword(decodeURIComponent(params.keyword))
      } catch (e) {
        setKeyword(params.keyword)
      }
    }

    // 处理日期参数，如果为空则使用今天和明天
    if (params.checkIn) {
      setCheckIn(params.checkIn)
    } else {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      setCheckIn(`${year}-${month}-${day}`)
    }

    if (params.checkOut) {
      setCheckOut(params.checkOut)
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const year = tomorrow.getFullYear()
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const day = String(tomorrow.getDate()).padStart(2, '0')
      setCheckOut(`${year}-${month}-${day}`)
    }
  })

  useEffect(() => {
    if (city && city !== '定位中...') {
      fetchHotelsData()
    }
  }, [city, keyword])

  const fetchHotelsData = async () => {
    setLoading(true)
    
    // 显示加载提示
    Taro.showLoading({ 
      title: '疯狂搜索中...', 
      mask: true 
    })
    
    try {
      // 准备请求参数
      const requestData: any = {}
      
      // city 参数：优先使用当前 state 中的 city（已经处理过路由参数和定位）
      if (city && city !== '定位中...') {
        requestData.city = city
      }
      
      // keyword 参数
      if (keyword) {
        requestData.keyword = keyword
      }
      
      // 日期参数
      if (checkIn) {
        requestData.checkIn = checkIn
      }
      if (checkOut) {
        requestData.checkOut = checkOut
      }

      console.log('请求参数:', requestData)

      // 发起真实的后端请求
      const response = await Taro.request({
        url: 'http://localhost:3001/api/hotels/search',
        method: 'GET',
        data: requestData,
        timeout: 10000
      })

      console.log('后端返回:', response)

      // 处理返回的数据
      if (response.statusCode === 200 && response.data) {
        const hotelList = response.data.data || []
        setHotels(hotelList)
        
        // 如果返回空数组，提示用户
        if (hotelList.length === 0) {
          console.log('未搜索到酒店')
        }
      } else {
        throw new Error('接口返回异常')
      }
    } catch (error) {
      console.error('获取酒店数据失败:', error)
      Taro.showToast({ 
        title: '网络开小差了', 
        icon: 'none',
        duration: 2000
      })
      // 出错时清空列表
      setHotels([])
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const handleGoBack = () => {
    Taro.navigateBack()
  }

  const handleViewDetail = (hotelId: string) => {
    Taro.showToast({ 
      title: `查看酒店 ${hotelId} 详情`, 
      icon: 'none' 
    })
    // TODO: 跳转到酒店详情页
    // Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${hotelId}` })
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Text key={index} className={`star ${index < rating ? 'star-active' : ''}`}>
        ★
      </Text>
    ))
  }

  const formatDateRange = () => {
    if (!checkIn || !checkOut) return ''
    // 简化日期显示：只显示月-日
    const formatShortDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    return `${formatShortDate(checkIn)}-${formatShortDate(checkOut)}`
  }

  return (
    <View className="hotel-lists-page">
      {/* 顶部导航栏 */}
      <View 
        className="top-navbar" 
        style={{ paddingTop: `${statusBarHeight}px` }}
      >
        <View className="nav-content">
          <View className="nav-back" onClick={handleGoBack}>
            ←
          </View>
          <View className="nav-title">
            <Text className="nav-city">📍{city}</Text>
            {keyword && <Text className="nav-keyword"> · {keyword}</Text>}
            {checkIn && checkOut && (
              <Text className="nav-date"> | 📅 {formatDateRange()}</Text>
            )}
          </View>
        </View>
      </View>

      {/* 筛选工具栏 */}
      <View 
        className="filter-bar"
        style={{ top: `${statusBarHeight + 44}px` }}
      >
        <View className="filter-options">
          <View className="filter-item">推荐排序 ▼</View>
          <View className="filter-item">不限 ▼</View>
          <View className="filter-item">星级 ▼</View>
          <View className="filter-item filter-icon">☰ 筛选</View>
        </View>
        <View className="filter-result">
          为您找到 {hotels.length} 家酒店
        </View>
      </View>

      {/* 酒店列表 */}
      <ScrollView 
        className="hotel-list-container"
        style={{ paddingTop: `${statusBarHeight + 44 + 88}px` }}
        scrollY
        enableBackToTop
      >
        {loading ? (
          <View className="loading-state">加载中...</View>
        ) : hotels.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🏨</Text>
            <Text className="empty-text">暂无符合条件的酒店~</Text>
            <Text className="empty-hint">试试调整搜索条件吧</Text>
          </View>
        ) : (
          hotels.map((hotel) => (
            <View key={hotel.id} className="hotel-card">
              {/* 酒店封面图 */}
              <View className="hotel-image-wrapper">
                <Image 
                  className="hotel-image" 
                  src={hotel.image} 
                  mode="aspectFill"
                />
                {hotel.hasPromotion && (
                  <View className="promotion-tag">限时优惠</View>
                )}
              </View>

              {/* 酒店信息 */}
              <View className="hotel-info">
                {/* 第一行：中文名 + 星级 */}
                <View className="hotel-name-row">
                  <Text className="hotel-name">{hotel.name}</Text>
                  <View className="hotel-stars">
                    {renderStars(hotel.rating)}
                  </View>
                </View>

                {/* 第二行：英文名 */}
                <Text className="hotel-name-en">{hotel.nameEn}</Text>

                {/* 第三行：评分 + 评论数 */}
                <View className="hotel-rating-row">
                  <View className="rating-badge">
                    <Text className="rating-score">{(hotel.rating * 2).toFixed(1)}</Text>
                    <Text className="rating-count">{hotel.reviewCount}条点评</Text>
                  </View>
                </View>

                {/* 第四行：位置信息 */}
                <View className="hotel-location-row">
                  <Text className="location-icon">📍</Text>
                  <Text className="location-text">{hotel.location}</Text>
                </View>
                <Text className="location-distance">{hotel.distance}</Text>

                {/* 第五行：标签 */}
                <View className="hotel-tags-row">
                  {hotel.tags.map((tag, index) => (
                    <View key={index} className="hotel-tag">{tag}</View>
                  ))}
                </View>

                {/* 底部：价格 + 按钮 */}
                <View className="hotel-footer">
                  <View className="price-section">
                    {hotel.originalPrice && (
                      <Text className="price-original">¥{hotel.originalPrice}</Text>
                    )}
                    <View className="price-current-row">
                      <Text className="price-symbol">¥</Text>
                      <Text className="price-current">{hotel.currentPrice}</Text>
                      <Text className="price-unit">起</Text>
                    </View>
                  </View>
                  <View 
                    className="view-detail-btn" 
                    onClick={() => handleViewDetail(hotel.id)}
                  >
                    查看详情
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default HotelLists
