/**
 * 应用服务层 - 管理应用的业务逻辑
 */
import { appConfig } from '@/config/app.config'
import type { AppConfiguration } from '@/types/app'

export class AppService {
  /**
   * 根据应用key获取应用配置
   */
  static getAppByKey(key: string): AppConfiguration | undefined {
    return appConfig.apps.find(app => app.key === key)
  }

  /**
   * 获取所有应用
   */
  static getAllApps(): AppConfiguration[] {
    return appConfig.apps
  }

  /**
   * 获取Dock应用列表
   */
  static getDockApps(): AppConfiguration[] {
    return appConfig.dockApps
  }

  /**
   * 获取系统应用
   */
  static getSystemApps(): AppConfiguration[] {
    return appConfig.apps.filter(app => app.category === 'system')
  }

  /**
   * 获取演示应用
   */
  static getDemoApps(): AppConfiguration[] {
    return appConfig.apps.filter(app => app.category === 'demo')
  }

  /**
   * 检查应用是否存在
   */
  static appExists(key: string): boolean {
    return appConfig.apps.some(app => app.key === key)
  }

  /**
   * 获取应用图标URL
   */
  static getAppIcon(app: AppConfiguration): string {
    return app.icon || '/default-app-icon.png'
  }

  /**
   * 检查应用是否可以调整大小
   */
  static canResize(app: AppConfiguration): boolean {
    return !app.disableResize
  }

  /**
   * 检查应用是否可以关闭
   */
  static canClose(app: AppConfiguration): boolean {
    return !app.unclose
  }

  /**
   * 检查应用是否应该保持在Dock中
   */
  static shouldKeepInDock(app: AppConfiguration): boolean {
    return app.keepInDock || false
  }

  /**
   * 检查应用是否应该隐藏桌面
   */
  static shouldHideDesktop(app: AppConfiguration): boolean {
    return app.hideDesktop || false
  }

  /**
   * 获取应用的默认尺寸
   */
  static getDefaultSize(app: AppConfiguration): { width?: number; height?: number } {
    return {
      width: app.width,
      height: app.height
    }
  }

  /**
   * 生成应用实例ID
   */
  static generatePid(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证应用配置
   */
  static validateAppConfig(app: Partial<AppConfiguration>): boolean {
    return !!(app.key && app.title && app.component)
  }

  /**
   * 格式化应用标题
   */
  static formatAppTitle(app: AppConfiguration, customTitle?: string): string {
    return customTitle || app.title
  }

  /**
   * 获取应用分类显示名称
   */
  static getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      system: '系统应用',
      demo: '演示应用',
      utility: '实用工具',
      entertainment: '娱乐应用',
      productivity: '效率工具',
      development: '开发工具'
    }
    return categoryMap[category] || category
  }

  /**
   * 搜索应用
   */
  static searchApps(query: string): AppConfiguration[] {
    const lowercaseQuery = query.toLowerCase()
    return appConfig.apps.filter(app => 
      app.title.toLowerCase().includes(lowercaseQuery) ||
      app.key.toLowerCase().includes(lowercaseQuery) ||
      (app.description && app.description.toLowerCase().includes(lowercaseQuery))
    )
  }

  /**
   * 按分类分组应用
   */
  static groupAppsByCategory(): Record<string, AppConfiguration[]> {
    return appConfig.apps.reduce((groups, app) => {
      const category = app.category || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(app)
      return groups
    }, {} as Record<string, AppConfiguration[]>)
  }
}