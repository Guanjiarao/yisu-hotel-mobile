/**
 * 酒店相关 API 服务
 */

import { get, post } from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

/**
 * 获取酒店列表
 */
export const getHotelListApi = (data?: {
  page?: number
  pageSize?: number
  city?: string
}) => {
  return get(API_ENDPOINTS.HOTEL.LIST, data, {
    showLoading: true,
    loadingText: '加载中...'
  })
}

/**
 * 获取酒店详情
 */
export const getHotelDetailApi = (hotelId: string) => {
  return get(API_ENDPOINTS.HOTEL.DETAIL, { hotelId }, {
    showLoading: true,
    loadingText: '加载中...'
  })
}

/**
 * 搜索酒店
 */
export const searchHotelApi = (data: {
  keyword?: string
  city?: string
  checkInDate?: string
  checkOutDate?: string
  page?: number
  pageSize?: number
  minPrice?: number
  maxPrice?: number
}) => {
  return post(API_ENDPOINTS.HOTEL.SEARCH, data, {
    showLoading: true,
    loadingText: '搜索中...'
  })
}

/**
 * 获取首页 Banner
 */
export const getBannersApi = () => {
  return get(API_ENDPOINTS.HOTEL.BANNERS)
}
