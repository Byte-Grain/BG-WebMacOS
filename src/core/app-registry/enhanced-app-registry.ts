import { dynamicComponentLoader } from '../component-loader'
import { AppDiscovery } from './app-discovery'
import type { AppConfig, AppDiscoveryConfig, AppRegistryConfig, AppCategory } from './types'

// 导入静态应用配置
import { systemApps } from '@/config/apps/system-apps'
import { customApps } from '@/config/apps/custom-apps'

/**
 * 增强的应用注册表
 * 统一管理应用的注册、发现、加载和生命周期
 */
export class EnhancedAppRegistry {
  private apps = new Map<string, AppConfig>()
  private componentMap = new Map<string, any>()
  private appDiscovery: AppDiscovery
  private initialized = false
  private config: AppRegistryConfig

  constructor(config: AppRegistryConfig = {}) {
    this.config = {
      enableStaticApps: true,
      enableDynamicApps: import.meta.env.DEV,
      enableCache: true,
      validateApps: true,
      debugMode: import.meta.env.DEV,
      ...config
    }

    // 配置应用发现器
    const discoveryConfig: AppDiscoveryConfig = {
      autoScan: this.config.enableDynamicApps || false,
      scanPaths: [
        '/src/views/apps/custom',
        '/src/applications/user-custom',
        '/src/applications/third-party'
      ],
      excludePatterns: [
        '.*\\.test\\.vue$',
        '.*\\.spec\\.vue$',
        '.*\\.story\\.vue$',
        '.*\\.d\\.ts$'
      ],
      fileExtensions: ['.vue'],
      watchMode: import.meta.env.DEV,
      cacheEnabled: this.config.enableCache,
      maxCacheAge: 5 * 60 * 1000, // 5分钟
      ...this.config.discovery
    }

    this.appDiscovery = new AppDiscovery(discoveryConfig)
  }

  /**
   * 初始化注册表
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      const startTime = performance.now()

      // 1. 注册静态配置的应用
      if (this.config.enableStaticApps) {
        this.registerStaticApps()
      }

      // 2. 发现并注册动态应用
      if (this.config.enableDynamicApps) {
        await this.discoverAndRegisterApps()
      }

      // 3. 生成组件映射
      this.generateComponentMap()

      // 4. 验证应用配置
      if (this.config.validateApps) {
        this.validateAllApps()
      }

      this.initialized = true
      const endTime = performance.now()
      
      if (this.config.debugMode) {
        console.log(`✅ Initialized app registry with ${this.apps.size} apps in ${(endTime - startTime).toFixed(2)}ms`)
        console.log('📱 Registered apps:', Array.from(this.apps.keys()))
        console.log('🧩 Component map:', dynamicComponentLoader.getCacheInfo())
      }
    } catch (error) {
      console.error('❌ Failed to initialize app registry:', error)
      throw error
    }
  }

  /**
   * 注册静态配置的应用
   */
  private registerStaticApps(): void {
    const allStaticApps = [...customApps, ...systemApps]
    
    for (const app of allStaticApps) {
      // 为静态应用添加完整的配置信息
      const enhancedApp: AppConfig = {
        category: this.inferCategoryFromKey(app.key),
        version: '1.0.0',
        author: 'System',
        description: `${app.title} application`,
        permissions: [],
        window: {
          width: app.width,
          height: app.height,
          resizable: app.resizable !== false,
          draggable: app.draggable !== false,
          closable: app.closable !== false,
          minimizable: app.minimizable !== false,
          maximizable: app.maximizable !== false
        },
        theme: {
          iconColor: app.iconColor,
          iconBgColor: app.iconBgColor,
          titleBgColor: app.titleBgColor,
          titleColor: app.titleColor
        },
        ...app
      }
      
      this.apps.set(app.key, enhancedApp)
    }
  }

  /**
   * 从应用 key 推断分类
   */
  private inferCategoryFromKey(key: string): AppCategory {
    const keyLower = key.toLowerCase()
    
    if (keyLower.startsWith('system')) return 'system'
    if (keyLower.startsWith('demo')) return 'demo'
    if (keyLower.includes('util')) return 'utilities'
    if (keyLower.includes('dev')) return 'development'
    if (keyLower.includes('game')) return 'games'
    if (keyLower.includes('media')) return 'multimedia'
    if (keyLower.includes('social')) return 'social'
    if (keyLower.includes('business')) return 'business'
    if (keyLower.includes('education')) return 'education'
    if (keyLower.includes('graphic')) return 'graphics'
    if (keyLower.includes('product')) return 'productivity'
    if (keyLower.includes('entertainment')) return 'entertainment'
    
    return 'custom'
  }

