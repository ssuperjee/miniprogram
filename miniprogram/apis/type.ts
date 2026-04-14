/**
 * 登录参数
 */
export interface LoginParams {
  phone: string
  code: string
}

/**
 * 登录返回值
 */
export interface LoginResult {
  token: string
  userId: string
  nickname: string
  avatar: string
}

/**
 * 用户信息
 */
export interface UserInfo {
  userId: string
  nickname: string
  avatar: string
}

export interface UploadResult {
  url: string;
  path: string;
}