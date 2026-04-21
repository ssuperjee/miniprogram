Component({
  properties: {
    show: {
      type: Boolean,
      value: true,
    },
    title: {
      type: String,
      value: '审批意见',
    },
    serialLabel: {
      type: String,
      value: '线索编号：',
    },
    serialNo: {
      type: String,
      value: 'XS20260326002',
    },
    value: {
      type: String,
      value: '',
      observer(value: string) {
        this.setData({ innerValue: value });
      },
    },
    placeholder: {
      type: String,
      value: '请输入审批意见',
    },
    confirmText: {
      type: String,
      value: '确认提交',
    },
    cancelText: {
      type: String,
      value: '取消',
    },
    closeOnClickOverlay: {
      type: Boolean,
      value: true,
    },
    maxLength: {
      type: Number,
      value: 200,
    },
  },

  data: {
    innerValue: '',
  },

  lifetimes: {
    attached() {
      this.setData({
        innerValue: this.properties.value,
      });
    },
  },

  methods: {
    onOverlayClick() {
      if (!this.properties.closeOnClickOverlay) {
        return;
      }

      this.triggerEvent('close');
    },

    onInput(event: WechatMiniprogram.TextareaInput) {
      const value = event.detail.value;
      this.setData({ innerValue: value });
      this.triggerEvent('input', { value });
    },

    onCancel() {
      this.triggerEvent('cancel');
      this.triggerEvent('close');
    },

    onConfirm() {
      this.triggerEvent('confirm', { value: this.data.innerValue.trim() });
    },

    noop() {},
  },
});
