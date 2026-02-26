import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface OrderDetail {
  order_no: string
  hotel_name: string
  room_name: string
  check_in: string
  check_out: string
  total_price: number
  status: string
  created_at?: string
  guests?: number
  [key: string]: any
}

function OrderDetail() {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderNo, setOrderNo] = useState('')

  useLoad((params) => {
    const no = params.order_no || ''
    setOrderNo(no)
    if (no) {
      fetchOrderDetail(no)
    } else {
      Taro.showToast({ title: '订单号缺失', icon: 'none' })
      setLoading(false)
    }
  })

  const fetchOrderDetail = async (no: string) => {
    setLoading(true)
    Taro.showLoading({ title: '加载中...', mask: true })
    try {
      const token = Taro.getStorageSync('token')
      const response = await Taro.request({
        url: `http://116.62.19.40:3002/api/orders/${no}`,
        method: 'GET',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000,
      })
      if (response.statusCode === 200 && response.data) {
        const raw = response.data
        const detail: OrderDetail = raw.data || raw
        setOrder(detail)
      } else {
        throw new Error(`${response.statusCode}`)
      }
    } catch (err) {
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const updateOrderStatus = async (no: string, status: string) => {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: `http://116.62.19.40:3002/api/orders/${no}/status`,
      method: 'PUT',
      data: { status },
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 10000,
    })
    if (response.statusCode !== 200) {
      throw new Error(`更新失败: ${response.statusCode}`)
    }
  }

  const handleCancelOrder = () => {
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？取消后无法恢复。',
      confirmText: '确认取消',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (!res.confirm) return
        try {
          Taro.showLoading({ title: '取消中...', mask: true })
          await updateOrderStatus(orderNo, '已取消')
          Taro.hideLoading()
          Taro.showToast({ title: '订单已取消', icon: 'success', duration: 1500 })
          setTimeout(() => fetchOrderDetail(orderNo), 1500)
        } catch {
          Taro.hideLoading()
          Taro.showToast({ title: '取消失败，请重试', icon: 'none' })
        }
      },
    })
  }

  const handlePayOrder = async () => {
    Taro.showLoading({ title: '支付中...', mask: true })
    await new Promise((resolve) => setTimeout(resolve, 1500))
    try {
      await updateOrderStatus(orderNo, '已完成')
      Taro.hideLoading()
      Taro.showToast({ title: '支付成功', icon: 'success', duration: 1500 })
      setTimeout(() => fetchOrderDetail(orderNo), 1500)
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '支付失败，请重试', icon: 'none' })
    }
  }

  // 从日期字符串中安全提取 YYYY-MM-DD，不经过 new Date 转换，避免时区偏移
  const extractYMD = (dateStr: string): { y: number; m: number; d: number } | null => {
    if (!dateStr) return null
    // 兼容 "2026-02-25" 和 "2026-02-25T10:00:00.000Z" 两种格式
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    return { y: parseInt(match[1]), m: parseInt(match[2]), d: parseInt(match[3]) }
  }

  const formatDate = (dateStr: string): string => {
    const ymd = extractYMD(dateStr)
    if (!ymd) return '-'
    return `${ymd.m}月${ymd.d}日`
  }

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return '-'
    const ymd = extractYMD(dateStr)
    // 时间部分用本地时间解析（带时区的 datetime 用 replace 修正 iOS 兼容性）
    const safeStr = String(dateStr).replace('T', ' ').replace('Z', '').replace(/-/g, '/')
    const d = new Date(safeStr)
    const timeStr = isNaN(d.getTime())
      ? ''
      : ` ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    if (!ymd) return '-'
    return `${ymd.y}-${String(ymd.m).padStart(2, '0')}-${String(ymd.d).padStart(2, '0')}${timeStr}`
  }

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const inYmd = extractYMD(checkIn)
    const outYmd = extractYMD(checkOut)
    if (!inYmd || !outYmd) return 1
    // 用纯日期（不含时间）计算晚数，避免时区偏移导致相差 0 晚
    const inMs = new Date(inYmd.y, inYmd.m - 1, inYmd.d).getTime()
    const outMs = new Date(outYmd.y, outYmd.m - 1, outYmd.d).getTime()
    const n = Math.round((outMs - inMs) / (1000 * 60 * 60 * 24))
    return n > 0 ? n : 1
  }

  const STATUS_CONFIG: Record<string, { text: string; className: string; desc: string }> = {
    '待支付': { text: '待支付', className: 'status-pending', desc: '请尽快完成支付，以确保预订成功' },
    '已完成': { text: '已完成', className: 'status-completed', desc: '订单已完成，感谢您的入住' },
    '已取消': { text: '已取消', className: 'status-cancelled', desc: '订单已取消' },
  }

  const statusCfg = order ? (STATUS_CONFIG[order.status] || { text: order.status, className: '', desc: '' }) : null
  const isPending = order?.status === '待支付'

  if (loading) {
    return (
      <View className="order-detail-page">
        <View className="loading-state">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!order) {
    return (
      <View className="order-detail-page">
        <View className="empty-state">
          <Text className="empty-icon">📋</Text>
          <Text className="empty-text">订单信息不存在</Text>
        </View>
      </View>
    )
  }

  const nights = calculateNights(order.check_in, order.check_out)

  return (
    <View className="order-detail-page">
      <ScrollView
        className={`detail-scroll ${isPending ? 'has-footer' : ''}`}
        scrollY
        enableBackToTop
      >
        {/* 状态卡片 */}
        <View className={`status-card ${statusCfg?.className}`}>
          <Text className="status-big-text">{statusCfg?.text}</Text>
          {statusCfg?.desc ? <Text className="status-desc">{statusCfg.desc}</Text> : null}
        </View>

        {/* 酒店信息 */}
        <View className="detail-section">
          <View className="section-title-row">
            <Text className="section-title">住宿信息</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">酒店名称</Text>
            <Text className="info-value info-value-bold">{order.hotel_name || '-'}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">房型</Text>
            <Text className="info-value">{order.room_name || '-'}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">入住日期</Text>
            <Text className="info-value">{formatDate(order.check_in)}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">离店日期</Text>
            <Text className="info-value">{formatDate(order.check_out)}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">入住晚数</Text>
            <Text className="info-value info-value-highlight">{nights} 晚</Text>
          </View>
        </View>

        {/* 费用信息 */}
        <View className="detail-section">
          <View className="section-title-row">
            <Text className="section-title">费用明细</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">房费合计</Text>
            <View className="price-row">
              <Text className="price-symbol">¥</Text>
              <Text className="price-value">{order.total_price ?? 0}</Text>
            </View>
          </View>
          <View className="price-total-row">
            <Text className="price-total-label">实付金额</Text>
            <View className="price-total-right">
              <Text className="price-total-symbol">¥</Text>
              <Text className="price-total-value">{order.total_price ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* 订单信息 */}
        <View className="detail-section">
          <View className="section-title-row">
            <Text className="section-title">订单信息</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">订单号</Text>
            <Text className="info-value info-value-mono">{order.order_no}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">下单时间</Text>
            <Text className="info-value">{formatDateTime(order.created_at || '')}</Text>
          </View>
        </View>

        <View className="bottom-safe-area" />
      </ScrollView>

      {/* 底部操作栏（仅待支付状态显示） */}
      {isPending && (
        <View className="footer-bar">
          <View className="footer-btn btn-cancel" onClick={handleCancelOrder}>
            取消订单
          </View>
          <View className="footer-btn btn-pay" onClick={handlePayOrder}>
            立即支付
          </View>
        </View>
      )}
    </View>
  )
}

export default OrderDetail
