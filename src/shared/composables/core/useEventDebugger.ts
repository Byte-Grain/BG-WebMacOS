/**
 * 事件调试工具
 * 提供事件流可视化、实时监控和性能分析功能
 */

import { ref, reactive, computed, watch } from 'vue'
import type { EventName, EventData } from './useEventBus'
import type { EventLifecycleRecord, EventStatus, LifecyclePhase } from './useEventLifecycle'
import type { MiddlewareExecutionResult } from './useEventMiddleware'
import type { DistributionResult } from './useEventRouter'

// 调试级别
export type DebugLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error'

// 调试事件类型
export type DebugEventType = 
  | 'event_triggered'    // 事件触发
  | 'event_completed'    // 事件完成
  | 'event_failed'       // 事件失败
  | 'middleware_start'   // 中间件开始
  | 'middleware_end'     // 中间件结束
  | 'route_matched'      // 路由匹配
  | 'target_dispatched'  // 目标分发
  | 'performance_issue'  // 性能问题
  | 'error_occurred'     // 错误发生

// 调试记录
export interface DebugRecord {
  id: string
  type: DebugEventType
  level: DebugLevel
  timestamp: number
  eventName: string
  eventId?: string
  message: string
  data: any
  stack?: string
  duration?: number
  metadata: Record<string, any>
}

// 性能指标
export interface PerformanceMetrics {
  eventCount: number
  averageEventTime: number
  slowestEvent: { name: string; duration: number }
  fastestEvent: { name: string; duration: number }
  errorRate: number
  throughput: number // 每秒事件数
  memoryUsage: number
  cpuUsage: number
}

// 事件流节点
export interface EventFlowNode {
  id: string
  type: 'event' | 'middleware' | 'router' | 'target'
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  duration?: number
  children: EventFlowNode[]
  metadata: Record<string, any>
}

// 事件统计
export interface EventStatistics {
  name: string
  count: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  successCount: number
  errorCount: number
  successRate: number
  lastTriggered: number
}

// 调试配置
export interface DebugConfig {
  enabled: boolean
  level: DebugLevel
  maxRecords: number
  autoCleanup: boolean
  cleanupInterval: number
  captureStack: boolean
  trackPerformance: boolean
  visualizeFlow: boolean
  realTimeMonitoring: boolean
}

// 过滤器配置
export interface DebugFilter {
  eventNames?: string[]
  eventTypes?: DebugEventType[]
  levels?: DebugLevel[]
  timeRange?: { start: number; end: number }
  searchText?: string
  showOnlyErrors?: boolean
}

// 导出配置
export interface ExportConfig {
  format: 'json' | 'csv' | 'txt'
  includeMetadata: boolean
  includeStack: boolean
  timeRange?: { start: number; end: number }
  filter?: DebugFilter
}

/**
 * 事件调试器组合式函数
 */
