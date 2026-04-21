// pages/list/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 1,
    tabs:[
      { title: "全部", content: "内容 1" },
      { title: "已跟进", content: "内容 2" },
      { title: "待跟进", content: "内容 3" },
      { title: "已完结", content: "内容 4" }
    ],
    line1Items: [
      { number: 8, label: "总线索" },
      { number: 2, label: "待跟进" },
      { number: 2, label: "已跟进" },
      { number: 2, label: "已完结" }
    ],
    line2Items: [
      { number: 1, label: "已合并" },
      { number: 2, label: "失效" },
      { number: 2, label: "超期预警" },
    ],
    leadFields: [
      { label: "侵权公司", value: "华南侵权公司" },
      { label: "样品编号", value: "YP20260407001" },
      { label: "品种类型", value: "未授权种植" },
      { label: "地块面积", value: "1.25亩" }
    ],
    leadDuplicateRate: "0%",
    leadDate: "2026-04-09"

  },

    onChange(event:any) {
    wx.showToast({
      title: `切换到标签 ${event.detail.name}`,
      icon: 'none',
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    wx.utils.tabBar.setTabBarIndex(1);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})