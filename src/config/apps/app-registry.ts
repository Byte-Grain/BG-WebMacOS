import { AppRegistry } from './types'
import { systemApps } from './system-apps'
import { demoApps } from './demo-apps'
import { loadAppsFromJson, validateJsonConfig as validateJson } from './json-config-loader'

// 是否使用JSON配置
const USE_JSON_CONFIG = true

// 从JSON加载的应用注册表
let jsonAppRegistry: AppRegistry | null = null

// 获取应用注册表
function getAppRegistry(): AppRegistry {
  if (USE_JSON_CONFIG) {
    if (!jsonAppRegistry) {
      try {
        jsonAppRegistry = loadAppsFromJson()
        console.log('✅ 成功从JSON配置加载应用')
      } catch (error) {
        console.error('❌ JSON配置加载失败，回退到TypeScript配置:', error)
        // 回退到原始的TypeScript配置
        return {
          system: Object.values(systemApps),
          demo: Object.values(demoApps),
          user: []
        }
      }
    }
    return jsonAppRegistry
  } else {
    // 使用原始的TypeScript配置
    return {
      system: Object.values(systemApps),
      demo: Object.values(demoApps),
      user: []
    }
  }
}

// 应用注册表
export const appRegistry: AppRegistry = getAppRegistry()

// 获取所有应用
export const getAllApps = () => {
  const registry = getAppRegistry()
  return [
    ...Object.values(registry.system),
    ...Object.values(registry.demo),
    ...Object.values(registry.user),
  ]
}

// 获取系统应用
export const getSystemApps = () => {
  const registry = getAppRegistry()
  return Object.values(registry.system)
}

// 获取演示应用
export const getDemoApps = () => {
  const registry = getAppRegistry()
  return Object.values(registry.demo)
}

// 获取用户应用
export const getUserApps = () => {
  const registry = getAppRegistry()
  return Object.values(registry.user)
}

// 根据 key 获取应用
export const getAppByKey = (key: string) => {
  const registry = getAppRegistry()
  
  // 在系统应用中查找
  if (registry.system[key]) {
    return registry.system[key]
  }
  
  // 在演示应用中查找
  if (registry.demo[key]) {
    return registry.demo[key]
  }
  
  // 在用户应用中查找
  if (registry.user[key]) {
    return registry.user[key]
  }
  
  return undefined
}

// 根据分类获取应用
export const getAppsByCategory = (category: string) => {
  const allApps = getAllApps()
  return allApps.filter(app => app.category === category)
}

// 获取桌面应用（不隐藏的应用）
export const getDesktopApps = () => {
  const allApps = getAllApps()
  return allApps.filter(app => !app.hideInDesktop)
}

// 获取 Dock 应用
export const getDockApps = () => {
  const allApps = getAllApps()
  return allApps.filter(app => app.keepInDock)
}

// 获取特色应用
export const getFeaturedApps = () => {
  const demoApps = getDemoApps()
  return demoApps.filter(app => 'featured' in app && app.featured)
}

// 搜索应用
export const searchApps = (query: string) => {
  const allApps = getAllApps()
  const lowerQuery = query.toLowerCase()
  
  return allApps.filter(app => {
    return (
      app.title.toLowerCase().includes(lowerQuery) ||
      app.description?.toLowerCase().includes(lowerQuery) ||
      app.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      app.category?.toLowerCase().includes(lowerQuery)
    )
  })
}

// 验证应用配置
export const validateAppConfig = (config: any): boolean => {
  if (!config.key || !config.title || !config.icon) {
    return false
  }
  
  if (config.outLink && !config.url) {
    return false
  }
  
  if (config.innerLink && !config.url) {
    return false
  }
  
  if (!config.outLink && !config.innerLink && !config.component) {
    return false
  }
  
  return true
}

// 注册新应用
export const registerApp = (config: any, type: 'system' | 'demo' | 'user' = 'user') => {
  if (!validateAppConfig(config)) {
    throw new Error('Invalid app configuration')
  }
  
  if (getAppByKey(config.key)) {
    throw new Error(`App with key '${config.key}' already exists`)
  }
  
  const registry = getAppRegistry()
  registry[type][config.key] = config
  
  // 如果使用JSON配置，更新缓存
  if (USE_JSON_CONFIG && jsonAppRegistry) {
    jsonAppRegistry[type][config.key] = config
  }
  
  return config
}

// 注销应用
export const unregisterApp = (key: string, type: 'system' | 'demo' | 'user' = 'user') => {
  const registry = getAppRegistry()
  
  if (!registry[type][key]) {
    throw new Error(`App with key '${key}' not found in ${type} registry`)
  }
  
  delete registry[type][key]
  
  // 如果使用JSON配置，更新缓存
  if (USE_JSON_CONFIG && jsonAppRegistry) {
    delete jsonAppRegistry[type][key]
  }
  
  return true
}

// 更新应用配置
export const updateAppConfig = (key: string, updates: Partial<any>, type?: 'system' | 'demo' | 'user') => {
  const registry = getAppRegistry()
  let targetType = type
  
  if (!targetType) {
    // 自动查找应用所在的注册表
    if (registry.system[key]) targetType = 'system'
    else if (registry.demo[key]) targetType = 'demo'
    else if (registry.user[key]) targetType = 'user'
    else throw new Error(`App with key '${key}' not found`)
  }
  
  if (!registry[targetType][key]) {
    throw new Error(`App with key '${key}' not found in ${targetType} registry`)
  }
  
  registry[targetType][key] = {
    ...registry[targetType][key],
    ...updates,
  }
  
  // 如果使用JSON配置，更新缓存
  if (USE_JSON_CONFIG && jsonAppRegistry) {
    jsonAppRegistry[targetType][key] = registry[targetType][key]
  }
  
  return registry[targetType][key]
}

// 重新加载配置
export const reloadConfig = () => {
  if (USE_JSON_CONFIG) {
    jsonAppRegistry = null
    return getAppRegistry()
  }
  return appRegistry
}

// 切换配置模式
export const toggleConfigMode = (useJson: boolean) => {
  // 注意：这个函数需要重新启动应用才能生效
  console.log(`配置模式切换为: ${useJson ? 'JSON' : 'TypeScript'}`)
  console.log('请重新启动应用以应用更改')
}

// 验证JSON配置
export const validateJsonConfig = () => {
  if (!USE_JSON_CONFIG) {
    return true
  }
  return validateJson()
}

// 获取配置信息
export const getConfigInfo = () => {
  return {
    mode: USE_JSON_CONFIG ? 'JSON' : 'TypeScript',
    isJsonValid: USE_JSON_CONFIG ? validateJsonConfig() : true,
    totalApps: getAllApps().length,
    systemApps: getSystemApps().length,
    demoApps: getDemoApps().length,
    userApps: getUserApps().length
  }
}

export default appRegistry