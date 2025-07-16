/**
 * 应用注册系统类型定义
 */

import type { Component } from 'vue'

/**
 * 应用分类
 */
export type AppCategory = 
  | 'system'        // 系统应用
  | 'utilities'     // 实用工具
  | 'productivity'  // 效率工具
  | 'entertainment' // 娱乐应用
  | 'development'   // 开发工具
  | 'education'     // 教育应用
  | 'business'      // 商务应用
  | 'graphics'      // 图形设计
  | 'multimedia'    // 多媒体
  | 'social'        // 社交应用
  | 'games'         // 游戏
  | 'demo'          // 演示应用
  | 'custom'        // 自定义应用

/**
 * 应用权限
 */
export type AppPermission = 
  | 'camera'          // 摄像头权限
  | 'microphone'      // 麦克风权限
  | 'location'        // 位置权限
  | 'notifications'   // 通知权限
  | 'storage'         // 存储权限
  | 'network'         // 网络权限
  | 'clipboard'       // 剪贴板权限
  | 'fullscreen'      // 全屏权限
  | 'system-info'     // 系统信息权限

/**
 * 应用菜单项
 */
export interface AppMenu {
  key?: string
  title?: string
  sub?: AppMenu[]
  isLine?: boolean
  action?: () => void
  shortcut?: string
  disabled?: boolean
}

/**
 * 应用窗口配置
 */
export interface AppWindowConfig {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  alwaysOnTop?: boolean
  modal?: boolean
  transparent?: boolean
}

/**
 * 应用主题配置
 */
export interface AppThemeConfig {
  titleBgColor?: string
  titleColor?: string
  iconColor?: string
  iconBgColor?: string
  accentColor?: string
  supportsDarkMode?: boolean
}

/**
 * 应用生命周期钩子
 */
export interface AppLifecycleHooks {
  onBeforeMount?: () => void | Promise<void>
  onMounted?: () => void | Promise<void>
  onBeforeUnmount?: () => void | Promise<void>
  onUnmounted?: () => void | Promise<void>
  onActivated?: () => void | Promise<void>
  onDeactivated?: () => void | Promise<void>
  onError?: (error: Error) => void
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  // 基本信息
  key: string                           // 应用唯一标识
  title: string                         // 应用标题
  icon: string                          // 应用图标
  description?: string                  // 应用描述
  version?: string                      // 应用版本
  author?: string                       // 应用作者
  homepage?: string                     // 应用主页
  repository?: string                   // 代码仓库
  license?: string                      // 许可证
  
  // 分类和标签
  category?: AppCategory                // 应用分类
  tags?: string[]                       // 应用标签
  keywords?: string[]                   // 搜索关键词
  
  // 组件和路径
  component?: Component | string        // Vue 组件
  componentPath?: string                // 组件路径（用于动态加载）
  
  // 窗口配置
  window?: AppWindowConfig              // 窗口配置
  
  // 兼容性字段（向后兼容）
  width?: number
  height?: number
  resizable?: boolean
  draggable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  disableResize?: boolean               // 已废弃，使用 window.resizable
  
  // 主题配置
  theme?: AppThemeConfig                // 主题配置
  
  // 兼容性字段（向后兼容）
  iconColor?: string
  iconBgColor?: string
  titleBgColor?: string
  titleColor?: string
  
  // 行为配置
  hideInDesktop?: boolean               // 是否在桌面隐藏
  keepInDock?: boolean                  // 是否保持在 Dock 中
  hideWhenClose?: boolean               // 关闭时是否隐藏而非销毁
  singleton?: boolean                   // 是否为单例应用
  autoStart?: boolean                   // 是否自动启动
  essential?: boolean                   // 是否为必需应用
  system?: boolean                      // 是否为系统应用
  demo?: boolean                        // 是否为演示应用
  featured?: boolean                    // 是否为推荐应用
  
  // 权限和安全
  permissions?: AppPermission[]         // 应用权限
  trusted?: boolean                     // 是否为可信应用
  sandboxed?: boolean                   // 是否运行在沙箱中
  
  // 菜单和交互
  menu?: AppMenu[]                      // 应用菜单
  shortcuts?: Record<string, () => void> // 快捷键
  
  // 外部链接
  outLink?: boolean                     // 是否为外部链接
  url?: string                          // 外部链接地址
  innerLink?: boolean                   // 是否为内部链接
  
  // 运行时状态（由系统管理）
  pid?: number                          // 进程ID
  hide?: boolean                        // 是否隐藏
  active?: boolean                      // 是否激活
  data?: any                            // 应用数据
  
  // 生命周期
  lifecycle?: AppLifecycleHooks         // 生命周期钩子
  
  // 依赖管理
  dependencies?: string[]               // 依赖的其他应用
  conflicts?: string[]                  // 冲突的应用
  
  // 更新和版本控制
  updateUrl?: string                    // 更新检查地址
  autoUpdate?: boolean                  // 是否自动更新
  minSystemVersion?: string             // 最低系统版本要求
  
  // 元数据
  createdAt?: string                    // 创建时间
  updatedAt?: string                    // 更新时间
  installDate?: string                  // 安装日期
  lastUsed?: string                     // 最后使用时间
  usageCount?: number                   // 使用次数
  
  // 扩展字段
  [key: string]: any                    // 允许扩展字段
}

/**
 * 应用状态
 */
export interface AppState {
  showLogin: boolean
  nowApp: AppConfig | false
  openAppList: AppConfig[]
  dockAppList: AppConfig[]
  openWidgetList: any[]
  volumn: number
  launchpad: boolean
}

/**
 * 应用发现配置
 */
export interface AppDiscoveryConfig {
  autoScan: boolean           // 是否启用自动扫描
  scanPaths: string[]         // 扫描路径
  excludePatterns: string[]   // 排除模式
  fileExtensions: string[]    // 文件扩展名
  watchMode?: boolean         // 是否启用监听模式
  cacheEnabled?: boolean      // 是否启用缓存
  maxCacheAge?: number        // 缓存最大年龄（毫秒）
}

/**
 * 应用注册表配置
 */
export interface AppRegistryConfig {
  discovery?: AppDiscoveryConfig
  enableStaticApps?: boolean
  enableDynamicApps?: boolean
  enableCache?: boolean
  validateApps?: boolean
  debugMode?: boolean
}

/**
 * 应用验证结果
 */
export interface AppValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 应用搜索选项
 */
export interface AppSearchOptions {
  query: string
  category?: AppCategory
  tags?: string[]
  author?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'category' | 'author' | 'version' | 'lastUsed'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 应用搜索结果
 */
export interface AppSearchResult {
  apps: AppConfig[]
  total: number
  hasMore: boolean
}