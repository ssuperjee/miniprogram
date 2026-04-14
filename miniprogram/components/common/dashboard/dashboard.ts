type GaugePoint = {
  x: number;
  y: number;
};

type GaugeCanvasRect = {
  width?: number;
  height?: number;
};

// 组件的默认视觉参数，属性未传值时使用这一组配置。
// 默认画布宽度，改大后组件整体会变宽。
const DEFAULT_GAUGE_WIDTH = 360;
// 默认画布高度，改大后组件整体会变高。
const DEFAULT_GAUGE_HEIGHT = 300;
// 默认主弧半径，改大后仪表盘主体会更大。
const DEFAULT_GAUGE_RADIUS = 80;
// 默认刻度数量，改大后刻度更密，改小后更疏。
const DEFAULT_GAUGE_TICK_COUNT = 17;
// 默认刻度与主弧的间距，改大后白线会整体离主弧更远。
const DEFAULT_GAUGE_TICK_GAP = 12;
// 默认单条刻度长度，改大后白线更长。
const DEFAULT_GAUGE_TICK_LENGTH = 10;
// 默认主弧线宽，改大后背景弧和进度弧都会更粗。
const DEFAULT_GAUGE_LINE_WIDTH = 15;
// 默认刻度线宽，改大后每条刻度更明显。
const DEFAULT_GAUGE_TICK_LINE_WIDTH = 1.5;
// 默认画布安全留白，改大后仪表盘会离边缘更远。
const DEFAULT_GAUGE_PADDING = 0;
// 默认外层端点圆半径，改大后蓝色端点更明显。
const DEFAULT_GAUGE_DOT_RADIUS = 6;
// 默认内层白点半径，改大后白色高光点更大。
const DEFAULT_GAUGE_DOT_INNER_RADIUS = 2.6;
// 默认背景弧颜色。
const DEFAULT_TRACK_COLOR = '#dbe6ff';
// 默认进度弧颜色。
const DEFAULT_PROGRESS_COLOR = '#6f94ff';
// 默认刻度颜色。
const DEFAULT_TICK_COLOR = '#ffffff';
// 默认端点外层圆颜色。
const DEFAULT_DOT_COLOR = '#6f94ff';
// 默认端点内层圆颜色。
const DEFAULT_DOT_INNER_COLOR = '#ffffff';
// 默认文案颜色。
const DEFAULT_TEXT_COLOR = '#ffffff';
// 默认文案区域距离底部的位置，改大后文字会更靠上。
const DEFAULT_DESC_BOTTOM = 70;
// 默认小标题字号。
const DEFAULT_SUBTITLE_FONT_SIZE = 24;
// 默认大标题字号。
const DEFAULT_TITLE_FONT_SIZE = 28;
// 默认大标题与小标题之间的上间距。
const DEFAULT_TITLE_MARGIN_TOP = 10;

