import { dynamicComponentLoader } from '@core/component-loader/dynamicComponentLoader'
import { AppDiscovery, type AppDiscoveryConfig } from '@/utils/appDiscovery'
import type { AppConfig } from '@/types/app.d'

import { systemApps } from './system-apps'
import { customApps } from './custom-apps'

/**
 * 增强的应用注册表
 */
class EnhancedAppRegistry {
  private apps = new Map<string, AppConfig>()
  private componentMap = new Map<string, any>()
  private appDiscovery: AppDiscovery
  private initialized = false

  constructor() {
    // 配置应用发现器
    const discoveryConfig: AppDiscoveryConfig = {
      autoScan: import.meta.env.DEV, // 仅在开发环境启用自动扫描
      scanPaths: [
        '/src/views/apps/custom',
      ],
      excludePatterns: [
        '.*\\.test\\.vue$',
        '.*\\.spec\\.vue$',
        '.*\\.story\\.vue$',
        '.*\\.d\\.ts$'
      ],
      fileExtensions: ['.vue']
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
      // 1. 注册静态配置的应用
      this.registerStaticApps()

      // 2. 跳过动态应用发现，只使用静态导入
      // await this.discoverAndRegisterApps()

      // 3. 生成组件映射
      this.generateComponentMap()

      this.initialized = true
      console.log(`✅ Initialized app registry with ${this.apps.size} apps`)
      
      // 输出调试信息
      if (import.meta.env.DEV) {
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
    const allStaticApps = [...customApps,...systemApps]
    
    for (const app of allStaticApps) {
      // 为静态应用添加分类信息
      const enhancedApp: AppConfig = {
        ...app,
        category: app.category || this.inferCategoryFromKey(app.key),
        version: app.version || '1.0.0',
        author: app.author || 'System',
        description: app.description || `${app.title} application`,
        permissions: app.permissions || []
      }
      
      this.apps.set(app.key, enhancedApp)
    }
  }

  /**
   * 从应用 key 推断分类
   */
  private inferCategoryFromKey(key: string): 'system' | 'demo' | 'custom' {
    if (key.toLowerCase().startsWith('system')) {
      return 'system'
    } else if (key.toLowerCase().startsWith('demo')) {
      return 'demo'
    }
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
          
          if (import.meta.env.DEV) {
            console.log(`🔍 Discovered app: ${app.key} (${app.componentPath})`)
          }
        } else {
          if (import.meta.env.DEV) {
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
    console.log('🔧 Generating component map...')
    
    for (const app of this.apps.values()) {
      const componentKey = app.key // 使用 app.key 作为组件映射的键
      
      if (!this.componentMap.has(componentKey)) {
        // 如果app配置中直接包含component（静态导入的组件），直接使用
        if (app.component && (typeof app.component === 'object' || typeof app.component === 'function')) {
          console.log(`✅ Using static component for ${app.key}:`, typeof app.component)
          this.componentMap.set(componentKey, app.component)
        } else {
          console.log(`🔄 Using dynamic loader for ${app.key}`)
          // 否则使用动态加载器（向后兼容）
          const component = dynamicComponentLoader.loadComponent(app)
          this.componentMap.set(componentKey, component)
        }
      } else {
        console.log(`⚠️ Component already exists for ${app.key}`)
      }
    }
    
    console.log('🔧 Component map generated:', {
      totalComponents: this.componentMap.size,
      componentKeys: Array.from(this.componentMap.keys())
    })
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
  getAppsByCategory(category: 'system' | 'demo' | 'custom'): AppConfig[] {
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
    const componentKey = app.key // 使用 app.key 作为组件映射的键
    return this.componentMap.get(componentKey)
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
      ...app
    }
    
    this.apps.set(app.key, enhancedApp)
    
    // 生成组件映射
    const componentKey = app.key // 使用 app.key 作为组件映射的键
    if (!this.componentMap.has(componentKey)) {
      // 如果app配置中直接包含component（静态导入的组件），直接使用
      if (app.component && (typeof app.component === 'object' || typeof app.component === 'function')) {
        this.componentMap.set(componentKey, app.component)
      } else {
        // 否则使用动态加载器（向后兼容）
        const component = dynamicComponentLoader.loadComponent(enhancedApp)
        this.componentMap.set(componentKey, component)
      }
    }
    
    console.log(`✅ Registered app: ${app.key}`)
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
    
    const componentKey = app.key // 使用 app.key 作为组件映射的键
    this.componentMap.delete(componentKey)
    
    console.log(`🗑️ Unregistered app: ${key}`)
    return true
  }

  /**
   * 重新加载应用注册表
   */
  async reload(): Promise<void> {
    console.log('🔄 Reloading app registry...')
    
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
      console.log(`🚀 Preloaded ${appsToPreload.length} apps`)
    } catch (error) {
      console.warn('⚠️ Some apps failed to preload:', error)
    }
  }

  /**
   * 获取注册表状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalApps: this.apps.size,
      systemApps: this.getAppsByCategory('system').length,
      demoApps: this.getAppsByCategory('demo').length,
      customApps: this.getAppsByCategory('custom').length,
      componentCache: dynamicComponentLoader.getCacheInfo()
    }
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
export const getAppsByCategory = (category: 'system' | 'demo' | 'custom') => 
  enhancedAppRegistry.getAppsByCategory(category)
export const getComponent = (app: AppConfig) => 
  enhancedAppRegistry.getComponent(app)
export const preloadApps = (appKeys?: string[]) => 
  enhancedAppRegistry.preloadApps(appKeys)
export const getRegistryStatus = () => 
  enhancedAppRegistry.getStatus()
