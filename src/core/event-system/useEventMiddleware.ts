/**
 * 事件中间件系统
 * 提供事件处理的中间件机制，支持前置和后置处理
 */

import { ref, reactive } from 'vue'
import type { EventName, EventData } from './useEventBus'

// 中间件类型定义
export type MiddlewareType = 'before' | 'after' | 'error'

// 中间件上下文
export interface MiddlewareContext<T extends EventName = EventName> {
  eventName: T
  eventData: EventData<T>
  timestamp: number
  source?: string
  metadata?: Record<string, any>
  stopPropagation: () => void
  preventDefault: () => void
}

// 中间件函数类型
export type MiddlewareFunction<T extends EventName = EventName> = (
  context: MiddlewareContext<T>,
  next: () => Promise<void> | void
) => Promise<void> | void

// 中间件配置
export interface MiddlewareConfig {
  name: string
  type: MiddlewareType
  priority: number
  enabled: boolean
  condition?: (context: MiddlewareContext) => boolean
  timeout?: number
}

// 中间件注册信息
export interface MiddlewareRegistration {
  id: string
  config: MiddlewareConfig
  handler: MiddlewareFunction
  createdAt: number
  executionCount: number
  lastExecuted?: number
  averageExecutionTime: number
}

// 中间件执行结果
export interface MiddlewareExecutionResult {
  success: boolean
  executionTime: number
  error?: Error
  stopped?: boolean
  prevented?: boolean
}

// 中间件统计信息
export interface MiddlewareStats {
  totalMiddlewares: number
  enabledMiddlewares: number
  totalExecutions: number
  averageExecutionTime: number
  errorCount: number
  lastError?: Error
}

// 内置中间件类型
export const BUILT_IN_MIDDLEWARES = {
  LOGGER: 'logger',
  VALIDATOR: 'validator',
  CACHE: 'cache',
  RATE_LIMITER: 'rateLimiter',
  SECURITY: 'security',
  PERFORMANCE: 'performance'
} as const

/**
 * 事件中间件组合式函数
 */
