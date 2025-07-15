import type { AppConfig } from '@/types/app.d'

/**
 * 应用发现配置
 */
export interface AppDiscoveryConfig {
  autoScan: boolean           // 是否启用自动扫描
  scanPaths: string[]         // 扫描路径
  excludePatterns: string[]   // 排除模式
  fileExtensions: string[]    // 文件扩展名
}

/**
 * 应用自动发现器
 */
export class AppDiscovery {
  private config: AppDiscoveryConfig

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

    const discoveredApps: AppConfig[] = []

    try {
      if (import.meta.env.DEV) {
        const apps = await this.scanPathDev()
        discoveredApps.push(...apps)
      } else {
        const apps = await this.scanPathProd()
        discoveredApps.push(...apps)
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

      for (const [filePath, moduleLoader] of Object.entries(modules)) {
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
    // 在生产环境中，暂时返回空数组
    // TODO: 实现预生成的清单文件机制
    console.warn('Production app discovery not implemented yet, returning empty array')
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
        return {
          ...module.default.appConfig,
          componentPath: filePath
        }
      }

      // 检查是否有独立的 appConfig 导出
      if (module.appConfig) {
        return {
          ...module.appConfig,
          componentPath: filePath
        }
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
    
    // 获取最后一级文件夹名称
    const category = pathParts[pathParts.length - 2]

    // 生成应用 key（确保唯一性）
    const key = this.generateUniqueKey(fileName, category)

    return {
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
      // 默认尺寸
      width: 800,
      height: 600,
      resizable: true
    } as AppConfig
  }

  /**
   * 生成唯一的应用 key
   */
  private generateUniqueKey(fileName: string, category: string): string {
    // 使用分类前缀确保唯一性
    const prefix = category.charAt(0).toUpperCase() + category.slice(1)
    const formattedName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
    return `${prefix}${formattedName}`
  }

  /**
   * 格式化标题
   */
  private formatTitle(fileName: string): string {
    return fileName
      .split(/[-_]/)  // 按连字符或下划线分割
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * 获取默认图标
   */
  private getDefaultIcon(category: string): string {
    const iconMap = {
      system: '/icons/system-app.png',
      demo: '/icons/demo-app.png',
      custom: '/icons/custom-app.png'
    }
    
    return iconMap[category as keyof typeof iconMap] || '/icons/default-app.png'
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AppDiscoveryConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AppDiscoveryConfig {
    return { ...this.config }
  }
}