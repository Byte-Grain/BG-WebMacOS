import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useEventBus, EVENTS } from '../core/useEventBus'
import { useUtils } from './useUtils'

// 错误类型
export type ErrorType = 'javascript' | 'promise' | 'resource' | 'network' | 'custom'

// 错误严重级别
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// 错误信息接口
export interface ErrorInfo {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  component?: string
  metadata?: Record<string, any>
}

// 性能指标接口
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: number
  component?: string
  metadata?: Record<string, any>
}

// 错误监控配置
export interface ErrorMonitorConfig {
  enabled: boolean
  autoReport: boolean
  maxErrors: number
  reportInterval: number // 上报间隔（毫秒）
  enablePerformanceMonitoring: boolean
  enableNetworkMonitoring: boolean
  enableConsoleCapture: boolean
  filters: {
    ignoreUrls?: RegExp[]
    ignoreMessages?: RegExp[]
    ignoreComponents?: string[]
  }
  onError?: (error: ErrorInfo) => void
  onReport?: (errors: ErrorInfo[]) => void
}

// 默认配置
const DEFAULT_CONFIG: ErrorMonitorConfig = {
  enabled: true,
  autoReport: true,
  maxErrors: 100,
  reportInterval: 30000, // 30秒
  enablePerformanceMonitoring: true,
  enableNetworkMonitoring: true,
  enableConsoleCapture: false,
  filters: {
    ignoreUrls: [/localhost/, /127\.0\.0\.1/],
    ignoreMessages: [/Script error/, /Non-Error promise rejection/],
    ignoreComponents: []
  }
}

