import { View, Text, Input } from '@tarojs/components'
import Taro, { useLoad, getCurrentInstance } from '@tarojs/taro'
import { useState } from 'react'
import { getEmailFromToken, isTokenExpired } from '../../utils/jwt'
import './index.scss'

function OrderCreate() {
  const [orderInfo, setOrderInfo] = useState({
    hotelId: '',
    hotelName: '',
    roomId: '',
    roomName: '',
    price: 0,
    checkIn: '',
    checkOut: '',
    nights: 1
  })
  
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useLoad(() => {
    // 获取 token 凭证
    const token = Taro.getStorageSync('token')
    
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 2000)
      return
    }

    // 检查 token 是否过期
    if (isTokenExpired(token)) {
      Taro.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        Taro.removeStorageSync('token')
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 2000)
      return
    }

    // 从 JWT 中提取邮箱
    const email = getEmailFromToken(token)
    
    if (!email) {
      Taro.showModal({
        title: '获取用户信息失败',
        content: '无法从登录凭证中获取邮箱信息，请重新登录',
        showCancel: false,
        success: () => {
          Taro.removeStorageSync('token')
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      })
      return
    }

    console.log('【用户邮箱】:', email)
    setUserEmail(email)

    // 尝试从缓存获取用户信息（用于自动填充表单）
    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo) {
      setGuestName(userInfo.username || userInfo.name || '')
      setGuestPhone(userInfo.phone || '')
    }

    // 获取路由参数
    const instance = getCurrentInstance()
    const params = instance.router?.params || {}

    console.log('🔥 接收到的原始路由参数:', params)

    // checkIn/checkOut 可能经过 URLSearchParams 编码，需要 decode
    let checkInDate = ''
    let checkOutDate = ''
    try { checkInDate = decodeURIComponent(params.checkIn || '') } catch { checkInDate = params.checkIn || '' }
    try { checkOutDate = decodeURIComponent(params.checkOut || '') } catch { checkOutDate = params.checkOut || '' }

    // 统一转为 YYYY-MM-DD 格式（兼容斜杠 2026/03/01 和横杠 2026-03-01）
    const normalizeDate = (s: string) => s.replace(/\//g, '-').trim()
    checkInDate = normalizeDate(checkInDate)
    checkOutDate = normalizeDate(checkOutDate)

    console.log('🔥 解码后日期:', { checkInDate, checkOutDate })

    // 计算入住天数
    const nights = calculateNights(checkInDate, checkOutDate)

    setOrderInfo({
      hotelId: params.hotelId || '',
      hotelName: decodeURIComponent(params.hotelName || ''),
      roomId: params.roomId || '',
      roomName: decodeURIComponent(params.roomName || ''),
      price: Number(params.price || 0),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights
    })

    // 尝试从缓存获取用户信息
    if (userInfo) {
      setGuestName(userInfo.username || '')
      setGuestPhone(userInfo.phone || userInfo.email || '')
    }
  })

  // 安全提取 YYYY-MM-DD 中的年月日，避免 iOS 时区偏移
  const extractYMD = (dateStr: string) => {
    const match = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    return { y: parseInt(match[1]), m: parseInt(match[2]), d: parseInt(match[3]) }
  }

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const inYmd = extractYMD(checkIn)
    const outYmd = extractYMD(checkOut)
    if (!inYmd || !outYmd) return 1
    const inMs = new Date(inYmd.y, inYmd.m - 1, inYmd.d).getTime()
    const outMs = new Date(outYmd.y, outYmd.m - 1, outYmd.d).getTime()
    const n = Math.round((outMs - inMs) / (1000 * 60 * 60 * 24))
    return n > 0 ? n : 1
  }

  const formatDate = (dateStr: string): string => {
    const ymd = extractYMD(dateStr)
    if (!ymd) return ''
    // 用本地时间构造，避免时区偏移导致星期几算错
    const date = new Date(ymd.y, ymd.m - 1, ymd.d)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${ymd.m}月${ymd.d}日 ${weekdays[date.getDay()]}`
  }

  const getTotalPrice = (): number => {
    return orderInfo.price * orderInfo.nights
  }

  const handleSubmitOrder = async () => {
    // 表单验证
    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入入住人姓名', icon: 'none' })
      return
    }
    
    if (!guestPhone.trim()) {
      Taro.showToast({ title: '请输入联系手机号', icon: 'none' })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(guestPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    // 检查邮箱
    if (!userEmail) {
      Taro.showToast({ title: '用户信息异常，请重新登录', icon: 'none' })
      return
    }

    // 调用后端创建订单接口
    Taro.showLoading({ title: '提交中...', mask: true })

    try {
      console.log('【创建订单】请求参数:', {
        user_email: userEmail,
        hotel_name: orderInfo.hotelName,
        room_name: orderInfo.roomName,
        check_in: orderInfo.checkIn,
        check_out: orderInfo.checkOut,
        total_price: getTotalPrice()
      })

      const response = await Taro.request({
        url: 'http://116.62.19.40:3002/api/orders',
        method: 'POST',
        data: {
          user_email: userEmail,
          hotel_name: orderInfo.hotelName,
          room_name: orderInfo.roomName,
          check_in: orderInfo.checkIn,
          check_out: orderInfo.checkOut,
          total_price: getTotalPrice(),
          guest_name: guestName,
          guest_phone: guestPhone
        },
        timeout: 10000
      })

      console.log('【创建订单】后端返回:', response.data)

      Taro.hideLoading()

      if (response.statusCode === 200 && response.data) {
        const result = response.data
        
        if (result.code === 200 || result.success) {
          Taro.showToast({ 
            title: '预订成功', 
            icon: 'success',
            duration: 2000
          })
          
          setTimeout(() => {
            Taro.redirectTo({ url: '/pages/order-list/index' })
          }, 2000)
        } else {
          throw new Error(result.message || '订单创建失败')
        }
      } else {
        throw new Error('网络请求失败')
      }
    } catch (error) {
      console.error('【错误】创建订单失败:', error)
      Taro.hideLoading()
      Taro.showToast({ 
        title: error.message || '订单创建失败，请重试', 
        icon: 'none',
        duration: 2000
      })
    }
  }

  return (
    <View className="order-create-page">
      {/* 酒店与房型信息卡片 */}
      <View className="info-card">
        <Text className="card-title">订单信息</Text>
        
        <View className="hotel-info">
          <Text className="hotel-name">{orderInfo.hotelName}</Text>
          <Text className="room-name">{orderInfo.roomName}</Text>
        </View>

        <View className="date-info">
          <View className="date-row">
            <Text className="date-label">入住</Text>
            <Text className="date-value">{formatDate(orderInfo.checkIn)}</Text>
          </View>
          <View className="date-divider">-</View>
          <View className="date-row">
            <Text className="date-label">离店</Text>
            <Text className="date-value">{formatDate(orderInfo.checkOut)}</Text>
          </View>
        </View>

        <View className="nights-info">
          <Text className="nights-text">共 {orderInfo.nights} 晚</Text>
        </View>

        <View className="policy-tags">
          <View className="policy-tag">大床房</View>
          <View className="policy-tag">含早餐</View>
        </View>
      </View>

      {/* 入住人信息卡片 */}
      <View className="guest-card">
        <Text className="card-title">入住人信息</Text>
        
        <View className="form-item">
          <Text className="form-label">入住人姓名</Text>
          <Input
            className="form-input"
            placeholder="请输入入住人姓名"
            placeholderClass="input-placeholder"
            value={guestName}
            onInput={(e) => setGuestName(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">联系手机号</Text>
          <Input
            className="form-input"
            type="number"
            placeholder="请输入联系手机号"
            placeholderClass="input-placeholder"
            value={guestPhone}
            maxlength={11}
            onInput={(e) => setGuestPhone(e.detail.value)}
          />
        </View>
      </View>

      {/* 退改政策 */}
      <View className="policy-card">
        <Text className="card-title">退改政策</Text>
        <View className="policy-content">
          <Text className="policy-icon">✓</Text>
          <Text className="policy-text">入住当天 18:00 前可免费取消</Text>
        </View>
      </View>

      {/* 价格明细 */}
      <View className="price-card">
        <Text className="card-title">价格明细</Text>
        <View className="price-row">
          <Text className="price-label">房费 × {orderInfo.nights}晚</Text>
          <Text className="price-value">¥{orderInfo.price * orderInfo.nights}</Text>
        </View>
      </View>

      {/* 底部吸底操作栏 */}
      <View className="bottom-bar">
        <View className="price-section">
          <Text className="price-label">总计</Text>
          <View className="price-row-bottom">
            <Text className="price-symbol">¥</Text>
            <Text className="price-total">{getTotalPrice()}</Text>
          </View>
        </View>
        <View className="submit-btn" onClick={handleSubmitOrder}>
          提交订单
        </View>
      </View>
    </View>
  )
}

export default OrderCreate