  /**
   * 发现并注册动态应用
   */
  private async discoverAndRegisterApps(): Promise<void> {
    try {
      const discoveredApps = await this.appDiscovery.discoverApps()
      
      for (const app of discoveredApps) {
        // 避免覆盖已存在的静态配置
        if (!this.apps.has(app.key)) {
          this.apps.set(app.key, app)
          
          if (this.config.debugMode) {
            console.log(`🔍 Discovered app: ${app.key} (${app.componentPath})`)
          }
        } else {
          if (this.config.debugMode) {
            console.log(`⚠️ Skipped duplicate app: ${app.key}`)
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to discover apps:', error)
    }
  }

  /**
   * 生成组件映射
   */
  private generateComponentMap(): void {
    if (this.config.debugMode) {
      console.log('🔧 Generating component map...')
    }
    
    for (const app of this.apps.values()) {
      const componentKey = app.key
      
      if (!this.componentMap.has(componentKey)) {
        // 如果app配置中直接包含component（静态导入的组件），直接使用
        if (app.component && (typeof app.component === 'object' || typeof app.component === 'function')) {
          if (this.config.debugMode) {
            console.log(`✅ Using static component for ${app.key}:`, typeof app.component)
          }
          this.componentMap.set(componentKey, app.component)
        } else {
          if (this.config.debugMode) {
            console.log(`🔄 Using dynamic loader for ${app.key}`)
          }
          // 否则使用动态加载器（向后兼容）
          const component = dynamicComponentLoader.loadComponent(app)
          this.componentMap.set(componentKey, component)
        }
      } else {
        if (this.config.debugMode) {
          console.log(`⚠️ Component already exists for ${app.key}`)
        }
      }
    }
    
    if (this.config.debugMode) {
      console.log('🔧 Component map generated:', {
        totalComponents: this.componentMap.size,
        componentKeys: Array.from(this.componentMap.keys())
      })
    }
  }

  /**
   * 验证所有应用配置
   */
  private validateAllApps(): void {
    let validCount = 0
    let invalidCount = 0

    for (const [key, app] of this.apps.entries()) {
      if (this.validateAppConfig(app)) {
        validCount++
      } else {
        invalidCount++
        console.warn(`⚠️ Invalid app config: ${key}`, app)
      }
    }

    if (this.config.debugMode) {
      console.log(`📋 App validation: ${validCount} valid, ${invalidCount} invalid`)
    }
  }

  /**
   * 验证应用配置
   */
  private validateAppConfig(app: AppConfig): boolean {
    return !!(app.key && app.title && (app.component || app.componentPath || app.outLink))
  }

  /**
   * 获取所有应用
   */
  getAllApps(): AppConfig[] {
    return Array.from(this.apps.values())
  }

  /**
   * 根据分类获取应用
   */
  getAppsByCategory(category: AppCategory): AppConfig[] {
    return this.getAllApps().filter(app => app.category === category)
  }

  /**
   * 根据 key 获取应用
   */
  getAppByKey(key: string): AppConfig | undefined {
    return this.apps.get(key)
  }

  /**
   * 获取组件映射
   */
  getComponentMap(): Record<string, any> {
    const map: Record<string, any> = {}
    
    for (const [key, component] of this.componentMap.entries()) {
      map[key] = component
    }
    
    return map
  }

  /**
   * 获取组件
   */
  getComponent(app: AppConfig): any {
    return this.componentMap.get(app.key)
  }

  /**
   * 动态注册应用
   */
  registerApp(app: AppConfig): void {
    // 确保应用配置完整
    const enhancedApp: AppConfig = {
      category: 'custom',
      version: '1.0.0',
      author: 'Unknown',
      description: `${app.title} application`,
      permissions: [],
      window: {
        resizable: true,
        draggable: true,
        closable: true,
        minimizable: true,
        maximizable: true
      },
      ...app
    }
    
    // 验证应用配置
    if (this.config.validateApps && !this.validateAppConfig(enhancedApp)) {
      throw new Error(`Invalid app config for: ${app.key}`)
    }
    
    this.apps.set(app.key, enhancedApp)
    
    // 生成组件映射
    if (!this.componentMap.has(app.key)) {
      if (app.component && (typeof app.component === 'object' || typeof app.component === 'function')) {
        this.componentMap.set(app.key, app.component)
      } else {
        const component = dynamicComponentLoader.loadComponent(enhancedApp)
        this.componentMap.set(app.key, component)
      }
    }
    
    if (this.config.debugMode) {
      console.log(`✅ Registered app: ${app.key}`)
    }
  }

  /**
   * 注销应用
   */
  unregisterApp(key: string): boolean {
    const app = this.apps.get(key)
    if (!app) {
      return false
    }

    this.apps.delete(key)
    this.componentMap.delete(key)
    
    if (this.config.debugMode) {
      console.log(`🗑️ Unregistered app: ${key}`)
    }
    return true
  }

  /**
   * 重新加载应用注册表
   */
  async reload(): Promise<void> {
    if (this.config.debugMode) {
      console.log('🔄 Reloading app registry...')
    }
    
    this.apps.clear()
    this.componentMap.clear()
    this.initialized = false
    
    // 清理组件加载器缓存
    dynamicComponentLoader.clearCache()
    
    await this.initialize()
  }

  /**
   * 预加载应用组件
   */
  async preloadApps(appKeys?: string[]): Promise<void> {
    const appsToPreload = appKeys 
      ? appKeys.map(key => this.apps.get(key)).filter(Boolean) as AppConfig[]
      : this.getAllApps()

    const preloadPromises = appsToPreload.map(app => 
      dynamicComponentLoader.preloadComponent(app)
    )

    try {
      await Promise.allSettled(preloadPromises)
      if (this.config.debugMode) {
        console.log(`🚀 Preloaded ${appsToPreload.length} apps`)
      }
    } catch (error) {
      console.warn('⚠️ Some apps failed to preload:', error)
    }
  }

  /**
   * 搜索应用
   */
  searchApps(query: string, options: { category?: AppCategory; limit?: number } = {}): AppConfig[] {
    const { category, limit = 50 } = options
    const queryLower = query.toLowerCase()
    
    let results = this.getAllApps().filter(app => {
      // 分类过滤
      if (category && app.category !== category) {
        return false
      }
      
      // 文本搜索
      return (
        app.title.toLowerCase().includes(queryLower) ||
        app.description?.toLowerCase().includes(queryLower) ||
        app.author?.toLowerCase().includes(queryLower) ||
        app.tags?.some(tag => tag.toLowerCase().includes(queryLower)) ||
        app.keywords?.some(keyword => keyword.toLowerCase().includes(queryLower))
      )
    })
    
    // 限制结果数量
    if (limit > 0) {
      results = results.slice(0, limit)
    }
    
    return results
  }

  /**
   * 获取注册表状态
   */
  getStatus() {
    const categoryStats = this.getAllApps().reduce((stats, app) => {
      const category = app.category || 'unknown'
      stats[category] = (stats[category] || 0) + 1
      return stats
    }, {} as Record<string, number>)

    return {
      initialized: this.initialized,
      totalApps: this.apps.size,
      categoryStats,
      componentCache: dynamicComponentLoader.getCacheInfo(),
      config: this.config
    }
  }

  /**
   * 获取配置
   */
  getConfig(): AppRegistryConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AppRegistryConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// 导出单例实例
export const enhancedAppRegistry = new EnhancedAppRegistry()

// 兼容性导出（保持与现有代码的兼容性）
export const getAllApps = () => enhancedAppRegistry.getAllApps()
export const getAppByKey = (key: string) => enhancedAppRegistry.getAppByKey(key)
export const registerApp = (app: AppConfig) => enhancedAppRegistry.registerApp(app)
export const unregisterApp = (key: string) => enhancedAppRegistry.unregisterApp(key)

// 新增导出
export const getAppsByCategory = (category: AppCategory) => 
  enhancedAppRegistry.getAppsByCategory(category)
export const getComponent = (app: AppConfig) => 
  enhancedAppRegistry.getComponent(app)
export const preloadApps = (appKeys?: string[]) => 
  enhancedAppRegistry.preloadApps(appKeys)
export const searchApps = (query: string, options?: { category?: AppCategory; limit?: number }) => 
  enhancedAppRegistry.searchApps(query, options)
export const getRegistryStatus = () => 
  enhancedAppRegistry.getStatus()