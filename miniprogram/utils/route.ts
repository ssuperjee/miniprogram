/**
 * 微信小程序路由封装
 */
export const ROUTES = {
  home: "/pages/home/index",
  list: "/pages/list/index",
  me: "/pages/me/index",
  login: "/pages/login/index",
  walk: "/subpackages/walk/index",
};

type RouteKey = keyof typeof ROUTES;

export const route = {
  // 通过 navigateTo 跳转到某个页面
  navigateTo(url: RouteKey, params?: Record<string, any>) {
    console.log(`navigateTo 跳转到 ${ROUTES[url]}，携带参数：`, params);
    let path = ROUTES[url];
    if (params) {
      const query = Object.keys(params)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join("&");
      path += `?${query}`;
    }
    wx.navigateTo({ url: path });
  },

  // 通过 switchTab 跳转到某个 tab 页
  switchTab(url: RouteKey) {
    wx.switchTab({ url: ROUTES[url] });
  },

  //  返回上一个页面
  navigateBack(delta = 1) {
    wx.navigateBack({ delta });
  },

  // 重定向到某个页面
  redirectTo(url: RouteKey) {
    wx.redirectTo({ url: ROUTES[url] });
  },

  // 通过 关闭当前所有页面并打开到某个页面
  reLaunch(url: RouteKey) {
    wx.reLaunch({ url: ROUTES[url] });
  },

  // 获取当前页面的参数
  getCurrentPageParams<T = Record<string, string>>(): T {
    const pages = getCurrentPages();
    if (pages.length === 0) return {} as T;

    const currentPage = pages[pages.length - 1];
    return (currentPage.options || {}) as T;
  },
};

export type RouteType = typeof route;
