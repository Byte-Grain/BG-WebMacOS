/**
 * 应用包相关类型定义
 */

import { AppPermission, AppCategory } from '@core/app-registry/types'

// 应用清单接口
export interface AppManifest {
  // 基础信息
  name: string                    // 应用名称
  key: string                     // 应用唯一标识
  version: string                 // 版本号
  description: string             // 应用描述
  author: string                  // 开发者
  homepage?: string               // 主页地址
  repository?: string             // 仓库地址
  license?: string                // 许可证
  
  // 应用配置
  type: 'component' | 'web' | 'external'  // 应用类型
  entry: string                   // 入口文件
  icon: string                    // 图标路径
  category?: AppCategory          // 应用分类
  tags?: string[]                 // 标签
  
  // 窗口配置
  window?: {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    resizable?: boolean
    maximizable?: boolean
    minimizable?: boolean
    closable?: boolean
    alwaysOnTop?: boolean
    modal?: boolean
    transparent?: boolean
    frame?: boolean
    titleBarStyle?: 'default' | 'hidden' | 'hiddenInset'
    backgroundColor?: string
    opacity?: number
  }
  
  // 权限声明
  permissions?: AppPermission[]
  
  // 依赖声明
  dependencies?: {
    framework?: string            // 框架版本要求
    apis?: string[]              // 需要的 API
    plugins?: string[]           // 依赖的插件
    libraries?: Record<string, string>  // 第三方库依赖
  }
  
  // 生命周期钩子
  lifecycle?: {
    install?: string             // 安装脚本
    uninstall?: string           // 卸载脚本
    update?: string              // 更新脚本
    startup?: string             // 启动脚本
    shutdown?: string            // 关闭脚本
  }
  
  // 配置选项
  config?: {
    autoStart?: boolean          // 是否自动启动
    singleton?: boolean          // 是否单例应用
    background?: boolean         // 是否后台运行
    persistent?: boolean         // 是否持久化数据
  }
  
  // 国际化
  i18n?: {
    defaultLocale: string
    supportedLocales: string[]
    resources: Record<string, string>
  }
  
  // 更新配置
  update?: {
    channel?: 'stable' | 'beta' | 'alpha'
    autoUpdate?: boolean
    updateUrl?: string
  }
  
  // 安全配置
  security?: {
    csp?: string                 // 内容安全策略
    sandbox?: boolean            // 是否启用沙箱
    allowedDomains?: string[]    // 允许访问的域名
  }
}

// 应用包信息
export interface AppPackageInfo {
  manifest: AppManifest
  files: string[]                // 包含的文件列表
  size: number                   // 包大小
  checksum: string               // 校验和
  signature?: string             // 数字签名
  createdAt: number              // 创建时间
}

// 已安装应用信息
export interface InstalledAppInfo {
  manifest: AppManifest
  files: string[]                // 安装的文件列表
  installPath: string            // 安装路径
  installedAt: number            // 安装时间
  updatedAt?: number             // 更新时间
  lastUsed?: number              // 最后使用时间
  usage: {
    launchCount: number          // 启动次数
    totalRuntime: number         // 总运行时间
  }
}

// 安装结果
export interface InstallResult {
  success: boolean
  appKey?: string
  version?: string
  error?: string
  warnings?: string[]
}

// 更新结果
export interface UpdateResult {
  success: boolean
  oldVersion?: string
  newVersion?: string
  error?: string
  changelog?: string
}

// 验证结果
export interface ValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
  details?: {
    manifestValid: boolean
    filesValid: boolean
    permissionsValid: boolean
    dependenciesValid: boolean
    signatureValid?: boolean
  }
}

// 依赖检查结果
export interface DependencyCheckResult {
  satisfied: boolean
  missing: string[]
  conflicts?: string[]
  recommendations?: string[]
}

// 应用更新信息
export interface AppUpdateInfo {
  appKey: string
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  changelog?: string
  downloadUrl?: string
  size?: number
  releaseDate?: string
  critical?: boolean             // 是否为关键更新
}

