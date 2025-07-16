/**
 * 事件生命周期管理系统
 * 提供事件状态跟踪、持久化和恢复功能
 */

import { ref, reactive, computed } from 'vue'
import type { EventName, EventData } from './useEventBus'

// 事件状态
export type EventStatus = 
  | 'pending'     // 等待处理
  | 'processing'  // 正在处理
  | 'completed'   // 已完成
  | 'failed'      // 处理失败
  | 'timeout'     // 超时
  | 'cancelled'   // 已取消
  | 'retrying'    // 重试中

// 事件生命周期阶段
export type LifecyclePhase = 
  | 'created'     // 事件创建
  | 'queued'      // 加入队列
  | 'started'     // 开始处理
  | 'middleware'  // 中间件处理
  | 'routing'     // 路由分发
  | 'executing'   // 执行处理器
  | 'completed'   // 处理完成
  | 'cleanup'     // 清理阶段

// 事件生命周期记录
export interface EventLifecycleRecord {
  id: string
  eventName: string
  eventData: any
  status: EventStatus
  phase: LifecyclePhase
  createdAt: number
  startedAt?: number
  completedAt?: number
  duration?: number
  error?: Error
  retryCount: number
  maxRetries: number
  timeout: number
  priority: number
  source?: string
  metadata: Record<string, any>
  checkpoints: LifecycleCheckpoint[]
  dependencies: string[]
  dependents: string[]
}

// 生命周期检查点
export interface LifecycleCheckpoint {
  phase: LifecyclePhase
  timestamp: number
  duration: number
  success: boolean
  error?: Error
  metadata?: Record<string, any>
}

// 事件持久化配置
export interface PersistenceConfig {
  enabled: boolean
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
  maxRecords: number
  ttl: number // 生存时间（毫秒）
  compression: boolean
  encryption: boolean
}

// 事件恢复配置
export interface RecoveryConfig {
  enabled: boolean
  autoRecover: boolean
  recoverOnStartup: boolean
  maxRecoveryAttempts: number
  recoveryDelay: number
}

// 清理策略
export interface CleanupStrategy {
  enabled: boolean
  interval: number // 清理间隔（毫秒）
  maxAge: number   // 最大保留时间（毫秒）
  maxRecords: number
  keepSuccessful: boolean
  keepFailed: boolean
}

// 生命周期统计
export interface LifecycleStats {
  totalEvents: number
  activeEvents: number
  completedEvents: number
  failedEvents: number
  timeoutEvents: number
  cancelledEvents: number
  averageProcessingTime: number
  averageQueueTime: number
  successRate: number
  retryRate: number
}

// 事件依赖关系
export interface EventDependency {
  eventId: string
  dependsOn: string[]
  dependents: string[]
  resolved: boolean
}

/**
 * 事件生命周期管理组合式函数
 */
