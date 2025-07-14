/**
 * 企业级事件管理器
 * 整合所有事件系统组件，提供统一的管理接口
 */

import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useEventBus } from './useEventBus'
import { useEventMiddleware } from './useEventMiddleware'
import { useBuiltInMiddlewares } from './useBuiltInMiddlewares'
import { useEventRouter } from './useEventRouter'
import { useEventLifecycle } from './useEventLifecycle'
import { useEventDebugger } from './useEventDebugger'
import type { EventName, EventData, EventHandler } from './useEventBus'
import type { MiddlewareFunction, MiddlewareConfig } from './useEventMiddleware'
import type { RouteConfig, DistributionStrategy } from './useEventRouter'
import type { LifecycleConfig, EventDependency } from './useEventLifecycle'
import type { DebugConfig, DebugLevel } from './useEventDebugger'

// 管理器配置
export interface EventManagerConfig {
  // 基础配置
  enableMiddleware: boolean
  enableRouting: boolean
  enableLifecycle: boolean
  enableDebugging: boolean
  
  // 中间件配置
  middlewareConfig: {
    enableLogging: boolean
    enableValidation: boolean
    enableCaching: boolean
    enableRateLimit: boolean
    enablePerformanceMonitoring: boolean
    enableSecurity: boolean
    enableErrorHandling: boolean
    customMiddlewares: MiddlewareFunction[]
  }
  
  // 路由配置
  routingConfig: {
    defaultStrategy: DistributionStrategy
    enableLoadBalancing: boolean
    enableFailover: boolean
    maxRetries: number
    retryDelay: number
  }
  
  // 生命周期配置
  lifecycleConfig: {
    enablePersistence: boolean
    enableRecovery: boolean
    enableDependencyTracking: boolean
    maxEventAge: number
    cleanupInterval: number
  }
  
  // 调试配置
  debugConfig: DebugConfig
  
  // 性能配置
  performanceConfig: {
    enableMetrics: boolean
    enableProfiling: boolean
    enableMemoryTracking: boolean
    metricsInterval: number
    alertThresholds: {
      maxEventTime: number
      maxMemoryUsage: number
      maxErrorRate: number
    }
  }
  
  // 安全配置
  securityConfig: {
    enableEventValidation: boolean
    enableAccessControl: boolean
    enableAuditLog: boolean
    maxEventSize: number
    allowedEventTypes: string[]
    blockedEventTypes: string[]
  }
}

// 事件处理结果
export interface EventProcessingResult {
  success: boolean
  eventId: string
  eventName: string
  startTime: number
  endTime: number
  duration: number
  middlewareResults: any[]
  routingResults: any[]
  lifecyclePhases: string[]
  errors: Error[]
  metadata: Record<string, any>
}

// 系统状态
export interface SystemStatus {
  isHealthy: boolean
  uptime: number
  eventCount: number
  errorCount: number
  averageResponseTime: number
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  queueSize: number
  lastError?: Error
  lastErrorTime?: number
}

// 性能指标
export interface PerformanceReport {
  period: { start: number; end: number }
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  averageEventTime: number
  p95EventTime: number
  p99EventTime: number
  throughput: number
  errorRate: number
  memoryPeak: number
  cpuPeak: number
  topSlowEvents: Array<{ name: string; duration: number }>
  topErrorEvents: Array<{ name: string; count: number }>
}

// 告警类型
export type AlertType = 'performance' | 'error' | 'memory' | 'security' | 'system'

// 告警信息
export interface Alert {
  id: string
  type: AlertType
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  timestamp: number
  data: any
  resolved: boolean
  resolvedAt?: number
}

/**
 * 企业级事件管理器组合式函数
 */
