type PrivacyDialogPrivacySettingResult = {
  needAuthorization?: boolean;
};

type PrivacyDialogWxWithPrivacyApi = typeof wx & {
  getPrivacySetting?: (options: {
    success?: (result: PrivacyDialogPrivacySettingResult) => void;
    fail?: (error: unknown) => void;
  }) => void;
  openPrivacyContract?: (options: {
    success?: (result: unknown) => void;
    fail?: (error: unknown) => void;
  }) => void;
  exitMiniProgram?: (options?: {
    success?: (result: unknown) => void;
    fail?: (error: unknown) => void;
    complete?: (result: unknown) => void;
  }) => void;
};

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer: "onShowChange",
    },
  },

  lifetimes: {
    attached() {
      // 组件加载时自动检查是否需要授权
      this.checkNeedAuthorization();
    },
  },

  methods: {
    // 检查是否需要弹出隐私框
    checkNeedAuthorization() {
      const privacyApi = wx as PrivacyDialogWxWithPrivacyApi;
      if (!privacyApi.getPrivacySetting) {
        this.setData({ show: false });
        return;
      }

      privacyApi.getPrivacySetting({
        success: (res: any) => {
          // 不需要授权 → 直接关闭弹框，不显示
          console.log(res, 'needAuth >>>')
          if (!res.needAuthorization) {
            this.setData({ show: false });
          }
        },
        fail: () => {
          this.setData({ show: false });
        },
      });
    },

    // 显示状态监听
    onShowChange(newVal: boolean) {
      if (!newVal) return;
      this.checkNeedAuthorization();
    },

    // 打开隐私协议
    openPrivacyContract() {
      const privacyApi = wx as PrivacyDialogWxWithPrivacyApi;
      if (!privacyApi.openPrivacyContract) {
        wx.showToast({ title: "无法打开隐私协议", icon: "none" });
        return;
      }

      privacyApi.openPrivacyContract({
        fail: () => {
          wx.showToast({ title: "无法打开隐私协议", icon: "none" });
        },
      });
    },

    // 用户同意（官方授权按钮触发）
    handleAgree() {
      this.setData({ show: false });

      // 触发事件，页面可监听也可以不监听
      this.triggerEvent("complete", { agree: true });
    },

    // 用户拒绝
    handleDisagree() {
      wx.showModal({
        title: "提示",
        content: "未同意隐私协议将无法使用小程序",
        confirmText: "退出",
        showCancel: false,
        success: () => {
          const privacyApi = wx as PrivacyDialogWxWithPrivacyApi;
          this.setData({ show: false });
          if (privacyApi.exitMiniProgram) {
            privacyApi.exitMiniProgram();
          }
        },
      });
    },
  },
});