// 应用配置统一导出
export { default as appRegistry } from './app-registry'
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
export * from './utils'