export function useEnterpriseEventManager(initialConfig?: Partial<EventManagerConfig>) {
  // 默认配置
  const defaultConfig: EventManagerConfig = {
    enableMiddleware: true,
    enableRouting: true,
    enableLifecycle: true,
    enableDebugging: true,
    
    middlewareConfig: {
      enableLogging: true,
      enableValidation: true,
      enableCaching: false,
      enableRateLimit: false,
      enablePerformanceMonitoring: true,
      enableSecurity: true,
      enableErrorHandling: true,
      customMiddlewares: []
    },
    
    routingConfig: {
      defaultStrategy: 'all',
      enableLoadBalancing: false,
      enableFailover: true,
      maxRetries: 3,
      retryDelay: 1000
    },
    
    lifecycleConfig: {
      enablePersistence: false,
      enableRecovery: false,
      enableDependencyTracking: true,
      maxEventAge: 3600000, // 1小时
      cleanupInterval: 300000 // 5分钟
    },
    
    debugConfig: {
      enabled: true,
      level: 'info',
      maxRecords: 10000,
      autoCleanup: true,
      cleanupInterval: 300000,
      captureStack: true,
      trackPerformance: true,
      visualizeFlow: true,
      realTimeMonitoring: true
    },
    
    performanceConfig: {
      enableMetrics: true,
      enableProfiling: true,
      enableMemoryTracking: true,
      metricsInterval: 5000,
      alertThresholds: {
        maxEventTime: 1000,
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxErrorRate: 5 // 5%
      }
    },
    
    securityConfig: {
      enableEventValidation: true,
      enableAccessControl: false,
      enableAuditLog: true,
      maxEventSize: 1024 * 1024, // 1MB
      allowedEventTypes: [],
      blockedEventTypes: []
    }
  }

  // 配置
  const config = ref<EventManagerConfig>({ ...defaultConfig, ...initialConfig })
  
  // 系统状态
  const systemStatus = reactive<SystemStatus>({
    isHealthy: true,
    uptime: 0,
    eventCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    queueSize: 0
  })
  
  // 告警列表
  const alerts = reactive<Alert[]>([])
  
  // 性能数据
  const performanceData = reactive<{
    eventTimes: number[]
    errorCounts: number[]
    memoryUsages: number[]
    timestamps: number[]
  }>({
    eventTimes: [],
    errorCounts: [],
    memoryUsages: [],
    timestamps: []
  })
  
  // 初始化各个组件
  const eventBus = useEventBus()
  const middleware = useEventMiddleware()
  const builtInMiddlewares = useBuiltInMiddlewares()
  const router = useEventRouter()
  const lifecycle = useEventLifecycle()
  const eventDebugger = useEventDebugger()
  
  // 启动时间
  const startTime = Date.now()
  
  // 性能监控定时器
  let performanceTimer: number | null = null
  let uptimeTimer: number | null = null

  /**
   * 初始化管理器
   */
  function initialize(): void {
    // 配置调试器
    eventDebugger.config.value = config.value.debugConfig
    
    // 注册内置中间件
    if (config.value.enableMiddleware) {
      registerBuiltInMiddlewares()
    }
    
    // 启动性能监控
    if (config.value.performanceConfig.enableMetrics) {
      startPerformanceMonitoring()
    }
    
    // 启动运行时间计算
    startUptimeTracking()
    
    // 设置事件拦截
    setupEventInterception()
  }

  /**
   * 注册内置中间件
   */
  function registerBuiltInMiddlewares(): void {
    const { middlewareConfig } = config.value
    
    if (middlewareConfig.enableLogging) {
      middleware.register('logging', builtInMiddlewares.createLoggingMiddleware())
    }
    
    if (middlewareConfig.enableValidation) {
      middleware.register('validation', builtInMiddlewares.createValidationMiddleware())
    }
    
    if (middlewareConfig.enableCaching) {
      middleware.register('caching', builtInMiddlewares.createCachingMiddleware())
    }
    
    if (middlewareConfig.enableRateLimit) {
      middleware.register('rateLimit', builtInMiddlewares.createRateLimitMiddleware())
    }
    
    if (middlewareConfig.enablePerformanceMonitoring) {
      middleware.register('performance', builtInMiddlewares.createPerformanceMiddleware())
    }
    
    if (middlewareConfig.enableSecurity) {
      middleware.register('security', builtInMiddlewares.createSecurityMiddleware())
    }
    
    if (middlewareConfig.enableErrorHandling) {
      middleware.register('errorHandling', builtInMiddlewares.createErrorHandlingMiddleware())
    }
    
    // 注册自定义中间件
    middlewareConfig.customMiddlewares.forEach((mw, index) => {
      middleware.register(`custom_${index}`, mw)
    })
  }

  /**
   * 设置事件拦截
   */
  function setupEventInterception(): void {
    // 拦截事件触发
    const originalEmit = eventBus.emit
    eventBus.emit = async function<T extends EventName>(
      eventName: T,
      eventData: EventData[T]
    ): Promise<EventProcessingResult> {
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const startTime = Date.now()
      
      try {
        // 安全检查
        if (!validateEvent(eventName, eventData)) {
          throw new Error(`Event validation failed for '${eventName}'`)
        }
        
        // 调试日志
        if (config.value.enableDebugging) {
          eventDebugger.logEventTriggered(eventName, eventData, eventId)
        }
        
        // 生命周期开始
        if (config.value.enableLifecycle) {
          lifecycle.startEvent(eventId, eventName, eventData)
        }
        
        let result: any
        
        // 执行中间件
        if (config.value.enableMiddleware) {
          const middlewareResult = await middleware.execute(eventName, eventData, {
            eventId,
            timestamp: startTime
          })
          
          if (!middlewareResult.success) {
            throw new Error(`Middleware execution failed: ${middlewareResult.error?.message}`)
          }
        }
        
        // 路由分发
        if (config.value.enableRouting) {
          const routeResult = await router.distribute(eventName, eventData, {
            strategy: config.value.routingConfig.defaultStrategy,
            maxRetries: config.value.routingConfig.maxRetries,
            retryDelay: config.value.routingConfig.retryDelay
          })
          result = routeResult
        } else {
          // 直接调用原始方法
          result = await originalEmit.call(eventBus, eventName, eventData)
        }
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        // 更新系统状态
        updateSystemStatus(duration, false)
        
        // 生命周期完成
        if (config.value.enableLifecycle) {
          lifecycle.completeEvent(eventId, result)
        }
        
        // 调试日志
        if (config.value.enableDebugging) {
          eventDebugger.logEventCompleted(eventName, duration, result, eventId)
        }
        
        return {
          success: true,
          eventId,
          eventName,
          startTime,
          endTime,
          duration,
          middlewareResults: [],
          routingResults: [],
          lifecyclePhases: [],
          errors: [],
          metadata: { result }
        }
        
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        // 更新系统状态
        updateSystemStatus(duration, true)
        
        // 生命周期失败
        if (config.value.enableLifecycle) {
          lifecycle.failEvent(eventId, error as Error)
        }
        
        // 调试日志
        if (config.value.enableDebugging) {
          eventDebugger.logEventFailed(eventName, error as Error, duration, eventId)
        }
        
        // 创建告警
        createAlert('error', 'error', 'Event Processing Failed', 
          `Event '${eventName}' failed: ${(error as Error).message}`, {
          eventName,
          eventId,
          error: error as Error,
          duration
        })
        
        throw error
      }
    }
  }

  /**
   * 验证事件
   */
  function validateEvent(eventName: string, eventData: any): boolean {
    const { securityConfig } = config.value
    
    if (!securityConfig.enableEventValidation) {
      return true
    }
    
    // 检查事件类型白名单
    if (securityConfig.allowedEventTypes.length > 0 && 
        !securityConfig.allowedEventTypes.includes(eventName)) {
      return false
    }
    
    // 检查事件类型黑名单
    if (securityConfig.blockedEventTypes.includes(eventName)) {
      return false
    }
    
    // 检查事件大小
    const eventSize = JSON.stringify(eventData).length
    if (eventSize > securityConfig.maxEventSize) {
      return false
    }
    
    return true
  }

  /**
   * 更新系统状态
   */
  function updateSystemStatus(duration: number, isError: boolean): void {
    systemStatus.eventCount++
    
    if (isError) {
      systemStatus.errorCount++
    }
    
    // 更新平均响应时间
    systemStatus.averageResponseTime = 
      (systemStatus.averageResponseTime * (systemStatus.eventCount - 1) + duration) / 
      systemStatus.eventCount
    
    // 检查健康状态
    const errorRate = (systemStatus.errorCount / systemStatus.eventCount) * 100
    systemStatus.isHealthy = 
      errorRate < config.value.performanceConfig.alertThresholds.maxErrorRate &&
      systemStatus.averageResponseTime < config.value.performanceConfig.alertThresholds.maxEventTime
  }

  /**
   * 启动性能监控
   */
  function startPerformanceMonitoring(): void {
    performanceTimer = window.setInterval(() => {
      const now = Date.now()
      
      // 记录性能数据
      performanceData.timestamps.push(now)
      performanceData.eventTimes.push(systemStatus.averageResponseTime)
      performanceData.errorCounts.push(systemStatus.errorCount)
      
      // 记录内存使用
      if ((performance as any).memory) {
        const memoryUsage = (performance as any).memory.usedJSHeapSize
        performanceData.memoryUsages.push(memoryUsage)
        systemStatus.memoryUsage = memoryUsage
        
        // 检查内存告警
        if (memoryUsage > config.value.performanceConfig.alertThresholds.maxMemoryUsage) {
          createAlert('memory', 'warning', 'High Memory Usage', 
            `Memory usage is ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`, {
            memoryUsage,
            threshold: config.value.performanceConfig.alertThresholds.maxMemoryUsage
          })
        }
      }
      
      // 限制数据点数量
      const maxDataPoints = 1000
      if (performanceData.timestamps.length > maxDataPoints) {
        performanceData.timestamps.splice(0, performanceData.timestamps.length - maxDataPoints)
        performanceData.eventTimes.splice(0, performanceData.eventTimes.length - maxDataPoints)
        performanceData.errorCounts.splice(0, performanceData.errorCounts.length - maxDataPoints)
        performanceData.memoryUsages.splice(0, performanceData.memoryUsages.length - maxDataPoints)
      }
      
    }, config.value.performanceConfig.metricsInterval)
  }

  /**
   * 启动运行时间跟踪
   */
  function startUptimeTracking(): void {
    uptimeTimer = window.setInterval(() => {
      systemStatus.uptime = Date.now() - startTime
    }, 1000)
  }

  /**
   * 创建告警
   */
  function createAlert(
    type: AlertType,
    level: Alert['level'],
    title: string,
    message: string,
    data?: any
  ): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      level,
      title,
      message,
      timestamp: Date.now(),
      data: data || {},
      resolved: false
    }
    
    alerts.push(alert)
    
    // 限制告警数量
    if (alerts.length > 1000) {
      alerts.splice(0, alerts.length - 1000)
    }
    
    // 控制台输出
    console.warn(`[ALERT] [${level.toUpperCase()}] ${title}: ${message}`, data)
  }

  /**
   * 解决告警
   */
  function resolveAlert(alertId: string): void {
    const alert = alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
    }
  }

  /**
   * 清除已解决的告警
   */
  function clearResolvedAlerts(): void {
    const unresolvedAlerts = alerts.filter(a => !a.resolved)
    alerts.splice(0, alerts.length, ...unresolvedAlerts)
  }

  /**
   * 生成性能报告
   */
  function generatePerformanceReport(periodMs = 3600000): PerformanceReport {
    const now = Date.now()
    const start = now - periodMs
    
    // 过滤时间范围内的数据
    const recentData = performanceData.timestamps
      .map((timestamp, index) => ({
        timestamp,
        eventTime: performanceData.eventTimes[index],
        errorCount: performanceData.errorCounts[index],
        memoryUsage: performanceData.memoryUsages[index]
      }))
      .filter(d => d.timestamp >= start)
    
    if (recentData.length === 0) {
      return {
        period: { start, end: now },
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        averageEventTime: 0,
        p95EventTime: 0,
        p99EventTime: 0,
        throughput: 0,
        errorRate: 0,
        memoryPeak: 0,
        cpuPeak: 0,
        topSlowEvents: [],
        topErrorEvents: []
      }
    }
    
    // 计算统计数据
    const eventTimes = recentData.map(d => d.eventTime).filter(t => t > 0)
    const sortedEventTimes = [...eventTimes].sort((a, b) => a - b)
    
    const totalEvents = systemStatus.eventCount
    const failedEvents = systemStatus.errorCount
    const successfulEvents = totalEvents - failedEvents
    
    return {
      period: { start, end: now },
      totalEvents,
      successfulEvents,
      failedEvents,
      averageEventTime: eventTimes.reduce((sum, t) => sum + t, 0) / eventTimes.length || 0,
      p95EventTime: sortedEventTimes[Math.floor(sortedEventTimes.length * 0.95)] || 0,
      p99EventTime: sortedEventTimes[Math.floor(sortedEventTimes.length * 0.99)] || 0,
      throughput: totalEvents / (periodMs / 1000),
      errorRate: totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0,
      memoryPeak: Math.max(...recentData.map(d => d.memoryUsage)),
      cpuPeak: 0, // TODO: 实现CPU监控
      topSlowEvents: [], // TODO: 从调试器获取
      topErrorEvents: [] // TODO: 从调试器获取
    }
  }

  /**
   * 重置系统状态
   */
  function resetSystemStatus(): void {
    Object.assign(systemStatus, {
      isHealthy: true,
      uptime: 0,
      eventCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      queueSize: 0
    })
    
    performanceData.eventTimes.splice(0)
    performanceData.errorCounts.splice(0)
    performanceData.memoryUsages.splice(0)
    performanceData.timestamps.splice(0)
    
    alerts.splice(0)
  }

  /**
   * 停止管理器
   */
  function shutdown(): void {
    if (performanceTimer) {
      clearInterval(performanceTimer)
      performanceTimer = null
    }
    
    if (uptimeTimer) {
      clearInterval(uptimeTimer)
      uptimeTimer = null
    }
    
    eventDebugger.stopMonitoring()
  }

  // 计算属性
  const activeAlerts = computed(() => alerts.filter(a => !a.resolved))
  const criticalAlerts = computed(() => activeAlerts.value.filter(a => a.level === 'critical'))
  const recentPerformanceData = computed(() => {
    const last100 = Math.max(0, performanceData.timestamps.length - 100)
    return {
      timestamps: performanceData.timestamps.slice(last100),
      eventTimes: performanceData.eventTimes.slice(last100),
      errorCounts: performanceData.errorCounts.slice(last100),
      memoryUsages: performanceData.memoryUsages.slice(last100)
    }
  })

  // 监听配置变化
  watch(() => config.value.debugConfig, (newConfig) => {
    eventDebugger.config.value = newConfig
  }, { deep: true })

  // 组件卸载时清理
  onUnmounted(() => {
    shutdown()
  })

  // 自动初始化
  initialize()

  return {
    // 配置
    config,
    
    // 状态
    systemStatus: readonly(systemStatus),
    alerts: readonly(alerts),
    activeAlerts,
    criticalAlerts,
    performanceData: readonly(performanceData),
    recentPerformanceData,
    
    // 子组件
    eventBus,
    middleware,
    router,
    lifecycle,
    eventDebugger,
    
    // 管理方法
    initialize,
    shutdown,
    resetSystemStatus,
    
    // 告警管理
    createAlert,
    resolveAlert,
    clearResolvedAlerts,
    
    // 报告
    generatePerformanceReport,
    
    // 工具方法
    validateEvent
  }
}

// 导出类型
export type {
  EventManagerConfig,
  EventProcessingResult,
  SystemStatus,
  PerformanceReport,
  AlertType,
  Alert
}