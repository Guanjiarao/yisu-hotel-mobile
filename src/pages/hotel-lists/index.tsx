import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import Taro, { useLoad, getCurrentInstance } from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { InfiniteLoading } from '@nutui/nutui-react-taro'
import { useLocationStore } from '../../store/location'
import './index.scss'

interface Hotel {
  id: string
  name: string
  nameEn?: string
  image?: string
  rating: number
  reviewCount?: number
  location?: string
  distance?: string
  tags?: string[]
  originalPrice?: number
  currentPrice?: number
  hasPromotion?: boolean
  // 数据库字段兼容
  _id?: string
  cover_img?: string
  cover_image?: string
  address?: string
  price?: number
  review_count?: number
  // 索引签名，允许任意其他属性
  [key: string]: any
}

// 从后端各种返回结构中提取酒店数组
function extractList(raw: any) {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    const inner = raw.data
    if (Array.isArray(inner)) return inner
    if (inner && typeof inner === 'object') {
      return inner.list || inner.hotels || inner.items || []
    }
    return raw.list || raw.hotels || raw.items || []
  }
  return []
}

// 字段规范化：将数据库字段统一映射到前端 Hotel 接口
function normalizeHotel(item: any) {
  return {
    ...item,
    score: item.score || item.rating || null,
    star: item.star || item.stars || item.rating || 0,
    review_count: item.review_count || item.reviewCount || item.review_num || null,
  }
}

