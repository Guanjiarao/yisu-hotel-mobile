import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getEmailFromToken, isTokenExpired } from '../../utils/jwt'
import './index.scss'

interface Order {
  id?: string
  order_no: string
  hotel_name: string
  room_name: string
  check_in: string
  check_out: string
  total_price: number
  status: string
  created_at?: string
}

type TabType = 'all' | 'pending' | 'completed' | 'cancelled'

function OrderList() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useLoad(() => {
    console.log('订单列表页加载')
    
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
  })

  useEffect(() => {
    if (userEmail) {
      fetchOrders()
    }
  }, [userEmail])

  const fetchOrders = async () => {
    setLoading(true)
    
    Taro.showLoading({
      title: '加载中...',
      mask: true
    })

    try {
      console.log('【获取订单列表】用户邮箱:', userEmail)

      const response = await Taro.request({
        url: `http://116.62.19.40:3002/api/orders?email=${encodeURIComponent(userEmail)}`,
        method: 'GET',
        timeout: 10000
      })

      console.log('【订单列表】后端返回:', response.data)

      if (response.statusCode === 200 && response.data) {
        const result = response.data
        
        // 兼容不同的返回格式
        let orderList: Order[] = []
        if (result.data && Array.isArray(result.data)) {
          orderList = result.data
        } else if (Array.isArray(result)) {
          orderList = result
        } else if (result.orders && Array.isArray(result.orders)) {
          orderList = result.orders
        }

        console.log('【解析后的订单列表】:', orderList)
        setOrders(orderList)
      } else {
        throw new Error('获取订单列表失败')
      }
    } catch (error) {
      console.error('【错误】获取订单列表失败:', error)
      Taro.showToast({ 
        title: '加载失败，请重试', 
        icon: 'none',
        duration: 2000
      })
      setOrders([])
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const tabs = [
    { key: 'all' as TabType, label: '全部' },
    { key: 'pending' as TabType, label: '待支付' },
    { key: 'completed' as TabType, label: '已完成' },
    { key: 'cancelled' as TabType, label: '已取消' }
  ]

  const getFilteredOrders = (): Order[] => {
    if (activeTab === 'all') return orders
    return orders.filter(order => {
      const status = (order.status || '').toLowerCase()
      return status === activeTab || status.includes(activeTab)
    })
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }

  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 1
    const start = new Date(checkIn).getTime()
    const end = new Date(checkOut).getTime()
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return nights > 0 ? nights : 1
  }

  const getStatusText = (status: string): string => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower === 'pending' || statusLower.includes('pending')) return '待支付'
    if (statusLower === 'completed' || statusLower.includes('completed')) return '已完成'
    if (statusLower === 'cancelled' || statusLower.includes('cancelled')) return '已取消'
    return status || '未知'
  }

  const getStatusType = (status: string): 'pending' | 'completed' | 'cancelled' => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower === 'pending' || statusLower.includes('pending')) return 'pending'
    if (statusLower === 'completed' || statusLower.includes('completed')) return 'completed'
    if (statusLower === 'cancelled' || statusLower.includes('cancelled')) return 'cancelled'
    return 'completed'
  }

  const handleCancelOrder = (orderNo: string) => {
    console.log('取消订单:', orderNo)
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用后端取消订单接口
          console.log('确认取消订单:', orderNo)
          Taro.showToast({ title: '订单已取消', icon: 'success' })
          // 重新获取订单列表
          fetchOrders()
        }
      }
    })
  }

  const handlePayOrder = (orderNo: string) => {
    console.log('支付订单:', orderNo)
    Taro.showToast({ title: '跳转支付...', icon: 'none' })
    // TODO: 跳转到支付页面
  }

  const handleBookAgain = (order: Order) => {
    console.log('再次预订:', order.order_no, order.hotel_name)
    Taro.showToast({ title: '再次预订...', icon: 'none' })
    // TODO: 跳转到酒店详情页或创建订单页
  }

  const handleViewDetail = (orderNo: string) => {
    console.log('查看订单详情:', orderNo)
    Taro.showToast({ title: '查看订单详情', icon: 'none' })
    // TODO: 跳转到订单详情页
  }

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'status-pending'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  return (
    <View className="order-list-page">
      {/* 顶部 Tabs 吸顶 */}
      <View className="tabs-container">
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {/* 订单列表 */}
      <ScrollView className="order-list-scroll" scrollY enableBackToTop>
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : getFilteredOrders().length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📋</Text>
            <Text className="empty-text">暂无订单</Text>
          </View>
        ) : (
          getFilteredOrders().map((order, index) => {
            const statusType = getStatusType(order.status)
            const nights = calculateNights(order.check_in, order.check_out)
            
            return (
              <View key={order.order_no || order.id || index} className="order-card">
                {/* 顶部：酒店名称 + 状态 */}
                <View className="order-header">
                  <Text className="hotel-name">{order.hotel_name || '未知酒店'}</Text>
                  <Text className={`order-status ${getStatusClass(statusType)}`}>
                    {getStatusText(order.status)}
                  </Text>
                </View>

                {/* 中部：订单详情 */}
                <View className="order-content" onClick={() => handleViewDetail(order.order_no)}>
                  <Text className="room-name">{order.room_name || '标准房'}</Text>
                  
                  <View className="date-info">
                    <Text className="date-text">
                      {formatDate(order.check_in)} - {formatDate(order.check_out)}
                    </Text>
                    <Text className="nights-text">共{nights}晚</Text>
                  </View>

                  <View className="price-row">
                    <Text className="price-label">订单金额</Text>
                    <View className="price-value-row">
                      <Text className="price-symbol">¥</Text>
                      <Text className="price-value">{order.total_price || 0}</Text>
                    </View>
                  </View>
                </View>

                {/* 底部：操作按钮 */}
                <View className="order-footer">
                  <Text className="order-id">订单号：{order.order_no}</Text>
                  <View className="action-buttons">
                    {statusType === 'pending' && (
                      <>
                        <View 
                          className="action-btn btn-cancel"
                          onClick={() => handleCancelOrder(order.order_no)}
                        >
                          取消订单
                        </View>
                        <View 
                          className="action-btn btn-pay"
                          onClick={() => handlePayOrder(order.order_no)}
                        >
                          去支付
                        </View>
                      </>
                    )}
                    {statusType === 'completed' && (
                      <View 
                        className="action-btn btn-book-again"
                        onClick={() => handleBookAgain(order)}
                      >
                        再次预订
                      </View>
                    )}
                    {statusType === 'cancelled' && (
                      <View 
                        className="action-btn btn-book-again"
                        onClick={() => handleBookAgain(order)}
                      >
                        重新预订
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

export default OrderList
