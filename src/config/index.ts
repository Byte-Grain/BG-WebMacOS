/**
 * 配置管理模块统一导出
 * 提供系统配置、应用配置、主题配置和环境配置的统一访问接口
 */

// 系统配置
export * from './system'
export { default as systemConfig } from './system/system.config'
export { menuConfig } from './system/menu.config'
export { shortcutConfig } from './system/shortcut.config'
export { windowConfig, WINDOW_PRESETS, WINDOW_Z_INDEX, WINDOW_STATES, WINDOW_TYPES } from './system/window.config'

// 应用配置
export * from './apps'
export { enhancedAppRegistry, getAllApps, getSystemApps, getDemoApps, getUserApps, getAppByKey, getAppsByCategory, getDesktopApps, getDockApps, getFeaturedApps, searchApps, validateAppConfig, registerApp, unregisterApp, updateAppConfig, appRegistry } from './apps'
// 旧的静态应用导出已移除，现在使用增强应用注册表
export { appDefaults } from './apps/app-defaults'

// 主题配置
export * from './theme.config'
export { lightTheme, darkTheme, themes, defaultTheme, generateCSSVariables, applyTheme, getSystemTheme, themeUtils } from './theme.config'

// 环境配置
export * from './env.config'
export { developmentConfig, productionConfig, testConfig, getCurrentEnv, getEnvConfig, isFeatureEnabled, isDebugMode, isDevelopment, isProduction, commonConfig } from './env.config'

// 配置工具函数
export const configUtils = {
  // 获取完整配置
  getFullConfig: () => ({
    system: systemConfig,
    apps: appRegistry,
    theme: themes,
    env: getEnvConfig(),
  }),
  
  // 验证配置完整性
  validateConfig: () => {
    const errors: string[] = []
    
    // 验证系统配置
    if (!systemConfig.version) {
      errors.push('System version is required')
    }
    
    // 验证应用配置
    if (appRegistry.system.length === 0) {
      errors.push('At least one system app is required')
    }
    
    // 验证主题配置
    if (!themes.light || !themes.dark) {
      errors.push('Light and dark themes are required')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  },
  
  // 重置配置到默认值
  resetToDefaults: () => {
    // 这里可以实现重置逻辑
    console.warn('Reset to defaults not implemented yet')
  },
}

// 默认导出配置工具
export default configUtils
