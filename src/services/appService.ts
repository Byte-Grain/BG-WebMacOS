/**
 * 应用服务层 - 管理应用的业务逻辑
 */
import { getAllApps, getAppByKey, getDockApps, getSystemApps, getDemoApps, searchApps } from '@/config/apps/app-registry'
import type { AppConfig } from '@/config/apps/types'

export class AppService {
  /**
   * 根据应用key获取应用配置
   */
  static getAppByKey(key: string): AppConfig | undefined {
    return getAppByKey(key)
  }

  /**
   * 获取所有应用
   */
  static getAllApps(): AppConfig[] {
    return getAllApps()
  }

  /**
   * 获取Dock应用列表
   */
  static getDockApps(): AppConfig[] {
    return getDockApps()
  }

  /**
   * 获取系统应用
   */
  static getSystemApps(): AppConfig[] {
    return getSystemApps()
  }

  /**
   * 获取演示应用
   */
  static getDemoApps(): AppConfig[] {
    return getDemoApps()
  }

  /**
   * 检查应用是否存在
   */
  static appExists(key: string): boolean {
    return !!getAppByKey(key)
  }

  /**
   * 获取应用图标URL
   */
  static getAppIcon(app: AppConfig): string {
    return app.icon || '/default-app-icon.png'
  }

  /**
   * 检查应用是否可以调整大小
   */
  static canResize(app: AppConfig): boolean {
    return app.resizable !== false
  }

  /**
   * 检查应用是否可以关闭
   */
  static canClose(app: AppConfig): boolean {
    return app.closable !== false
  }

  /**
   * 检查应用是否应该保持在Dock中
   */
  static shouldKeepInDock(app: AppConfig): boolean {
    return app.keepInDock || false
  }

  /**
   * 检查应用是否应该隐藏桌面
   */
  static shouldHideDesktop(app: AppConfig): boolean {
    return app.hideInDesktop || false
  }

  /**
   * 获取应用的默认尺寸
   */
  static getDefaultSize(app: AppConfig): { width?: number; height?: number } {
    return {
      width: typeof app.width === 'number' ? app.width : undefined,
      height: typeof app.height === 'number' ? app.height : undefined
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
  static validateAppConfig(app: Partial<AppConfig>): boolean {
    return !!(app.key && app.title && (app.component || ('outLink' in app && app.outLink) || ('innerLink' in app && app.innerLink)))
  }

  /**
   * 格式化应用标题
   */
  static formatAppTitle(app: AppConfig, customTitle?: string): string {
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
  static searchApps(query: string): AppConfig[] {
    return searchApps(query)
  }

  /**
   * 按分类分组应用
   */
  static groupAppsByCategory(): Record<string, AppConfig[]> {
    const allApps = getAllApps()
    return allApps.reduce((groups, app) => {
      const category = app.category || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(app)
      return groups
    }, {} as Record<string, AppConfig[]>)
  }
}