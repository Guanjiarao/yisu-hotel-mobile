/**
 * API 配置文件
 * 统一管理后端接口地址
 */

// 后端服务器基础地址
export const BASE_URL = 'http://116.62.19.40:3001'

// API 端点配置
export const API_ENDPOINTS = {
  // 用户相关
  USER: {
    LOGIN: '/api/user/login',           // 登录
    REGISTER: '/api/user/register',     // 注册
    LOGOUT: '/api/user/logout',         // 登出
    INFO: '/api/user/info',             // 获取用户信息
    UPDATE: '/api/user/update',         // 更新用户信息
  },
  
  // 酒店相关
  HOTEL: {
    LIST: '/api/hotel/list',            // 酒店列表
    DETAIL: '/api/hotel/detail',        // 酒店详情
    SEARCH: '/api/hotel/search',        // 搜索酒店
    BANNERS: '/api/hotel/banners',      // 首页 Banner
  },
  
  // 订单相关
  ORDER: {
    CREATE: '/api/order/create',        // 创建订单
    LIST: '/api/order/list',            // 订单列表
    DETAIL: '/api/order/detail',        // 订单详情
    CANCEL: '/api/order/cancel',        // 取消订单
  }
}

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 10000

// 环境配置
export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
}
