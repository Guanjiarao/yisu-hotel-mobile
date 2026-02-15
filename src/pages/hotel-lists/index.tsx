import React from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useSearchStore } from '../../store/search'
import './index.scss'

function FilterTest() {
  const filters = useSearchStore((s) => s.filters)
  const setCity = useSearchStore((s) => s.setCity)
  const setKeyword = useSearchStore((s) => s.setKeyword)
  const toggleTag = useSearchStore((s) => s.toggleTag)
  const clearTags = useSearchStore((s) => s.clearTags)
  const setDateRange = useSearchStore((s) => s.setDateRange)
  const reset = useSearchStore((s) => s.reset)

  const pretty = (obj: any) => JSON.stringify(obj, null, 2)

  return (
    <View className="filter-test-page">
      <View className="header">
        <Text className="title">筛选页（测试）</Text>
        <Text className="sub">只展示 useSearchStore.filters</Text>
      </View>

      <View className="card">
        <Text className="card-title">当前筛选条件</Text>
        <View className="json-box">
          <Text className="json-text">{pretty(filters)}</Text>
        </View>
      </View>

      <View className="card">
        <Text className="card-title">快捷测试按钮</Text>

        <View className="btn-row">
          <Button size="small" type="primary" onClick={() => setCity({ city: '上海', adcode: '310000' })}>
            城市=上海
          </Button>
          <Button size="small" onClick={() => setCity({ city: '北京', adcode: '110000' })}>
            城市=北京
          </Button>
        </View>

        <View className="btn-row">
          <Button size="small" onClick={() => setKeyword('万豪')}>
            关键词=万豪
          </Button>
          <Button size="small" onClick={() => setKeyword('')}>
            清空关键词
          </Button>
        </View>

        <View className="btn-row">
          <Button size="small" onClick={() => toggleTag('亲子')}>
            toggle 亲子
          </Button>
          <Button size="small" onClick={() => toggleTag('豪华')}>
            toggle 豪华
          </Button>
          <Button size="small" onClick={clearTags}>
            清空标签
          </Button>
        </View>

        <View className="btn-row">
          <Button
            size="small"
            onClick={() => setDateRange({ checkIn: '2026-02-07', checkOut: '2026-02-08' })}
          >
            日期=2/7-2/8
          </Button>
          <Button size="small" onClick={() => setDateRange({ checkIn: null, checkOut: null })}>
            清空日期
          </Button>
        </View>

        <View className="btn-row">
          <Button
            size="small"
            onClick={() => {
              reset()
              Taro.showToast({ title: '已重置', icon: 'none' })
            }}
          >
            重置全部
          </Button>
        </View>
      </View>
    </View>
  )
}

export default FilterTest
