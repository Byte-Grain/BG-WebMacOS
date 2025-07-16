import { HTTP_STATUS, DEFAULTS } from '@/constants'

// 环境类型
export type Environment = 'development' | 'production' | 'test'

// 环境配置接口
export interface EnvConfig {
  env: Environment
  debug: boolean
  apiBaseUrl: string
  enableErrorReporter: boolean
  enableDevTools: boolean
  enableMockData: boolean
  features: {
    pwa: boolean
    analytics: boolean
    errorTracking: boolean
    performanceMonitoring: boolean
  }
  api: {
    timeout: number
    retryCount: number
    retryDelay: number
  }
  storage: {
    prefix: string
    enableEncryption: boolean
  }
  performance: {
    enableLazyLoading: boolean
    enableCodeSplitting: boolean
    enableImageOptimization: boolean
  }
}

// 开发环境配置
const developmentConfig: EnvConfig = {
  env: 'development',
  debug: true,
  apiBaseUrl: 'http://localhost:3000/api',
  enableErrorReporter: false,
  enableDevTools: true,
  enableMockData: true,
  features: {
    pwa: false,
    analytics: false,
    errorTracking: false,
    performanceMonitoring: true,
  },
  api: {
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,
  },
  storage: {
    prefix: 'macos_dev_',
    enableEncryption: false,
  },
  performance: {
    enableLazyLoading: false,
    enableCodeSplitting: false,
    enableImageOptimization: false,
  },
}

// 生产环境配置
const productionConfig: EnvConfig = {
  env: 'production',
  debug: false,
  apiBaseUrl: 'https://api.example.com',
  enableErrorReporter: true,
  enableDevTools: false,
  enableMockData: false,
  features: {
    pwa: true,
    analytics: true,
    errorTracking: true,
    performanceMonitoring: true,
  },
  api: {
    timeout: 5000,
    retryCount: 2,
    retryDelay: 2000,
  },
  storage: {
    prefix: 'macos_',
    enableEncryption: true,
  },
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableImageOptimization: true,
  },
}

// 测试环境配置
const testConfig: EnvConfig = {
  env: 'test',
  debug: true,
  apiBaseUrl: 'http://localhost:3001/api',
  enableErrorReporter: false,
  enableDevTools: true,
  enableMockData: true,
  features: {
    pwa: false,
    analytics: false,
    errorTracking: false,
    performanceMonitoring: false,
  },
  api: {
    timeout: 5000,
    retryCount: 1,
    retryDelay: 500,
  },
  storage: {
    prefix: 'macos_test_',
    enableEncryption: false,
  },
  performance: {
    enableLazyLoading: false,
    enableCodeSplitting: false,
    enableImageOptimization: false,
  },
}

// 环境配置映射
const configs = {
  development: developmentConfig,
  production: productionConfig,
  test: testConfig,
}

// 获取当前环境
export const getCurrentEnv = (): Environment => {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development'
    }
    if (hostname.includes('test') || hostname.includes('staging')) {
      return 'test'
    }
    return 'production'
  }
  
  // Node.js 环境
  const nodeEnv = process.env.NODE_ENV as Environment
  return nodeEnv || 'development'
}

// 获取当前环境配置
export const getEnvConfig = (): EnvConfig => {
  const env = getCurrentEnv()
  return configs[env]
}

// 通用配置（不依赖环境）
export const commonConfig = {
  app: {
    name: 'macOS Web UI',
    version: '1.0.0',
    description: 'A web-based macOS interface',
  },
  httpStatus: HTTP_STATUS,
  defaults: DEFAULTS,
  messages: {
    defaultError: '请求服务器失败，请稍后再试',
    networkError: '网络连接失败，请检查网络设置',
    timeoutError: '请求超时，请稍后再试',
    unknownError: '未知错误，请联系管理员',
  },
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxUsernameLength: 50,
    minPasswordLength: 6,
  },
}

// 功能开关检查函数
export const isFeatureEnabled = (feature: keyof EnvConfig['features']): boolean => {
  const config = getEnvConfig()
  return config.features[feature]
}

// 调试模式检查
export const isDebugMode = (): boolean => {
  return getEnvConfig().debug
}

// 开发环境检查
export const isDevelopment = (): boolean => {
  return getCurrentEnv() === 'development'
}

// 生产环境检查
export const isProduction = (): boolean => {
  return getCurrentEnv() === 'production'
}

// 测试环境检查
export const isTest = (): boolean => {
  return getCurrentEnv() === 'test'
}

// 导出当前配置
export const config = getEnvConfig()
export const envConfig = getEnvConfig()

export default {
  config,
  envConfig,
  commonConfig,
  getCurrentEnv,
  getEnvConfig,
  isFeatureEnabled,
  isDebugMode,
  isDevelopment,
  isProduction,
  isTest,
}
