// app.ts
import { tabBarUtils, TabBarUtilsType } from "./utils/tabBar";
import { commonUtils, CommonUtilsType } from "./utils/common";
import { route, RouteType } from "./utils/route";

wx.utils = {
  tabBar: tabBarUtils,
  common: commonUtils,
  route,
};

declare global {
  namespace WechatMiniprogram {
    interface Wx {
      utils: {
        tabBar: TabBarUtilsType;
        common: CommonUtilsType;
        route: RouteType;
      };
    }
  }
}

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 登录
    wx.login({
      success: (res) => {
        console.log(res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    });
  },
});
