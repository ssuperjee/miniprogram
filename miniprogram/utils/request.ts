/**
 * 微信小程序请求封装 - TS 版
 * 支持：请求头、token、拦截器、loading、错误处理
 */
import appConfig from '../config/config'

// 基础配置
const requestConfig = {
  baseUrl: appConfig.baseUrl, // 你的接口地址
  timeout: 10000,
};

// 加载计数器（解决多请求同时触发 loading）
let loadingCount = 0;

// ==================== 类型定义 ====================
interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: Record<string, string>;
  loading?: boolean;
  loadingText?: string;
  noToken?: boolean; // 不需要 token
}

interface ResponseData<T = any> {
  code: number;
  msg: string;
  data: T;
}

// ==================== 核心请求方法 ====================
const request = <T = any>(
  options: RequestOptions
): Promise<ResponseData<T>> => {
  const {
    url,
    method = "GET",
    data = {},
    header = {},
    loading = true,
    loadingText = "加载中...",
    noToken = false,
  } = options;

  // 开启 loading
  if (loading) {
    loadingCount++;
    wx.showLoading({
      title: loadingText,
      mask: true,
    });
  }

  // 请求头
  const token = wx.getStorageSync("token") || "";
  const defaultHeader: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 自动添加 token
  if (token && !noToken) {
    defaultHeader["Authorization"] = `Bearer ${token}`;
  }

  // 返回 Promise
  return new Promise((resolve, reject) => {
    wx.request({
      url: requestConfig.baseUrl + url,
      method,
      data,
      header: { ...defaultHeader, ...header },
      timeout: requestConfig.timeout,

      // 响应成功
      success: (res) => {
        const { statusCode, data } = res;
        const responseData = data as ResponseData<T>;

        // HTTP 状态码判断
        switch (statusCode) {
          case 200:
            // 业务状态码
            if (responseData.code === 0 || responseData.code === 200) {
              resolve(responseData);
            } else if (responseData.code === 401) {
              // TOKEN 过期
              handleUnauthorized();
              reject(responseData);
            } else {
              // 业务错误
              wx.showToast({
                title: responseData.msg || "请求失败",
                icon: "none",
              });
              reject(responseData);
            }
            break;

          case 404:
            wx.showToast({ title: "接口不存在", icon: "none" });
            reject(res);
            break;

          case 500:
            wx.showToast({ title: "服务器异常", icon: "none" });
            reject(res);
            break;

          default:
            wx.showToast({
              title: `请求错误 ${statusCode}`,
              icon: "none",
            });
            reject(res);
            break;
        }
      },

      // 网络失败
      fail: (err) => {
        wx.showToast({
          title: "网络异常，请稍后重试",
          icon: "none",
        });
        reject(err);
      },

      // 完成（关闭 loading）
      complete: () => {
        if (loading) {
          loadingCount--;
          if (loadingCount <= 0) {
            loadingCount = 0;
            wx.hideLoading();
          }
        }
      },
    });
  });
};

// ==================== 401 统一处理 ====================
function handleUnauthorized() {
  wx.removeStorageSync("token");
  wx.showToast({
    title: "登录已过期，请重新登录",
    icon: "none",
    duration: 2000,
  });
  setTimeout(() => {
    wx.reLaunch({
      url: "/pages/login/index", // 登录页
    });
  }, 2000);
}

// ==================== 导出 ====================
export default {
  request,

  get<T = any>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, "url" | "method" | "data">
  ) {
    return request<T>({ url, method: "GET", data, ...options });
  },

  post<T = any>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, "url" | "method" | "data">
  ) {
    return request<T>({ url, method: "POST", data, ...options });
  },

  put<T = any>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, "url" | "method" | "data">
  ) {
    return request<T>({ url, method: "PUT", data, ...options });
  },

  delete<T = any>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, "url" | "method" | "data">
  ) {
    return request<T>({ url, method: "DELETE", data, ...options });
  },
};