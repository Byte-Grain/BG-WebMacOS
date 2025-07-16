import type { AppConfig, AppDiscoveryConfig, AppCategory } from './types'

/**
 * 应用自动发现器
 * 负责扫描指定目录，自动发现和注册应用
 */
export class AppDiscovery {
  private config: AppDiscoveryConfig
  private cache = new Map<string, { apps: AppConfig[]; timestamp: number }>()

  constructor(config: AppDiscoveryConfig) {
    this.config = config
  }

  /**
   * 扫描并发现应用
   */
  async discoverApps(): Promise<AppConfig[]> {
    if (!this.config.autoScan) {
      return []
    }

    // 检查缓存
    if (this.config.cacheEnabled) {
      const cached = this.getCachedApps()
      if (cached) {
        return cached
      }
    }

    const discoveredApps: AppConfig[] = []

    try {
      if (import.meta.env.DEV) {
        const apps = await this.scanPathDev()
        discoveredApps.push(...apps)
      } else {
        const apps = await this.scanPathProd()
        discoveredApps.push(...apps)
      }

      // 缓存结果
      if (this.config.cacheEnabled) {
        this.cacheApps(discoveredApps)
      }
    } catch (error) {
      console.warn('Failed to discover apps:', error)
    }

    return discoveredApps
  }