// 错误监控组合式函数
export function useErrorMonitor(config: Partial<ErrorMonitorConfig> = {}) {
  const { emit } = useEventBus()
  const { generateId } = useUtils()
  
  // 合并配置
  const finalConfig = reactive({ ...DEFAULT_CONFIG, ...config })
  
  // 错误列表
  const errors = ref<ErrorInfo[]>([])
  
  // 性能指标列表
  const performanceMetrics = ref<PerformanceMetric[]>([])
  
  // 会话ID
  const sessionId = generateId('session')
  
  // 统计信息
  const stats = reactive({
    totalErrors: 0,
    errorsByType: {
      javascript: 0,
      promise: 0,
      resource: 0,
      network: 0,
      custom: 0
    },
    errorsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  })
  
  // 上报定时器
  let reportTimer: NodeJS.Timeout | null = null

  // 创建错误信息
  const createErrorInfo = (
    type: ErrorType,
    message: string,
    options: Partial<ErrorInfo> = {}
  ): ErrorInfo => {
    return {
      id: generateId('error'),
      type,
      severity: options.severity || 'medium',
      message,
      stack: options.stack,
      filename: options.filename,
      lineno: options.lineno,
      colno: options.colno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId,
      component: options.component,
      metadata: options.metadata,
      ...options
    }
  }

  // 检查是否应该忽略错误
  const shouldIgnoreError = (error: ErrorInfo): boolean => {
    const { filters } = finalConfig
    
    // 检查URL过滤
    if (filters.ignoreUrls?.some(regex => regex.test(error.url))) {
      return true
    }
    
    // 检查消息过滤
    if (filters.ignoreMessages?.some(regex => regex.test(error.message))) {
      return true
    }
    
    // 检查组件过滤
    if (error.component && filters.ignoreComponents?.includes(error.component)) {
      return true
    }
    
    return false
  }

  // 记录错误
  const recordError = (error: ErrorInfo): void => {
    if (!finalConfig.enabled || shouldIgnoreError(error)) {
      return
    }
    
    // 添加到错误列表
    errors.value.push(error)
    
    // 限制错误数量
    if (errors.value.length > finalConfig.maxErrors) {
      errors.value.shift()
    }
    
    // 更新统计
    stats.totalErrors++
    stats.errorsByType[error.type]++
    stats.errorsBySeverity[error.severity]++
    
    // 触发错误事件
    emit('error:captured', error)
    
    // 执行自定义错误处理
    if (finalConfig.onError) {
      try {
        finalConfig.onError(error)
      } catch (e) {
        console.error('Error in onError callback:', e)
      }
    }
    
    // 严重错误立即上报
    if (error.severity === 'critical' && finalConfig.autoReport) {
      reportErrors([error])
    }
  }

  // JavaScript错误处理
  const handleJavaScriptError = (event: ErrorEvent): void => {
    const error = createErrorInfo('javascript', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      severity: 'high'
    })
    
    recordError(error)
  }

  // Promise拒绝处理
  const handlePromiseRejection = (event: PromiseRejectionEvent): void => {
    const error = createErrorInfo('promise', String(event.reason), {
      stack: event.reason?.stack,
      severity: 'medium'
    })
    
    recordError(error)
  }

  // 资源加载错误处理
  const handleResourceError = (event: Event): void => {
    const target = event.target as HTMLElement
    const error = createErrorInfo('resource', `Failed to load resource: ${target.tagName}`, {
      filename: (target as any).src || (target as any).href,
      severity: 'low'
    })
    
    recordError(error)
  }

  // 网络错误监控
  const monitorNetworkErrors = (): void => {
    if (!finalConfig.enableNetworkMonitoring) return
    
    // 监控fetch请求
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          const error = createErrorInfo('network', `HTTP ${response.status}: ${response.statusText}`, {
            metadata: {
              url: args[0],
              status: response.status,
              statusText: response.statusText
            },
            severity: response.status >= 500 ? 'high' : 'medium'
          })
          recordError(error)
        }
        return response
      } catch (err) {
        const error = createErrorInfo('network', `Network error: ${err}`, {
          metadata: {
            url: args[0],
            error: String(err)
          },
          severity: 'high'
        })
        recordError(error)
        throw err
      }
    }
  }

  // 性能监控
  const monitorPerformance = (): void => {
    if (!finalConfig.enablePerformanceMonitoring) return
    
    // 监控内存使用
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const metric: PerformanceMetric = {
          id: generateId('metric'),
          name: 'memory_usage',
          value: memory.usedJSHeapSize / memory.totalJSHeapSize * 100,
          unit: 'percentage',
          timestamp: Date.now(),
          metadata: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        }
        
        performanceMetrics.value.push(metric)
        
        // 内存使用过高时记录错误
        if (metric.value > 90) {
          const error = createErrorInfo('custom', 'High memory usage detected', {
            severity: 'high',
            metadata: metric.metadata
          })
          recordError(error)
        }
      }
    }
    
    // 定期检查性能
    setInterval(checkMemoryUsage, 10000) // 每10秒检查一次
  }

  // 上报错误
  const reportErrors = async (errorsToReport: ErrorInfo[] = errors.value): Promise<void> => {
    if (!errorsToReport.length) return
    
    try {
      // 这里可以实现实际的错误上报逻辑
      // 例如发送到错误监控服务
      console.group('🚨 Error Report')
      console.log('Session ID:', sessionId)
      console.log('Errors:', errorsToReport)
      console.log('Stats:', stats)
      console.groupEnd()
      
      // 触发上报事件
      emit('error:reported', {
        sessionId,
        errors: errorsToReport,
        stats: { ...stats }
      })
      
      // 执行自定义上报处理
      if (finalConfig.onReport) {
        finalConfig.onReport(errorsToReport)
      }
      
      // 清空已上报的错误
      if (errorsToReport === errors.value) {
        errors.value = []
      }
    } catch (error) {
      console.error('Failed to report errors:', error)
    }
  }

  // 手动记录错误
  const captureError = (
    message: string,
    options: Partial<ErrorInfo> = {}
  ): void => {
    const error = createErrorInfo('custom', message, options)
    recordError(error)
  }

  // 手动记录异常
  const captureException = (
    exception: Error,
    options: Partial<ErrorInfo> = {}
  ): void => {
    const error = createErrorInfo('custom', exception.message, {
      stack: exception.stack,
      severity: 'high',
      ...options
    })
    recordError(error)
  }

  // 获取错误统计
  const getErrorStats = () => ({ ...stats })

  // 获取最近的错误
  const getRecentErrors = (count = 10) => {
    return errors.value.slice(-count)
  }

  // 清空错误记录
  const clearErrors = (): void => {
    errors.value = []
    performanceMetrics.value = []
  }

  // 启动监控
  const startMonitoring = (): void => {
    if (!finalConfig.enabled) return
    
    // 监听JavaScript错误
    window.addEventListener('error', handleJavaScriptError)
    
    // 监听Promise拒绝
    window.addEventListener('unhandledrejection', handlePromiseRejection)
    
    // 监听资源加载错误
    window.addEventListener('error', handleResourceError, true)
    
    // 启动网络监控
    monitorNetworkErrors()
    
    // 启动性能监控
    monitorPerformance()
    
    // 启动定时上报
    if (finalConfig.autoReport && finalConfig.reportInterval > 0) {
      reportTimer = setInterval(() => {
        if (errors.value.length > 0) {
          reportErrors()
        }
      }, finalConfig.reportInterval)
    }
  }

  // 停止监控
  const stopMonitoring = (): void => {
    window.removeEventListener('error', handleJavaScriptError)
    window.removeEventListener('unhandledrejection', handlePromiseRejection)
    window.removeEventListener('error', handleResourceError, true)
    
    if (reportTimer) {
      clearInterval(reportTimer)
      reportTimer = null
    }
  }

  // 生命周期
  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
    // 组件卸载时上报剩余错误
    if (errors.value.length > 0 && finalConfig.autoReport) {
      reportErrors()
    }
  })

  return {
    // 配置
    config: finalConfig,
    
    // 数据
    errors: readonly(errors),
    performanceMetrics: readonly(performanceMetrics),
    stats: readonly(stats),
    sessionId,
    
    // 方法
    captureError,
    captureException,
    reportErrors,
    getErrorStats,
    getRecentErrors,
    clearErrors,
    startMonitoring,
    stopMonitoring
  }
}

// 全局错误监控实例
let globalErrorMonitor: ReturnType<typeof useErrorMonitor> | null = null

// 获取全局错误监控实例
export function getGlobalErrorMonitor() {
  if (!globalErrorMonitor) {
    globalErrorMonitor = useErrorMonitor()
  }
  return globalErrorMonitor
}

// 便捷的全局错误捕获函数
export const captureError = (message: string, options?: Partial<ErrorInfo>) => {
  getGlobalErrorMonitor().captureError(message, options)
}

export const captureException = (exception: Error, options?: Partial<ErrorInfo>) => {
  getGlobalErrorMonitor().captureException(exception, options)
}

// 导出类型
export type { ErrorInfo, PerformanceMetric, ErrorMonitorConfig }