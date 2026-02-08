# API 配置说明

## 文件结构

```
src/
├── config/
│   └── api.ts          # API 配置文件（后端地址、端点配置）
├── utils/
│   └── request.ts      # 网络请求工具（封装 Taro.request）
└── services/
    ├── user.ts         # 用户相关 API
    └── hotel.ts        # 酒店相关 API
```

## 配置说明

### 1. API 配置 (`config/api.ts`)

```typescript
// 后端服务器地址
export const BASE_URL = 'http://116.62.19.40:3001'

// API 端点配置
export const API_ENDPOINTS = {
  USER: {
    LOGIN: '/api/user/login',
    REGISTER: '/api/user/register',
    // ...
  }
}
```

### 2. 请求工具 (`utils/request.ts`)

封装了 Taro.request，提供以下功能：
- 自动添加 token 到请求头
- 统一处理响应错误
- 自动显示加载提示
- 401 自动跳转登录

### 3. API 服务 (`services/`)

封装了具体的业务接口调用：

```typescript
import { loginApi } from '../../services/user'

// 调用登录接口
const res = await loginApi({ email, password })
```

## 使用示例

### 登录

```typescript
import { loginApi } from '../../services/user'

const handleLogin = async () => {
  try {
    const res = await loginApi({ email, password })
    
    // 保存 token
    Taro.setStorageSync('token', res.data.token)
    
    // 跳转首页
    Taro.switchTab({ url: '/pages/index/index' })
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

### 注册

```typescript
import { registerApi } from '../../services/user'

const handleRegister = async () => {
  try {
    await registerApi({ name, email, phone, password })
    
    // 跳转登录页
    Taro.navigateTo({ url: '/pages/login/index' })
  } catch (error) {
    console.error('注册失败:', error)
  }
}
```

### 获取酒店列表

```typescript
import { getHotelListApi } from '../../services/hotel'

const loadHotels = async () => {
  try {
    const res = await getHotelListApi({ 
      page: 1, 
      pageSize: 10,
      city: '北京'
    })
    
    console.log('酒店列表:', res.data)
  } catch (error) {
    console.error('加载失败:', error)
  }
}
```

## 修改后端地址

如果需要修改后端服务器地址，只需修改 `config/api.ts` 中的 `BASE_URL`：

```typescript
// 开发环境
export const BASE_URL = 'http://116.62.19.40:3001'

// 生产环境
// export const BASE_URL = 'https://api.yourdomain.com'
```

## Token 管理

- Token 存储在本地存储中 (`Taro.setStorageSync('token', token)`)
- 每次请求自动从本地存储读取 token 并添加到请求头
- 401 错误时自动清除 token 并跳转登录页

## 错误处理

请求工具会自动处理以下错误：
- HTTP 错误（404, 500 等）
- 业务错误（后端返回的错误信息）
- 网络错误（超时、断网等）

所有错误都会通过 `Taro.showToast` 显示给用户。