  /**
   * 开发环境扫描
   */
  private async scanPathDev(): Promise<AppConfig[]> {
    const apps: AppConfig[] = []
    
    try {
      // 使用 Vite 的 import.meta.glob 动态导入
      const modules = import.meta.glob('/src/views/apps/**/*.vue', {
        eager: false
      })

      // 扫描新的应用目录
      const newModules = import.meta.glob('/src/applications/**/*.vue', {
        eager: false
      })

      // 合并模块
      const allModules = { ...modules, ...newModules }

      for (const [filePath, moduleLoader] of Object.entries(allModules)) {
        if (this.shouldIncludeFile(filePath)) {
          try {
            const app = await this.extractAppConfig(filePath, moduleLoader)
            if (app) {
              apps.push(app)
            }
          } catch (error) {
            console.warn(`Failed to extract app config from: ${filePath}`, error)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to scan apps in dev mode:', error)
    }

    return apps
  }

  /**
   * 生产环境扫描
   */
  private async scanPathProd(): Promise<AppConfig[]> {
    // 在生产环境中，尝试加载预生成的应用清单
    try {
      const manifestModule = await import('/app-manifest.json')
      const manifest = manifestModule.default || manifestModule
      
      if (manifest && Array.isArray(manifest.apps)) {
        return manifest.apps.map((app: any) => this.normalizeAppConfig(app))
      }
    } catch (error) {
      console.warn('Failed to load app manifest, falling back to empty array:', error)
    }
    
    return []
  }

  /**
   * 检查文件是否应该包含
   */
  private shouldIncludeFile(filePath: string): boolean {
    // 检查文件扩展名
    const hasValidExtension = this.config.fileExtensions.some(ext => 
      filePath.endsWith(ext)
    )
    
    if (!hasValidExtension) {
      return false
    }

    // 检查是否在扫描路径中
    const inScanPath = this.config.scanPaths.some(scanPath => 
      filePath.includes(scanPath)
    )
    
    if (!inScanPath) {
      return false
    }

    // 检查排除模式
    const isExcluded = this.config.excludePatterns.some(pattern => 
      new RegExp(pattern).test(filePath)
    )

    return !isExcluded
  }

  /**
   * 从文件中提取应用配置
   */
  private async extractAppConfig(
    filePath: string, 
    moduleLoader: () => Promise<any>
  ): Promise<AppConfig | null> {
    try {
      const module = await moduleLoader()
      
      // 检查组件是否导出了应用配置
      if (module.default?.appConfig) {
        return this.normalizeAppConfig({
          ...module.default.appConfig,
          componentPath: filePath
        })
      }

      // 检查是否有独立的 appConfig 导出
      if (module.appConfig) {
        return this.normalizeAppConfig({
          ...module.appConfig,
          componentPath: filePath
        })
      }

      // 如果没有配置，尝试从文件路径推断
      return this.inferAppConfigFromPath(filePath)
    } catch (error) {
      console.warn(`Failed to load module: ${filePath}`, error)
      return null
    }
  }

  /**
   * 从文件路径推断应用配置
   */
  private inferAppConfigFromPath(filePath: string): AppConfig | null {
    const pathParts = filePath.split('/')
    const fileName = pathParts[pathParts.length - 1].replace('.vue', '')
    
    // 获取分类信息
    const category = this.inferCategoryFromPath(filePath)

    // 生成应用 key（确保唯一性）
    const key = this.generateUniqueKey(fileName, category)

    return this.normalizeAppConfig({
      key,
      component: fileName,
      componentPath: filePath,
      title: this.formatTitle(fileName),
      icon: this.getDefaultIcon(category),
      category,
      version: '1.0.0',
      author: 'Auto-discovered',
      description: `Auto-discovered ${category} app: ${fileName}`,
      permissions: [],
      window: {
        width: 800,
        height: 600,
        resizable: true,
        draggable: true,
        closable: true,
        minimizable: true,
        maximizable: true
      }
    })
  }

  /**
   * 从路径推断应用分类
   */
  private inferCategoryFromPath(filePath: string): AppCategory {
    const pathLower = filePath.toLowerCase()
    
    if (pathLower.includes('/system/')) return 'system'
    if (pathLower.includes('/demo/')) return 'demo'
    if (pathLower.includes('/utilities/')) return 'utilities'
    if (pathLower.includes('/productivity/')) return 'productivity'
    if (pathLower.includes('/entertainment/')) return 'entertainment'
    if (pathLower.includes('/development/')) return 'development'
    if (pathLower.includes('/education/')) return 'education'
    if (pathLower.includes('/business/')) return 'business'
    if (pathLower.includes('/graphics/')) return 'graphics'
    if (pathLower.includes('/multimedia/')) return 'multimedia'
    if (pathLower.includes('/social/')) return 'social'
    if (pathLower.includes('/games/')) return 'games'
    if (pathLower.includes('/built-in/')) return 'system'
    if (pathLower.includes('/third-party/')) return 'custom'
    if (pathLower.includes('/user-custom/')) return 'custom'
    if (pathLower.includes('/marketplace/')) return 'custom'
    
    return 'custom'
  }

  /**
   * 生成唯一的应用 key
   */
  private generateUniqueKey(fileName: string, category: AppCategory): string {
    // 使用分类前缀确保唯一性
    const prefix = category === 'custom' ? 'app' : category
    const formattedName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
    const timestamp = Date.now().toString(36).slice(-4)
    return `${prefix}_${formattedName}_${timestamp}`
  }

  /**
   * 格式化标题
   */
  private formatTitle(fileName: string): string {
    return fileName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * 获取默认图标
   */
  private getDefaultIcon(category: AppCategory): string {
    const iconMap: Record<AppCategory, string> = {
      system: '⚙️',
      utilities: '🔧',
      productivity: '📊',
      entertainment: '🎮',
      development: '💻',
      education: '📚',
      business: '💼',
      graphics: '🎨',
      multimedia: '🎵',
      social: '💬',
      games: '🎯',
      demo: '🧪',
      custom: '📱'
    }
    
    return iconMap[category] || '📱'
  }

  /**
   * 标准化应用配置
   */
  private normalizeAppConfig(config: Partial<AppConfig>): AppConfig {
    return {
      key: config.key || `app_${Date.now()}`,
      title: config.title || 'Untitled App',
      icon: config.icon || '📱',
      category: config.category || 'custom',
      version: config.version || '1.0.0',
      author: config.author || 'Unknown',
      description: config.description || '',
      permissions: config.permissions || [],
      window: {
        width: 800,
        height: 600,
        resizable: true,
        draggable: true,
        closable: true,
        minimizable: true,
        maximizable: true,
        ...config.window
      },
      theme: {
        iconColor: '#fff',
        iconBgColor: '#007AFF',
        ...config.theme
      },
      ...config
    } as AppConfig
  }

  /**
   * 获取缓存的应用
   */
  private getCachedApps(): AppConfig[] | null {
    if (!this.config.cacheEnabled || !this.config.maxCacheAge) {
      return null
    }

    const cacheKey = this.getCacheKey()
    const cached = this.cache.get(cacheKey)
    
    if (!cached) {
      return null
    }

    const now = Date.now()
    if (now - cached.timestamp > this.config.maxCacheAge) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached.apps
  }

  /**
   * 缓存应用列表
   */
  private cacheApps(apps: AppConfig[]): void {
    if (!this.config.cacheEnabled) {
      return
    }

    const cacheKey = this.getCacheKey()
    this.cache.set(cacheKey, {
      apps: [...apps],
      timestamp: Date.now()
    })
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(): string {
    return JSON.stringify({
      scanPaths: this.config.scanPaths,
      excludePatterns: this.config.excludePatterns,
      fileExtensions: this.config.fileExtensions
    })
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    return {
      enabled: this.config.cacheEnabled,
      size: this.cache.size,
      maxAge: this.config.maxCacheAge
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AppDiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    // 清理缓存，因为配置已更改
    this.clearCache()
  }

  /**
   * 获取配置
   */
  getConfig(): AppDiscoveryConfig {
    return { ...this.config }
  }
}
