Component({
  options: {
    multipleSlots: true,
  },

  properties: {
    src: {
      type: String,
      value: '',
    },
    width: {
      type: Number,
      value: 0,
    },
    height: {
      type: Number,
      value: 0,
    },
    bgColor: {
        type: String,
        value: '#fff',
    },
    // 页面背景模式
    mode: {
      type: String,
      value: 'local',
    },
    imgMode: {
      type: String,
      value: 'widthFill',
    },
    extClass: {
      type: String,
      value: '',
    },
  },
});