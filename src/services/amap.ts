import Taro from '@tarojs/taro'

const AMAP_BASE = 'https://restapi.amap.com/v3'
const AMAP_KEY = '3472349111046e399b927a89750ba335'
export type RegeoResult = {
  province?: string
  city?: string
  district?: string
  adcode?: string
  formattedAddress?: string
}

type AMapRegeoResp = {
  status: string
  info: string
  infocode: string
  regeocode?: {
    formatted_address?: string
    addressComponent?: {
      province?: string
      city?: string | string[] // 直辖市可能是 []
      district?: string
      adcode?: string
    }
  }
}

export async function regeo(lng: number, lat: number): Promise<RegeoResult> {
  const res = await Taro.request<AMapRegeoResp>({
    url: `${AMAP_BASE}/geocode/regeo`,
    method: 'GET',
    data: {
      key: AMAP_KEY,
      location: `${lng},${lat}`,
      output: 'JSON',
      extensions: 'base',
    },
  })

  const data = res.data
  if (data.status !== '1') {
    throw new Error(`AMap regeo error: ${data.info} (${data.infocode})`)
  }

  const ac = data.regeocode?.addressComponent
  const city =
    (Array.isArray(ac?.city) ? ac?.city?.[0] : ac?.city) || ac?.province || ''

  return {
    province: ac?.province,
    city,
    district: ac?.district,
    adcode: ac?.adcode,
    formattedAddress: data.regeocode?.formatted_address,
  }
}
