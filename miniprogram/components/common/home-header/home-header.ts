Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    alertThemeClass: 'home-header__alert--red',
  },

  properties: {
    navTitle: {
      type: String,
      value: '线索提报工具',
    },
    bgSrc: {
      type: String,
      value: '/assets/image/manager/3.png',
    },
    bgWidth: {
      type: Number,
      value: 750,
    },
    bgHeight: {
      type: Number,
      value: 654,
    },
    profileName: {
      type: String,
      value: '我是昵称张三',
    },
    profileTags: {
      type: Array,
      value: [
        {
          icon: '/assets/image/manager/1.png',
          text: '品保经理'
        },
        {
          icon: '/assets/image/manager/2.png',
          text: '品保经理'
        }
      ],
    },
    alertText: {
      type: String,
      value: '',
    },
    alertTextColor: {
      type: String,
      value: '',
      observer: 'updateAlertThemeClass',
    }
  },

  lifetimes: {
    attached() {
      this.updateAlertThemeClass(this.properties.alertTextColor);
    },
  },

  methods: {
    updateAlertThemeClass(color?: string) {
      const nextColor = (color || '#ac0003').trim().toLowerCase();
      const alertThemeClass = this.getAlertThemeClass(nextColor);

      this.setData({
        alertThemeClass,
      });
    },

    getAlertThemeClass(color: string) {
      switch (color) {
        case '#007f22':
          return 'home-header__alert--green';
        case '#2f73fa':
        case '#1447e6':
          return 'home-header__alert--blue';
        case '#ac0003':
        default:
          return 'home-header__alert--red';
      }
    },
  },
});
