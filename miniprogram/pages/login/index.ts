
// pages/login/index.ts
// 手机号校验：当前登录流程只允许 11 位大陆手机号。
const PHONE_REGEXP = /^1\d{10}$/;

// 验证码校验：当前验证码固定为 6 位纯数字。
const CODE_REGEXP = /^\d{6}$/;

// 获取验证码后的冷却时间，单位为秒。
const COUNTDOWN_SECONDS = 60;

// 页面级倒计时定时器。
// 放在 Page 外层是为了便于在 onUnload 中统一清理，避免页面销毁后定时器继续运行。
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 手机号输入框抖动定时器。
// 用于在触发错误反馈后恢复 shake 状态，避免类名一直保留导致下次无法重新播放动画。
let phoneShakeTimer: ReturnType<typeof setTimeout> | null = null;

Page({

  /**
   * 页面的初始数据。
   *
   * 字段说明：
   * - phone: 手机号输入框的实时值。
   * - code: 验证码输入框的实时值。
   * - verifyCountdown: 验证码按钮剩余倒计时；为 0 表示未倒计时。
   * - verifyButtonState: 验证码按钮状态。
   *   - disabled: 手机号不合法，按钮不可点击。
   *   - active: 手机号合法，按钮可点击。
   *   - countdown: 已发送验证码，正在倒计时。
   * - verifyButtonText: 验证码按钮展示文案，会随倒计时动态变化。
   * - loginButtonState: 登录按钮状态。
   *   - disabled: 表单未满足登录条件。
   *   - active: 手机号与验证码均满足格式要求，可点击登录。
   */
  data: {
    phone: '',
    code: '',
    phoneInvalid: false,
    phoneShake: false,
    verifyCountdown: 0,
    verifyButtonState: 'disabled',
    verifyButtonText: '获取验证码',
    loginButtonState: 'disabled',
  },

  /**
   * 手机号输入事件。
   *
   * 处理逻辑：
   * 1. 将用户输入实时同步到 data.phone。
   * 2. 使用 trim 去掉首尾空格，避免误把空格算入有效输入。
   * 3. 每次输入后立即重新计算“获取验证码”和“登录”两个按钮的状态，
   *    保证界面状态与当前表单内容保持同步。
   */
  onPhoneInput(event: WechatMiniprogram.Input) {
    const phone = event.detail.value.trim();

    this.setData({
      phone,
      phoneInvalid: phone ? this.data.phoneInvalid && !PHONE_REGEXP.test(phone) : false,
    });
    this.updateButtonStates();
  },

  /**
   * 手机号输入框失焦校验。
   *
   * 只有在用户已经输入内容但格式仍不合法时，才触发错误反馈：
   * 1. 输入框边框变红。
   * 2. 输入框左右抖动两次，强化错误提示。
   */
  onPhoneBlur() {
    const { phone } = this.data;

    if (!phone || PHONE_REGEXP.test(phone)) {
      return;
    }

    this.triggerPhoneInvalidFeedback();
  },

  /**
   * 验证码输入事件。
   *
   * 处理逻辑与手机号输入一致：
   * 1. 同步当前输入值。
   * 2. 去掉首尾空格。
   * 3. 重新计算登录按钮状态。
   *
   * 注意：验证码按钮是否可点击只取决于手机号是否合法，
   * 登录按钮则同时依赖手机号与验证码两项内容。
   */
  onCodeInput(event: WechatMiniprogram.Input) {
    this.setData({
      code: event.detail.value.trim()
    });
    this.updateButtonStates();
  },

  /**
   * 统一计算按钮状态。
   *
   * 这是当前登录页状态流转的核心方法，所有输入变化、倒计时变化，
   * 最终都会汇总到这里来更新按钮样式态和交互态。
   *
   * 计算规则：
   * 1. 验证码按钮
   *    - 倒计时中：countdown
   *    - 非倒计时且手机号合法：active
   *    - 其他情况：disabled
   * 2. 验证码按钮文案
   *    - 倒计时中显示“xxs后重发”
   *    - 否则显示“获取验证码”
   * 3. 登录按钮
   *    - 手机号合法且验证码是 6 位数字：active
   *    - 否则：disabled
   */
  updateButtonStates() {
    const { phone, code, verifyCountdown } = this.data;
    const phoneValid = PHONE_REGEXP.test(phone);
    const codeValid = CODE_REGEXP.test(code);

    this.setData({
      verifyButtonState: verifyCountdown > 0 ? 'countdown' : phoneValid ? 'active' : 'disabled',
      verifyButtonText: verifyCountdown > 0 ? `${verifyCountdown}s后重发` : '获取验证码',
      loginButtonState: phoneValid && codeValid ? 'active' : 'disabled'
    });
  },

  /**
   * 触发手机号输入框错误反馈。
   *
   * 这里把“红边”和“抖动”拆开控制：
   * - phoneInvalid: 负责保留错误边框，直到用户把号码修正为合法格式。
   * - phoneShake: 负责播放一次性动画，播放结束后自动清除，便于下次再次触发。
   */
  triggerPhoneInvalidFeedback() {
    if (phoneShakeTimer) {
      clearTimeout(phoneShakeTimer);
      phoneShakeTimer = null;
    }

    this.setData({
      phoneInvalid: true,
      phoneShake: false,
    });

    // 先重置一次 shake 状态，再在下一个事件循环设为 true，确保动画每次都能重新播放。
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

  /**
   * 获取验证码按钮点击事件。
   *
   * 当前只处理前端交互态，不发起真实接口请求。
   * 执行流程：
   * 1. 只有按钮处于 active 状态时才允许进入逻辑，防止重复点击。
   * 2. 点击后立即把倒计时设为 60 秒，并刷新按钮样式与文案。
   * 3. 启动一个 1 秒执行一次的定时器，每次将剩余秒数减 1。
   * 4. 当倒计时结束时，清理定时器并恢复按钮状态。
   *
   * 后续如果接入真实短信接口，通常会把“请求接口”放在设置倒计时之前，
   * 只有接口成功后才开始倒计时。
   */
  onGetCode() {
    if (this.data.verifyButtonState !== 'active') {
      return;
    }

    this.setData({
      verifyCountdown: COUNTDOWN_SECONDS
    });
    this.updateButtonStates();

    // 启动倒计时，并在每次 tick 后同步刷新按钮文案和交互态。
    countdownTimer = setInterval(() => {
      const nextCountdown = this.data.verifyCountdown - 1;

      // 倒计时结束时，先清理定时器，再将剩余时间重置为 0。
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

  /**
   * 生命周期函数--监听页面加载。
   *
   * 当前仅用于演示路由参数读取，便于后续接登录来源、邀请信息、重定向地址等场景。
   */
  onLoad() {
    const params = wx.utils.route.getCurrentPageParams()?.id;
    console.log("login 页 getCurrentPageParams 获取到的参数：", params);
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

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载。
   *
   * 必须在页面销毁时清理倒计时：
   * 1. 避免定时器继续运行造成内存泄漏。
   * 2. 避免页面已经销毁但定时器仍然尝试 setData，引发异常或无效更新。
   */
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