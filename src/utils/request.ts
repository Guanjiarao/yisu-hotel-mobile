/**
 * 网络请求工具
 * 封装 Taro.request，统一处理请求和响应
 */

import Taro from '@tarojs/taro'
import { BASE_URL, REQUEST_TIMEOUT } from '../config/api'

// 请求拦截器 - 添加 token 等
const requestInterceptor = (config: any) => {
  // 从本地存储获取 token
  const token = Taro.getStorageSync('token')
  
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  return config
}

// 响应拦截器 - 统一处理错误
const responseInterceptor = (response: any) => {
  const { statusCode, data } = response
  
  // HTTP 状态码检查
  if (statusCode >= 200 && statusCode < 300) {
    // 业务状态码检查
    if (data.code === 0 || data.success) {
      return data
    } else {
      // 业务错误
      Taro.showToast({
        title: data.message || '请求失败',
        icon: 'none',
        duration: 2000
      })
      return Promise.reject(data)
    }
  } else if (statusCode === 401) {
    // 未授权，清除 token 并跳转登录
    Taro.removeStorageSync('token')
    Taro.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    })
    setTimeout(() => {
      Taro.navigateTo({ url: '/pages/login/index' })
    }, 2000)
    return Promise.reject(response)
  } else {
    // HTTP 错误
    Taro.showToast({
      title: `请求错误 ${statusCode}`,
      icon: 'none',
      duration: 2000
    })
    return Promise.reject(response)
  }
}

/**
 * 通用请求方法
 */
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
  showLoading?: boolean
  loadingText?: string
}

export const request = async (options: RequestOptions) => {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = false,
    loadingText = '加载中...'
  } = options

  // 显示加载提示
  if (showLoading) {
    Taro.showLoading({ title: loadingText })
  }

  try {
    // 构建完整的请求配置
    let config: any = {
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      method,
      timeout: REQUEST_TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        ...header
      }
    }

    // GET 请求使用 params，其他请求使用 data
    if (method === 'GET') {
      config.data = data
    } else {
      config.data = data
    }

    // 请求拦截
    config = requestInterceptor(config)

    // 发送请求
    const response = await Taro.request(config)

    // 响应拦截
    const result = await responseInterceptor(response)

    return result
  } catch (error) {
    console.error('请求失败:', error)
    Taro.showToast({
      title: '网络请求失败',
      icon: 'none',
      duration: 2000
    })
    return Promise.reject(error)
  } finally {
    // 隐藏加载提示
    if (showLoading) {
      Taro.hideLoading()
    }
  }
}

/**
 * GET 请求
 */
export const get = (url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST 请求
 */
export const post = (url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
export const put = (url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
export const del = (url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

export default request
