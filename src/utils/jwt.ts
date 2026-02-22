/**
 * JWT Token 解析工具
 * 兼容微信小程序环境（不依赖 atob）
 */

/**
 * Base64Url 解码函数（手写实现，兼容小程序）
 */
function base64UrlDecode(str: string): string {
  // Base64Url 转 Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  
  // 补齐 padding
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }

  // 使用通用的 Base64 解码
  try {
    // 尝试使用原生 atob（浏览器环境）
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    }
  } catch (e) {
    console.log('atob 不可用，使用手动解码')
  }

  // 手动 Base64 解码（兼容小程序）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0

  base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '')

  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++))
    const enc2 = chars.indexOf(base64.charAt(i++))
    const enc3 = chars.indexOf(base64.charAt(i++))
    const enc4 = chars.indexOf(base64.charAt(i++))

    const chr1 = (enc1 << 2) | (enc2 >> 4)
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    const chr3 = ((enc3 & 3) << 6) | enc4

    result += String.fromCharCode(chr1)

    if (enc3 !== 64) {
      result += String.fromCharCode(chr2)
    }
    if (enc4 !== 64) {
      result += String.fromCharCode(chr3)
    }
  }

  // UTF-8 解码
  return decodeURIComponent(
    result
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

/**
 * 解析 JWT Token 的 Payload
 */
export function parseJWT(token: string): any {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token 格式错误')
    }

    // JWT 格式：header.payload.signature
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      throw new Error('Token 格式不正确')
    }

    // 解码 payload（第二部分）
    const payload = parts[1]
    const decodedPayload = base64UrlDecode(payload)
    
    // 解析为 JSON 对象
    const payloadObj = JSON.parse(decodedPayload)
    
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
