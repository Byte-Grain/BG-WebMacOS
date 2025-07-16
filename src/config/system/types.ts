// 系统配置类型定义

// 菜单项配置
export interface MenuItem {
  key: string
  title: string
  icon?: string
  shortcut?: string
  action?: string
  sub?: MenuItem[]
  isLine?: boolean
  disabled?: boolean
}

// 菜单配置
export interface MenuConfig {
  appleMenu: MenuItem[]
  applicationMenus: Record<string, MenuItem[]>
  contextMenu: MenuItem[]
}

// 快捷键配置
export interface ShortcutConfig {
  global: Record<string, string>
  application: Record<string, Record<string, string>>
}

// 窗口配置
export interface WindowConfig {
  defaultSize: {
    width: number
    height: number
  }
  minSize: {
    width: number
    height: number
  }
  maxSize: {
    width: number
    height: number
  }
  animation: {
    duration: number
    easing: string
  }
  shadow: {
    enabled: boolean
    blur: number
    spread: number
    color: string
  }
}

// 系统配置
export interface SystemConfig {
  version: string
  buildTime: string
  author: string
  repository: string
  license: string
  features: {
    multiLanguage: boolean
    darkMode: boolean
    notifications: boolean
    shortcuts: boolean
    contextMenu: boolean
    dragAndDrop: boolean
    fileSystem: boolean
  }
  limits: {
    maxOpenWindows: number
    maxFileSize: number
    sessionTimeout: number
  }
  defaults: {
    language: string
    theme: string
    wallpaper: string
    volume: number
  }
}
