/**
 * 应用注册系统核心模块
 * 统一管理应用的注册、发现和加载
 */

export { EnhancedAppRegistry } from './enhanced-app-registry'
export { AppDiscovery } from './app-discovery'
export { AppConfigValidator } from './app-validator'
export { AppCategoryManager } from './app-category-manager'
export type {
  AppConfig,
  AppCategory,
  AppPermission,
  AppMenu,
  AppWindowConfig,
  AppThemeConfig,
  AppLifecycleHooks,
  AppState,
  AppDiscoveryConfig,
  AppRegistryConfig,
  AppValidationResult,
  AppSearchOptions,
  AppSearchResult
} from './types'

// 导出单例实例
export { enhancedAppRegistry } from './enhanced-app-registry'

// 兼容性导出
export { enhancedAppRegistry as appRegistry } from './enhanced-app-registry'