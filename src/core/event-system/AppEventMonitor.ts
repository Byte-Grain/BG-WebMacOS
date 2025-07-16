/**
 * 应用事件监控和分析器
 * 实现事件系统的性能监控、统计分析和异常检测
 */

import type { EventName, EventData } from './useEventBus'
import type { AppLifecycleState } from './AppLifecycleManager'
import type { PermissionType } from './AppEventPermissionManager'

// 事件统计信息
export interface EventStats {
  eventName: string
  totalCount: number
  successCount: number
  errorCount: number
  avgProcessingTime: number
  maxProcessingTime: number
  minProcessingTime: number
  lastEventTime: number
  frequency: number // 每秒事件数
}

// 应用统计信息
export interface AppStats {
  appId: string
  appName: string
  totalEvents: number
  emittedEvents: number
  receivedEvents: number
  errorCount: number
  avgResponseTime: number
  uptime: number
  lastActivity: number
  lifecycleState: AppLifecycleState | null
  memoryUsage?: number
  cpuUsage?: number
}

// 系统统计信息
export interface SystemStats {
  totalApps: number
  activeApps: number
  totalEvents: number
  eventsPerSecond: number
  avgEventProcessingTime: number
  errorRate: number
  memoryUsage: number
  uptime: number
  lastUpdate: number
}

// 性能指标
export interface PerformanceMetrics {
  timestamp: number
  eventThroughput: number // 事件吞吐量
  eventLatency: number // 事件延迟
  memoryUsage: number // 内存使用量
  cpuUsage: number // CPU使用率
  errorRate: number // 错误率
  activeConnections: number // 活跃连接数
}

// 异常检测结果
export interface AnomalyDetection {
  id: string
  timestamp: number
  type: 'performance' | 'error' | 'security' | 'usage'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedApps: string[]
  metrics: Record<string, number>
  suggestions: string[]
  resolved: boolean
}

// 事件追踪信息
export interface EventTrace {
  id: string
  eventName: string
  sourceAppId: string
  targetAppId?: string
  timestamp: number
  processingTime: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
  stackTrace?: string[]
}

// 监控配置
export interface MonitorConfig {
  enablePerformanceMonitoring: boolean
  enableAnomalyDetection: boolean
  enableEventTracing: boolean
  maxTraceHistory: number
  anomalyThresholds: {
    errorRate: number
    responseTime: number
    memoryUsage: number
    eventFrequency: number
  }
  samplingRate: number // 采样率 (0-1)
}

// 应用事件监控器
export class AppEventMonitor {
  private eventStats = new Map<string, EventStats>()
  private appStats = new Map<string, AppStats>()
  private systemStats: SystemStats
  private performanceHistory: PerformanceMetrics[] = []
  private eventTraces: EventTrace[] = []
  private anomalies: AnomalyDetection[] = []
  private config: MonitorConfig
  private startTime: number
  private monitoringInterval: NodeJS.Timeout | null = null
  
