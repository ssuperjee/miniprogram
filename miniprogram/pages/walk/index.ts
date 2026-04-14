/**
 * 页面初次渲染时使用的默认中心点。
 * 在真实定位尚未返回前，地图先使用固定坐标稳定展示。
 */
const INITIAL_CENTER = {
  latitude: 22.540836,
  longitude: 114.057031,
};

/**
 * 地图默认缩放级别。
 * 步行场景下使用 17，能兼顾当前位置和附近路线细节。
 */
const INITIAL_SCALE = 17;

/**
 * 两次有效采样之间允许记录的最小位移，单位米。
 * 小于这个阈值通常只是定位抖动，不应该计入步行轨迹。
 */
const MIN_DISTANCE_METERS = 3;

/**
 * 微信小程序定位权限对应的 scope 常量。
 * 集中定义可以避免页面里散落魔法字符串。
 */
const LOCATION_SCOPE = "scope.userLocation";

/**
 * 隐私授权查询接口的最小返回结构。
 * 当前项目类型定义不完整，因此这里补充一个足够使用的类型。
 */
type PrivacySettingResult = {
  needAuthorization?: boolean;
};

/**
 * 对 wx 增补隐私授权查询方法的类型声明。
 * 这样既能通过类型检查，也能兼容旧版基础库定义。
 */
type WxWithPrivacyApi = typeof wx & {
  getPrivacySetting?: (options: {
    success?: (result: PrivacySettingResult) => void;
    fail?: (error: unknown) => void;
  }) => void;
};

/**
 * 单个轨迹点，仅保存距离计算和地图绘制所需的经纬度。
 */
type TrackPoint = {
  latitude: number;
  longitude: number;
};

/**
 * 地图折线的数据结构。
 * 页面会把采样得到的轨迹点转换成 polyline，在 map 上绘制路径。
 */
type WalkPolyline = {
  points: TrackPoint[];
  color: string;
  width: number;
  dottedLine?: boolean;
};

/**
 * 页面在空闲状态下展示的默认提示。
 */
const DEFAULT_HINT = "点击开始后，将根据实时定位记录行走轨迹";

/**
 * 数字补零，保证时间格式始终为两位数。
 * 例如 3 会被格式化成 03。
 */
function padNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * 将累计秒数转换成 HH:mm:ss 文案。
 * 页面内部用纯数字做计算，展示时再统一格式化。
 */
function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}

/**
 * 根据距离值返回更适合展示的文本。
 * 小于 1 公里显示米，大于等于 1 公里显示公里并保留两位小数。
 */
function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

/**
 * 计算平均速度并格式化为 km/h。
 * 这里取的是总距离除以总时长，得到稳定的平均速度，而不是瞬时速度。
 */
function formatAverageSpeed(distanceMeters: number, durationSeconds: number): string {
  if (durationSeconds <= 0 || distanceMeters <= 0) {
    return "0.00 km/h";
  }

  const speed = distanceMeters / durationSeconds * 3.6;
  return `${speed.toFixed(2)} km/h`;
}

/**
 * 角度转弧度。
 * Haversine 距离公式中的三角函数计算使用弧度制。
 */
function toRadians(value: number): number {
  return value * Math.PI / 180;
}

/**
 * 使用 Haversine 公式计算两个坐标点之间的球面距离，单位为米。
 * 对步行轨迹这类短距离场景，这个精度足够稳定可靠。
 */
function calculateDistance(start: TrackPoint, end: TrackPoint): number {
  const earthRadius = 6378137;
  const deltaLatitude = toRadians(end.latitude - start.latitude);
  const deltaLongitude = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2)
    + Math.cos(startLatitude) * Math.cos(endLatitude)
    * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

/**
 * 根据轨迹点生成 map 组件需要的折线数据。
 * 少于两个点时无法组成路径，因此直接返回空数组。
 */
function getPolyline(points: TrackPoint[]): WalkPolyline[] {
  if (points.length < 2) {
    return [];
  }

  return [{
    points,
    color: "#16A34ACC",
    width: 8,
    dottedLine: false,
  }];
}

/**
 * 获取一次当前位置。
 * 用于首次进入页面、开始记录后立即对齐当前位置，以及重置后的重新定位。
 */
