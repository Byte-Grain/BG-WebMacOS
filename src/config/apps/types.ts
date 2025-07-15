// 应用配置类型定义

// 基础应用配置
export interface BaseAppConfig {
  key: string
  title: string
  icon: string
  iconColor?: string
  iconBgColor?: string
  component?: string
  width?: number | string
  height?: number | string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  x?: number
  y?: number
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  alwaysOnTop?: boolean
  modal?: boolean
  transparent?: boolean
  frame?: boolean
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset'
  backgroundColor?: string
  opacity?: number
  shadow?: boolean
  animation?: boolean
  keepInDock?: boolean
  hideInDesktop?: boolean
  hideWhenClose?: boolean
  disableResize?: boolean
  autoFocus?: boolean
  category?: string
  tags?: string[]
  version?: string
  author?: string
  description?: string
  permissions?: string[]
  dependencies?: string[]
}

// 外部链接应用配置
export interface ExternalAppConfig extends BaseAppConfig {
  outLink: true
  url: string
  target?: '_blank' | '_self' | '_parent' | '_top'
}

// 内嵌网页应用配置
export interface WebAppConfig extends BaseAppConfig {
  innerLink: true
  url: string
  sandbox?: boolean
  allowScripts?: boolean
  allowForms?: boolean
  allowPopups?: boolean
}

// 本地组件应用配置
export interface ComponentAppConfig extends BaseAppConfig {
  component: string
  props?: Record<string, any>
  slots?: Record<string, any>
}

// 应用配置联合类型
export type AppConfig = ComponentAppConfig | ExternalAppConfig | WebAppConfig | SystemAppConfig | DemoAppConfig

// 系统应用配置
export interface SystemAppConfig extends ComponentAppConfig {
  system: true
  essential?: boolean // 是否为必需应用
  singleton?: boolean // 是否为单例应用
}

// 演示应用配置
export interface DemoAppConfig extends AppConfig {
  demo: true
  featured?: boolean // 是否为特色演示
}

// 应用注册表
export interface AppRegistry {
  system: Record<string, SystemAppConfig>
  demo: Record<string, DemoAppConfig>
  user: Record<string, AppConfig>
}

// 应用菜单配置
export interface AppMenuConfig {
  key: string
  title: string
  shortcut?: string
  action?: string
  sub?: AppMenuConfig[]
  isLine?: boolean
  disabled?: boolean
}

// 应用状态
export interface AppState {
  key: string
  pid: string
  title: string
  icon: string
  component?: string
  url?: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
  maximized: boolean
  hidden: boolean
  focused: boolean
  loading: boolean
  error?: string
  data?: any
  createdAt: number
  updatedAt: number
}

// 应用事件
export interface AppEvent {
  type: string
  payload?: any
  timestamp: number
  source: string
  target?: string
}

// 应用权限
export type AppPermission = 
  | 'filesystem'
  | 'network'
  | 'camera'
  | 'microphone'
  | 'location'
  | 'notifications'
  | 'clipboard'
  | 'fullscreen'
  | 'storage'
  | 'system'

// 应用分类
export type AppCategory = 
  | 'system'
  | 'productivity'
  | 'entertainment'
  | 'development'
  | 'graphics'
  | 'utilities'
  | 'games'
  | 'education'
  | 'business'
  | 'social'
  | 'other'