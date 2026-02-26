import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useLoad, getCurrentInstance } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getEmailFromToken } from '../../utils/jwt'
import { useSearchStore } from '../../store/search'
import './index.scss'

// 定义酒店数据类型
interface HotelData {
  id: string
  name: string
  nameEn?: string
  rating: number   // 星级（1-5）
  score: number    // 评分（如 4.7）
  maxRating?: number
  reviewCount: number
  address: string
  phone: string
  description: string
  facilities: Array<{ icon: string; name: string }>
  images: string[]
  rooms: Array<{
    id: string
    name: string
    nameEn?: string
    image: string
    area: string | number  // 支持带单位的字符串或纯数字
    bedType: string
    capacity: string | number  // 支持带单位的字符串或纯数字
    tags: string[]
    originalPrice?: number
    currentPrice: number
    stock: number
    hasPromotion: boolean
  }>
  policies: {
    checkIn: string[]
    cancellation: string[]
    other: string[]
  }
}

const DEFAULT_IMAGE = ''

function HotelDetail() {
  const [hotelData, setHotelData] = useState<HotelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'rooms' | 'policy'>('rooms')
  const [hotelId, setHotelId] = useState('')

  useLoad(() => {
    // 获取路由参数中的酒店 ID
    const instance = getCurrentInstance()
    const id = instance.router?.params?.id || ''
    
    console.log('【酒店详情页】加载，酒店ID:', id)
    setHotelId(id)
  })

  useEffect(() => {
    if (hotelId) {
      fetchHotelDetail(hotelId)
    }
  }, [hotelId])

  const fetchHotelDetail = async (id: string) => {
    setLoading(true)
    
    Taro.showLoading({
      title: '加载中...',
      mask: true
    })

    try {
      console.log('【请求酒店详情】ID:', id)
      
      const response = await Taro.request({
        url: `http://116.62.19.40:3002/api/hotels/${id}`,
        method: 'GET',
        timeout: 10000
      })

      console.log('【后端返回数据】:', response.data)
      console.log('【返回数据类型】:', typeof response.data)

      if (response.statusCode === 200 && response.data) {
        const rawData = response.data.data || response.data
        
        // 安全解析函数：处理可能是字符串的 JSON
        const safeParseArray = (value: any): any[] => {
          if (!value) return []
          if (Array.isArray(value)) return value
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          }
          return []
        }

        const safeParseObject = (value: any): any => {
          if (!value) return {}
          if (typeof value === 'object' && !Array.isArray(value)) return value
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value)
              return typeof parsed === 'object' ? parsed : {}
            } catch {
              return {}
            }
          }
          return {}
        }

        // 安全获取设施列表
        const facilities = safeParseArray(rawData?.facilities || rawData?.facility)
        
        // 安全获取图片列表
        let images = safeParseArray(rawData?.images || rawData?.image || rawData?.cover_img)
        if (images.length === 0) {
          images = [DEFAULT_IMAGE]
        }

        // 安全获取房型列表
        const rooms = safeParseArray(rawData?.rooms || rawData?.room_types)

        // 安全获取政策信息
        const policiesData = safeParseObject(rawData?.policies || rawData?.policy)
        
        console.log('🔥 酒店详情原始数据:', rawData)

        // 数据处理和容错
        const processedData: HotelData = {
          id: rawData?.id || rawData?._id || id,
          name: rawData?.name || '未知酒店',
          nameEn: rawData?.nameEn || rawData?.name_en || rawData?.english_name || '',
          // star 字段用于渲染星星数量（1-5），score 用于显示评分数值（如 4.7）
          rating: Number(rawData?.star || rawData?.stars || rawData?.star_rating || rawData?.rating || 0),
          score: Number(rawData?.score || rawData?.rating || 0),
          maxRating: Number(rawData?.maxRating || rawData?.max_rating || 5.0),
          reviewCount: Number(rawData?.reviewCount || rawData?.review_count || rawData?.comment_count || 0),
          address: rawData?.address || rawData?.location || '地址信息暂无',
          phone: rawData?.phone || rawData?.tel || rawData?.telephone || '',
          description: rawData?.description || rawData?.intro || rawData?.introduction || '暂无介绍',
          facilities: facilities,
          images: images,
          rooms: rooms.map(room => ({
            id: room?.id || room?._id || String(Math.random()),
            name: room?.name || room?.room_name || '标准房',
            nameEn: room?.nameEn || room?.name_en || '',
            image: room?.image || room?.cover_img || room?.cover_image || DEFAULT_IMAGE,
            area: room?.area || room?.size || '',  // 直接使用字符串，不转换
            bedType: room?.bedType || room?.bed_type || room?.bed || '标准床',
            capacity: room?.capacity || room?.max_people || '',  // 直接使用字符串，不转换
            tags: safeParseArray(room?.tags || room?.amenities),
            originalPrice: room?.originalPrice || room?.original_price || null,
            currentPrice: Number(room?.currentPrice || room?.current_price || room?.price || 0),
            stock: Number(room?.stock || room?.available || 999),
            hasPromotion: Boolean(room?.hasPromotion || room?.has_promotion || room?.promotion)
          })),
          policies: {
            checkIn: safeParseArray(policiesData?.checkIn || policiesData?.check_in || policiesData?.checkin),
            cancellation: safeParseArray(policiesData?.cancellation || policiesData?.cancel),
            other: safeParseArray(policiesData?.other || policiesData?.others || policiesData?.notes)
          }
        }

        console.log('【处理后的数据】:', processedData)
        setHotelData(processedData)
      } else {
        throw new Error('数据格式错误')
      }
    } catch (error) {
      console.error('【错误】获取酒店详情失败:', error)
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
      setHotelData(null)
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const handleSwiperChange = (e) => {
    setCurrentImageIndex(e.detail.current)
  }

  const handleCallPhone = () => {
    if (hotelData && hotelData.phone) {
      Taro.makePhoneCall({
        phoneNumber: hotelData.phone
      })
    } else {
      Taro.showToast({
        title: '电话号码不可用',
        icon: 'none'
      })
    }
  }

  const handleViewMap = () => {
    Taro.showToast({ title: '查看地图功能开发中', icon: 'none' })
  }

  const handleBookRoom = (roomId: string) => {
    // 登录拦截 - 检查 token
    const token = Taro.getStorageSync('token')
    
    if (!token) {
      Taro.showToast({ 
        title: '请先登录', 
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1500)
      return
    }

    // 验证 token 有效性
    const email = getEmailFromToken(token)
    if (!email) {
      Taro.showToast({ 
        title: '登录信息异常，请重新登录', 
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        Taro.removeStorageSync('token')
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1500)
      return
    }

    // 已登录，跳转到创建订单页
    const room = hotelData?.rooms?.find(r => r.id === roomId)
    if (!room) {
      Taro.showToast({ title: '房型信息异常', icon: 'none' })
      return
    }

    // 优先从搜索 store 中获取用户选择的日期
    const dateRange = useSearchStore.getState().filters.dateRange
    const todayStr = new Date().toISOString().split('T')[0]
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const checkIn = dateRange.checkIn || todayStr
    const checkOut = dateRange.checkOut || tomorrowStr

    console.log('🔥 跳转订单页日期来源:', { storeCheckIn: dateRange.checkIn, storeCheckOut: dateRange.checkOut, checkIn, checkOut })

    const params = new URLSearchParams({
      hotelId: hotelData?.id || hotelId,
      hotelName: hotelData?.name || '',
      roomId: room.id,
      roomName: room.name,
      price: String(room.currentPrice),
      checkIn,
      checkOut
    })

    Taro.navigateTo({ 
      url: `/pages/order-create/index?${params.toString()}` 
    })
  }

  const handleBottomAction = () => {
    if (activeTab === 'policy') {
      setActiveTab('rooms')
      Taro.pageScrollTo({ scrollTop: 600, duration: 300 })
    } else {
      // 立即预订 - 预订第一个房型
      const firstRoom = hotelData?.rooms?.[0]
      if (firstRoom) {
        handleBookRoom(firstRoom.id)
      } else {
        Taro.showToast({ title: '暂无可预订房型', icon: 'none' })
      }
    }
  }

  const getMinPrice = () => {
    if (!hotelData?.rooms || !Array.isArray(hotelData.rooms) || hotelData.rooms.length === 0) {
      return 0
    }
    const prices = hotelData.rooms
      .map(r => Number(r?.currentPrice || 0))
      .filter(p => p > 0)
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const renderStars = (rating: number) => {
    const safeRating = Number(rating) || 0
    const fullStars = Math.floor(safeRating)
    return Array(5).fill(0).map((_, index) => (
      <Text key={index} className={`star ${index < fullStars ? 'star-active' : ''}`}>
        ★
      </Text>
    ))
  }

  // 智能图标映射函数
  const getFacilityIcon = (facilityName: string): string => {
    const name = (facilityName || '').toLowerCase()
    
    // WiFi 相关
    if (name.includes('wifi') || name.includes('网络') || name.includes('无线')) {
      return '📶'
    }
    // 停车相关
    if (name.includes('停车') || name.includes('车位') || name.includes('parking')) {
      return '🚗'
    }
    // 游泳池相关
    if (name.includes('泳池') || name.includes('游泳') || name.includes('pool')) {
      return '🏊'
    }
    // 健身相关
    if (name.includes('健身') || name.includes('gym') || name.includes('运动')) {
      return '💪'
    }
    // 餐厅相关
    if (name.includes('餐厅') || name.includes('餐饮') || name.includes('restaurant')) {
      return '🍴'
    }
    // 早餐相关
    if (name.includes('早餐') || name.includes('breakfast')) {
      return '🍳'
    }
    // 会议室相关
    if (name.includes('会议') || name.includes('会务') || name.includes('meeting')) {
      return '💼'
    }
    // SPA/按摩相关
    if (name.includes('spa') || name.includes('按摩') || name.includes('massage')) {
      return '💆'
    }
    // 空调相关
    if (name.includes('空调') || name.includes('冷气') || name.includes('air')) {
      return '❄️'
    }
    // 电视相关
    if (name.includes('电视') || name.includes('tv')) {
      return '📺'
    }
    // 洗衣相关
    if (name.includes('洗衣') || name.includes('laundry')) {
      return '👔'
    }
    // 酒吧相关
    if (name.includes('酒吧') || name.includes('bar')) {
      return '🍷'
    }
    // 接送相关
    if (name.includes('接送') || name.includes('shuttle')) {
      return '🚌'
    }
    // 宠物相关
    if (name.includes('宠物') || name.includes('pet')) {
      return '🐕'
    }
    // 吸烟相关
    if (name.includes('吸烟') || name.includes('smoking')) {
      return '🚬'
    }
    // 禁烟相关
    if (name.includes('禁烟') || name.includes('non-smoking')) {
      return '🚭'
    }
    // 咖啡相关
    if (name.includes('咖啡') || name.includes('coffee')) {
      return '☕'
    }
    // 保险箱相关
    if (name.includes('保险箱') || name.includes('safe')) {
      return '🔒'
    }
    
    // 默认图标
    return '✓'
  }

  // 严格的 Loading 拦截 - 绝对拦截
  if (loading || !hotelData) {
    return (
      <View className="hotel-detail-page">
        <View className="loading-container">
          <Text className="loading-text">
            {loading ? '加载中...' : '加载失败'}
          </Text>
          {!loading && (
            <View className="retry-btn" onClick={() => fetchHotelDetail(hotelId)}>
              重新加载
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className="hotel-detail-page">
      {/* 顶部轮播图 */}
      <View className="swiper-container">
        <Swiper
          className="hotel-swiper"
          indicatorDots={false}
          autoplay={false}
          circular
          onChange={handleSwiperChange}
        >
          {(hotelData?.images || [DEFAULT_IMAGE]).map((img, index) => (
            <SwiperItem key={index}>
              <Image className="swiper-image" src={img || DEFAULT_IMAGE} mode="aspectFill" />
            </SwiperItem>
          ))}
        </Swiper>
        <View className="swiper-indicator">
          {currentImageIndex + 1} / {(hotelData?.images || []).length || 1}
        </View>
      </View>

      {/* 酒店基础信息卡片 */}
      <View className="hotel-info-card">
        <View className="hotel-header">
          <Text className="hotel-name">{hotelData?.name || '未知酒店'}</Text>
          <View className="hotel-rating-row">
            <View className="stars">
              {renderStars(hotelData?.rating || 0)}
            </View>
            <Text className="rating-score">
              {hotelData?.score ? Number(hotelData.score).toFixed(1) : (hotelData?.rating ? Number(hotelData.rating).toFixed(1) : '4.5')}
            </Text>
            <Text className="rating-max">/ {hotelData?.maxRating || 5.0}</Text>
          </View>
        </View>

        {hotelData?.nameEn && (
          <Text className="hotel-name-en">{hotelData.nameEn}</Text>
        )}

        <View className="review-count-row">
          <Text className="review-count">{hotelData?.reviewCount || 128}条点评</Text>
        </View>

        <View className="info-row" onClick={handleViewMap}>
          <Text className="info-icon">📍</Text>
          <Text className="info-text">{hotelData?.address || '地址暂无'}</Text>
          <Text className="view-map-link">查看地图</Text>
        </View>

        {hotelData?.phone && (
          <View className="info-row" onClick={handleCallPhone}>
            <Text className="info-icon">📞</Text>
            <Text className="info-text info-phone">{hotelData.phone}</Text>
          </View>
        )}
      </View>

      {/* 设施与介绍模块 */}
      {hotelData?.facilities && Array.isArray(hotelData.facilities) && hotelData.facilities.length > 0 && (
        <View className="facilities-section">
          <Text className="section-title">酒店设施</Text>
          <View className="facilities-grid">
            {(hotelData?.facilities || []).map((facility, index) => {
              // 兼容两种格式：对象格式 { icon, name } 和纯字符串格式
              const isString = typeof facility === 'string'
              const facilityName = isString ? facility : (facility?.name || '')
              const facilityIcon = isString ? getFacilityIcon(facility) : (facility?.icon || getFacilityIcon(facilityName))
              
              return (
                <View key={index} className="facility-item">
                  <Text className="facility-icon">{facilityIcon}</Text>
                  <Text className="facility-name">{facilityName}</Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      <View className="description-section">
        <Text className="section-title">酒店介绍</Text>
        <Text className="description-text">{hotelData?.description || '暂无介绍'}</Text>
      </View>

      {/* Sticky 吸顶 Tabs */}
      <View className="sticky-tabs">
        <View 
          className={`tab-item ${activeTab === 'rooms' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          选择房型
        </View>
        <View 
          className={`tab-item ${activeTab === 'policy' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('policy')}
        >
          政策说明
        </View>
      </View>

      {/* 内容区域 */}
      {activeTab === 'rooms' ? (
        <View className="rooms-section">
          {hotelData?.rooms && Array.isArray(hotelData.rooms) && hotelData.rooms.length > 0 ? (
            <>
              <Text className="section-subtitle">按价格从低到高排列</Text>
              {(hotelData?.rooms || []).map((room, index) => (
                <View key={room?.id || index} className="room-card">
                  <View className="room-image-wrapper">
                    <Image 
                      className="room-image" 
                      src={room?.image || DEFAULT_IMAGE} 
                      mode="aspectFill" 
                    />
                    {room?.hasPromotion && (
                      <View className="promotion-tag">限时优惠</View>
                    )}
                  </View>

                  <View className="room-info">
                    <Text className="room-name">{room?.name || '标准房'}</Text>
                    {room?.nameEn && (
                      <Text className="room-name-en">{room.nameEn}</Text>
                    )}

                    <View className="room-specs">
                      {room?.area && (
                        <View className="spec-item">
                          <Text className="spec-icon">📐</Text>
                          <Text className="spec-text">{room.area}</Text>
                        </View>
                      )}
                      {room?.bedType && (
                        <View className="spec-item">
                          <Text className="spec-icon">🛏️</Text>
                          <Text className="spec-text">{room.bedType}</Text>
                        </View>
                      )}
                      {room?.capacity && (
                        <View className="spec-item">
                          <Text className="spec-icon">👥</Text>
                          <Text className="spec-text">{room.capacity}</Text>
                        </View>
                      )}
                    </View>

                    {room?.tags && Array.isArray(room.tags) && room.tags.length > 0 && (
                      <View className="room-tags">
                        {(room?.tags || []).map((tag, tagIndex) => (
                          <View key={tagIndex} className="room-tag">{tag || ''}</View>
                        ))}
                      </View>
                    )}

                    {room?.stock && Number(room.stock) <= 3 && (
                      <Text className="stock-warning">仅剩{room.stock}间</Text>
                    )}

                    <View className="room-footer">
                      <View className="price-section">
                        {room?.originalPrice && Number(room.originalPrice) > 0 && (
                          <Text className="price-original">¥{room.originalPrice}</Text>
                        )}
                        <View className="price-current-row">
                          <Text className="price-symbol">¥</Text>
                          <Text className="price-current">{room?.currentPrice || 0}</Text>
                        </View>
                      </View>
                      <View 
                        className="book-btn"
                        onClick={() => handleBookRoom(room?.id || '')}
                      >
                        预订
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View className="empty-rooms">
              <Text className="empty-text">暂无房型信息</Text>
            </View>
          )}
        </View>
      ) : (
        <View className="policy-section">
          {hotelData?.policies?.checkIn && Array.isArray(hotelData.policies.checkIn) && hotelData.policies.checkIn.length > 0 && (
            <View className="policy-group">
              <Text className="policy-title">入住政策</Text>
              {(hotelData?.policies?.checkIn || []).map((item, index) => (
                <View key={index} className="policy-item">
                  <Text className="policy-bullet">•</Text>
                  <Text className="policy-text">{item || ''}</Text>
                </View>
              ))}
            </View>
          )}

          {hotelData?.policies?.cancellation && Array.isArray(hotelData.policies.cancellation) && hotelData.policies.cancellation.length > 0 && (
            <View className="policy-group">
              <Text className="policy-title">取消政策</Text>
              {(hotelData?.policies?.cancellation || []).map((item, index) => (
                <View key={index} className="policy-item">
                  <Text className="policy-bullet">•</Text>
                  <Text className="policy-text">{item || ''}</Text>
                </View>
              ))}
            </View>
          )}

          {hotelData?.policies?.other && Array.isArray(hotelData.policies.other) && hotelData.policies.other.length > 0 && (
            <View className="policy-group">
              <Text className="policy-title">其他说明</Text>
              {(hotelData?.policies?.other || []).map((item, index) => (
                <View key={index} className="policy-item">
                  <Text className="policy-bullet">•</Text>
                  <Text className="policy-text">{item || ''}</Text>
                </View>
              ))}
            </View>
          )}

          {(!hotelData?.policies?.checkIn || !Array.isArray(hotelData.policies.checkIn) || hotelData.policies.checkIn.length === 0) &&
           (!hotelData?.policies?.cancellation || !Array.isArray(hotelData.policies.cancellation) || hotelData.policies.cancellation.length === 0) &&
           (!hotelData?.policies?.other || !Array.isArray(hotelData.policies.other) || hotelData.policies.other.length === 0) && (
            <View className="empty-policy">
              <Text className="empty-text">暂无政策信息</Text>
            </View>
          )}
        </View>
      )}

      {/* 底部固定动作栏 */}
      <View className="bottom-bar">
        <View className="price-info">
          <Text className="price-label">最低价</Text>
          <View className="price-value-row">
            <Text className="price-symbol-small">¥</Text>
            <Text className="price-value">{getMinPrice() || 0}</Text>
            <Text className="price-unit">起</Text>
          </View>
        </View>
        <View className="action-btn" onClick={handleBottomAction}>
          {activeTab === 'policy' ? '查看房型' : '立即预订'}
        </View>
      </View>
    </View>
  )
}

export default HotelDetail
