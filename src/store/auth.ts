import { create } from 'zustand'
import Taro from '@tarojs/taro'

type UserInfo = {
  username: string
  avatar: string
  email: string
  phone: string
}

type AuthState = {
  baseUrl: string
  userInfo: UserInfo | null
  checking: boolean

  checkLoginStatus: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  baseUrl: 'http://116.62.19.40:3001',
  userInfo: null,
  checking: false,

  checkLoginStatus: async () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      set({ userInfo: null, checking: false })
      return
    }

    set({ checking: true })
    try {
      const res = await Taro.request({
        url: `${get().baseUrl}/api/user/info`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` },
      })
      const data: any = res.data
      if (data?.success) set({ userInfo: data.data, checking: false })
      else {
        Taro.removeStorageSync('token')
        set({ userInfo: null, checking: false })
      }
    } catch {
      set({ userInfo: null, checking: false })
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      const res = await Taro.request({
        url: `${get().baseUrl}/api/user/login`,
        method: 'POST',
        data: { email, password },
      })

      const data: any = res.data
      if (data?.success) {
        Taro.setStorageSync('token', data.data.token)
        // 登录成功后，统一用 /info 写入 userInfo（避免两份来源）
        await get().checkLoginStatus()
        return true
      }

      Taro.showToast({ title: data?.msg || '登录失败', icon: 'none', duration: 2000 })
      return false
    } catch (err) {
      console.error('登录请求失败:', err)
      Taro.showToast({ title: '连接服务器失败，请检查网络', icon: 'none' })
      return false
    }
  },

  logout: () => {
    Taro.removeStorageSync('token')
    set({ userInfo: null })
  },
}))