export function useEventMiddleware() {
  // 中间件注册表
  const middlewares = reactive<Map<string, MiddlewareRegistration>>(new Map())
  
  // 统计信息
  const stats = reactive<MiddlewareStats>({
    totalMiddlewares: 0,
    enabledMiddlewares: 0,
    totalExecutions: 0,
    averageExecutionTime: 0,
    errorCount: 0
  })

  // 是否启用中间件系统
  const enabled = ref(true)

  /**
   * 注册中间件
   */
  function registerMiddleware(
    config: MiddlewareConfig,
    handler: MiddlewareFunction
  ): string {
    const id = `middleware_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const registration: MiddlewareRegistration = {
      id,
      config,
      handler,
      createdAt: Date.now(),
      executionCount: 0,
      averageExecutionTime: 0
    }

    middlewares.set(id, registration)
    updateStats()

    return id
  }

  /**
   * 注销中间件
   */
  function unregisterMiddleware(id: string): boolean {
    const result = middlewares.delete(id)
    if (result) {
      updateStats()
    }
    return result
  }

  /**
   * 启用/禁用中间件
   */
  function toggleMiddleware(id: string, enabled: boolean): boolean {
    const middleware = middlewares.get(id)
    if (middleware) {
      middleware.config.enabled = enabled
      updateStats()
      return true
    }
    return false
  }

  /**
   * 获取中间件列表
   */
  function getMiddlewares(type?: MiddlewareType): MiddlewareRegistration[] {
    const list = Array.from(middlewares.values())
    if (type) {
      return list.filter(m => m.config.type === type)
    }
    return list
  }

  /**
   * 执行中间件链
   */
  async function executeMiddlewares<T extends EventName>(
    type: MiddlewareType,
    context: MiddlewareContext<T>
  ): Promise<MiddlewareExecutionResult[]> {
    if (!enabled.value) {
      return []
    }

    // 获取指定类型的中间件并按优先级排序
    const targetMiddlewares = Array.from(middlewares.values())
      .filter(m => 
        m.config.type === type && 
        m.config.enabled &&
        (!m.config.condition || m.config.condition(context))
      )
      .sort((a, b) => b.config.priority - a.config.priority)

    const results: MiddlewareExecutionResult[] = []
    let index = 0

    // 创建 next 函数
    const next = async (): Promise<void> => {
      if (index >= targetMiddlewares.length) {
        return
      }

      const middleware = targetMiddlewares[index++]
      const startTime = performance.now()

      try {
        // 设置超时
        const timeoutPromise = middleware.config.timeout
          ? new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`Middleware ${middleware.config.name} timeout`)), middleware.config.timeout)
            })
          : null

        // 执行中间件
        const executePromise = Promise.resolve(middleware.handler(context, next))
        
        if (timeoutPromise) {
          await Promise.race([executePromise, timeoutPromise])
        } else {
          await executePromise
        }

        const executionTime = performance.now() - startTime
        
        // 更新统计信息
        updateMiddlewareStats(middleware, executionTime)
        
        results.push({
          success: true,
          executionTime,
          stopped: context.stopPropagation === undefined,
          prevented: context.preventDefault === undefined
        })

      } catch (error) {
        const executionTime = performance.now() - startTime
        const err = error instanceof Error ? error : new Error(String(error))
        
        updateMiddlewareStats(middleware, executionTime, err)
        
        results.push({
          success: false,
          executionTime,
          error: err
        })

        // 错误中间件处理
        if (type !== 'error') {
          await executeMiddlewares('error', {
            ...context,
            metadata: { ...context.metadata, originalError: err }
          })
        }
      }
    }

    // 开始执行中间件链
    await next()
    
    return results
  }

  /**
   * 创建中间件上下文
   */
  function createContext<T extends EventName>(
    eventName: T,
    eventData: EventData<T>,
    source?: string,
    metadata?: Record<string, any>
  ): MiddlewareContext<T> {
    let stopped = false
    let prevented = false

    return {
      eventName,
      eventData,
      timestamp: Date.now(),
      source,
      metadata,
      stopPropagation: () => { stopped = true },
      preventDefault: () => { prevented = true }
    }
  }

  /**
   * 更新中间件统计信息
   */
  function updateMiddlewareStats(
    middleware: MiddlewareRegistration,
    executionTime: number,
    error?: Error
  ): void {
    middleware.executionCount++
    middleware.lastExecuted = Date.now()
    
    // 计算平均执行时间
    middleware.averageExecutionTime = 
      (middleware.averageExecutionTime * (middleware.executionCount - 1) + executionTime) / 
      middleware.executionCount

    // 更新全局统计
    stats.totalExecutions++
    stats.averageExecutionTime = 
      (stats.averageExecutionTime * (stats.totalExecutions - 1) + executionTime) / 
      stats.totalExecutions

    if (error) {
      stats.errorCount++
      stats.lastError = error
    }
  }

  /**
   * 更新统计信息
   */
  function updateStats(): void {
    stats.totalMiddlewares = middlewares.size
    stats.enabledMiddlewares = Array.from(middlewares.values())
      .filter(m => m.config.enabled).length
  }

  /**
   * 清理中间件
   */
  function clearMiddlewares(type?: MiddlewareType): void {
    if (type) {
      for (const [id, middleware] of middlewares.entries()) {
        if (middleware.config.type === type) {
          middlewares.delete(id)
        }
      }
    } else {
      middlewares.clear()
    }
    updateStats()
  }

  /**
   * 重置统计信息
   */
  function resetStats(): void {
    stats.totalExecutions = 0
    stats.averageExecutionTime = 0
    stats.errorCount = 0
    stats.lastError = undefined
    
    // 重置每个中间件的统计
    for (const middleware of middlewares.values()) {
      middleware.executionCount = 0
      middleware.averageExecutionTime = 0
      middleware.lastExecuted = undefined
    }
  }

  /**
   * 获取中间件详情
   */
  function getMiddlewareDetails(id: string): MiddlewareRegistration | undefined {
    return middlewares.get(id)
  }

  /**
   * 批量注册中间件
   */
  function registerMiddlewares(
    middlewareList: Array<{ config: MiddlewareConfig; handler: MiddlewareFunction }>
  ): string[] {
    return middlewareList.map(({ config, handler }) => 
      registerMiddleware(config, handler)
    )
  }

  return {
    // 状态
    enabled,
    stats: readonly(stats),
    
    // 中间件管理
    registerMiddleware,
    unregisterMiddleware,
    toggleMiddleware,
    getMiddlewares,
    getMiddlewareDetails,
    registerMiddlewares,
    
    // 执行
    executeMiddlewares,
    createContext,
    
    // 工具
    clearMiddlewares,
    resetStats
  }
}

// 导出类型
export type {
  EventName,
  EventData,
  MiddlewareContext,
  MiddlewareFunction,
  MiddlewareConfig,
  MiddlewareRegistration,
  MiddlewareExecutionResult,
  MiddlewareStats
}
