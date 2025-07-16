import { WindowConfig } from './types'

// 窗口配置
export const windowConfig: WindowConfig = {
  // 默认窗口尺寸
  defaultSize: {
    width: 800,
    height: 600,
  },
  
  // 最小窗口尺寸
  minSize: {
    width: 320,
    height: 240,
  },
  
  // 最大窗口尺寸（相对于屏幕）
  maxSize: {
    width: 0.9, // 90% of screen width
    height: 0.9, // 90% of screen height
  },
  
  // 动画配置
  animation: {
    duration: 300, // 毫秒
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ease-out
  },
  
  // 阴影配置
  shadow: {
    enabled: true,
    blur: 20,
    spread: 0,
    color: 'rgba(0, 0, 0, 0.3)',
  },
}

// 预定义窗口尺寸
export const WINDOW_PRESETS = {
  SMALL: {
    width: 400,
    height: 300,
  },
  MEDIUM: {
    width: 600,
    height: 450,
  },
  LARGE: {
    width: 800,
    height: 600,
  },
  EXTRA_LARGE: {
    width: 1000,
    height: 750,
  },
  FULL_SCREEN: {
    width: '100vw',
    height: '100vh',
  },
} as const

// 窗口层级配置
export const WINDOW_Z_INDEX = {
  BASE: 1000,
  MODAL: 2000,
  DROPDOWN: 3000,
  TOOLTIP: 4000,
  NOTIFICATION: 5000,
  LOADING: 6000,
} as const

// 窗口状态
export const WINDOW_STATES = {
  NORMAL: 'normal',
  MINIMIZED: 'minimized',
  MAXIMIZED: 'maximized',
  FULLSCREEN: 'fullscreen',
  HIDDEN: 'hidden',
} as const

// 窗口类型
export const WINDOW_TYPES = {
  NORMAL: 'normal',
  MODAL: 'modal',
  UTILITY: 'utility',
  SPLASH: 'splash',
  DESKTOP: 'desktop',
} as const

export default windowConfig
