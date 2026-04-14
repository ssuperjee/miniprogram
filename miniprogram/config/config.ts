interface EnvConfig {
  baseUrl: string; // 请求域名
  env: "development" | "production"; // 环境名称
}

interface Configs extends EnvConfig {
  style: {
    clPrimary: string;
    clWarning: string;
  };
}

// 正式环境
export const production: EnvConfig = {
  baseUrl: "https://xxx.api.com",
  env: "production",
};

// 测试环境
export const development: EnvConfig = {
  baseUrl: "http://192.168.20.154:48080",
  env: "development",
};

const configs: Configs = {
  // 切换环境
  ...development,
  // 其他通用配置
  style: {
    clPrimary: "#026545",
    clWarning: "#c10000",
  },
};

export default configs;
