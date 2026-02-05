import React from 'react'
import { View } from '@tarojs/components'
import { Button, Cell } from '@nutui/nutui-react-taro'
import './index.scss'

function Index() {
  return (
    <View className="nutui-react-demo">
      <View style={{ marginTop: '100px', textAlign: 'center' }}>
        <View style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          🏨 易宿酒店预订
        </View>
        
        {/* 测试一下 NutUI 组件是否正常 */}
        <Cell title="当前状态" extra="环境搭建完美！" />
        
        <View style={{ padding: '20px' }}>
          <Button type="primary" block>
            开始开发酒店列表
          </Button>
        </View>
      </View>
    </View>
  )
}

export default Index