export function useEventLifecycle() {
  // 事件记录存储
  const records = reactive<Map<string, EventLifecycleRecord>>(new Map())
  
  // 事件依赖关系
  const dependencies = reactive<Map<string, EventDependency>>(new Map())
  
  // 等待队列
  const pendingQueue = reactive<string[]>([])
  
  // 处理中的事件
  const processingEvents = reactive<Set<string>>(new Set())
  
  // 统计信息
  const stats = reactive<LifecycleStats>({
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    failedEvents: 0,
    timeoutEvents: 0,
    cancelledEvents: 0,
    averageProcessingTime: 0,
    averageQueueTime: 0,
    successRate: 0,
    retryRate: 0
  })

  // 配置
  const persistenceConfig = ref<PersistenceConfig>({
    enabled: true,
    storage: 'localStorage',
    maxRecords: 10000,
    ttl: 24 * 60 * 60 * 1000, // 24小时
    compression: false,
    encryption: false
  })

  const recoveryConfig = ref<RecoveryConfig>({
    enabled: true,
    autoRecover: true,
    recoverOnStartup: true,
    maxRecoveryAttempts: 3,
    recoveryDelay: 5000
  })

  const cleanupStrategy = ref<CleanupStrategy>({
    enabled: true,
    interval: 60 * 60 * 1000, // 1小时
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxRecords: 50000,
    keepSuccessful: true,
    keepFailed: true
  })

  // 是否启用生命周期管理
  const enabled = ref(true)

  /**
   * 创建事件记录
   */
  function createEventRecord<T extends EventName>(
    eventName: T,
    eventData: EventData<T>,
    options: {
      priority?: number
      timeout?: number
      maxRetries?: number
      source?: string
      metadata?: Record<string, any>
      dependencies?: string[]
    } = {}
  ): string {
    if (!enabled.value) {
      return ''
    }

    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const record: EventLifecycleRecord = {
      id,
      eventName,
      eventData,
      status: 'pending',
      phase: 'created',
      createdAt: now,
      duration: 0,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000,
      priority: options.priority || 0,
      source: options.source,
      metadata: options.metadata || {},
      checkpoints: [{
        phase: 'created',
        timestamp: now,
        duration: 0,
        success: true
      }],
      dependencies: options.dependencies || [],
      dependents: []
    }

    records.set(id, record)
    
    // 处理依赖关系
    if (options.dependencies && options.dependencies.length > 0) {
      setupDependencies(id, options.dependencies)
    }
    
    // 添加到队列
    if (canProcessEvent(id)) {
      pendingQueue.push(id)
      updatePhase(id, 'queued')
    }

    updateStats()
    
    // 持久化
    if (persistenceConfig.value.enabled) {
      persistEvent(record)
    }

    return id
  }

  /**
   * 更新事件状态
   */
  function updateStatus(eventId: string, status: EventStatus, error?: Error): boolean {
    const record = records.get(eventId)
    if (!record) {
      return false
    }

    const previousStatus = record.status
    record.status = status

    if (error) {
      record.error = error
    }

    // 更新时间戳
    const now = Date.now()
    if (status === 'processing' && !record.startedAt) {
      record.startedAt = now
    } else if (['completed', 'failed', 'timeout', 'cancelled'].includes(status)) {
      record.completedAt = now
      record.duration = record.startedAt ? now - record.startedAt : 0
      processingEvents.delete(eventId)
      
      // 解锁依赖的事件
      if (status === 'completed') {
        resolveDependencies(eventId)
      }
    }

    // 添加检查点
    addCheckpoint(eventId, record.phase, true)

    updateStats()
    
    // 持久化更新
    if (persistenceConfig.value.enabled) {
      persistEvent(record)
    }

    return true
  }

  /**
   * 更新事件阶段
   */
  function updatePhase(eventId: string, phase: LifecyclePhase, metadata?: Record<string, any>): boolean {
    const record = records.get(eventId)
    if (!record) {
      return false
    }

    const previousPhase = record.phase
    record.phase = phase

    if (metadata) {
      record.metadata = { ...record.metadata, ...metadata }
    }

    // 添加检查点
    addCheckpoint(eventId, phase, true, undefined, metadata)

    return true
  }

  /**
   * 添加检查点
   */
  function addCheckpoint(
    eventId: string,
    phase: LifecyclePhase,
    success: boolean,
    error?: Error,
    metadata?: Record<string, any>
  ): boolean {
    const record = records.get(eventId)
    if (!record) {
      return false
    }

    const now = Date.now()
    const lastCheckpoint = record.checkpoints[record.checkpoints.length - 1]
    const duration = lastCheckpoint ? now - lastCheckpoint.timestamp : 0

    const checkpoint: LifecycleCheckpoint = {
      phase,
      timestamp: now,
      duration,
      success,
      error,
      metadata
    }

    record.checkpoints.push(checkpoint)
    return true
  }

  /**
   * 开始处理事件
   */
  function startProcessing(eventId: string): boolean {
    const record = records.get(eventId)
    if (!record || record.status !== 'pending') {
      return false
    }

    // 检查依赖是否已解决
    if (!canProcessEvent(eventId)) {
      return false
    }

    // 从队列中移除
    const queueIndex = pendingQueue.indexOf(eventId)
    if (queueIndex !== -1) {
      pendingQueue.splice(queueIndex, 1)
    }

    // 更新状态
    processingEvents.add(eventId)
    updateStatus(eventId, 'processing')
    updatePhase(eventId, 'started')

    // 设置超时
    if (record.timeout > 0) {
      setTimeout(() => {
        if (processingEvents.has(eventId)) {
          timeoutEvent(eventId)
        }
      }, record.timeout)
    }

    return true
  }

  /**
   * 完成事件处理
   */
  function completeEvent(eventId: string, result?: any): boolean {
    const record = records.get(eventId)
    if (!record || !processingEvents.has(eventId)) {
      return false
    }

    if (result !== undefined) {
      record.metadata.result = result
    }

    updateStatus(eventId, 'completed')
    updatePhase(eventId, 'completed')

    return true
  }

  /**
   * 事件处理失败
   */
  function failEvent(eventId: string, error: Error): boolean {
    const record = records.get(eventId)
    if (!record) {
      return false
    }

    record.retryCount++
    
    // 检查是否可以重试
    if (record.retryCount <= record.maxRetries) {
      updateStatus(eventId, 'retrying', error)
      
      // 延迟重试
      setTimeout(() => {
        if (records.has(eventId)) {
          retryEvent(eventId)
        }
      }, getRetryDelay(record.retryCount))
    } else {
      updateStatus(eventId, 'failed', error)
      updatePhase(eventId, 'completed')
    }

    return true
  }

  /**
   * 事件超时
   */
  function timeoutEvent(eventId: string): boolean {
    const record = records.get(eventId)
    if (!record || !processingEvents.has(eventId)) {
      return false
    }

    updateStatus(eventId, 'timeout', new Error('Event processing timeout'))
    updatePhase(eventId, 'completed')

    return true
  }

  /**
   * 取消事件
   */
  function cancelEvent(eventId: string, reason?: string): boolean {
    const record = records.get(eventId)
    if (!record) {
      return false
    }

    // 从队列中移除
    const queueIndex = pendingQueue.indexOf(eventId)
    if (queueIndex !== -1) {
      pendingQueue.splice(queueIndex, 1)
    }

    processingEvents.delete(eventId)
    
    const error = new Error(reason || 'Event cancelled')
    updateStatus(eventId, 'cancelled', error)
    updatePhase(eventId, 'completed')

    return true
  }

  /**
   * 重试事件
   */
  function retryEvent(eventId: string): boolean {
    const record = records.get(eventId)
    if (!record || record.status !== 'retrying') {
      return false
    }

    // 重置状态
    updateStatus(eventId, 'pending')
    updatePhase(eventId, 'queued')
    
    // 重新加入队列
    if (canProcessEvent(eventId)) {
      pendingQueue.push(eventId)
    }

    return true
  }

  /**
   * 设置事件依赖
   */
  function setupDependencies(eventId: string, dependsOn: string[]): void {
    const dependency: EventDependency = {
      eventId,
      dependsOn: [...dependsOn],
      dependents: [],
      resolved: false
    }

    dependencies.set(eventId, dependency)

    // 更新被依赖事件的依赖者列表
    for (const depId of dependsOn) {
      const depRecord = dependencies.get(depId)
      if (depRecord) {
        depRecord.dependents.push(eventId)
      }
    }
  }

  /**
   * 检查事件是否可以处理
   */
  function canProcessEvent(eventId: string): boolean {
    const dependency = dependencies.get(eventId)
    if (!dependency) {
      return true
    }

    // 检查所有依赖是否已完成
    for (const depId of dependency.dependsOn) {
      const depRecord = records.get(depId)
      if (!depRecord || depRecord.status !== 'completed') {
        return false
      }
    }

    return true
  }

  /**
   * 解决依赖关系
   */
  function resolveDependencies(eventId: string): void {
    const dependency = dependencies.get(eventId)
    if (!dependency) {
      return
    }

    dependency.resolved = true

    // 检查依赖此事件的其他事件
    for (const dependentId of dependency.dependents) {
      if (canProcessEvent(dependentId)) {
        const record = records.get(dependentId)
        if (record && record.status === 'pending') {
          pendingQueue.push(dependentId)
        }
      }
    }
  }

  /**
   * 获取重试延迟
   */
  function getRetryDelay(retryCount: number): number {
    // 指数退避算法
    return Math.min(1000 * Math.pow(2, retryCount - 1), 30000)
  }

  /**
   * 持久化事件
   */
  function persistEvent(record: EventLifecycleRecord): void {
    if (!persistenceConfig.value.enabled) {
      return
    }

    try {
      const key = `event_lifecycle_${record.id}`
      let data = JSON.stringify(record)

      // 压缩（简单实现）
      if (persistenceConfig.value.compression) {
        // 这里可以实现压缩算法
        data = data
      }

      // 加密（简单实现）
      if (persistenceConfig.value.encryption) {
        // 这里可以实现加密算法
        data = btoa(data)
      }

      switch (persistenceConfig.value.storage) {
        case 'localStorage':
          localStorage.setItem(key, data)
          break
        case 'sessionStorage':
          sessionStorage.setItem(key, data)
          break
        case 'indexedDB':
          // 这里可以实现 IndexedDB 存储
          break
        case 'memory':
        default:
          // 内存存储已经在 records 中
          break
      }
    } catch (error) {
      console.error('Failed to persist event:', error)
    }
  }

  /**
   * 恢复事件
   */
  function recoverEvents(): Promise<number> {
    return new Promise((resolve) => {
      if (!recoveryConfig.value.enabled || !persistenceConfig.value.enabled) {
        resolve(0)
        return
      }

      try {
        let recoveredCount = 0
        const storage = persistenceConfig.value.storage === 'localStorage' 
          ? localStorage 
          : sessionStorage

        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i)
          if (key && key.startsWith('event_lifecycle_')) {
            try {
              let data = storage.getItem(key) || ''
              
              // 解密
              if (persistenceConfig.value.encryption) {
                data = atob(data)
              }
              
              const record: EventLifecycleRecord = JSON.parse(data)
              
              // 检查是否过期
              const now = Date.now()
              if (now - record.createdAt > persistenceConfig.value.ttl) {
                storage.removeItem(key)
                continue
              }
              
              // 恢复未完成的事件
              if (['pending', 'processing', 'retrying'].includes(record.status)) {
                records.set(record.id, record)
                
                if (record.status === 'processing') {
                  // 重置为待处理状态
                  record.status = 'pending'
                  pendingQueue.push(record.id)
                }
                
                recoveredCount++
              }
            } catch (error) {
              console.error('Failed to recover event:', error)
              storage.removeItem(key)
            }
          }
        }
        
        updateStats()
        resolve(recoveredCount)
      } catch (error) {
        console.error('Failed to recover events:', error)
        resolve(0)
      }
    })
  }

  /**
   * 清理过期事件
   */
  function cleanupEvents(): number {
    if (!cleanupStrategy.value.enabled) {
      return 0
    }

    const now = Date.now()
    let cleanedCount = 0
    const toDelete: string[] = []

    for (const [id, record] of records.entries()) {
      const age = now - record.createdAt
      const shouldClean = 
        age > cleanupStrategy.value.maxAge ||
        (!cleanupStrategy.value.keepSuccessful && record.status === 'completed') ||
        (!cleanupStrategy.value.keepFailed && record.status === 'failed')

      if (shouldClean) {
        toDelete.push(id)
      }
    }

    // 如果记录数超过限制，删除最旧的记录
    if (records.size > cleanupStrategy.value.maxRecords) {
      const sortedRecords = Array.from(records.entries())
        .sort(([, a], [, b]) => a.createdAt - b.createdAt)
      
      const excessCount = records.size - cleanupStrategy.value.maxRecords
      for (let i = 0; i < excessCount; i++) {
        toDelete.push(sortedRecords[i][0])
      }
    }

    // 执行删除
    for (const id of toDelete) {
      records.delete(id)
      dependencies.delete(id)
      processingEvents.delete(id)
      
      // 从持久化存储中删除
      if (persistenceConfig.value.enabled) {
        const key = `event_lifecycle_${id}`
        try {
          if (persistenceConfig.value.storage === 'localStorage') {
            localStorage.removeItem(key)
          } else if (persistenceConfig.value.storage === 'sessionStorage') {
            sessionStorage.removeItem(key)
          }
        } catch (error) {
          console.error('Failed to remove persisted event:', error)
        }
      }
      
      cleanedCount++
    }

    updateStats()
    return cleanedCount
  }

  /**
   * 更新统计信息
   */
  function updateStats(): void {
    const allRecords = Array.from(records.values())
    
    stats.totalEvents = allRecords.length
    stats.activeEvents = allRecords.filter(r => 
      ['pending', 'processing', 'retrying'].includes(r.status)
    ).length
    stats.completedEvents = allRecords.filter(r => r.status === 'completed').length
    stats.failedEvents = allRecords.filter(r => r.status === 'failed').length
    stats.timeoutEvents = allRecords.filter(r => r.status === 'timeout').length
    stats.cancelledEvents = allRecords.filter(r => r.status === 'cancelled').length
    
    // 计算平均处理时间
    const completedRecords = allRecords.filter(r => 
      r.duration !== undefined && r.duration > 0
    )
    if (completedRecords.length > 0) {
      stats.averageProcessingTime = completedRecords.reduce((sum, r) => 
        sum + (r.duration || 0), 0
      ) / completedRecords.length
    }
    
    // 计算成功率
    const finishedEvents = stats.completedEvents + stats.failedEvents + stats.timeoutEvents
    stats.successRate = finishedEvents > 0 ? (stats.completedEvents / finishedEvents) * 100 : 0
    
    // 计算重试率
    const retriedEvents = allRecords.filter(r => r.retryCount > 0).length
    stats.retryRate = stats.totalEvents > 0 ? (retriedEvents / stats.totalEvents) * 100 : 0
  }

  /**
   * 获取事件记录
   */
  function getEventRecord(eventId: string): EventLifecycleRecord | undefined {
    return records.get(eventId)
  }

  /**
   * 获取所有事件记录
   */
  function getAllEventRecords(filter?: {
    status?: EventStatus[]
    phase?: LifecyclePhase[]
    source?: string
    timeRange?: { start: number; end: number }
  }): EventLifecycleRecord[] {
    let result = Array.from(records.values())
    
    if (filter) {
      if (filter.status) {
        result = result.filter(r => filter.status!.includes(r.status))
      }
      if (filter.phase) {
        result = result.filter(r => filter.phase!.includes(r.phase))
      }
      if (filter.source) {
        result = result.filter(r => r.source === filter.source)
      }
      if (filter.timeRange) {
        result = result.filter(r => 
          r.createdAt >= filter.timeRange!.start && 
          r.createdAt <= filter.timeRange!.end
        )
      }
    }
    
    return result.sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 获取待处理队列
   */
  function getPendingQueue(): string[] {
    return [...pendingQueue]
  }

  /**
   * 获取正在处理的事件
   */
  function getProcessingEvents(): string[] {
    return Array.from(processingEvents)
  }

  // 启动时恢复事件
  if (recoveryConfig.value.recoverOnStartup) {
    recoverEvents()
  }

  // 定期清理
  if (cleanupStrategy.value.enabled) {
    setInterval(() => {
      cleanupEvents()
    }, cleanupStrategy.value.interval)
  }

  return {
    // 状态
    enabled,
    stats: readonly(stats),
    persistenceConfig,
    recoveryConfig,
    cleanupStrategy,
    
    // 事件管理
    createEventRecord,
    updateStatus,
    updatePhase,
    addCheckpoint,
    startProcessing,
    completeEvent,
    failEvent,
    timeoutEvent,
    cancelEvent,
    retryEvent,
    
    // 依赖管理
    setupDependencies,
    canProcessEvent,
    
    // 查询
    getEventRecord,
    getAllEventRecords,
    getPendingQueue,
    getProcessingEvents,
    
    // 工具
    recoverEvents,
    cleanupEvents
  }
}

// 导出类型
export type {
  EventStatus,
  LifecyclePhase,
  EventLifecycleRecord,
  LifecycleCheckpoint,
  PersistenceConfig,
  RecoveryConfig,
  CleanupStrategy,
  LifecycleStats,
  EventDependency
}