// 应用商店应用信息
export interface StoreAppInfo {
  manifest: AppManifest
  screenshots: string[]          // 应用截图
  rating: number                 // 评分
  reviewCount: number            // 评论数
  downloadCount: number          // 下载数
  featured: boolean              // 是否为精选应用
  verified: boolean              // 是否为认证应用
  publishedAt: string            // 发布时间
  updatedAt: string              // 更新时间
  developer: {
    name: string
    email?: string
    website?: string
    verified: boolean
  }
  pricing: {
    type: 'free' | 'paid' | 'freemium'
    price?: number
    currency?: string
    trialDays?: number
  }
}

// 应用搜索结果
export interface AppSearchResult {
  apps: StoreAppInfo[]
  total: number
  page: number
  pageSize: number
  filters: {
    category?: string
    tags?: string[]
    rating?: number
    price?: 'free' | 'paid'
  }
}

// 应用分类信息
export interface AppCategoryInfo {
  key: string
  name: string
  description: string
  icon: string
  appCount: number
  featured: StoreAppInfo[]
}

// 应用安装选项
export interface InstallOptions {
  autoStart?: boolean            // 安装后自动启动
  createShortcut?: boolean       // 创建桌面快捷方式
  addToDock?: boolean           // 添加到 Dock
  installPath?: string          // 自定义安装路径
  skipDependencies?: boolean    // 跳过依赖检查
}

// 应用卸载选项
export interface UninstallOptions {
  keepUserData?: boolean        // 保留用户数据
  removeFromDock?: boolean      // 从 Dock 移除
  removeShortcuts?: boolean     // 移除快捷方式
}

// 应用备份信息
export interface AppBackup {
  appKey: string
  version: string
  backupId: string
  createdAt: number
  size: number
  files: string[]
  userData?: any
}

// 应用沙箱配置
export interface AppSandboxConfig {
  appKey: string
  permissions: AppPermission[]
  resourceLimits: {
    memory?: number              // 内存限制 (MB)
    storage?: number             // 存储限制 (MB)
    network?: {
      bandwidth?: number         // 带宽限制 (KB/s)
      connections?: number       // 连接数限制
    }
  }
  isolation: {
    filesystem: boolean          // 文件系统隔离
    network: boolean             // 网络隔离
    storage: boolean             // 存储隔离
  }
}

// 应用性能指标
export interface AppPerformanceMetrics {
  appKey: string
  metrics: {
    startupTime: number          // 启动时间 (ms)
    memoryUsage: number          // 内存使用 (MB)
    cpuUsage: number             // CPU 使用率 (%)
    networkUsage: number         // 网络使用 (KB)
    storageUsage: number         // 存储使用 (MB)
  }
  timestamp: number
}

// 应用错误报告
export interface AppErrorReport {
  appKey: string
  version: string
  error: {
    message: string
    stack?: string
    type: string
  }
  context: {
    userAgent: string
    url: string
    timestamp: number
    userId?: string
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 应用使用统计
export interface AppUsageStats {
  appKey: string
  period: {
    start: number
    end: number
  }
  stats: {
    launchCount: number
    totalRuntime: number         // 总运行时间 (ms)
    averageSessionTime: number   // 平均会话时间 (ms)
    crashCount: number
    errorCount: number
  }
}

// 应用配置模式
export interface AppConfigSchema {
  type: 'object'
  properties: Record<string, {
    type: string
    default?: any
    description?: string
    enum?: any[]
    minimum?: number
    maximum?: number
    pattern?: string
  }>
  required?: string[]
}

// 应用主题配置
export interface AppThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    accent: string
  }
  fonts: {
    primary: string
    secondary: string
    monospace: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// 应用快捷键配置
export interface AppShortcutConfig {
  key: string
  description: string
  combination: string[]          // 按键组合
  action: string                 // 执行的动作
  global?: boolean               // 是否为全局快捷键
}

// 应用菜单配置
export interface AppMenuConfig {
  key: string
  label: string
  icon?: string
  shortcut?: string
  action?: string
  submenu?: AppMenuConfig[]
  separator?: boolean
  disabled?: boolean
  visible?: boolean
}

// 应用通知配置
export interface AppNotificationConfig {
  title: string
  body: string
  icon?: string
  badge?: string
  sound?: string
  vibrate?: number[]
  actions?: {
    action: string
    title: string
    icon?: string
  }[]
  data?: any
  persistent?: boolean
  silent?: boolean
}

export default AppManifest
