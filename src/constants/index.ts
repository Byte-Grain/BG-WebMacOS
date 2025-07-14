// 系统常量定义

// 应用键值常量
export const APP_KEYS = {
  SYSTEM_ABOUT: 'system_about',
  SYSTEM_FINDER: 'system_finder',
  SYSTEM_LAUNCHPAD: 'system_launchpad',
  SYSTEM_SETTING: 'system_setting',
  SYSTEM_STORE: 'system_store',
  SYSTEM_TASK: 'system_task',
} as const

// 系统状态常量
export const SYSTEM_STATES = {
  LOADING: 'loading',
  LOGIN: 'login',
  DESKTOP: 'desktop',
  LAUNCHPAD: 'launchpad',
} as const

// 窗口尺寸常量
export const WINDOW_SIZES = {
  SMALL: { width: 400, height: 300 },
  MEDIUM: { width: 600, height: 450 },
  LARGE: { width: 800, height: 600 },
  EXTRA_LARGE: { width: 1000, height: 750 },
} as const

// 动画时长常量
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const

// 延迟时间常量
export const DELAYS = {
  VOLUME_HIDE: 3000,
  TOOLTIP_SHOW: 500,
  AUTO_SAVE: 1000,
} as const

// Z-Index 层级常量
export const Z_INDEX = {
  BACKGROUND: 1,
  DESKTOP: 10,
  WINDOW: 100,
  MODAL: 1000,
  DROPDOWN: 2000,
  TOOLTIP: 3000,
  NOTIFICATION: 4000,
} as const

// 本地存储键名常量
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'AccessToken',
  LANGUAGE: 'language',
  THEME: 'theme',
  VOLUME: 'volume',
  USER_PREFERENCES: 'userPreferences',
} as const

// HTTP 状态码常量
export const HTTP_STATUS = {
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
} as const

// 主题常量
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const

// 语言常量
export const LANGUAGES = {
  ZH: 'zh',
  EN: 'en',
} as const

// 事件名称常量（从useEventBus导入，保持统一）
// 注意：主要事件常量已移至 composables/useEventBus.ts 中统一管理
// 这里保留一些基础事件常量以保持向后兼容
export const BASIC_EVENTS = {
  APP_OPEN: 'app:open',
  APP_CLOSE: 'app:close',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  THEME_CHANGE: 'theme:change',
  LANGUAGE_CHANGE: 'language:change',
  VOLUME_CHANGE: 'volume:change',
} as const

// 为了向后兼容，保留EVENTS导出
export const EVENTS = BASIC_EVENTS

// 默认配置常量
export const DEFAULTS = {
  VOLUME: 80,
  LANGUAGE: LANGUAGES.ZH,
  THEME: THEMES.LIGHT,
  WINDOW_SIZE: WINDOW_SIZES.MEDIUM,
} as const

// 类型导出
export type AppKey = typeof APP_KEYS[keyof typeof APP_KEYS]
export type SystemState = typeof SYSTEM_STATES[keyof typeof SYSTEM_STATES]
export type Theme = typeof THEMES[keyof typeof THEMES]
export type Language = typeof LANGUAGES[keyof typeof LANGUAGES]
export type EventName = typeof EVENTS[keyof typeof EVENTS]