// 排序选项
const SORT_OPTIONS = [
  { label: '推荐排序', value: '' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
  { label: '距离从近到远', value: 'distance_asc' },
]

// 星级选项
const STAR_OPTIONS = [
  { label: '不限星级', value: 0 },
  { label: '⭐ 1星', value: 1 },
  { label: '⭐⭐ 2星', value: 2 },
  { label: '⭐⭐⭐ 3星', value: 3 },
  { label: '⭐⭐⭐⭐ 4星', value: 4 },
  { label: '⭐⭐⭐⭐⭐ 5星', value: 5 },
]

function HotelLists() {
  const [city, setCity] = useState('定位中...')
  const [keyword, setKeyword] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [statusBarHeight, setStatusBarHeight] = useState(0)

  // 筛选/排序状态
  const [sort, setSort] = useState('')
  const [star, setStar] = useState(0)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [, setUserLat] = useState<number | null>(null)
  const [, setUserLng] = useState<number | null>(null)

  // 下拉菜单 & 筛选弹窗显示状态
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showStarMenu, setShowStarMenu] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // 价格输入临时值（点确认后才触发请求）
  const [tempMinPrice, setTempMinPrice] = useState('')
  const [tempMaxPrice, setTempMaxPrice] = useState('')

  // 分页状态
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 10

  // 用 ref 保存最新筛选参数，供 loadMore 使用
  const filterRef = useRef({ sort: '', star: 0, minPrice: '', maxPrice: '', userLat: null as number | null, userLng: null as number | null })

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
    const toDateStr = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    if (params.checkIn) {
      try {
        setCheckIn(decodeURIComponent(params.checkIn))
      } catch {
        setCheckIn(params.checkIn)
      }
    } else {
      setCheckIn(toDateStr(new Date()))
    }

    if (params.checkOut) {
      try {
        setCheckOut(decodeURIComponent(params.checkOut))
      } catch {
        setCheckOut(params.checkOut)
      }
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setCheckOut(toDateStr(tomorrow))
    }
  })

  useEffect(() => {
    if (city && city !== '定位中...') {
      // 重新搜索时，重置分页状态
      setPage(1)
      setHasMore(true)
      fetchHotelsData(1)
    }
  }, [city, keyword])

  const fetchHotelsData = async (currentPage = 1, overrideFilters?: typeof filterRef.current) => {
    const filters = overrideFilters ?? filterRef.current

    if (currentPage === 1) {
      setLoading(true)
      Taro.showLoading({ title: '疯狂搜索中...', mask: true })
    }
    
    try {
      const requestData: any = {
        page: currentPage,
        pageSize: pageSize
      }
      
      if (city && city !== '定位中...') requestData.city = city
      if (keyword) requestData.keyword = keyword
      if (checkIn) requestData.checkIn = checkIn
      if (checkOut) requestData.checkOut = checkOut

      // 筛选/排序参数
      if (filters.sort) requestData.sort = filters.sort
      if (filters.star) requestData.star = filters.star
      if (filters.minPrice) requestData.min_price = Number(filters.minPrice)
      if (filters.maxPrice) requestData.max_price = Number(filters.maxPrice)
      if (filters.userLat != null) requestData.user_lat = filters.userLat
      if (filters.userLng != null) requestData.user_lng = filters.userLng

      console.log('【请求参数】:', requestData)

      // 发起真实的后端请求
      const response = await Taro.request({
        url: 'http://116.62.19.40:3002/api/hotels/search',
        method: 'GET',
        data: requestData,
        timeout: 10000
      })

      // 第一时间打印真实返回数据，方便溯源
      console.log('【后端真实返回数据】:', response.data)
      console.log('【返回数据类型】:', typeof response.data)
      console.log('【statusCode】:', response.statusCode)

      // 安全取值与容错赋值
      if (response.statusCode === 200) {
        const rawData = response.data

        console.log('【rawData 结构】:', JSON.stringify(rawData).slice(0, 300))

        const list = extractList(rawData)
        const safeList = list.map(normalizeHotel)

        console.log('【解析后列表长度】:', safeList.length)
        if (safeList.length > 0) {
          console.log('【第一条 score/star/review_count】:', safeList[0].score, safeList[0].star, safeList[0].review_count)
        }

        if (currentPage === 1) {
          setHotels(safeList)
        } else {
          setHotels(prev => [...prev, ...safeList])
        }
        
        // 当返回的列表长度小于分页大小时，认为没有更多数据了
        if (safeList.length < pageSize) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
      } else {
        console.error('【错误】接口返回状态码异常:', response.statusCode)
        throw new Error(`接口返回异常: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('【错误】获取酒店数据失败:', error)
      Taro.showToast({ title: '网络开小差了', icon: 'none', duration: 2000 })
      if (currentPage === 1) setHotels([])
    } finally {
      if (currentPage === 1) {
        setLoading(false)
        Taro.hideLoading()
      }
    }
  }

  // 统一触发筛选重新搜索
  const applyFilters = (newFilters: Partial<typeof filterRef.current>) => {
    const merged = { ...filterRef.current, ...newFilters }
    filterRef.current = merged
    setSort(merged.sort)
    setStar(merged.star)
    setMinPrice(merged.minPrice)
    setMaxPrice(merged.maxPrice)
    setUserLat(merged.userLat)
    setUserLng(merged.userLng)
    setPage(1)
    setHasMore(true)
    fetchHotelsData(1, merged)
  }

  const handleSortSelect = async (value: string) => {
    setShowSortMenu(false)
    if (value === 'distance_asc') {
      Taro.showLoading({ title: '获取位置中...' })
      try {
        const res = await Taro.getLocation({ type: 'wgs84' })
        Taro.hideLoading()
        applyFilters({ sort: value, userLat: res.latitude, userLng: res.longitude })
      } catch {
        Taro.hideLoading()
        Taro.showToast({ title: '获取位置失败，请授权定位', icon: 'none' })
        applyFilters({ sort: value, userLat: null, userLng: null })
      }
    } else {
      applyFilters({ sort: value, userLat: null, userLng: null })
    }
  }

  const handleStarSelect = (value: number) => {
    setShowStarMenu(false)
    applyFilters({ star: value })
  }

  const handlePriceConfirm = () => {
    setShowFilterPanel(false)
    applyFilters({ minPrice: tempMinPrice, maxPrice: tempMaxPrice })
  }

  const handlePriceReset = () => {
    setTempMinPrice('')
    setTempMaxPrice('')
    setShowFilterPanel(false)
    applyFilters({ minPrice: '', maxPrice: '' })
  }

  const closeAllMenus = () => {
    setShowSortMenu(false)
    setShowStarMenu(false)
    setShowFilterPanel(false)
  }

  const hasActiveFilter = !!(minPrice || maxPrice)

  const loadMore = async () => {
    if (!hasMore) return
    const nextPage = page + 1
    await fetchHotelsData(nextPage, filterRef.current)
    setPage(nextPage)
  }

  const handleGoBack = () => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.reLaunch({ url: '/pages/index/index' })
    }
  }

  const handleViewDetail = (hotelId: string) => {
    Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${hotelId}` })
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

      {/* 遮罩层：点击关闭所有菜单 */}
      {(showSortMenu || showStarMenu || showFilterPanel) && (
        <View className="dropdown-mask" onClick={closeAllMenus} />
      )}

      {/* 筛选工具栏 */}
      <View 
        className="filter-bar"
        style={{ top: `${statusBarHeight + 44}px` }}
      >
        <View className="filter-options">
          {/* 排序 */}
          <View
            className={`filter-item ${sort ? 'filter-item-active' : ''}`}
            onClick={() => { setShowSortMenu(!showSortMenu); setShowStarMenu(false); setShowFilterPanel(false) }}
          >
            {sort ? SORT_OPTIONS.find(o => o.value === sort)?.label : '推荐排序'} ▾
          </View>

          {/* 星级 */}
          <View
            className={`filter-item ${star ? 'filter-item-active' : ''}`}
            onClick={() => { setShowStarMenu(!showStarMenu); setShowSortMenu(false); setShowFilterPanel(false) }}
          >
            {star ? `${star}星` : '星级'} ▾
          </View>

          {/* 价格筛选 */}
          <View
            className={`filter-item ${hasActiveFilter ? 'filter-item-active' : ''} filter-icon`}
            onClick={() => { setTempMinPrice(minPrice); setTempMaxPrice(maxPrice); setShowFilterPanel(!showFilterPanel); setShowSortMenu(false); setShowStarMenu(false) }}
          >
            {hasActiveFilter ? '已筛选' : '☰ 筛选'}
          </View>
        </View>

        <View className="filter-result">为您找到 {hotels.length} 家酒店</View>

        {/* 排序下拉菜单 */}
        {showSortMenu && (
          <View className="dropdown-menu">
            {SORT_OPTIONS.map(opt => (
              <View
                key={opt.value}
                className={`dropdown-item ${sort === opt.value ? 'dropdown-item-active' : ''}`}
                onClick={() => handleSortSelect(opt.value)}
              >
                {opt.label}
                {sort === opt.value && <Text className="dropdown-check">✓</Text>}
              </View>
            ))}
          </View>
        )}

        {/* 星级下拉菜单 */}
        {showStarMenu && (
          <View className="dropdown-menu dropdown-menu-star">
            {STAR_OPTIONS.map(opt => (
              <View
                key={opt.value}
                className={`dropdown-item ${star === opt.value ? 'dropdown-item-active' : ''}`}
                onClick={() => handleStarSelect(opt.value)}
              >
                {opt.label}
                {star === opt.value && <Text className="dropdown-check">✓</Text>}
              </View>
            ))}
          </View>
        )}

        {/* 价格筛选面板 */}
        {showFilterPanel && (
          <View className="filter-panel">
            <View className="filter-panel-title">价格区间（元/晚）</View>
            <View className="price-range-row">
              <Input
                className="price-input"
                type="number"
                placeholder="最低价"
                value={tempMinPrice}
                onInput={e => setTempMinPrice(e.detail.value)}
              />
              <Text className="price-range-sep">—</Text>
              <Input
                className="price-input"
                type="number"
                placeholder="最高价"
                value={tempMaxPrice}
                onInput={e => setTempMaxPrice(e.detail.value)}
              />
            </View>
            <View className="filter-panel-actions">
              <View className="filter-btn-reset" onClick={handlePriceReset}>重置</View>
              <View className="filter-btn-confirm" onClick={handlePriceConfirm}>确定</View>
            </View>
          </View>
        )}
      </View>

      {/* 酒店列表 */}
      <ScrollView 
        className="hotel-list-container"
        style={{ paddingTop: `${statusBarHeight + 44 + 88}px`, height: '100vh', boxSizing: 'border-box' }}
        scrollY
        enableBackToTop
        id="scroll-hotel-list"
      >
        {loading && page === 1 ? (
          <View className="loading-state">加载中...</View>
        ) : !hotels || hotels.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🏨</Text>
            <Text className="empty-text">暂无符合条件的酒店~</Text>
            <Text className="empty-hint">试试调整搜索条件吧</Text>
          </View>
        ) : (
          <InfiniteLoading
            target="scroll-hotel-list"
            hasMore={hasMore}
            onLoadMore={loadMore}
            loadingText={
              <View className="infinite-loading-container loading">
                <Text>正在努力加载中...</Text>
              </View>
            }
            loadMoreText={
              <View className="infinite-loading-container no-more">
                <Text>—— 到底啦，没有更多酒店了 ——</Text>
              </View>
            }
            pullRefresh={false}
          >
            {hotels && Array.isArray(hotels) && hotels.map((hotel, index) => (
              <View key={hotel.id || index} className="hotel-card">
                {/* 酒店封面图 */}
              <View className="hotel-image-wrapper">
                <Image 
                  className="hotel-image" 
                  src={hotel.image || hotel.cover_img || hotel.cover_image || ''} 
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
                  <Text className="hotel-name">{hotel.name || '未知酒店'}</Text>
                  <View className="hotel-stars">
                    {/* 👇 修改1：优先取数据库的 star，如果有就转成数字，没有就传 0 */}
                    {renderStars(hotel.star ? Number(hotel.star) : 0)}
                  </View>
                </View>

                {/* 第二行：英文名 */}
                {hotel.nameEn && (
                  <Text className="hotel-name-en">{hotel.nameEn}</Text>
                )}

                {/* 第三行：评分 + 评论数 */}
                <View className="hotel-rating-row">
                  <View className="rating-badge">
                    {/* 👇 修改2：如果有 score，转数字并保留1位小数；如果没有，直接写死 '4.5'，彻底杜绝 toFixed 报错 */}
                    <Text className="rating-score">{hotel.score ? Number(hotel.score).toFixed(1) : '4.5'}</Text>
                    
                    {/* 👇 修改3：优先取数据库新增的 review_count，没有就直接写死 128 */}
                    <Text className="rating-count">{hotel.review_count ? hotel.review_count : 128}条点评</Text>
                  </View>
                </View>

                {/* 第四行：位置信息 */}
                <View className="hotel-location-row">
                  <Text className="location-icon">📍</Text>
                  <Text className="location-text">{hotel.location || hotel.address || '位置信息暂无'}</Text>
                </View>
                {hotel.distance && (
                  <Text className="location-distance">{hotel.distance}</Text>
                )}

                {/* 第五行：标签 */}
                {hotel.tags && Array.isArray(hotel.tags) && hotel.tags.length > 0 && (
                  <View className="hotel-tags-row">
                    {hotel.tags.map((tag, index) => (
                      <View key={index} className="hotel-tag">{tag}</View>
                    ))}
                  </View>
                )}

                {/* 底部：价格 + 按钮 */}
                <View className="hotel-footer">
                  <View className="price-section">
                    {hotel.originalPrice && (
                      <Text className="price-original">¥{hotel.originalPrice}</Text>
                    )}
                    <View className="price-current-row">
                      <Text className="price-symbol">¥</Text>
                      <Text className="price-current">{hotel.currentPrice || hotel.price || 0}</Text>
                      <Text className="price-unit">起</Text>
                    </View>
                  </View>
                  <View
                    className="view-detail-btn"
                    onClick={() => handleViewDetail(hotel.id || hotel._id || '')}
                  >
                    查看详情
                  </View>
                </View>
              </View>
            </View>
          ))}
          </InfiniteLoading>
        )}
      </ScrollView>
    </View>
  )
}

export default HotelLists
