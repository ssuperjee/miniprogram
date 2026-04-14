/**
 * 微信小程序通用上传工具（支持图片、文档、txt、zip、pdf、excel、word 等所有文件）
 */
import appConfig from "../config/config";

// 基础配置
const requestConfig = {
  baseUrl: appConfig.baseUrl, // 你的接口地址
  timeout: 5000,
};

interface UploadOption {
  url: string;
  filePath: string;
  name?: string;
  formData?: Record<string, any>;
  timeout?: number;
  loading?: boolean;
  loadingText?: string;
  noToken?: boolean;
  showErrorToast?: boolean;
}

/**
 * 单文件通用上传
 */
export function uploadFile<T = any>(option: UploadOption): Promise<T> {
  const {
    url,
    filePath,
    name = "file",
    formData = {},
    timeout = requestConfig.timeout,
    loading = true,
    loadingText = "上传中...",
    noToken = false,
    showErrorToast = true,
  } = option;

  if (loading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  const token = wx.getStorageSync("token") || "";
  const header: Record<string, string> = {};
  if (token && !noToken) {
    header["Authorization"] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: requestConfig.baseUrl + url,
      filePath,
      name,
      formData,
      header,
      timeout,

      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0 || data.code === 200) {
            resolve(data as T);
          } else {
            if (showErrorToast) {
              wx.showToast({
                title: data.msg || "上传失败",
                icon: "none",
              });
            }
            reject(data);
          }
        } catch (e) {
          if (showErrorToast) {
            wx.showToast({ title: "返回数据格式错误", icon: "none" });
          }
          reject(e);
        }
      },

      fail: (err) => {
        if (showErrorToast) {
          wx.showToast({ title: "上传失败，请检查网络", icon: "none" });
        }
        reject(err);
      },

      complete: () => {
        if (loading) {
          wx.hideLoading();
        }
      },
    });
  });
}

/**
 * 容错版多文件串行上传
 */
export async function uploadFiles<T = any>(
  options: Omit<UploadOption, "filePath"> & {
    filePaths: string[];
  },
): Promise<{
  success: { data: T; index: number; filePath: string }[];
  fail: { error: any; index: number; filePath: string }[];
}> {
  const {
    filePaths,
    loading = true,
    loadingText = "上传中...",
    ...rest
  } = options;
  const success: any[] = [];
  const fail: any[] = [];

  if (loading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  try {
    for (let i = 0; i < filePaths.length; i++) {
      try {
        const data = await uploadFile({
          ...rest,
          filePath: filePaths[i],
          loading: false,
          showErrorToast: false,
        });
        success.push({ data, index: i, filePath: filePaths[i] });
      } catch (err) {
        console.error("上传文件失败：", err);
        fail.push({ error: err, index: i, filePath: filePaths[i] });
      }
    }
  } finally {
    if (loading) {
      wx.hideLoading();
    }
  }

  if (fail.length > 0) {
    wx.showToast({
      title: `上传失败 ${fail.length} 个`,
      icon: "none",
    });
  }

  return { success, fail };
}

export default {
  uploadFile,
  uploadFiles,
};

// 测试上传多文件
// async testUploadMultipleFiles() {
//   wx.chooseMessageFile({
//     count: 5,
//     type: 'file',
//     success: async (res) => {
//       console.log('选择的文件列表：', res);
//       const filePaths = res.tempFiles.map(file => file.path);
//       const uploadRes = await apiUploadImages(filePaths);
//       console.log('上传结果：', uploadRes);
//     },
//     fail(err) {
//       console.error('选择文件失败：', err);
//     }
//   });
// }

// 测试上传单文件
// async testUploadSingleFile() {
//   wx.chooseMessageFile({
//     count: 1,
//     type: 'file',
//     success: async (res) => {
//       console.log('选择的文件列表：', res);
//       const uploadRes = await apiUploadImage(res.tempFiles[0].path);
//       console.log('上传结果：', uploadRes);
//     },
//     fail(err) {
//       console.error('选择文件失败：', err);
//     }
//   });
// }
