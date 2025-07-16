interface Config {
  debug: boolean;
  apiBaseUrl: string;
  qiyeWechatWebhook: string;
  enableErrorReporter: boolean;
  httpStatusCode: {
    OK: number;
    MOVED_PERMANENTLY: number;
    FOUND: number;
    NOT_MODIFIED: number;
    BAD_REQUEST: number;
    UNAUTHORIZED: number;
    FORBIDDEN: number;
    NOT_FOUND: number;
    METHOD_NOT_ALLOWED: number;
    INTERNAL_SERVER_ERROR: number;
    BAD_GATEWAY: number;
    SERVICE_UNAVAILABLE: number;
    GATEWAY_TIMEOUT: number;
  };
  version: number;
  defaultErrorMessage: string;
  requestMissingUrl: string;
}

const config: Config = {
  debug: true,
  apiBaseUrl: "https://hamm.cn",
  qiyeWechatWebhook: '',
  enableErrorReporter: false,
  httpStatusCode: {
    OK: 200,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },
  version: 10000,
  defaultErrorMessage: "请求服务器失败,请稍后再试",
  requestMissingUrl: "请求缺少url，请检查！"
};

export default config;
