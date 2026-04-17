/**
 * 全局 TabBar 工具类
 */
export const tabBarUtils = {
  /**
   * 同步底部导航栏选中状态
   * @param index 导航栏索引
   */
  setTabBarIndex(index: number): void {
    const pages = getCurrentPages();
    if (!pages.length) return;
    const currentPage = pages[pages.length - 1];

    // 类型安全判断
    if (typeof currentPage.getTabBar === "function") {
      const tabBar = currentPage.getTabBar();
      tabBar?.setData({ current: index });
    }
  },

  /**
   * 显示 TabBar
   */
  showTabBar(): void {
    const page = getCurrentPages().pop();
    page?.getTabBar?.()?.setData({ hidden: false });
  },

  /**
   * 隐藏 TabBar
   */
  hideTabBar(): void {
    const page = getCurrentPages().pop();
    page?.getTabBar?.()?.setData({ hidden: true });
  },
};

// 导出工具类型，给全局扩展用
export type TabBarUtilsType = typeof tabBarUtils;
