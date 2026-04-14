export const CommonUtils = {
  /**
   * 计算导航栏高度 （状态栏 + 导航栏）
   */
  calculateNavBarHeight(): number {
    const windowApi = wx as typeof wx & {
      getWindowInfo?: () => Pick<WechatMiniprogram.SystemInfo, "statusBarHeight">;
    };
    const systemInfo = windowApi.getWindowInfo?.() || wx.getSystemInfoSync(); // 获取系统信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect(); // 获取胶囊按钮信息
    const statusBarHeight = systemInfo.statusBarHeight || 0; // 状态栏高度
    const navBarHeight =
      (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height; // 根据官方建议计算导航栏高度
    return statusBarHeight + navBarHeight;
  }
}

export type CommonUtilsType = typeof CommonUtils;
