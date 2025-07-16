import type { Component } from 'vue'
import type { AppConfig } from '@core/app-registry/types'

/**
 * 组件加载器配置
 */
export interface ComponentLoaderConfig {
  /** 是否启用组件缓存 */
  cacheEnabled: boolean
  /** 缓存最大大小 */
  maxCacheSize: number
  /** 缓存过期时间（毫秒） */
  cacheExpiration: number
  /** 是否启用预加载 */
  preloadEnabled: boolean
  /** 预加载延迟时间（毫秒） */
  preloadDelay: number
  /** 组件搜索路径 */
  searchPaths: string[]
  /** 组件文件扩展名 */
  fileExtensions: string[]
  /** 错误重试次数 */
  retryAttempts: number
  /** 重试延迟时间（毫秒） */
  retryDelay: number
}

/**
 * 组件缓存项
 */
export interface ComponentCache {
  /** 组件实例 */
  component: Component
  /** 缓存时间戳 */
  timestamp: number
  /** 访问次数 */
  accessCount: number
  /** 最后访问时间 */
  lastAccessed: number
  /** 组件大小（估算） */
  size: number
}

/**
 * 组件加载结果
 */
export interface ComponentLoadResult {
  /** 是否成功 */
  success: boolean
  /** 组件实例 */
  component?: Component
  /** 错误信息 */
  error?: string
  /** 加载时间（毫秒） */
  loadTime: number
  /** 是否来自缓存 */
  fromCache: boolean
  /** 组件路径 */
  componentPath?: string
}

/**
 * 组件预加载选项
 */
export interface ComponentPreloadOptions {
  /** 预加载的应用配置列表 */
  apps: AppConfig[]
  /** 是否并行加载 */
  parallel: boolean
  /** 并发数量限制 */
  concurrency: number
  /** 预加载优先级 */
  priority: 'high' | 'normal' | 'low'
  /** 预加载策略 */
  strategy: 'eager' | 'lazy' | 'on-demand'
}

/**
 * 组件加载统计
 */
export interface ComponentLoadStats {
  /** 总加载次数 */
  totalLoads: number
  /** 缓存命中次数 */
  cacheHits: number
  /** 缓存未命中次数 */
  cacheMisses: number
  /** 加载失败次数 */
  loadFailures: number
  /** 平均加载时间 */
  averageLoadTime: number
  /** 缓存命中率 */
  cacheHitRate: number
}

/**
 * 组件路径解析结果
 */
export interface ComponentPathResolution {
  /** 解析的路径列表 */
  paths: string[]
  /** 首选路径 */
  preferredPath: string
  /** 解析策略 */
  strategy: 'exact' | 'inferred' | 'fallback'
}