function requestCurrentLocation(): Promise<WechatMiniprogram.GetLocationSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: "gcj02",
      success: resolve,
      fail: reject,
    });
  });
}

/**
 * 开启持续定位。
 * 启动后，页面才能持续收到位置变化回调并记录轨迹。
 */
function startLocationUpdate(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.startLocationUpdate({
      success: () => resolve(),
      fail: reject,
    });
  });
}

/**
 * 关闭持续定位。
 * 暂停、重置、离开页面时都会调用，防止后台继续采样。
 */
function stopLocationUpdate(): Promise<void> {
  return new Promise((resolve) => {
    wx.stopLocationUpdate({
      complete: () => resolve(),
    });
  });
}

/**
 * 主动申请定位权限。
 * 如果用户尚未授权，微信会在这里弹出系统授权流程。
 */
function authorizeLocation(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope: LOCATION_SCOPE,
      success: () => resolve(),
      fail: reject,
    });
  });
}

/**
 * 打开微信设置页，并返回用户是否已经开启定位权限。
 * 用于用户首次拒绝后，二次引导其手动打开权限。
 */
function openLocationSettings(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    wx.openSetting({
      success: (res) => resolve(Boolean(res.authSetting[LOCATION_SCOPE])),
      fail: reject,
    });
  });
}

/**
 * 将底层定位错误统一转换成用户能看懂的提示语。
 * 页面只消费最终文案，不需要关心 errMsg 的各种差异细节。
 */
function getLocationErrorMessage(error: any): string {
  const errorMessage = typeof error === "object" && error !== null && "errMsg" in error
    ? String(error.errMsg)
    : "";

  if (errorMessage.includes("need authorization") || errorMessage.includes("privacy")) {
    return "请先同意隐私保护指引，再使用定位功能";
  }

  if (errorMessage.includes("auth deny") || errorMessage.includes("auth denied")) {
    return "定位权限未开启，请在设置中允许位置权限";
  }

  if (errorMessage.includes("requiredPrivateInfos") || errorMessage.includes("privateInfos")) {
    return "定位能力未在 app.json 声明，请补充敏感接口配置后重试";
  }

  if (errorMessage.includes("system permission denied")) {
    return "系统定位服务未开启，请检查手机定位开关";
  }

  if (errorMessage.includes("frequency limit")) {
    return "定位请求过于频繁，请稍后再试";
  }

  return "暂时无法获取定位，请稍后重试";
}

/**
 * 从页面 data 中抽取一份用于调试或后续保存的行走记录快照。
 */
