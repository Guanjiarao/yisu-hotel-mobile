import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { regeo, RegeoResult } from '../services/amap'

type LocationState = {
  locating: boolean
  error: string | null

  lng: number | null
  lat: number | null
  address: RegeoResult | null

  locateAndRegeo: () => Promise<void>
}

export const useLocationStore = create<LocationState>((set) => ({
  locating: false,
  error: null,

  lng: null,
  lat: null,
  address: null,

  locateAndRegeo: async () => {
    set({ locating: true, error: null })

    try {
      const loc = await Taro.getLocation({
        type: 'gcj02', // 高德用 gcj02
        isHighAccuracy: true,
        highAccuracyExpireTime: 3000,
      })

      const lng = loc.longitude
      const lat = loc.latitude

      const address = await regeo(lng, lat)

      set({ lng, lat, address, locating: false })
    } catch (e: any) {
      const msg = String(e?.errMsg || e?.message || '定位失败')
      set({ locating: false, error: msg })
    }
  },
}))
