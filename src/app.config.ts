export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/register/index',
    'pages/hotel-lists/index'
  ],
  requiredPrivateInfos: ['getLocation'],
  permission: {
    "scope.userLocation": {
      desc: "用于为您自动定位默认城市，推荐附近酒店"
    }
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '易宿酒店',
    navigationBarTextStyle: 'black'
  }
})