function createWalkRecord(data: Record<string, any>) {
  return {
    totalDistance: data.totalDistance,
    distanceText: data.distanceText,
    durationSeconds: data.durationSeconds,
    durationText: data.durationText,
    averageSpeedText: data.averageSpeedText,
    pointCount: data.pointCount,
    points: data.points,
    polylines: data.polylines,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

Page({
  /**
   * map 组件上下文。
   * 用于调用 moveToLocation 之类的地图实例方法。
   */
  mapContext: null as WechatMiniprogram.MapContext | null,

  /**
   * 行走计时器句柄。
   * 记录过程中每秒更新一次时长和平均速度。
   */
  walkTimer: null as ReturnType<typeof setInterval> | null,

  /**
   * 位置变化监听函数的引用。
   * 保存它是为了后续可以正确解绑，避免重复监听。
   */
  locationChangeHandler: null as ((result: WechatMiniprogram.OnLocationChangeCallbackResult) => void) | null,

  /**
   * 隐私授权完成时用于唤醒流程的 resolve 引用。
   */
  privacyAuthorizeResolver: null as (() => void) | null,

  /**
   * 当前正在等待的隐私授权 Promise。
   * 缓存它可以避免在短时间内重复创建授权流程。
   */
  privacyAuthorizePromise: null as Promise<void> | null,

  data: {
    // 地图中心点经纬度。
    latitude: INITIAL_CENTER.latitude,
    longitude: INITIAL_CENTER.longitude,

    // 地图缩放级别。
    scale: INITIAL_SCALE,

    // 当前已采集到的全部轨迹点。
    points: [] as TrackPoint[],

    // 预留的地图标记数据，当前页面暂未使用。
    markers: [] as unknown[],

    // 地图路径绘制数据。
    polylines: [] as WalkPolyline[],

    // 当前是否处于记录状态。
    isWalking: false,

    // 累计行走距离，单位米。
    totalDistance: 0,

    // 面向用户展示的距离文本。
    distanceText: "0 m",

    // 累计时长，单位秒。
    durationSeconds: 0,

    // 面向用户展示的时长文本。
    durationText: "00:00:00",

    // 面向用户展示的平均速度文本。
    averageSpeedText: "0.00 km/h",

    // 已记录轨迹点数量。
    pointCount: 0,

    // 页面当前状态文本，例如未开始、定位中、记录中、已暂停。
    statusText: "未开始",

    // 补充说明文本，用于提示用户当前处于什么阶段。
    hintText: DEFAULT_HINT,

    // 主操作按钮文案。
    primaryText: "开始行走测",

    // 是否显示隐私授权弹窗。
    showPrivacyDialog: false,
  },

  /**
   * 页面加载时初始化定位监听器，并检查当前定位授权状态。
   * 如果已经授权，则尝试先同步一次当前位置，提升进入页面时的可用性。
   */
  onLoad() {
    this.locationChangeHandler = (result) => {
      this.handleLocationChange(result);
    };

    wx.getSetting({
      success: (res) => {
        if (res.authSetting[LOCATION_SCOPE]) {
          void this.prepareCurrentLocation().catch(() => {
            this.setData({
              hintText: "当前位置获取失败，请点击开始后重试",
            });
          });
          return;
        }

        this.setData({
          statusText: "待授权",
          hintText: "开始前需要允许位置权限，才能记录行走轨迹",
        });
      },
    });
  },

  /**
   * 页面初次渲染后创建地图上下文。
   * map 实例方法依赖 onReady 之后的上下文才能安全调用。
   */
  onReady() {
    this.mapContext = wx.createMapContext("walkMap", this);
  },

  /**
   * 页面切入后台时暂停记录。
   * 避免用户离开页面后仍继续采样定位，导致状态混乱。
   */
  onHide() {
    if (this.data.isWalking) {
      void this.pauseWalk("页面已切换，已暂停记录，可返回后继续");
    }
  },

  /**
   * 页面销毁时统一回收异步资源。
   */
  onUnload() {
    void this.disposeTrackingResources();
  },

  /**
   * 主按钮统一入口。
   * 已在记录中时执行暂停，否则进入开始或继续记录流程。
   */
  async handlePrimaryAction() {
    if (this.data.isWalking) {
      await this.pauseWalk("本次记录已暂停，可继续或清空后重新开始");
      return;
    }

    await this.startWalk();
  },

  /**
   * 开始或继续一次行走记录。
   * 执行顺序为：隐私授权检查、定位权限检查、绑定监听、更新页面状态、开启计时、启动持续定位。
   */
  async startWalk() {
    try {
      await this.ensurePrivacyAuthorization();
      await this.ensureLocationPermission();

      this.bindLocationListener();
      this.setData({
        isWalking: true,
        statusText: this.data.pointCount > 0 ? "继续记录中" : "定位中",
        hintText: "正在连接定位服务并采集轨迹",
        primaryText: "结束行走测",
      });

      this.startTimer();
      await startLocationUpdate();
      await this.syncCurrentLocation();
    } catch (error) {
      await this.disposeTrackingResources();
      const hasTrack = this.data.pointCount > 0;
      const message = getLocationErrorMessage(error);

      this.setData({
        isWalking: false,
        statusText: hasTrack ? "已暂停" : "待授权",
        hintText: message,
        primaryText: hasTrack ? "继续行走测" : "开始行走测",
      });

      wx.showToast({
        title: message,
        icon: "none",
      });
    }
  },

  /**
   * 暂停当前记录，但保留已采集的数据。
   * 这样用户稍后仍可以继续同一条轨迹，而不是被迫重新开始。
   */
  async pauseWalk(hintText?: string) {
    await this.disposeTrackingResources();

    const hasTrack = this.data.pointCount > 0;
    if (hasTrack) {
      console.log("walk record >>>", createWalkRecord(this.data));
    }

    this.setData({
      isWalking: false,
      statusText: hasTrack ? "已暂停" : "未开始",
      hintText: hintText || (hasTrack ? "记录已暂停，可继续行走测" : DEFAULT_HINT),
      primaryText: hasTrack ? "继续行走测" : "开始行走测",
    });
  },

  /**
   * 清空当前轨迹和统计数据，并恢复页面到初始状态。
   * 清空后会重新同步一次当前位置，使地图中心点保持最新。
   */
  async resetWalk() {
    await this.disposeTrackingResources();

    this.setData({
      points: [],
      markers: [],
      polylines: [],
      isWalking: false,
      totalDistance: 0,
      distanceText: "0 m",
      durationSeconds: 0,
      durationText: "00:00:00",
      averageSpeedText: "0.00 km/h",
      pointCount: 0,
      statusText: "未开始",
      hintText: DEFAULT_HINT,
      primaryText: "开始行走测",
      showPrivacyDialog: false,
    });

    void this.prepareCurrentLocation().catch(() => {
      this.setData({
        hintText: "当前位置获取失败，请点击开始后重试",
      });
    });
  },

  /**
   * 把地图视角移动到当前定位点。
   * 该操作只调整视角，不会触发新的轨迹采样。
   */
  moveToCurrentLocation() {
    this.mapContext?.moveToLocation();
  },

  /**
   * 隐私授权弹窗点击同意后的回调。
   * 关闭弹窗，并继续唤醒此前等待隐私确认的流程。
   */
  handlePrivacyAuthorizeComplete() {
    this.setData({
      showPrivacyDialog: false,
    });

    this.privacyAuthorizeResolver?.();
    this.privacyAuthorizeResolver = null;
    this.privacyAuthorizePromise = null;
  },

  /**
   * 同步一次当前位置。
   * 这个方法只负责获取当前位置并刷新页面，不会开启持续定位。
   */
  async prepareCurrentLocation() {
    await this.ensurePrivacyAuthorization();
    await this.syncCurrentLocation();
  },

  /**
   * 确认当前是否需要展示隐私授权弹窗。
   * 如果基础库不支持该 API，则直接跳过，不阻塞主流程。
   */
  async ensurePrivacyAuthorization() {
    const privacyApi = wx as WxWithPrivacyApi;
    if (!privacyApi.getPrivacySetting) {
      return;
    }

    if (this.privacyAuthorizePromise) {
      return this.privacyAuthorizePromise;
    }

    this.privacyAuthorizePromise = new Promise<void>((resolve) => {
      privacyApi.getPrivacySetting?.({
        success: (result) => {
          if (!result.needAuthorization) {
            this.privacyAuthorizePromise = null;
            resolve();
            return;
          }

          this.privacyAuthorizeResolver = resolve;
          this.setData({
            showPrivacyDialog: true,
            statusText: "待授权",
            hintText: "请先同意隐私保护指引，再开始行走测",
          });
        },
        fail: () => {
          this.privacyAuthorizePromise = null;
          resolve();
        },
      });
    });

    return this.privacyAuthorizePromise;
  },

  /**
   * 确保定位权限已经具备。
   * 首次申请失败后，会继续引导用户进入设置页手动开启权限。
   */
  async ensureLocationPermission() {
    const settingResult = await new Promise<WechatMiniprogram.GetSettingSuccessCallbackResult>((resolve, reject) => {
      wx.getSetting({
        success: resolve,
        fail: reject,
      });
    });

    if (settingResult.authSetting[LOCATION_SCOPE]) {
      return;
    }

    try {
      await authorizeLocation();
    } catch (_error) {
      const modalResult = await new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>((resolve, reject) => {
        wx.showModal({
          title: "需要定位权限",
          content: "行走测依赖实时定位，请先允许小程序获取位置信息。",
          confirmText: "去设置",
          success: resolve,
          fail: reject,
        });
      });

      if (!modalResult.confirm) {
        throw _error;
      }

      const enabled = await openLocationSettings();
      if (!enabled) {
        throw _error;
      }
    }
  },

  /**
   * 绑定位置变化监听。
   * 每次重新绑定前先解绑，避免一个定位事件被重复处理多次。
   */
  bindLocationListener() {
    if (!this.locationChangeHandler) {
      return;
    }

    wx.offLocationChange(this.locationChangeHandler);
    wx.onLocationChange(this.locationChangeHandler);
  },

  /**
   * 主动读取一次当前位置，并复用统一的定位处理逻辑。
   */
  async syncCurrentLocation() {
    const location = await requestCurrentLocation();
    this.handleLocationChange(location);
  },

  /**
   * 处理每一次定位结果。
   * 这是页面的核心逻辑，负责更新当前位置、过滤低质量采样、累积距离和刷新统计信息。
   */
  handleLocationChange(result: WechatMiniprogram.OnLocationChangeCallbackResult | WechatMiniprogram.GetLocationSuccessCallbackResult) {
    const nextPoint: TrackPoint = {
      latitude: result.latitude,
      longitude: result.longitude,
    };

    if (!this.data.isWalking) {
      this.setData({
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
      });
      return;
    }

    // 已开始记录后，currentPoints 保存当前全部轨迹，lastPoint 用来和新点计算位移。
    const currentPoints = this.data.points as TrackPoint[];
    const lastPoint = currentPoints[currentPoints.length - 1];

    // 当定位精度较差时，只更新当前位置，不把该点写入轨迹。
    // 这样可以减少 GPS 漂移造成的路线跳点和异常距离增长。
    if (currentPoints.length > 0 && result.accuracy > 40) {
      this.setData({
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        hintText: `定位精度较低，已跳过本次采样（±${Math.round(result.accuracy)}m）`,
      });
      return;
    }

    // 第一条有效定位只作为轨迹起点，本身不产生距离增量。
    if (!lastPoint) {
      const nextPoints = [nextPoint];
      this.setData({
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        points: nextPoints,
        polylines: [],
        pointCount: 1,
        statusText: "记录中",
        hintText: "已定位成功，开始记录行走轨迹",
      });
      return;
    }

    // 如果新旧点距离太近，则判定为定位抖动，忽略本次采样。
    const segmentDistance = calculateDistance(lastPoint, nextPoint);
    if (segmentDistance < MIN_DISTANCE_METERS) {
      this.setData({
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
      });
      return;
    }

    // 将新点拼接到轨迹中，并基于本次位移累加总距离。
    const nextPoints = currentPoints.concat(nextPoint);
    const totalDistance = this.data.totalDistance + segmentDistance;

    this.setData({
      latitude: nextPoint.latitude,
      longitude: nextPoint.longitude,
      points: nextPoints,
      polylines: getPolyline(nextPoints),
      totalDistance,
      distanceText: formatDistance(totalDistance),
      averageSpeedText: formatAverageSpeed(totalDistance, this.data.durationSeconds),
      pointCount: nextPoints.length,
      statusText: "记录中",
      hintText: `已记录 ${nextPoints.length} 个轨迹点`,
    });
  },

  /**
   * 开启记录计时器。
   * 每秒递增 durationSeconds，并同步刷新展示用的时间和平均速度文本。
   */
  startTimer() {
    this.clearTimer();
    this.walkTimer = setInterval(() => {
      const nextDuration = this.data.durationSeconds + 1;
      this.setData({
        durationSeconds: nextDuration,
        durationText: formatDuration(nextDuration),
        averageSpeedText: formatAverageSpeed(this.data.totalDistance, nextDuration),
      });
    }, 1000);
  },

  /**
   * 清理当前计时器。
   * 统一由暂停、重置和页面销毁流程复用。
   */
  clearTimer() {
    if (!this.walkTimer) {
      return;
    }

    clearInterval(this.walkTimer);
    this.walkTimer = null;
  },

  /**
   * 统一释放记录过程中持有的资源。
   * 包括计时器和位置监听，确保页面退出后不会继续工作。
   */
  async disposeTrackingResources() {
    this.clearTimer();

    if (this.locationChangeHandler) {
      wx.offLocationChange(this.locationChangeHandler);
    }

    await stopLocationUpdate();
  },
});
