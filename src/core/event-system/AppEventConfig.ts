/**
 * 应用事件系统配置
 * 统一管理事件系统的配置参数和默认设置
 */

// 事件系统配置接口
export interface AppEventSystemConfig {
  // 权限配置
  permissions: {
    // 默认权限策略
    defaultPolicy: 'allow' | 'deny'
    // 权限检查超时时间（毫秒）
    checkTimeout: number
    // 临时权限默认过期时间（毫秒）
    tempPermissionTTL: number
    // 权限缓存大小
    cacheSize: number
  }
  
  // 监控配置
  monitoring: {
    // 是否启用监控
    enabled: boolean
    // 统计数据保留时间（毫秒）
    dataRetentionTime: number
    // 性能监控采样率（0-1）
    samplingRate: number
    // 异常检测阈值
    anomalyThresholds: {
      errorRate: number
      avgDuration: number
      eventFrequency: number
    }
    // 统计数据清理间隔（毫秒）
    cleanupInterval: number
  }
  
  // 事件总线配置
  eventBus: {
    // 最大监听器数量
    maxListeners: number
    // 事件队列大小
    queueSize: number
    // 事件处理超时时间（毫秒）
    processingTimeout: number
    // 是否启用事件去重
    enableDeduplication: boolean
    // 去重时间窗口（毫秒）
    deduplicationWindow: number
  }
  
  // 跨应用通信配置
  crossApp: {
    // 通信超时时间（毫秒）
    timeout: number
    // 最大重试次数
    maxRetries: number
    // 重试间隔（毫秒）
    retryInterval: number
    // 消息队列大小
    messageQueueSize: number
  }
  
  // 生命周期配置
  lifecycle: {
    // 应用启动超时时间（毫秒）
    startupTimeout: number
    // 应用关闭超时时间（毫秒）
    shutdownTimeout: number
    // 健康检查间隔（毫秒）
    healthCheckInterval: number
    // 僵尸应用检测间隔（毫秒）
    zombieDetectionInterval: number
  }
  
  // 调试配置
  debug: {
    // 是否启用调试模式
    enabled: boolean
    // 日志级别
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    // 是否记录事件详情
    logEventDetails: boolean
    // 是否记录性能指标
    logPerformance: boolean
  }
}

// 默认配置
export const DEFAULT_APP_EVENT_CONFIG: AppEventSystemConfig = {
  permissions: {
    defaultPolicy: 'deny',
    checkTimeout: 1000,
    tempPermissionTTL: 5 * 60 * 1000, // 5分钟
    cacheSize: 1000
  },
  
  monitoring: {
    enabled: true,
    dataRetentionTime: 24 * 60 * 60 * 1000, // 24小时
    samplingRate: 1.0,
    anomalyThresholds: {
      errorRate: 0.1, // 10%
      avgDuration: 1000, // 1秒
      eventFrequency: 100 // 每秒100个事件
    },
    cleanupInterval: 60 * 60 * 1000 // 1小时
  },
  
  eventBus: {
    maxListeners: 100,
    queueSize: 1000,
    processingTimeout: 5000,
    enableDeduplication: true,
    deduplicationWindow: 1000
  },
  
  crossApp: {
    timeout: 3000,
    maxRetries: 3,
    retryInterval: 1000,
    messageQueueSize: 100
  },
  
  lifecycle: {
    startupTimeout: 10000,
    shutdownTimeout: 5000,
    healthCheckInterval: 30000,
    zombieDetectionInterval: 60000
  },
  
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    logEventDetails: process.env.NODE_ENV === 'development',
    logPerformance: process.env.NODE_ENV === 'development'
  }
}

// 配置管理器
export class AppEventConfigManager {
  private static instance: AppEventConfigManager
  private config: AppEventSystemConfig
  
  private constructor(initialConfig?: Partial<AppEventSystemConfig>) {
    this.config = this.mergeConfig(DEFAULT_APP_EVENT_CONFIG, initialConfig || {})
  }
  
  static getInstance(initialConfig?: Partial<AppEventSystemConfig>): AppEventConfigManager {
    if (!AppEventConfigManager.instance) {
      AppEventConfigManager.instance = new AppEventConfigManager(initialConfig)
    }
    return AppEventConfigManager.instance
  }
  
  // 获取完整配置
  getConfig(): AppEventSystemConfig {
    return { ...this.config }
  }
  
  // 获取特定配置项
  getPermissionsConfig() {
    return { ...this.config.permissions }
  }
  
  getMonitoringConfig() {
    return { ...this.config.monitoring }
  }
  
