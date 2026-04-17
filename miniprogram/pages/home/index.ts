
Page({
  data: {
    profileName: '我是昵称张三',
    profileTags: [
      {
        icon: '/assets/image/manager/1.png',
        text: '品保经理'
      },
      {
        icon: '/assets/image/manager/2.png',
        text: '品保经理'
      }
    ],
    alertText: '有 2 条线索已超期，请关注',
    moduleList: [
      {
        number: 8,
        statusName: '待审批',
        status: 0
      },
      {
        number: 7,
        statusName: '已完结',
        status: 1
      },
      {
        number: 5,
        statusName: '超期预警',
        status: 2
      },
    ],
    quickActionList: [
      {
        icon: '/assets/image/manager/6.png',
        title: '待跟进线索',
        desc: '需受合并或跟进处理',
        theme: 'orange'
      },
      {
        icon: '/assets/image/manager/5.png',
        title: '超期线索',
        desc: '需要立即处理',
        theme: 'red'
      },
      {
        icon: '/assets/image/manager/7.png',
        title: '全部线索',
        desc: '查看所有线索记录',
        theme: 'default'
      }
    ]
  },
  onShow() {
    wx.utils.tabBar.setTabBarIndex(0);
  }

});