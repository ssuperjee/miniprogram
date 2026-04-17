Component({
  data: {
    current: 0, // 当前选中的Tab索引
  },
  methods: {
    // 切换Tab
    switchTab(e: any) {
      const { path, index } = e.currentTarget.dataset;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const currentPath = `/${currentPage.route}`;

      // 避免重复点击
      if (currentPath === path) return;

      // 跳转到对应页面
      wx.switchTab({
        url: path,
        // success: () => {
        //   this.setData({ current: index });
        // },
      });
    },

    // 中间按钮点击事件（扫码/其他功能）
    handleCenterClick() {
      wx.scanCode({
        success: (res) => {
          console.log("扫码结果：", res.result);
          // 这里可以写扫码后的逻辑，比如跳转、请求接口等
        },
      });
    },
  },
});
