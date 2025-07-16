import { defineAsyncComponent, AsyncComponentLoader, Component } from 'vue'
import type { AppConfig } from '../app-registry/types'
import type {
  ComponentLoaderConfig,
  ComponentCache,
  ComponentLoadResult,
  ComponentPreloadOptions,
  ComponentLoadStats,
  ComponentPathResolution
} from './types'

/**
 * 增强版动态组件加载器
 * 支持缓存、预加载、错误处理、统计等功能
 */
export class DynamicComponentLoader {
  private config: ComponentLoaderConfig
  private componentCache = new Map<string, ComponentCache>()
  private loadingPromises = new Map<string, Promise<Component>>()
  private stats: ComponentLoadStats = {
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    loadFailures: 0,
    averageLoadTime: 0,
    cacheHitRate: 0
  }
  private loadTimes: number[] = []

  constructor(config?: Partial<ComponentLoaderConfig>) {
    this.config = {
      cacheEnabled: true,
      maxCacheSize: 50,
      cacheExpiration: 30 * 60 * 1000, // 30分钟
      preloadEnabled: true,
      preloadDelay: 1000,
      searchPaths: [
        '@/applications',
        '@/components/apps',
        '@/applications',
        '@/views/desktop/system'
      ],
      fileExtensions: ['.vue', '.js', '.ts'],
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    }

    // 定期清理过期缓存
    this.startCacheCleanup()
  }

  /**
   * 根据应用配置加载组件
   */
  loadComponent(app: AppConfig): AsyncComponentLoader {
    const componentKey = this.getComponentKey(app)
    
    // 检查缓存
    if (this.config.cacheEnabled && this.componentCache.has(componentKey)) {
      const cached = this.componentCache.get(componentKey)!
      
      // 检查缓存是否过期
      if (!this.isCacheExpired(cached)) {
        this.updateCacheAccess(cached)
        this.stats.cacheHits++
        return () => Promise.resolve(cached.component)
      } else {
        this.componentCache.delete(componentKey)
      }
    }

    // 如果正在加载，返回现有的 Promise
    if (this.loadingPromises.has(componentKey)) {
      return () => this.loadingPromises.get(componentKey)!
    }

    // 创建异步组件加载器
    return defineAsyncComponent({
      loader: () => this.createComponentLoader(app),
      loadingComponent: () => import('@/components/common/Loading.vue'),
      errorComponent: () => import('@/components/common/AppError.vue'),
      delay: 200,
      timeout: 10000
    })
  }

  /**
   * 创建组件加载器
   */
  private async createComponentLoader(app: AppConfig): Promise<Component> {
    const componentKey = this.getComponentKey(app)
    const startTime = Date.now()
    
    // 创建加载 Promise
    const loadingPromise = this.tryLoadFromPaths(app)
    this.loadingPromises.set(componentKey, loadingPromise)
    
    try {
      const component = await loadingPromise
      const loadTime = Date.now() - startTime
      
      // 更新统计
      this.updateLoadStats(loadTime, false)
      
      // 缓存组件
      if (this.config.cacheEnabled) {
        this.cacheComponent(componentKey, component, loadTime)
      }
      
      return component
    } catch (error) {
      this.stats.loadFailures++
      console.error(`Failed to load component for app: ${app.key}`, error)
      throw error
    } finally {
      // 清理加载 Promise
      this.loadingPromises.delete(componentKey)
    }
  }

  /**
   * 尝试从多个路径加载组件（支持重试）
   */
  private async tryLoadFromPaths(app: AppConfig): Promise<Component> {
    const pathResolution = this.resolvePossiblePaths(app)
    let lastError: Error | null = null
    
    for (const path of pathResolution.paths) {
      for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
        try {
          const module = await import(/* @vite-ignore */ path)
          const component = module.default || module
          
          if (component) {
            return component
          }
        } catch (error) {
          lastError = error as Error
          
          // 如果不是最后一次尝试，等待后重试
          if (attempt < this.config.retryAttempts - 1) {
            await this.delay(this.config.retryDelay)
          }
        }
      }
    }
    