  getEventBusConfig() {
    return { ...this.config.eventBus }
  }
  
  getCrossAppConfig() {
    return { ...this.config.crossApp }
  }
  
  getLifecycleConfig() {
    return { ...this.config.lifecycle }
  }
  
  getDebugConfig() {
    return { ...this.config.debug }
  }
  
  // 更新配置
  updateConfig(updates: Partial<AppEventSystemConfig>): void {
    this.config = this.mergeConfig(this.config, updates)
  }
  
  // 重置为默认配置
  resetToDefault(): void {
    this.config = { ...DEFAULT_APP_EVENT_CONFIG }
  }
  
  // 验证配置
  validateConfig(config: Partial<AppEventSystemConfig>): boolean {
    try {
      // 验证权限配置
      if (config.permissions) {
        const { defaultPolicy, checkTimeout, tempPermissionTTL, cacheSize } = config.permissions
        if (defaultPolicy && !['allow', 'deny'].includes(defaultPolicy)) {
          throw new Error('Invalid defaultPolicy')
        }
        if (checkTimeout && (checkTimeout < 0 || checkTimeout > 10000)) {
          throw new Error('Invalid checkTimeout')
        }
        if (tempPermissionTTL && (tempPermissionTTL < 1000 || tempPermissionTTL > 24 * 60 * 60 * 1000)) {
          throw new Error('Invalid tempPermissionTTL')
        }
        if (cacheSize && (cacheSize < 10 || cacheSize > 10000)) {
          throw new Error('Invalid cacheSize')
        }
      }
      
      // 验证监控配置
      if (config.monitoring) {
        const { samplingRate, anomalyThresholds } = config.monitoring
        if (samplingRate && (samplingRate < 0 || samplingRate > 1)) {
          throw new Error('Invalid samplingRate')
        }
        if (anomalyThresholds) {
          const { errorRate, avgDuration, eventFrequency } = anomalyThresholds
          if (errorRate && (errorRate < 0 || errorRate > 1)) {
            throw new Error('Invalid errorRate threshold')
          }
          if (avgDuration && avgDuration < 0) {
            throw new Error('Invalid avgDuration threshold')
          }
          if (eventFrequency && eventFrequency < 0) {
            throw new Error('Invalid eventFrequency threshold')
          }
        }
      }
      
      return true
    } catch (error) {
      console.error('Config validation failed:', error)
      return false
    }
  }
  
  // 深度合并配置
  private mergeConfig(
    target: AppEventSystemConfig,
    source: Partial<AppEventSystemConfig>
  ): AppEventSystemConfig {
    const result = { ...target }
    
    for (const key in source) {
      const sourceValue = source[key as keyof AppEventSystemConfig]
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        result[key as keyof AppEventSystemConfig] = {
          ...target[key as keyof AppEventSystemConfig],
          ...sourceValue
        } as any
      } else if (sourceValue !== undefined) {
        result[key as keyof AppEventSystemConfig] = sourceValue as any
      }
    }
    
    return result
  }
}

// 获取配置管理器实例
export function getAppEventConfig(initialConfig?: Partial<AppEventSystemConfig>): AppEventConfigManager {
  return AppEventConfigManager.getInstance(initialConfig)
}

// 配置预设
export const CONFIG_PRESETS = {
  // 开发环境配置
  development: {
    permissions: {
      defaultPolicy: 'allow' as const,
      checkTimeout: 500
    },
    monitoring: {
      enabled: true,
      samplingRate: 1.0,
      dataRetentionTime: 60 * 60 * 1000 // 1小时
    },
    debug: {
      enabled: true,
      logLevel: 'debug' as const,
      logEventDetails: true,
      logPerformance: true
    }
  },
  
  // 生产环境配置
  production: {
    permissions: {
      defaultPolicy: 'deny' as const,
      checkTimeout: 1000
    },
    monitoring: {
      enabled: true,
      samplingRate: 0.1,
      dataRetentionTime: 7 * 24 * 60 * 60 * 1000 // 7天
    },
    debug: {
      enabled: false,
      logLevel: 'error' as const,
      logEventDetails: false,
      logPerformance: false
    }
  },
  
  // 测试环境配置
  testing: {
    permissions: {
      defaultPolicy: 'allow' as const,
      checkTimeout: 100
    },
    monitoring: {
      enabled: false,
      samplingRate: 0,
      dataRetentionTime: 5 * 60 * 1000 // 5分钟
    },
    debug: {
      enabled: true,
      logLevel: 'warn' as const,
      logEventDetails: false,
      logPerformance: false
    }
  }
} as const