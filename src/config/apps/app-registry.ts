import { AppRegistry } from './types'
import { systemApps } from './system-apps'
import { demoApps } from './demo-apps'

// 应用注册表
export const appRegistry: AppRegistry = {
  system: Object.values(systemApps),
  demo: Object.values(demoApps),
  user: [], // 用户自定义应用，暂时为空
}

// 获取所有应用
export const getAllApps = () => {
  return [
    ...appRegistry.system,
    ...appRegistry.demo,
    ...appRegistry.user,
  ]
}

// 获取系统应用
export const getSystemApps = () => {
  return appRegistry.system
}

// 获取演示应用
export const getDemoApps = () => {
  return appRegistry.demo
}

// 获取用户应用
export const getUserApps = () => {
  return appRegistry.user
}

// 根据 key 获取应用
export const getAppByKey = (key: string) => {
  const allApps = getAllApps()
  return allApps.find(app => app.key === key)
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
  
  appRegistry[type].push(config)
  return config
}

// 注销应用
export const unregisterApp = (key: string, type: 'system' | 'demo' | 'user' = 'user') => {
  const index = appRegistry[type].findIndex(app => app.key === key)
  if (index === -1) {
    throw new Error(`App with key '${key}' not found in ${type} registry`)
  }
  
  appRegistry[type].splice(index, 1)
  return true
}

// 更新应用配置
export const updateAppConfig = (key: string, updates: Partial<any>, type?: 'system' | 'demo' | 'user') => {
  let targetType = type
  
  if (!targetType) {
    // 自动查找应用所在的注册表
    if (appRegistry.system.find(app => app.key === key)) targetType = 'system'
    else if (appRegistry.demo.find(app => app.key === key)) targetType = 'demo'
    else if (appRegistry.user.find(app => app.key === key)) targetType = 'user'
    else throw new Error(`App with key '${key}' not found`)
  }
  
  const index = appRegistry[targetType].findIndex(app => app.key === key)
  if (index === -1) {
    throw new Error(`App with key '${key}' not found in ${targetType} registry`)
  }
  
  appRegistry[targetType][index] = {
    ...appRegistry[targetType][index],
    ...updates,
  }
  
  return appRegistry[targetType][index]
}

export default appRegistry