// pages/me/index.ts
const menuIcon = '/assets/image/manager/2.png';

Page({
  data: {
    alertText: '已准备好，开始巡查',
    menuSections: [
      {
        items: [
          {
            label: '手机号',
            title: '13800138001',
            icon: menuIcon,
          },
          {
            label: '所属单位',
            title: '广州子公司',
            icon: menuIcon,
          },
        ],
      },
      {
        items: [
          {
            title: '修改登录密码',
            icon: menuIcon,
          },
          {
            title: '使用帮助',
            icon: menuIcon,
          },
          {
            title: '关于我们',
            icon: menuIcon,
          },
          {
            title: '版本信息',
            icon: menuIcon,
          },
        ],
      },
    ],
  },

  onShow() {
    wx.utils.tabBar.setTabBarIndex(2);
  }
});