  constructor(config?: Partial<MonitorConfig>) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableAnomalyDetection: true,
      enableEventTracing: true,
      maxTraceHistory: 10000,
      anomalyThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 1000, // 1秒
        memoryUsage: 0.8, // 80%
        eventFrequency: 1000 // 每秒1000个事件
      },
      samplingRate: 1.0,
      ...config
    }
    
    this.startTime = Date.now()
    this.systemStats = this.initializeSystemStats()
    
    this.startMonitoring()
  }
  
  // 初始化系统统计
  private initializeSystemStats(): SystemStats {
    return {
      totalApps: 0,
      activeApps: 0,
      totalEvents: 0,
      eventsPerSecond: 0,
      avgEventProcessingTime: 0,
      errorRate: 0,
      memoryUsage: 0,
      uptime: 0,
      lastUpdate: Date.now()
    }
  }
  
  // 记录事件
  recordEvent(
    eventName: string,
    sourceAppId: string,
    targetAppId?: string,
    processingTime?: number,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    const timestamp = Date.now()
    
    // 采样检查
    if (Math.random() > this.config.samplingRate) {
      return
    }
    
    // 更新事件统计
    this.updateEventStats(eventName, processingTime || 0, success)
    
    // 更新应用统计
    this.updateAppStats(sourceAppId, 'emit', success, processingTime)
    if (targetAppId) {
      this.updateAppStats(targetAppId, 'receive', success, processingTime)
    }
    
    // 记录事件追踪
    if (this.config.enableEventTracing) {
      this.recordEventTrace({
        id: this.generateTraceId(),
        eventName,
        sourceAppId,
        targetAppId,
        timestamp,
        processingTime: processingTime || 0,
        success,
        error,
        metadata
      })
    }
    
    // 更新系统统计
    this.updateSystemStats()
    
    // 异常检测
    if (this.config.enableAnomalyDetection) {
      this.detectAnomalies()
    }
  }
  
  // 更新事件统计
  private updateEventStats(eventName: string, processingTime: number, success: boolean): void {
    let stats = this.eventStats.get(eventName)
    
    if (!stats) {
      stats = {
        eventName,
        totalCount: 0,
        successCount: 0,
        errorCount: 0,
        avgProcessingTime: 0,
        maxProcessingTime: 0,
        minProcessingTime: Infinity,
        lastEventTime: 0,
        frequency: 0
      }
      this.eventStats.set(eventName, stats)
    }
    
    stats.totalCount++
    if (success) {
      stats.successCount++
    } else {
      stats.errorCount++
    }
    
    // 更新处理时间统计
    if (processingTime > 0) {
      stats.avgProcessingTime = (
        (stats.avgProcessingTime * (stats.totalCount - 1) + processingTime) / stats.totalCount
      )
      stats.maxProcessingTime = Math.max(stats.maxProcessingTime, processingTime)
      stats.minProcessingTime = Math.min(stats.minProcessingTime, processingTime)
    }
    
    stats.lastEventTime = Date.now()
    
    // 计算频率（最近1分钟）
    this.calculateEventFrequency(stats)
  }
  
  // 更新应用统计
  private updateAppStats(
    appId: string,
    action: 'emit' | 'receive',
    success: boolean,
    processingTime?: number
  ): void {
    let stats = this.appStats.get(appId)
    
    if (!stats) {
      stats = {
        appId,
        appName: appId, // 可以从应用注册信息获取
        totalEvents: 0,
        emittedEvents: 0,
        receivedEvents: 0,
        errorCount: 0,
        avgResponseTime: 0,
        uptime: 0,
        lastActivity: 0,
        lifecycleState: null
      }
      this.appStats.set(appId, stats)
    }
    
    stats.totalEvents++
    if (action === 'emit') {
      stats.emittedEvents++
    } else {
      stats.receivedEvents++
    }
    
    if (!success) {
      stats.errorCount++
    }
    
    // 更新响应时间
    if (processingTime && processingTime > 0) {
      const totalResponseTime = stats.avgResponseTime * (stats.totalEvents - 1) + processingTime
      stats.avgResponseTime = totalResponseTime / stats.totalEvents
    }
    
    stats.lastActivity = Date.now()
  }
  
  // 记录事件追踪
  private recordEventTrace(trace: EventTrace): void {
    this.eventTraces.push(trace)
    
    // 保持追踪历史在限制范围内
    if (this.eventTraces.length > this.config.maxTraceHistory) {
      this.eventTraces = this.eventTraces.slice(-this.config.maxTraceHistory / 2)
    }
  }
  
  // 更新系统统计
  private updateSystemStats(): void {
    const now = Date.now()
    const totalEvents = Array.from(this.eventStats.values())
      .reduce((sum, stats) => sum + stats.totalCount, 0)
    
    const totalErrors = Array.from(this.eventStats.values())
      .reduce((sum, stats) => sum + stats.errorCount, 0)
    
    const avgProcessingTime = this.calculateAverageProcessingTime()
    
    this.systemStats = {
      totalApps: this.appStats.size,
      activeApps: this.getActiveAppsCount(),
      totalEvents,
      eventsPerSecond: this.calculateEventsPerSecond(),
      avgEventProcessingTime: avgProcessingTime,
      errorRate: totalEvents > 0 ? totalErrors / totalEvents : 0,
      memoryUsage: this.getMemoryUsage(),
      uptime: now - this.startTime,
      lastUpdate: now
    }
  }
  
  // 计算事件频率
  private calculateEventFrequency(stats: EventStats): void {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    const recentTraces = this.eventTraces.filter(
      trace => trace.eventName === stats.eventName && trace.timestamp > oneMinuteAgo
    )
    
    stats.frequency = recentTraces.length / 60 // 每秒事件数
  }
  
  // 计算平均处理时间
  private calculateAverageProcessingTime(): number {
    const stats = Array.from(this.eventStats.values())
    if (stats.length === 0) return 0
    
    const totalTime = stats.reduce((sum, stat) => sum + stat.avgProcessingTime * stat.totalCount, 0)
    const totalCount = stats.reduce((sum, stat) => sum + stat.totalCount, 0)
    
    return totalCount > 0 ? totalTime / totalCount : 0
  }
  
  // 计算每秒事件数
  private calculateEventsPerSecond(): number {
    const now = Date.now()
    const oneSecondAgo = now - 1000
    
    const recentEvents = this.eventTraces.filter(trace => trace.timestamp > oneSecondAgo)
    return recentEvents.length
  }
  
  // 获取活跃应用数量
  private getActiveAppsCount(): number {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    
    return Array.from(this.appStats.values())
      .filter(stats => stats.lastActivity > fiveMinutesAgo)
      .length
  }
  
  // 获取内存使用量
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / memory.totalJSHeapSize
    }
    return 0
  }
  
  // 异常检测
  private detectAnomalies(): void {
    const now = Date.now()
    const thresholds = this.config.anomalyThresholds
    
    // 检测错误率异常
    if (this.systemStats.errorRate > thresholds.errorRate) {
      this.recordAnomaly({
        type: 'error',
        severity: this.systemStats.errorRate > thresholds.errorRate * 2 ? 'critical' : 'high',
        description: `High error rate detected: ${(this.systemStats.errorRate * 100).toFixed(2)}%`,
        affectedApps: this.getHighErrorApps(),
        metrics: { errorRate: this.systemStats.errorRate },
        suggestions: [
          'Check application logs for error patterns',
          'Review recent code changes',
          'Monitor system resources'
        ]
      })
    }
    
    // 检测响应时间异常
    if (this.systemStats.avgEventProcessingTime > thresholds.responseTime) {
      this.recordAnomaly({
        type: 'performance',
        severity: this.systemStats.avgEventProcessingTime > thresholds.responseTime * 2 ? 'high' : 'medium',
        description: `High response time detected: ${this.systemStats.avgEventProcessingTime.toFixed(2)}ms`,
        affectedApps: this.getSlowApps(),
        metrics: { responseTime: this.systemStats.avgEventProcessingTime },
        suggestions: [
          'Optimize event handlers',
          'Check for blocking operations',
          'Consider event batching'
        ]
      })
    }
    
    // 检测内存使用异常
    if (this.systemStats.memoryUsage > thresholds.memoryUsage) {
      this.recordAnomaly({
        type: 'performance',
        severity: this.systemStats.memoryUsage > 0.9 ? 'critical' : 'high',
        description: `High memory usage detected: ${(this.systemStats.memoryUsage * 100).toFixed(2)}%`,
        affectedApps: [],
        metrics: { memoryUsage: this.systemStats.memoryUsage },
        suggestions: [
          'Check for memory leaks',
          'Review event listener cleanup',
          'Consider garbage collection'
        ]
      })
    }
    
    // 检测事件频率异常
    if (this.systemStats.eventsPerSecond > thresholds.eventFrequency) {
      this.recordAnomaly({
        type: 'usage',
        severity: 'medium',
        description: `High event frequency detected: ${this.systemStats.eventsPerSecond} events/sec`,
        affectedApps: this.getHighFrequencyApps(),
        metrics: { eventFrequency: this.systemStats.eventsPerSecond },
        suggestions: [
          'Review event emission patterns',
          'Consider event throttling',
          'Optimize event handlers'
        ]
      })
    }
  }
  
  // 记录异常
  private recordAnomaly(anomaly: Omit<AnomalyDetection, 'id' | 'timestamp' | 'resolved'>): void {
    const fullAnomaly: AnomalyDetection = {
      id: this.generateAnomalyId(),
      timestamp: Date.now(),
      resolved: false,
      ...anomaly
    }
    
    this.anomalies.push(fullAnomaly)
    
    // 保持异常记录在合理范围内
    if (this.anomalies.length > 1000) {
      this.anomalies = this.anomalies.slice(-500)
    }
    
    // 触发异常事件（如果有全局事件总线）
    this.emitAnomalyEvent(fullAnomaly)
  }
  
  // 获取高错误率应用
  private getHighErrorApps(): string[] {
    return Array.from(this.appStats.values())
      .filter(stats => stats.totalEvents > 0 && stats.errorCount / stats.totalEvents > 0.1)
      .map(stats => stats.appId)
  }
  
  // 获取慢响应应用
  private getSlowApps(): string[] {
    return Array.from(this.appStats.values())
      .filter(stats => stats.avgResponseTime > this.config.anomalyThresholds.responseTime)
      .map(stats => stats.appId)
  }
  
  // 获取高频率应用
  private getHighFrequencyApps(): string[] {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    const appEventCounts = new Map<string, number>()
    
    this.eventTraces
      .filter(trace => trace.timestamp > oneMinuteAgo)
      .forEach(trace => {
        const count = appEventCounts.get(trace.sourceAppId) || 0
        appEventCounts.set(trace.sourceAppId, count + 1)
      })
    
    return Array.from(appEventCounts.entries())
      .filter(([, count]) => count > 60) // 超过每秒1个事件
      .map(([appId]) => appId)
  }
  
  // 生成追踪ID
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // 生成异常ID
  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // 触发异常事件
  private emitAnomalyEvent(anomaly: AnomalyDetection): void {
    // 这里可以集成到全局事件系统
    console.warn('Anomaly detected:', anomaly)
  }
  
  // 开始监控
  private startMonitoring(): void {
    if (this.config.enablePerformanceMonitoring) {
      this.monitoringInterval = setInterval(() => {
        this.collectPerformanceMetrics()
        this.updateSystemStats()
      }, 5000) // 每5秒收集一次性能指标
    }
  }
  
  // 收集性能指标
  private collectPerformanceMetrics(): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      eventThroughput: this.systemStats.eventsPerSecond,
      eventLatency: this.systemStats.avgEventProcessingTime,
      memoryUsage: this.systemStats.memoryUsage,
      cpuUsage: 0, // 浏览器环境无法直接获取CPU使用率
      errorRate: this.systemStats.errorRate,
      activeConnections: this.systemStats.activeApps
    }
    
    this.performanceHistory.push(metrics)
    
    // 保持历史记录在合理范围内（最近24小时）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.performanceHistory = this.performanceHistory.filter(
      metric => metric.timestamp > oneDayAgo
    )
  }
  
  // 公共API方法
  
  // 获取事件统计
  getEventStats(eventName?: string): EventStats[] {
    if (eventName) {
      const stats = this.eventStats.get(eventName)
      return stats ? [stats] : []
    }
    return Array.from(this.eventStats.values())
  }
  
  // 获取应用统计
  getAppStats(appId?: string): AppStats[] {
    if (appId) {
      const stats = this.appStats.get(appId)
      return stats ? [stats] : []
    }
    return Array.from(this.appStats.values())
  }
  
  // 获取系统统计
  getSystemStats(): SystemStats {
    return { ...this.systemStats }
  }
  
  // 获取性能历史
  getPerformanceHistory(duration?: number): PerformanceMetrics[] {
    if (!duration) {
      return [...this.performanceHistory]
    }
    
    const cutoff = Date.now() - duration
    return this.performanceHistory.filter(metric => metric.timestamp > cutoff)
  }
  
  // 获取事件追踪
  getEventTraces(filters?: {
    eventName?: string
    sourceAppId?: string
    targetAppId?: string
    success?: boolean
    limit?: number
  }): EventTrace[] {
    let traces = [...this.eventTraces]
    
    if (filters) {
      if (filters.eventName) {
        traces = traces.filter(trace => trace.eventName === filters.eventName)
      }
      if (filters.sourceAppId) {
        traces = traces.filter(trace => trace.sourceAppId === filters.sourceAppId)
      }
      if (filters.targetAppId) {
        traces = traces.filter(trace => trace.targetAppId === filters.targetAppId)
      }
      if (filters.success !== undefined) {
        traces = traces.filter(trace => trace.success === filters.success)
      }
      if (filters.limit) {
        traces = traces.slice(-filters.limit)
      }
    }
    
    return traces.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  // 获取异常检测结果
  getAnomalies(filters?: {
    type?: string
    severity?: string
    resolved?: boolean
    limit?: number
  }): AnomalyDetection[] {
    let anomalies = [...this.anomalies]
    
    if (filters) {
      if (filters.type) {
        anomalies = anomalies.filter(anomaly => anomaly.type === filters.type)
      }
      if (filters.severity) {
        anomalies = anomalies.filter(anomaly => anomaly.severity === filters.severity)
      }
      if (filters.resolved !== undefined) {
        anomalies = anomalies.filter(anomaly => anomaly.resolved === filters.resolved)
      }
      if (filters.limit) {
        anomalies = anomalies.slice(-filters.limit)
      }
    }
    
    return anomalies.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  // 标记异常为已解决
  resolveAnomaly(anomalyId: string): boolean {
    const anomaly = this.anomalies.find(a => a.id === anomalyId)
    if (anomaly) {
      anomaly.resolved = true
      return true
    }
    return false
  }
  
  // 清理历史数据
  cleanup(): void {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    
    // 清理事件追踪
    this.eventTraces = this.eventTraces.filter(trace => trace.timestamp > oneDayAgo)
    
    // 清理性能历史
    this.performanceHistory = this.performanceHistory.filter(
      metric => metric.timestamp > oneDayAgo
    )
    
    // 清理已解决的异常（保留最近7天）
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    this.anomalies = this.anomalies.filter(
      anomaly => !anomaly.resolved || anomaly.timestamp > oneWeekAgo
    )
  }
  
  // 停止监控
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }
  
  // 导出监控数据
  exportData(): any {
    return {
      timestamp: Date.now(),
      config: this.config,
      systemStats: this.systemStats,
      eventStats: Array.from(this.eventStats.entries()),
      appStats: Array.from(this.appStats.entries()),
      performanceHistory: this.performanceHistory,
      anomalies: this.anomalies,
      eventTraces: this.eventTraces.slice(-1000) // 只导出最近1000条追踪
    }
  }
}

// 创建默认的监控器实例
let defaultMonitor: AppEventMonitor | null = null

// 获取默认监控器
export function getAppEventMonitor(config?: Partial<MonitorConfig>): AppEventMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new AppEventMonitor(config)
  }
  return defaultMonitor
}

// 重置默认监控器（主要用于测试）
export function resetAppEventMonitor(): void {
  if (defaultMonitor) {
    defaultMonitor.stop()
    defaultMonitor = null
  }
}