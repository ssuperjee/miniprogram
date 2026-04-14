import request from "../../utils/request";
import { LoginParams, LoginResult,  UserInfo } from "../type";

/**
 * 登录
 */
export function login(data: LoginParams) {
  return request.post<LoginResult>("/auth/login", data);
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request.get<UserInfo>("/user/info");
}