// 应用配置统一导出
export { default as appRegistry, getAllApps, getSystemApps, getDemoApps, getUserApps, getAppByKey, getAppsByCategory, getDesktopApps, getDockApps, getFeaturedApps, searchApps, validateAppConfig, registerApp, unregisterApp, updateAppConfig } from './app-registry'
export { default as systemApps } from './system-apps'
export { default as demoApps } from './demo-apps'
export { default as appDefaults } from './app-defaults'

export type {
  AppConfig,
  AppRegistry,
  SystemAppConfig,
  DemoAppConfig,
} from './types'

// 应用配置工具函数
// export * from './utils' // utils.ts 文件不存在，暂时注释