/**
 * 微信小程序通用下载工具
 * 支持：图片、文档、pdf、word、excel、txt、zip 等所有文件
 */

import appConfig from "../config/config";

// 基础配置
const requestConfig = {
  baseUrl: appConfig.baseUrl, // 你的接口地址
  timeout: 10000,
};

interface DownloadOptions {
  /** 文件远程地址 */
  url: string;
  /** 显示 loading */
  loading?: boolean;
  loadingText?: string;
  /** 需要携带 token */
  needToken?: boolean;
}

/**
 * 下载文件 + 保存到本地
 */
export async function downloadFile(options: DownloadOptions): Promise<string> {
  const {
    url,
    loading = true,
    loadingText = "下载中...",
    needToken = true,
  } = options;

  // 处理完整地址
  const fileUrl = url.startsWith("http") ? url : requestConfig.baseUrl + url;

  // 显示 loading
  if (loading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  try {
    // 请求头
    const header: Record<string, string> = {};
    if (needToken) {
      const token = wx.getStorageSync("token") || "";
      if (token) {
        header["Authorization"] = `Bearer ${token}`;
      }
    }

    // 1. 下载文件到临时路径
    const downloadRes =
      await new Promise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(
        (resolve, reject) => {
          wx.downloadFile({
            url: fileUrl,
            header,
            timeout: requestConfig.timeout,
            success: resolve,
            fail: reject,
          });
        },
      );

    if (downloadRes.statusCode !== 200) {
      throw new Error(`下载失败，状态码：${downloadRes.statusCode}`);
    }

    const tempFilePath = downloadRes.tempFilePath;

    // 2. 保存文件到用户本地
    await saveFileToDevice(tempFilePath);

    wx.showToast({
      title: "下载成功",
      icon: "success",
    });

    return tempFilePath;
  } catch (err: any) {
    console.error("下载失败：", err);
    wx.showToast({
      title: err?.message || "下载失败，请重试",
      icon: "none",
    });
    throw err;
  } finally {
    if (loading) {
      wx.hideLoading();
    }
  }
}

/**
 * 保存文件到手机（兼容文档、图片、压缩包）
 */
function saveFileToDevice(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 微信小程序保存文件官方API
    wx.saveFileToDisk({
      filePath,
      success: () => resolve(),
      fail: (err) => {
        // 兼容部分设备无法直接保存
        console.warn("saveFileToDisk 失败，尝试打开文档", err);

        wx.openDocument({
          filePath,
          showMenu: true,
          success: () => resolve(),
          fail: () => reject(new Error("文件无法保存")),
        });
      },
    });
  });
}

export default {
  downloadFile,
};

// 测试下载
// async testDownloadFile() {
//  await downloadFile({url:"https://example.com/file.pdf"})
// }