export function useEventDebugger() {
  // 调试记录
  const records = reactive<DebugRecord[]>([])
  
  // 事件流
  const eventFlows = reactive<Map<string, EventFlowNode>>(new Map())
  
  // 事件统计
  const eventStats = reactive<Map<string, EventStatistics>>(new Map())
  
  // 性能指标
  const performanceMetrics = reactive<PerformanceMetrics>({
    eventCount: 0,
    averageEventTime: 0,
    slowestEvent: { name: '', duration: 0 },
    fastestEvent: { name: '', duration: Infinity },
    errorRate: 0,
    throughput: 0,
    memoryUsage: 0,
    cpuUsage: 0
  })
  
  // 配置
  const config = ref<DebugConfig>({
    enabled: true,
    level: 'info',
    maxRecords: 10000,
    autoCleanup: true,
    cleanupInterval: 300000, // 5分钟
    captureStack: true,
    trackPerformance: true,
    visualizeFlow: true,
    realTimeMonitoring: true
  })
  
  // 过滤器
  const filter = ref<DebugFilter>({})
  
  // 实时监控状态
  const isMonitoring = ref(false)
  const monitoringInterval = ref<number | null>(null)
  
  // 级别优先级映射
  const levelPriority: Record<DebugLevel, number> = {
    verbose: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
  }

  /**
   * 记录调试信息
   */
  function log(
    type: DebugEventType,
    level: DebugLevel,
    eventName: string,
    message: string,
    data?: any,
    eventId?: string,
    duration?: number
  ): void {
    if (!config.value.enabled || levelPriority[level] < levelPriority[config.value.level]) {
      return
    }

    const record: DebugRecord = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      level,
      timestamp: Date.now(),
      eventName,
      eventId,
      message,
      data: data || {},
      duration,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    }

    // 捕获调用栈
    if (config.value.captureStack && level === 'error') {
      record.stack = new Error().stack
    }

    records.push(record)
    
    // 更新统计信息
    updateEventStatistics(eventName, duration, level === 'error')
    
    // 更新性能指标
    if (config.value.trackPerformance) {
      updatePerformanceMetrics(eventName, duration, level === 'error')
    }
    
    // 自动清理
    if (config.value.autoCleanup && records.length > config.value.maxRecords) {
      const removeCount = Math.floor(config.value.maxRecords * 0.1) // 删除10%
      records.splice(0, removeCount)
    }
    
    // 控制台输出
    outputToConsole(record)
  }

  /**
   * 开始事件流跟踪
   */
  function startEventFlow(eventId: string, eventName: string): EventFlowNode {
    if (!config.value.visualizeFlow) {
      return {} as EventFlowNode
    }

    const node: EventFlowNode = {
      id: eventId,
      type: 'event',
      name: eventName,
      status: 'pending',
      startTime: Date.now(),
      children: [],
      metadata: {}
    }

    eventFlows.set(eventId, node)
    return node
  }

  /**
   * 添加子节点到事件流
   */
  function addFlowNode(
    parentId: string,
    type: EventFlowNode['type'],
    name: string,
    metadata?: Record<string, any>
  ): string {
    const parent = eventFlows.get(parentId)
    if (!parent) {
      return ''
    }

    const nodeId = `${parentId}_${type}_${Date.now()}`
    const node: EventFlowNode = {
      id: nodeId,
      type,
      name,
      status: 'pending',
      startTime: Date.now(),
      children: [],
      metadata: metadata || {}
    }

    parent.children.push(node)
    return nodeId
  }

  /**
   * 更新事件流节点状态
   */
  function updateFlowNode(
    nodeId: string,
    status: EventFlowNode['status'],
    metadata?: Record<string, any>
  ): void {
    // 查找节点（可能在任何层级）
    function findAndUpdateNode(nodes: EventFlowNode[]): boolean {
      for (const node of nodes) {
        if (node.id === nodeId) {
          node.status = status
          node.endTime = Date.now()
          node.duration = node.endTime - node.startTime
          if (metadata) {
            node.metadata = { ...node.metadata, ...metadata }
          }
          return true
        }
        if (findAndUpdateNode(node.children)) {
          return true
        }
      }
      return false
    }

    for (const flow of eventFlows.values()) {
      if (findAndUpdateNode([flow])) {
        break
      }
    }
  }

  /**
   * 记录事件触发
   */
  function logEventTriggered(eventName: string, eventData: any, eventId?: string): void {
    log('event_triggered', 'info', eventName, `Event '${eventName}' triggered`, {
      eventData,
      dataSize: JSON.stringify(eventData).length
    }, eventId)

    if (eventId && config.value.visualizeFlow) {
      startEventFlow(eventId, eventName)
    }
  }

  /**
   * 记录事件完成
   */
  function logEventCompleted(
    eventName: string,
    duration: number,
    result?: any,
    eventId?: string
  ): void {
    log('event_completed', 'info', eventName, 
      `Event '${eventName}' completed in ${duration.toFixed(2)}ms`, {
      result,
      duration
    }, eventId, duration)

    if (eventId) {
      updateFlowNode(eventId, 'completed', { result, duration })
    }
  }

  /**
   * 记录事件失败
   */
  function logEventFailed(
    eventName: string,
    error: Error,
    duration?: number,
    eventId?: string
  ): void {
    log('event_failed', 'error', eventName, 
      `Event '${eventName}' failed: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      duration
    }, eventId, duration)

    if (eventId) {
      updateFlowNode(eventId, 'failed', { error: error.message, duration })
    }
  }

  /**
   * 记录中间件执行
   */
  function logMiddlewareExecution(
    middlewareName: string,
    eventName: string,
    result: MiddlewareExecutionResult,
    eventId?: string
  ): void {
    const level = result.success ? 'debug' : 'error'
    const message = result.success 
      ? `Middleware '${middlewareName}' executed successfully`
      : `Middleware '${middlewareName}' failed`

    log('middleware_start', level, eventName, message, {
      middlewareName,
      result
    }, eventId, result.executionTime)

    if (eventId && config.value.visualizeFlow) {
      const nodeId = addFlowNode(eventId, 'middleware', middlewareName)
      updateFlowNode(nodeId, result.success ? 'completed' : 'failed', {
        executionTime: result.executionTime,
        error: result.error?.message
      })
    }
  }

  /**
   * 记录路由匹配
   */
  function logRouteMatched(
    eventName: string,
    routeName: string,
    targetCount: number,
    eventId?: string
  ): void {
    log('route_matched', 'debug', eventName, 
      `Route '${routeName}' matched with ${targetCount} targets`, {
      routeName,
      targetCount
    }, eventId)

    if (eventId && config.value.visualizeFlow) {
      addFlowNode(eventId, 'router', routeName, { targetCount })
    }
  }

  /**
   * 记录目标分发
   */
  function logTargetDispatched(
    eventName: string,
    targetId: string,
    result: DistributionResult,
    eventId?: string
  ): void {
    const level = result.success ? 'debug' : 'warn'
    const message = result.success
      ? `Target '${targetId}' executed successfully`
      : `Target '${targetId}' failed`

    log('target_dispatched', level, eventName, message, {
      targetId,
      result
    }, eventId, result.executionTime)

    if (eventId && config.value.visualizeFlow) {
      const nodeId = addFlowNode(eventId, 'target', targetId)
      updateFlowNode(nodeId, result.success ? 'completed' : 'failed', {
        executionTime: result.executionTime,
        error: result.error?.message,
        retryCount: result.retryCount
      })
    }
  }

  /**
   * 记录性能问题
   */
  function logPerformanceIssue(
    eventName: string,
    issue: string,
    metrics: Record<string, any>,
    eventId?: string
  ): void {
    log('performance_issue', 'warn', eventName, 
      `Performance issue detected: ${issue}`, metrics, eventId)
  }

  /**
   * 更新事件统计
   */
  function updateEventStatistics(eventName: string, duration?: number, isError = false): void {
    let stats = eventStats.get(eventName)
    
    if (!stats) {
      stats = {
        name: eventName,
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        successCount: 0,
        errorCount: 0,
        successRate: 0,
        lastTriggered: 0
      }
      eventStats.set(eventName, stats)
    }

    stats.count++
    stats.lastTriggered = Date.now()

    if (duration !== undefined) {
      stats.totalDuration += duration
      stats.averageDuration = stats.totalDuration / stats.count
      stats.minDuration = Math.min(stats.minDuration, duration)
      stats.maxDuration = Math.max(stats.maxDuration, duration)
    }

    if (isError) {
      stats.errorCount++
    } else {
      stats.successCount++
    }

    stats.successRate = (stats.successCount / stats.count) * 100
  }

  /**
   * 更新性能指标
   */
  function updatePerformanceMetrics(eventName: string, duration?: number, isError = false): void {
    performanceMetrics.eventCount++

    if (duration !== undefined) {
      // 更新平均事件时间
      performanceMetrics.averageEventTime = 
        (performanceMetrics.averageEventTime * (performanceMetrics.eventCount - 1) + duration) / 
        performanceMetrics.eventCount

      // 更新最慢和最快事件
      if (duration > performanceMetrics.slowestEvent.duration) {
        performanceMetrics.slowestEvent = { name: eventName, duration }
      }
      if (duration < performanceMetrics.fastestEvent.duration) {
        performanceMetrics.fastestEvent = { name: eventName, duration }
      }
    }

    // 更新错误率
    const errorCount = Array.from(eventStats.values())
      .reduce((sum, stats) => sum + stats.errorCount, 0)
    performanceMetrics.errorRate = (errorCount / performanceMetrics.eventCount) * 100

    // 更新内存使用（如果可用）
    if ((performance as any).memory) {
      performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
  }

  /**
   * 输出到控制台
   */
  function outputToConsole(record: DebugRecord): void {
    const timestamp = new Date(record.timestamp).toISOString()
    const prefix = `[${timestamp}] [${record.level.toUpperCase()}] [${record.type}]`
    const message = `${prefix} ${record.message}`

    switch (record.level) {
      case 'verbose':
      case 'debug':
        console.debug(message, record.data)
        break
      case 'info':
        console.info(message, record.data)
        break
      case 'warn':
        console.warn(message, record.data)
        break
      case 'error':
        console.error(message, record.data)
        if (record.stack) {
          console.error('Stack trace:', record.stack)
        }
        break
    }
  }

  /**
   * 获取过滤后的记录
   */
  const filteredRecords = computed(() => {
    let result = [...records]
    const f = filter.value

    if (f.eventNames && f.eventNames.length > 0) {
      result = result.filter(r => f.eventNames!.includes(r.eventName))
    }

    if (f.eventTypes && f.eventTypes.length > 0) {
      result = result.filter(r => f.eventTypes!.includes(r.type))
    }

    if (f.levels && f.levels.length > 0) {
      result = result.filter(r => f.levels!.includes(r.level))
    }

    if (f.timeRange) {
      result = result.filter(r => 
        r.timestamp >= f.timeRange!.start && r.timestamp <= f.timeRange!.end
      )
    }

    if (f.searchText) {
      const searchLower = f.searchText.toLowerCase()
      result = result.filter(r => 
        r.message.toLowerCase().includes(searchLower) ||
        r.eventName.toLowerCase().includes(searchLower)
      )
    }

    if (f.showOnlyErrors) {
      result = result.filter(r => r.level === 'error')
    }

    return result.sort((a, b) => b.timestamp - a.timestamp)
  })

  /**
   * 开始实时监控
   */
  function startMonitoring(interval = 1000): void {
    if (isMonitoring.value) {
      return
    }

    isMonitoring.value = true
    monitoringInterval.value = window.setInterval(() => {
      // 计算吞吐量
      const now = Date.now()
      const oneSecondAgo = now - 1000
      const recentEvents = records.filter(r => r.timestamp > oneSecondAgo)
      performanceMetrics.throughput = recentEvents.length

      // 更新CPU使用率（简单估算）
      const recentDurations = recentEvents
        .filter(r => r.duration !== undefined)
        .map(r => r.duration!)
      
      if (recentDurations.length > 0) {
        const avgDuration = recentDurations.reduce((sum, d) => sum + d, 0) / recentDurations.length
        performanceMetrics.cpuUsage = Math.min(100, (avgDuration / 100) * 100) // 简化计算
      }
    }, interval)
  }

  /**
   * 停止实时监控
   */
  function stopMonitoring(): void {
    if (monitoringInterval.value) {
      clearInterval(monitoringInterval.value)
      monitoringInterval.value = null
    }
    isMonitoring.value = false
  }

  /**
   * 清理记录
   */
  function clearRecords(): void {
    records.splice(0, records.length)
    eventFlows.clear()
    eventStats.clear()
    
    // 重置性能指标
    Object.assign(performanceMetrics, {
      eventCount: 0,
      averageEventTime: 0,
      slowestEvent: { name: '', duration: 0 },
      fastestEvent: { name: '', duration: Infinity },
      errorRate: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0
    })
  }

  /**
   * 导出调试数据
   */
  function exportData(exportConfig: ExportConfig): string {
    const data = filteredRecords.value
    
    switch (exportConfig.format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      
      case 'csv':
        const headers = ['timestamp', 'level', 'type', 'eventName', 'message', 'duration']
        if (exportConfig.includeMetadata) headers.push('metadata')
        if (exportConfig.includeStack) headers.push('stack')
        
        const csvRows = [headers.join(',')]
        data.forEach(record => {
          const row = [
            new Date(record.timestamp).toISOString(),
            record.level,
            record.type,
            record.eventName,
            `"${record.message.replace(/"/g, '""')}"`,
            record.duration || ''
          ]
          if (exportConfig.includeMetadata) {
            row.push(`"${JSON.stringify(record.metadata).replace(/"/g, '""')}"`)
          }
          if (exportConfig.includeStack) {
            row.push(`"${(record.stack || '').replace(/"/g, '""')}"`)
          }
          csvRows.push(row.join(','))
        })
        return csvRows.join('\n')
      
      case 'txt':
        return data.map(record => {
          const timestamp = new Date(record.timestamp).toISOString()
          let line = `[${timestamp}] [${record.level.toUpperCase()}] [${record.type}] ${record.eventName}: ${record.message}`
          if (record.duration) {
            line += ` (${record.duration.toFixed(2)}ms)`
          }
          return line
        }).join('\n')
      
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  /**
   * 获取事件流可视化数据
   */
  function getEventFlowData(eventId?: string): EventFlowNode[] {
    if (eventId) {
      const flow = eventFlows.get(eventId)
      return flow ? [flow] : []
    }
    return Array.from(eventFlows.values())
  }

  // 自动清理
  if (config.value.autoCleanup) {
    setInterval(() => {
      if (records.length > config.value.maxRecords) {
        const removeCount = Math.floor(config.value.maxRecords * 0.2) // 删除20%
        records.splice(0, removeCount)
      }
    }, config.value.cleanupInterval)
  }

  // 启动实时监控
  if (config.value.realTimeMonitoring) {
    startMonitoring()
  }

  return {
    // 状态
    config,
    filter,
    isMonitoring,
    
    // 数据
    records: readonly(records),
    filteredRecords,
    eventStats: readonly(eventStats),
    performanceMetrics: readonly(performanceMetrics),
    
    // 日志方法
    log,
    logEventTriggered,
    logEventCompleted,
    logEventFailed,
    logMiddlewareExecution,
    logRouteMatched,
    logTargetDispatched,
    logPerformanceIssue,
    
    // 事件流
    startEventFlow,
    addFlowNode,
    updateFlowNode,
    getEventFlowData,
    
    // 监控
    startMonitoring,
    stopMonitoring,
    
    // 工具
    clearRecords,
    exportData
  }
}

// 导出类型
export type {
  DebugLevel,
  DebugEventType,
  DebugRecord,
  PerformanceMetrics,
  EventFlowNode,
  EventStatistics,
  DebugConfig,
  DebugFilter,
  ExportConfig
}