/**
 * JWT Token 解析工具
 * 使用 Taro.base64ToArrayBuffer + Uint8Array，完美兼容微信小程序 JSCore
 */

import Taro from '@tarojs/taro'

/**
 * 解析 JWT Token 的 Payload
 */
export function parseJWT(token: string): any {
  try {
    if (!token || typeof token !== 'string') return null

    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    // Base64Url → Base64，并补齐 padding
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) base64 += new Array(5 - pad).join('=')

    // 使用 Taro 原生 API 解码，避免 atob 在 JSCore 上的兼容问题
    const buffer = Taro.base64ToArrayBuffer(base64)
    const bytes = new Uint8Array(buffer)

    // 逐字节转为百分号编码，再用 decodeURIComponent 还原 UTF-8（中文安全）
    let encodedString = ''
    for (let i = 0; i < bytes.length; i++) {
      encodedString += '%' + ('00' + bytes[i].toString(16)).slice(-2)
    }

    const payloadObj = JSON.parse(decodeURIComponent(encodedString))
    console.log('【JWT 解析成功】Payload:', payloadObj)
    return payloadObj
  } catch (error) {
    console.error('【JWT 解析失败】:', error)
    return null
  }
}

/**
 * 从 JWT Token 中提取用户标识符（通用）
 * 支持提取 email、username、name、id 等任何可用字段
 */
export function getUserIdentifierFromToken(token: string): string | null {
  const payload = parseJWT(token)
  
  if (!payload) {
    return null
  }

  // 尝试多种可能的字段名（按优先级排序）
  const identifier = payload.email || 
                     payload.account || 
                     payload.username || 
                     payload.user_email ||
                     payload.mail ||
                     payload.name ||           // 新增：用户名
                     payload.sub ||
                     (payload.id ? String(payload.id) : null)  // 新增：用户ID（转为字符串）

  if (identifier && (typeof identifier === 'string' || typeof identifier === 'number')) {
    const identifierStr = String(identifier)
    console.log('【提取用户标识成功】:', identifierStr)
    console.log('【Payload 完整内容】:', payload)
    return identifierStr
  }

  console.error('【提取用户标识失败】Payload 中没有找到可用字段')
  console.error('【Payload 内容】:', payload)
  return null
}

/**
 * 兼容旧函数名（向后兼容）
 */
export function getEmailFromToken(token: string): string | null {
  return getUserIdentifierFromToken(token)
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  
  if (!payload || !payload.exp) {
    return true
  }

  // exp 是秒级时间戳
  const expirationTime = payload.exp * 1000
  const currentTime = Date.now()

  return currentTime >= expirationTime
}
