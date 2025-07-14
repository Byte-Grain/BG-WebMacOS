import type { AppRegistry, AppConfig, SystemAppConfig, DemoAppConfig } from './types'
import appsConfigJson from './apps.json'

/**
 * JSON配置加载器
 * 负责从JSON文件加载应用配置并转换为TypeScript类型
 */
class JsonConfigLoader {
  private config: any
  private loadedApps: AppRegistry | null = null

  constructor() {
    this.config = appsConfigJson
  }

  /**
   * 验证配置文件格式
   */
  private validateConfig(): boolean {
    if (!this.config) {
      console.error('配置文件为空')
      return false
    }

    if (!this.config.version) {
      console.error('配置文件缺少版本信息')
      return false
    }

    if (!this.config.system || !this.config.demo || !this.config.user) {
      console.error('配置文件缺少必要的应用分类')
      return false
    }

    return true
  }

  /**
   * 合并默认配置
   */
  private mergeDefaults(appConfig: any): any {
    const defaults = this.config.defaults || {}
    return {
      ...defaults,
      ...appConfig,
      // 确保关键字段不被默认值覆盖
      key: appConfig.key,
      title: appConfig.title,
      icon: appConfig.icon
    }
  }

  /**
   * 转换系统应用配置
   */
  private transformSystemApp(key: string, config: any): SystemAppConfig {
    const merged = this.mergeDefaults(config)
    return {
      ...merged,
      key,
      system: true,
      essential: merged.essential ?? false,
      singleton: merged.singleton ?? false
    } as SystemAppConfig
  }

  /**
   * 转换演示应用配置
   */
  private transformDemoApp(key: string, config: any): DemoAppConfig {
    const merged = this.mergeDefaults(config)
    return {
      ...merged,
      key,
      demo: true,
      featured: merged.featured ?? false
    } as DemoAppConfig
  }

  /**
   * 转换用户应用配置
   */
  private transformUserApp(key: string, config: any): AppConfig {
    const merged = this.mergeDefaults(config)
    return {
      ...merged,
      key
    } as AppConfig
  }

  /**
   * 加载所有应用配置
   */
  public loadApps(): AppRegistry {
    if (this.loadedApps) {
      return this.loadedApps
    }

    if (!this.validateConfig()) {
      throw new Error('配置文件验证失败')
    }

    const registry: AppRegistry = {
      system: {},
      demo: {},
      user: {}
    }

    // 加载系统应用
    for (const [key, config] of Object.entries(this.config.system)) {
      registry.system[key] = this.transformSystemApp(key, config)
    }

    // 加载演示应用
    for (const [key, config] of Object.entries(this.config.demo)) {
      registry.demo[key] = this.transformDemoApp(key, config)
    }

    // 加载用户应用
    for (const [key, config] of Object.entries(this.config.user)) {
      registry.user[key] = this.transformUserApp(key, config)
    }

    this.loadedApps = registry
    return registry
  }

  /**
   * 获取配置版本
   */
  public getVersion(): string {
    return this.config.version || '1.0.0'
  }

  /**
   * 获取配置描述
   */
  public getDescription(): string {
    return this.config.description || 'WebMacOS应用配置'
  }

  /**
   * 获取最后更新时间
   */
  public getLastUpdated(): string {
    return this.config.lastUpdated || new Date().toISOString()
  }

  /**
   * 重新加载配置
   */
  public reload(): AppRegistry {
    this.loadedApps = null
    return this.loadApps()
  }

  /**
   * 验证单个应用配置
   */
  public validateAppConfig(config: any): boolean {
    if (!config.key || !config.title || !config.icon) {
      console.error('应用配置缺少必要字段: key, title, icon')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(config.key)) {
      console.error('应用key格式不正确，只能包含字母、数字和下划线')
      return false
    }

    return true
  }

  /**
   * 获取应用统计信息
   */
  public getStats(): {
    total: number
    system: number
    demo: number
    user: number
    version: string
  } {
    const apps = this.loadApps()
    return {
      total: Object.keys(apps.system).length + Object.keys(apps.demo).length + Object.keys(apps.user).length,
      system: Object.keys(apps.system).length,
      demo: Object.keys(apps.demo).length,
      user: Object.keys(apps.user).length,
      version: this.getVersion()
    }
  }
}

// 创建单例实例
export const jsonConfigLoader = new JsonConfigLoader()

// 导出加载函数
export function loadAppsFromJson(): AppRegistry {
  return jsonConfigLoader.loadApps()
}

// 导出验证函数
export function validateJsonConfig(): boolean {
  try {
    jsonConfigLoader.loadApps()
    return true
  } catch (error) {
    console.error('JSON配置验证失败:', error)
    return false
  }
}

// 导出统计信息
export function getConfigStats() {
  return jsonConfigLoader.getStats()
}