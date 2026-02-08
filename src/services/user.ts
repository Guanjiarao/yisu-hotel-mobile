/**
 * 用户相关 API 服务
 */

import { post, get } from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

/**
 * 用户登录
 */
export const loginApi = (data: { email: string; password: string }) => {
  return post(API_ENDPOINTS.USER.LOGIN, data, {
    showLoading: true,
    loadingText: '登录中...'
  })
}

/**
 * 用户注册
 */
export const registerApi = (data: {
  name: string
  email: string
  phone: string
  password: string
}) => {
  return post(API_ENDPOINTS.USER.REGISTER, data, {
    showLoading: true,
    loadingText: '注册中...'
  })
}

/**
 * 用户登出
 */
export const logoutApi = () => {
  return post(API_ENDPOINTS.USER.LOGOUT)
}

/**
 * 获取用户信息
 */
export const getUserInfoApi = () => {
  return get(API_ENDPOINTS.USER.INFO)
}

/**
 * 更新用户信息
 */
export const updateUserInfoApi = (data: any) => {
  return post(API_ENDPOINTS.USER.UPDATE, data)
}
