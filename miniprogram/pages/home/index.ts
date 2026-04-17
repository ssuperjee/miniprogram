
Page({
  data: {
    
  },
  onShow() {
    wx.utils.tabBar.setTabBarIndex(0);
  },
  goToSubpackageTest() {
    wx.utils.route.navigateTo("login", {id: 123});
  }

});