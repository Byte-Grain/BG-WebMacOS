import { BaseAppConfig } from './types'
import { WINDOW_PRESETS } from '../system/window.config'

// 应用默认配置
export const appDefaults: Partial<BaseAppConfig> = {
  // 窗口尺寸
  width: WINDOW_PRESETS.MEDIUM.width,
  height: WINDOW_PRESETS.MEDIUM.height,
  minWidth: 320,
  minHeight: 240,
  
  // 窗口行为
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  alwaysOnTop: false,
  modal: false,
  transparent: false,
  frame: true,
  titleBarStyle: 'default',
  
  // 外观
  backgroundColor: '#ffffff',
  opacity: 1,
  shadow: true,
  animation: true,
  
  // 显示设置
  keepInDock: false, // 保持在Dock栏
  hideInDesktop: false,
  hideWhenClose: false,
  autoFocus: true,
  draggable:false,
  
  // 图标设置
  icon:"",
  iconColor: '#333333',
  iconBgColor: '#ffffff',
  
  // 分类和标签
  category: 'other',
  tags: [],
  
  // 版本信息
  version: '1.0.0',
  author: 'Unknown',
  description: '',
  
  // 权限
  permissions: [],
  dependencies: [],
}

// 默认桌面应用列表
export const defaultDesktopApps = [
  'system_finder',
  'system_setting',
  'system_store',
]

// 默认 Dock 应用列表
export const defaultDockApps = [
  'system_finder',
  'system_launchpad',
  'system_setting',
  'system_store',
  'demo_demo',
  'demo_github',
  'demo_gitee',
  'demo_dock',
  'demo_hidedesktop',
]

// 应用分类配置
export const appCategories = {
  system: {
    name: '系统',
    icon: 'icon-system',
    color: '#007AFF',
    description: '系统核心应用',
  },
  productivity: {
    name: '效率',
    icon: 'icon-productivity',
    color: '#34C759',
    description: '提高工作效率的应用',
  },
  entertainment: {
    name: '娱乐',
    icon: 'icon-entertainment',
    color: '#FF3B30',
    description: '娱乐和休闲应用',
  },
  development: {
    name: '开发',
    icon: 'icon-development',
    color: '#5856D6',
    description: '开发工具和资源',
  },
  graphics: {
    name: '图形',
    icon: 'icon-graphics',
    color: '#FF9500',
    description: '图形设计和编辑应用',
  },
  utilities: {
    name: '工具',
    icon: 'icon-utilities',
    color: '#8E8E93',
    description: '实用工具和小程序',
  },
  games: {
    name: '游戏',
    icon: 'icon-games',
    color: '#FF2D92',
    description: '游戏和互动娱乐',
  },
  education: {
    name: '教育',
    icon: 'icon-education',
    color: '#30B0C7',
    description: '教育和学习应用',
  },
  business: {
    name: '商务',
    icon: 'icon-business',
    color: '#32D74B',
    description: '商务和办公应用',
  },
  social: {
    name: '社交',
    icon: 'icon-social',
    color: '#007AFF',
    description: '社交网络和通讯应用',
  },
  other: {
    name: '其他',
    icon: 'icon-other',
    color: '#8E8E93',
    description: '其他类型应用',
  },
} as const

// 应用权限配置
export const appPermissions = {
  filesystem: {
    name: '文件系统',
    description: '访问和修改文件系统',
    icon: 'icon-folder',
    level: 'high',
  },
  network: {
    name: '网络访问',
    description: '访问互联网和网络资源',
    icon: 'icon-network',
    level: 'medium',
  },
  camera: {
    name: '摄像头',
    description: '访问摄像头进行拍照或录像',
    icon: 'icon-camera',
    level: 'high',
  },
  microphone: {
    name: '麦克风',
    description: '访问麦克风进行录音',
    icon: 'icon-microphone',
    level: 'high',
  },
  location: {
    name: '位置信息',
    description: '获取设备位置信息',
    icon: 'icon-location',
    level: 'medium',
  },
  notifications: {
    name: '通知',
    description: '发送系统通知',
    icon: 'icon-notification',
    level: 'low',
  },
  clipboard: {
    name: '剪贴板',
    description: '访问和修改剪贴板内容',
    icon: 'icon-clipboard',
    level: 'medium',
  },
  fullscreen: {
    name: '全屏',
    description: '进入全屏模式',
    icon: 'icon-fullscreen',
    level: 'low',
  },
  storage: {
    name: '本地存储',
    description: '在本地存储数据',
    icon: 'icon-storage',
    level: 'medium',
  },
  system: {
    name: '系统控制',
    description: '控制系统功能和设置',
    icon: 'icon-system',
    level: 'high',
  },
} as const

export default appDefaults