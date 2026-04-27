
// 手机号：11 位大陆手机号。
const PHONE_REGEXP = /^1\d{10}$/;

// 验证码：6 位数字。
const CODE_REGEXP = /^\d{6}$/;

// 获取验证码后的冷却时间，单位秒。
const COUNTDOWN_SECONDS = 60;

// 页面级定时器，便于 onUnload 统一清理。
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 控制手机号错误抖动的重播。
let phoneShakeTimer: ReturnType<typeof setTimeout> | null = null;

Page({
  data: {
    phone: '',
    code: '',
    password: '',
    phoneInvalid: false,
    phoneShake: false,
    agreedProtocols: false,
    verifyCountdown: 0,
    verifyButtonState: 'disabled',
    verifyButtonText: '获取验证码',
    loginButtonState: 'disabled',
    active: 0,
  },

  onPhoneInput(event: WechatMiniprogram.Input) {
    const phone = event.detail.value.trim();

    this.setData({
      phone,
      phoneInvalid: phone ? this.data.phoneInvalid && !PHONE_REGEXP.test(phone) : false,
    });
    this.updateButtonStates();
  },

  onPhoneBlur() {
    const { phone } = this.data;

    if (!phone || PHONE_REGEXP.test(phone)) {
      return;
    }

    this.triggerPhoneInvalidFeedback();
  },

  onCodeInput(event: WechatMiniprogram.Input) {
    this.setData({
      code: event.detail.value.trim()
    });
    this.updateButtonStates();
  },

  onPasswordInput(event: WechatMiniprogram.Input) {
    this.setData({
      password: event.detail.value.trim(),
    });
    this.updateButtonStates();
  },

  // 根据当前登录方式统一刷新按钮状态。
  updateButtonStates() {
    const { phone, code, password, verifyCountdown, active } = this.data;
    const phoneValid = PHONE_REGEXP.test(phone);
    const codeValid = CODE_REGEXP.test(code);
    const passwordValid = password.length > 0;
    const isCodeLogin = active === 0;

    this.setData({
      verifyButtonState: verifyCountdown > 0 ? 'countdown' : phoneValid ? 'active' : 'disabled',
      verifyButtonText: verifyCountdown > 0 ? `${verifyCountdown}s后重发` : '获取验证码',
      loginButtonState: phoneValid && (isCodeLogin ? codeValid : passwordValid) ? 'active' : 'disabled'
    });
  },

  // 先清空再设为 true，保证 shake 动画每次都能重播。
  triggerPhoneInvalidFeedback() {
    if (phoneShakeTimer) {
      clearTimeout(phoneShakeTimer);
      phoneShakeTimer = null;
    }

    this.setData({
      phoneInvalid: true,
      phoneShake: false,
    });

    setTimeout(() => {
      this.setData({
        phoneShake: true,
      });
    }, 0);

    phoneShakeTimer = setTimeout(() => {
      this.setData({
        phoneShake: false,
      });
      phoneShakeTimer = null;
    }, 420);
  },

  onGetCode() {
    if (this.data.verifyButtonState !== 'active') {
      return;
    }

    this.setData({
      verifyCountdown: COUNTDOWN_SECONDS
    });
    this.updateButtonStates();

    countdownTimer = setInterval(() => {
      const nextCountdown = this.data.verifyCountdown - 1;

      if (nextCountdown <= 0) {
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }

        this.setData({
          verifyCountdown: 0
        });
        this.updateButtonStates();
        return;
      }

      this.setData({
        verifyCountdown: nextCountdown
      });
      this.updateButtonStates();
    }, 1000);
  },

  onTabsChange(event: WechatMiniprogram.CustomEvent<{ index?: number; name?: number }>) {
    const nextActive = event.detail?.index ?? event.detail?.name ?? 0;

    this.setData({
      active: Number(nextActive) || 0,
    });

    this.updateButtonStates();
  },

  onLogin() {
    if (this.data.loginButtonState !== 'active') {
      return;
    }

    if (!this.data.agreedProtocols) {
      wx.showToast({
        title: '请先阅读并同意协议',
        icon: 'none',
      });
      return;
    }

    wx.showToast({
      title: '登录功能开发中',
      icon: 'none',
    });
  },

  onToggleAgreement() {
    this.setData({
      agreedProtocols: !this.data.agreedProtocols,
    });
  },

  onOpenUserAgreement() {
    wx.showToast({
      title: '用户协议开发中',
      icon: 'none',
    });
  },

  onOpenPrivacyPolicy() {
    wx.showToast({
      title: '隐私政策开发中',
      icon: 'none',
    });
  },

  onWechatLogin() {
    if (!this.data.agreedProtocols) {
      wx.showToast({
        title: '请先阅读并同意协议',
        icon: 'none',
      });
      return;
    }

    wx.showToast({
      title: '微信登录开发中',
      icon: 'none',
    });
  },

  onLoad() {
    const params = wx.utils.route.getCurrentPageParams()?.id;
    console.log("login 页 getCurrentPageParams 获取到的参数：", params);
  },

  onReady() {

  },

  onShow() {

  },

  onHide() {

  },

  // 页面销毁时清理定时器，避免卸载后继续 setData。
  onUnload() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    if (phoneShakeTimer) {
      clearTimeout(phoneShakeTimer);
      phoneShakeTimer = null;
    }
  },

  onPullDownRefresh() {

  },

  onReachBottom() {

  },

  onShareAppMessage() {

  }
})