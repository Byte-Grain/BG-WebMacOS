// 应用配置统一导出 - 使用新的增强应用注册表
import { enhancedAppRegistry as registry } from './enhanced-app-registry'
export { enhancedAppRegistry, getAppByKey } from './enhanced-app-registry'
export { default as systemApps } from './system-apps'
export { default as demoApps } from './demo-apps'
export { default as appDefaults } from './app-defaults'
export { customApps, dynamicAppConfig } from './custom-apps'

export type {
  AppConfig,
  AppRegistry,
  SystemAppConfig,
  DemoAppConfig,
} from './types'

// 兼容性导出 - 使用增强应用注册表的方法
export const getAllApps = () => {
  try {
    return registry.getAllApps()
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for all apps')
    return []
  }
}
export const getSystemApps = () => {
  try {
    return registry.getAppsByCategory('system')
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for system apps')
    return []
  }
}
export const getDemoApps = () => {
  try {
    return registry.getAppsByCategory('demo')
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for demo apps')
    return []
  }
}
export const getUserApps = () => {
  try {
    return registry.getAppsByCategory('custom')
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for user apps')
    return []
  }
}
export const getAppsByCategory = (category: string) => {
  try {
    return registry.getAppsByCategory(category)
  } catch (error) {
    console.warn(`App registry not initialized yet, returning empty array for category: ${category}`)
    return []
  }
}
export const getDesktopApps = () => {
  try {
    return registry.getAllApps().filter(app => !app.hideInDesktop)
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for desktop apps')
    return []
  }
}
export const getDockApps = () => {
  try {
    return registry.getAllApps().filter(app => app.keepInDock)
  } catch (error) {
    console.warn('------App registry not initialized yet, returning empty array for dock apps');
    return []
  }
}
export const getFeaturedApps = () => {
  try {
    return registry.getAppsByCategory('demo').filter(app => 'featured' in app && app.featured)
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for featured apps')
    return []
  }
}
export const searchApps = (query: string) => {
  try {
    const allApps = registry.getAllApps()
    const lowerQuery = query.toLowerCase()
    return allApps.filter(app => {
      return (
        app.title.toLowerCase().includes(lowerQuery) ||
        app.description?.toLowerCase().includes(lowerQuery) ||
        app.category?.toLowerCase().includes(lowerQuery)
      )
    })
  } catch (error) {
    console.warn('App registry not initialized yet, returning empty array for search')
    return []
  }
}
export const registerApp = (config: any) => {
  try {
    return registry.registerApp(config)
  } catch (error) {
    console.warn('App registry not initialized yet, cannot register app')
    return false
  }
}
export const unregisterApp = (key: string) => {
  try {
    return registry.unregisterApp(key)
  } catch (error) {
    console.warn('App registry not initialized yet, cannot unregister app')
    return false
  }
}
export const updateAppConfig = (key: string, updates: any) => {
  try {
    const app = registry.getAppByKey(key)
    if (app) {
      return registry.registerApp({ ...app, ...updates })
    }
    throw new Error(`App with key '${key}' not found`)
  } catch (error) {
    console.warn('App registry not initialized yet, cannot update app config')
    return false
  }
}
export const validateAppConfig = (config: any): boolean => {
  return !!(config.key && config.title && config.icon)
}

// 保持向后兼容
export const appRegistry = {
  system: {},
  demo: {},
  user: {}
}