    throw new Error(
      `Component not found for app: ${app.key}. Tried paths: ${pathResolution.paths.join(', ')}. Last error: ${lastError?.message}`
    )
  }

  /**
   * 解析可能的组件路径
   */
  private resolvePossiblePaths(app: AppConfig): ComponentPathResolution {
    const paths: string[] = []
    const componentName = app.component || app.key
    
    // 1. 如果配置中指定了完整路径（最高优先级）
    if (app.componentPath) {
      paths.push(app.componentPath)
    }
    
    // 2. 根据应用分类和搜索路径生成路径
    for (const searchPath of this.config.searchPaths) {
      if (app.category) {
        // 分类路径
        paths.push(`${searchPath}/${app.category}/${componentName}.vue`)
        paths.push(`${searchPath}/${app.category}/${app.key}.vue`)
        
        // 子分类路径（如 built-in/system）
        if (app.category === 'system') {
          paths.push(`${searchPath}/built-in/system/${componentName}.vue`)
          paths.push(`${searchPath}/built-in/system/${app.key}.vue`)
        }
      }
      
      // 通用路径
      paths.push(`${searchPath}/${componentName}.vue`)
      paths.push(`${searchPath}/${app.key}.vue`)
    }
    
    // 3. 兼容旧路径结构
    if (app.category === 'system') {
      paths.push(`@/views/desktop/system/${componentName}.vue`)
      paths.push(`@/views/desktop/system/${app.key}.vue`)
    }
    
    // 4. 支持其他文件扩展名
    const vueOnlyPaths = [...paths]
    for (const ext of this.config.fileExtensions) {
      if (ext !== '.vue') {
        for (const vuePath of vueOnlyPaths) {
          paths.push(vuePath.replace('.vue', ext))
        }
      }
    }
    
    // 去重并确定首选路径
    const uniquePaths = [...new Set(paths)]
    const preferredPath = app.componentPath || uniquePaths[0]
    
    return {
      paths: uniquePaths,
      preferredPath,
      strategy: app.componentPath ? 'exact' : 'inferred'
    }
  }

  /**
   * 预加载组件
   */
  async preloadComponent(app: AppConfig): Promise<ComponentLoadResult> {
    if (!this.config.preloadEnabled) {
      return {
        success: false,
        error: 'Preloading is disabled',
        loadTime: 0,
        fromCache: false
      }
    }

    const startTime = Date.now()
    
    try {
      const component = await this.createComponentLoader(app)
      const loadTime = Date.now() - startTime
      
      return {
        success: true,
        component,
        loadTime,
        fromCache: false
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        loadTime: Date.now() - startTime,
        fromCache: false
      }
    }
  }

  /**
   * 批量预加载组件
   */
  async preloadComponents(options: ComponentPreloadOptions): Promise<ComponentLoadResult[]> {
    if (!this.config.preloadEnabled) {
      return []
    }

    const { apps, parallel, concurrency, strategy } = options
    
    if (strategy === 'on-demand') {
      return [] // 按需加载，不预加载
    }

    // 延迟预加载
    if (strategy === 'lazy') {
      await this.delay(this.config.preloadDelay)
    }

    if (parallel) {
      // 并行加载（限制并发数）
      const results: ComponentLoadResult[] = []
      const chunks = this.chunkArray(apps, concurrency)
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(app => this.preloadComponent(app))
        )
        results.push(...chunkResults)
      }
      
      return results
    } else {
      // 串行加载
      const results: ComponentLoadResult[] = []
      for (const app of apps) {
        const result = await this.preloadComponent(app)
        results.push(result)
      }
      return results
    }
  }

  /**
   * 缓存组件
   */
  private cacheComponent(key: string, component: Component, loadTime: number): void {
    // 检查缓存大小限制
    if (this.componentCache.size >= this.config.maxCacheSize) {
      this.evictLeastRecentlyUsed()
    }

    const cacheItem: ComponentCache = {
      component,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size: this.estimateComponentSize(component)
    }

    this.componentCache.set(key, cacheItem)
  }

  /**
   * 更新缓存访问信息
   */
  private updateCacheAccess(cached: ComponentCache): void {
    cached.accessCount++
    cached.lastAccessed = Date.now()
  }

  /**
   * 检查缓存是否过期
   */
  private isCacheExpired(cached: ComponentCache): boolean {
    return Date.now() - cached.timestamp > this.config.cacheExpiration
  }

  /**
   * 驱逐最少使用的缓存项
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey = ''
    let lruTime = Date.now()
    
    for (const [key, cached] of this.componentCache.entries()) {
      if (cached.lastAccessed < lruTime) {
        lruTime = cached.lastAccessed
        lruKey = key
      }
    }
    
    if (lruKey) {
      this.componentCache.delete(lruKey)
    }
  }

  /**
   * 估算组件大小
   */
  private estimateComponentSize(component: Component): number {
    // 简单的大小估算，实际实现可能更复杂
    return JSON.stringify(component).length
  }

  /**
   * 更新加载统计
   */
  private updateLoadStats(loadTime: number, fromCache: boolean): void {
    this.stats.totalLoads++
    
    if (fromCache) {
      this.stats.cacheHits++
    } else {
      this.stats.cacheMisses++
      this.loadTimes.push(loadTime)
      
      // 计算平均加载时间
      this.stats.averageLoadTime = 
        this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length
    }
    
    // 计算缓存命中率
    this.stats.cacheHitRate = this.stats.cacheHits / this.stats.totalLoads
  }

  /**
   * 获取组件键
   */
  private getComponentKey(app: AppConfig): string {
    return app.component || app.key
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * 启动缓存清理
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, cached] of this.componentCache.entries()) {
      if (now - cached.timestamp > this.config.cacheExpiration) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.componentCache.delete(key))
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    this.componentCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo() {
    const cacheItems = Array.from(this.componentCache.entries()).map(([key, cached]) => ({
      key,
      timestamp: cached.timestamp,
      accessCount: cached.accessCount,
      lastAccessed: cached.lastAccessed,
      size: cached.size
    }))

    return {
      cachedComponents: this.componentCache.size,
      loadingComponents: this.loadingPromises.size,
      cacheKeys: Array.from(this.componentCache.keys()),
      cacheItems,
      maxCacheSize: this.config.maxCacheSize,
      cacheExpiration: this.config.cacheExpiration
    }
  }

  /**
   * 获取加载统计
   */
  getLoadStats(): ComponentLoadStats {
    return { ...this.stats }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalLoads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      loadFailures: 0,
      averageLoadTime: 0,
      cacheHitRate: 0
    }
    this.loadTimes = []
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ComponentLoaderConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取配置
   */
  getConfig(): ComponentLoaderConfig {
    return { ...this.config }
  }
}

// 导出单例实例
export const dynamicComponentLoader = new DynamicComponentLoader()