Component({
  data: {
    canvasWidth: DEFAULT_GAUGE_WIDTH,
    canvasHeight: DEFAULT_GAUGE_HEIGHT,
    isReady: false,
  },

  properties: {
    subtitle: {
      type: String,
      value: '',
    },
    title: {
      type: String,
      value: '',
    },
    value: {
      type: Number,
      value: 0,
      observer: 'refreshChart',
    },
    width: {
      type: Number,
      value: DEFAULT_GAUGE_WIDTH,
      observer: 'refreshChart',
    },
    height: {
      type: Number,
      value: DEFAULT_GAUGE_HEIGHT,
      observer: 'refreshChart',
    },
    radius: {
      type: Number,
      value: DEFAULT_GAUGE_RADIUS,
      observer: 'refreshChart',
    },
    tickCount: {
      type: Number,
      value: DEFAULT_GAUGE_TICK_COUNT,
      observer: 'refreshChart',
    },
    tickGap: {
      type: Number,
      value: DEFAULT_GAUGE_TICK_GAP,
      observer: 'refreshChart',
    },
    tickLength: {
      type: Number,
      value: DEFAULT_GAUGE_TICK_LENGTH,
      observer: 'refreshChart',
    },
    lineWidth: {
      type: Number,
      value: DEFAULT_GAUGE_LINE_WIDTH,
      observer: 'refreshChart',
    },
    tickLineWidth: {
      type: Number,
      value: DEFAULT_GAUGE_TICK_LINE_WIDTH,
      observer: 'refreshChart',
    },
    padding: {
      type: Number,
      value: DEFAULT_GAUGE_PADDING,
      observer: 'refreshChart',
    },
    dotRadius: {
      type: Number,
      value: DEFAULT_GAUGE_DOT_RADIUS,
      observer: 'refreshChart',
    },
    dotInnerRadius: {
      type: Number,
      value: DEFAULT_GAUGE_DOT_INNER_RADIUS,
      observer: 'refreshChart',
    },
    trackColor: {
      type: String,
      value: DEFAULT_TRACK_COLOR,
      observer: 'refreshChart',
    },
    progressColor: {
      type: String,
      value: DEFAULT_PROGRESS_COLOR,
      observer: 'refreshChart',
    },
    tickColor: {
      type: String,
      value: DEFAULT_TICK_COLOR,
      observer: 'refreshChart',
    },
    dotColor: {
      type: String,
      value: DEFAULT_DOT_COLOR,
      observer: 'refreshChart',
    },
    dotInnerColor: {
      type: String,
      value: DEFAULT_DOT_INNER_COLOR,
      observer: 'refreshChart',
    },
    textColor: {
      type: String,
      value: DEFAULT_TEXT_COLOR,
    },
    descBottom: {
      type: Number,
      value: DEFAULT_DESC_BOTTOM,
    },
    subtitleFontSize: {
      type: Number,
      value: DEFAULT_SUBTITLE_FONT_SIZE,
    },
    titleFontSize: {
      type: Number,
      value: DEFAULT_TITLE_FONT_SIZE,
    },
    titleMarginTop: {
      type: Number,
      value: DEFAULT_TITLE_MARGIN_TOP,
    },
  },

  lifetimes: {
    ready() {
      this.setData({
        isReady: true,
      });
      this.updateGaugeCanvasSize(() => {
        this.drawGauge();
      });
    },
  },

  pageLifetimes: {
    show() {
      this.updateGaugeCanvasSize(() => {
        this.drawGauge();
      });
    },
  },

  methods: {
    // 可配置属性变化后统一走这里，避免散落的重复重绘逻辑。
    refreshChart() {
      if (!this.data.isReady) {
        return;
      }

      this.updateGaugeCanvasSize(() => {
        this.drawGauge();
      });
    },

    // 读取 canvas 实际渲染尺寸，确保 rpx 样式和 canvas 绘制坐标一致。
    updateGaugeCanvasSize(callback?: () => void) {
      this.createSelectorQuery()
        .select('.gauge-canvas')
        .boundingClientRect((rect) => {
          const gaugeRect = rect as GaugeCanvasRect | null;

          if (gaugeRect?.width && gaugeRect?.height) {
            this.setData({
              canvasWidth: gaugeRect.width,
              canvasHeight: gaugeRect.height,
            }, () => {
              callback?.();
            });
            return;
          }

          callback?.();
        })
        .exec();
    },

      // 按当前属性配置绘制完整仪表盘。
    drawGauge() {
      const value = Number(this.properties.value || 0);
      const safeValue = Math.max(0, Math.min(100, value));
      const ctx = wx.createCanvasContext('gaugeCanvas', this);
      const width = this.data.canvasWidth;
      const height = this.data.canvasHeight;
      const lineWidth = Number(this.properties.lineWidth);
      const tickLineWidth = Number(this.properties.tickLineWidth);
      const padding = Number(this.properties.padding);
      const centerX = width / 2;
      const radius = Math.min(
        Number(this.properties.radius),
        (width - padding * 2 - lineWidth) / 2,
        height - padding * 2 - lineWidth,
      );
      const centerY = height / 2 + radius / 2;
      const startAngle = Math.PI;
      const endAngle = 0;
      const progressAngle = startAngle + (Math.PI * safeValue) / 100;

      ctx.clearRect(0, 0, width, height);

      // 先画刻度，再画背景弧和进度弧，避免层级被覆盖。
      this.drawTicks(ctx, centerX, centerY, radius, Number(this.properties.tickCount), tickLineWidth, String(this.properties.tickColor));
      this.drawArc(
        ctx,
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle,
        String(this.properties.trackColor),
        lineWidth,
      );
      this.drawArc(
        ctx,
        centerX,
        centerY,
        radius,
        startAngle,
        progressAngle,
        String(this.properties.progressColor),
        lineWidth,
      );

      const dotPoint = this.getArcPoint(
        centerX,
        centerY,
        radius,
        progressAngle,
      );
      ctx.beginPath();
      ctx.setFillStyle(String(this.properties.dotColor));
      ctx.arc(dotPoint.x, dotPoint.y, Number(this.properties.dotRadius), 0, Math.PI * 2, false);
      ctx.fill();

      ctx.beginPath();
      ctx.setFillStyle(String(this.properties.dotInnerColor));
      ctx.arc(
        dotPoint.x,
        dotPoint.y,
        Number(this.properties.dotInnerRadius),
        0,
        Math.PI * 2,
        false,
      );
      ctx.fill();

      ctx.draw();
    },

    // 供背景弧和进度弧复用的单段圆弧绘制方法。
    drawArc(
      ctx: WechatMiniprogram.CanvasContext,
      centerX: number,
      centerY: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      color: string,
      lineWidth: number,
    ) {
      ctx.beginPath();
      ctx.setLineWidth(lineWidth);
      ctx.setLineCap('round');
      ctx.setStrokeStyle(color);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
      ctx.stroke();
    },

    // 在半圆上按固定分段均匀绘制刻度线。
    drawTicks(
      ctx: WechatMiniprogram.CanvasContext,
      centerX: number,
      centerY: number,
      radius: number,
      tickCount: number,
      tickLineWidth: number,
      tickColor: string,
    ) {
      const tickGap = Number(this.properties.tickGap);
      const tickLength = Number(this.properties.tickLength);

      for (let index = 0; index <= tickCount; index += 1) {
        const angle = Math.PI + (Math.PI * index) / tickCount;
        const start = this.getArcPoint(
          centerX,
          centerY,
          radius - tickGap - tickLength,
          angle,
        );
        const end = this.getArcPoint(
          centerX,
          centerY,
          radius - tickGap,
          angle,
        );

        ctx.beginPath();
        ctx.setLineWidth(tickLineWidth);
        ctx.setStrokeStyle(tickColor);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    },

    // 根据圆心、半径和角度换算圆弧上的坐标点。
    getArcPoint(
      centerX: number,
      centerY: number,
      radius: number,
      angle: number,
    ): GaugePoint {
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    },
  },
});
