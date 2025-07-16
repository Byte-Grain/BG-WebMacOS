/**
 * 内置中间件集合
 * 提供常用的事件处理中间件
 */

import type { MiddlewareFunction, MiddlewareConfig, MiddlewareContext } from './useEventMiddleware'
import type { EventName, EventData } from './useEventBus'

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 缓存配置
export interface CacheConfig {
  maxSize: number
  ttl: number // 生存时间（毫秒）
  enabled: boolean
}

// 限流配置
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // 时间窗口（毫秒）
  enabled: boolean
}

// 验证配置
export interface ValidationConfig {
  required: string[]
  schema?: Record<string, any>
  enabled: boolean
}

// 性能监控配置
export interface PerformanceConfig {
  slowThreshold: number // 慢事件阈值（毫秒）
  enabled: boolean
}

/**
 * 日志中间件
 */
export function createLoggerMiddleware(
  level: LogLevel = 'info',
  customLogger?: (level: LogLevel, message: string, context: any) => void
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  const logger = customLogger || ((level, message, context) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, context)
        break
      case 'info':
        console.info(logMessage, context)
        break
      case 'warn':
        console.warn(logMessage, context)
        break
      case 'error':
        console.error(logMessage, context)
        break
    }
  })

  return {
    config: {
      name: 'logger',
      type: 'before',
      priority: 1000,
      enabled: true
    },
    handler: async (context, next) => {
      const startTime = performance.now()
      
      logger(level, `Event triggered: ${context.eventName}`, {
        eventData: context.eventData,
        source: context.source,
        metadata: context.metadata
      })

      await next()

      const duration = performance.now() - startTime
      logger(level, `Event completed: ${context.eventName} (${duration.toFixed(2)}ms)`, {
        duration
      })
    }
  }
}

/**
 * 验证中间件
 */
export function createValidationMiddleware(
  validationConfig: ValidationConfig
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  return {
    config: {
      name: 'validator',
      type: 'before',
      priority: 900,
      enabled: validationConfig.enabled,
      condition: () => validationConfig.enabled
    },
    handler: async (context, next) => {
      // 检查必需字段
      if (validationConfig.required) {
        for (const field of validationConfig.required) {
          if (!(field in (context.eventData as any))) {
            throw new Error(`Required field '${field}' is missing in event data`)
          }
        }
      }

      // 简单的 schema 验证
      if (validationConfig.schema) {
        const data = context.eventData as any
        for (const [key, expectedType] of Object.entries(validationConfig.schema)) {
          if (key in data) {
            const actualType = typeof data[key]
            if (actualType !== expectedType) {
              throw new Error(`Field '${key}' expected type '${expectedType}' but got '${actualType}'`)
            }
          }
        }
      }

      await next()
    }
  }
}

/**
 * 缓存中间件
 */
export function createCacheMiddleware(
  cacheConfig: CacheConfig
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  const cache = new Map<string, { data: any; timestamp: number }>()
  
  // 定期清理过期缓存
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > cacheConfig.ttl) {
        cache.delete(key)
      }
    }
  }, Math.min(cacheConfig.ttl, 60000)) // 最多每分钟清理一次

  return {
    config: {
      name: 'cache',
      type: 'before',
      priority: 800,
      enabled: cacheConfig.enabled,
      condition: () => cacheConfig.enabled
    },
    handler: async (context, next) => {
      const cacheKey = `${context.eventName}_${JSON.stringify(context.eventData)}`
      const now = Date.now()
      
      // 检查缓存
      const cached = cache.get(cacheKey)
      if (cached && (now - cached.timestamp) < cacheConfig.ttl) {
        // 使用缓存数据
        context.metadata = { ...context.metadata, fromCache: true, cachedData: cached.data }
        return
      }

      // 执行事件处理
      await next()

      // 缓存结果（如果缓存未满）
      if (cache.size < cacheConfig.maxSize) {
        cache.set(cacheKey, {
          data: context.eventData,
          timestamp: now
        })
      }
    }
  }
}

/**
 * 限流中间件
 */
export function createRateLimitMiddleware(
  rateLimitConfig: RateLimitConfig
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  const requests = new Map<string, number[]>()

  return {
    config: {
      name: 'rateLimiter',
      type: 'before',
      priority: 950,
      enabled: rateLimitConfig.enabled,
      condition: () => rateLimitConfig.enabled
    },
    handler: async (context, next) => {
      const key = context.eventName
      const now = Date.now()
      const windowStart = now - rateLimitConfig.windowMs
      
      // 获取当前事件的请求记录
      let eventRequests = requests.get(key) || []
      
      // 清理过期请求
      eventRequests = eventRequests.filter(timestamp => timestamp > windowStart)
      
      // 检查是否超过限制
      if (eventRequests.length >= rateLimitConfig.maxRequests) {
        throw new Error(`Rate limit exceeded for event '${key}'. Max ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.windowMs}ms`)
      }
      
      // 记录当前请求
      eventRequests.push(now)
      requests.set(key, eventRequests)
      
      await next()
    }
  }
}

/**
 * 性能监控中间件
 */
export function createPerformanceMiddleware(
  performanceConfig: PerformanceConfig,
  onSlowEvent?: (eventName: string, duration: number, context: MiddlewareContext) => void
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  return {
    config: {
      name: 'performance',
      type: 'before',
      priority: 700,
      enabled: performanceConfig.enabled,
      condition: () => performanceConfig.enabled
    },
    handler: async (context, next) => {
      const startTime = performance.now()
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      await next()
      
      const duration = performance.now() - startTime
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryDelta = endMemory - startMemory
      
      // 记录性能数据
      context.metadata = {
        ...context.metadata,
        performance: {
          duration,
          memoryDelta,
          timestamp: Date.now()
        }
      }
      
      // 检查是否为慢事件
      if (duration > performanceConfig.slowThreshold) {
        console.warn(`Slow event detected: ${context.eventName} took ${duration.toFixed(2)}ms`)
        onSlowEvent?.(context.eventName, duration, context)
      }
    }
  }
}

/**
 * 安全中间件
 */
export function createSecurityMiddleware(
  allowedSources?: string[],
  sensitiveEvents?: string[]
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  return {
    config: {
      name: 'security',
      type: 'before',
      priority: 1000,
      enabled: true
    },
    handler: async (context, next) => {
      // 检查事件源
      if (allowedSources && context.source && !allowedSources.includes(context.source)) {
        throw new Error(`Unauthorized event source: ${context.source}`)
      }
      
      // 检查敏感事件
      if (sensitiveEvents && sensitiveEvents.includes(context.eventName)) {
        console.warn(`Sensitive event triggered: ${context.eventName}`, {
          source: context.source,
          timestamp: context.timestamp
        })
      }
      
      await next()
    }
  }
}

/**
 * 错误处理中间件
 */
export function createErrorHandlerMiddleware(
  onError?: (error: Error, context: MiddlewareContext) => void
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  return {
    config: {
      name: 'errorHandler',
      type: 'error',
      priority: 1000,
      enabled: true
    },
    handler: async (context, next) => {
      const error = context.metadata?.originalError as Error
      
      if (error) {
        console.error(`Event error in ${context.eventName}:`, error)
        onError?.(error, context)
        
        // 记录错误信息
        context.metadata = {
          ...context.metadata,
          errorHandled: true,
          errorMessage: error.message,
          errorStack: error.stack
        }
      }
      
      await next()
    }
  }
}

/**
 * 调试中间件
 */
export function createDebugMiddleware(
  debugMode: boolean = false
): { config: MiddlewareConfig; handler: MiddlewareFunction } {
  return {
    config: {
      name: 'debug',
      type: 'before',
      priority: 500,
      enabled: debugMode,
      condition: () => debugMode
    },
    handler: async (context, next) => {
      if (debugMode) {
        console.group(`🔍 Debug: ${context.eventName}`)
        console.log('Event Data:', context.eventData)
        console.log('Context:', {
          source: context.source,
          timestamp: new Date(context.timestamp).toISOString(),
          metadata: context.metadata
        })
        
        const startTime = performance.now()
        await next()
        const duration = performance.now() - startTime
        
        console.log(`⏱️ Execution time: ${duration.toFixed(2)}ms`)
        console.groupEnd()
      } else {
        await next()
      }
    }
  }
}

/**
 * 创建默认中间件集合
 */
export function createDefaultMiddlewares(options: {
  enableLogging?: boolean
  enableValidation?: boolean
  enableCache?: boolean
  enableRateLimit?: boolean
  enablePerformance?: boolean
  enableSecurity?: boolean
  enableDebug?: boolean
  logLevel?: LogLevel
  cacheConfig?: Partial<CacheConfig>
  rateLimitConfig?: Partial<RateLimitConfig>
  validationConfig?: Partial<ValidationConfig>
  performanceConfig?: Partial<PerformanceConfig>
} = {}) {
  const middlewares: Array<{ config: MiddlewareConfig; handler: MiddlewareFunction }> = []
  
  // 错误处理中间件（总是启用）
  middlewares.push(createErrorHandlerMiddleware())
  
  if (options.enableSecurity !== false) {
    middlewares.push(createSecurityMiddleware())
  }
  
  if (options.enableLogging !== false) {
    middlewares.push(createLoggerMiddleware(options.logLevel || 'info'))
  }
  
  if (options.enableValidation) {
    middlewares.push(createValidationMiddleware({
      required: [],
      enabled: true,
      ...options.validationConfig
    }))
  }
  
  if (options.enableRateLimit) {
    middlewares.push(createRateLimitMiddleware({
      maxRequests: 100,
      windowMs: 60000,
      enabled: true,
      ...options.rateLimitConfig
    }))
  }
  
  if (options.enableCache) {
    middlewares.push(createCacheMiddleware({
      maxSize: 1000,
      ttl: 300000, // 5分钟
      enabled: true,
      ...options.cacheConfig
    }))
  }
  
  if (options.enablePerformance) {
    middlewares.push(createPerformanceMiddleware({
      slowThreshold: 100, // 100ms
      enabled: true,
      ...options.performanceConfig
    }))
  }
  
  if (options.enableDebug) {
    middlewares.push(createDebugMiddleware(true))
  }
  
  return middlewares
}

/**
 * 内置中间件管理器
 */
export function useBuiltInMiddlewares() {
  return {
    createLoggerMiddleware,
    createValidationMiddleware,
    createCacheMiddleware,
    createRateLimitMiddleware,
    createPerformanceMiddleware,
    createSecurityMiddleware,
    createErrorHandlerMiddleware,
    createDebugMiddleware,
    createDefaultMiddlewares
  }
}

// 所有中间件创建函数已通过 useBuiltInMiddlewares 函数导出

