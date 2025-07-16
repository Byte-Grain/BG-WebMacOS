import { ref, onUnmounted } from 'vue'

// 事件类型定义
export interface EventCallback<T = any> {
  (data: T): void
}

export interface EventListener<T = any> {
  id: string
  callback: EventCallback<T>
  once?: boolean
  priority?: number // 事件优先级
  namespace?: string // 事件命名空间
  context?: any // 上下文信息
  createdAt: number // 创建时间
}

// 事件统计信息
export interface EventStats {
  totalEvents: number
  totalListeners: number
  eventCounts: Record<string, number>
  memoryUsage: number
}

// 事件过滤器
export interface EventFilter {
  namespace?: string
  priority?: number
  pattern?: RegExp
}

// 增强的事件总线类
class EventBus implements TypeSafeEventBus {
  private events: Map<string, EventListener[]> = new Map()
  private eventId = 0
  private maxListeners = 100 // 单个事件最大监听器数量
  private enableStats = true // 是否启用统计
  private stats: EventStats = {
    totalEvents: 0,
    totalListeners: 0,
    eventCounts: {},
    memoryUsage: 0
  }
  private debugMode = false // 调试模式
  
  // 生成唯一事件监听器 ID
  private generateId(): string {
    return `event_${++this.eventId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 更新统计信息
  private updateStats(): void {
    if (!this.enableStats) return
    
    this.stats.totalListeners = Array.from(this.events.values())
      .reduce((total, listeners) => total + listeners.length, 0)
    
    this.stats.eventCounts = {}
    this.events.forEach((listeners, event) => {
      this.stats.eventCounts[event] = listeners.length
    })
    
    // 估算内存使用量（字节）
    this.stats.memoryUsage = JSON.stringify(this.stats.eventCounts).length * 2
  }

  // 验证监听器数量限制
  private validateListenerLimit(event: string): boolean {
    const listeners = this.events.get(event)
    if (listeners && listeners.length >= this.maxListeners) {
      console.warn(`Event '${event}' has reached maximum listeners limit (${this.maxListeners})`)
      return false
    }
    return true
  }

  // 调试日志
  private debug(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`[EventBus] ${message}`, data || '')
    }
  }

  // 设置配置
  setConfig(config: {
    maxListeners?: number
    enableStats?: boolean
    debugMode?: boolean
  }): void {
    if (config.maxListeners !== undefined) this.maxListeners = config.maxListeners
    if (config.enableStats !== undefined) this.enableStats = config.enableStats
    if (config.debugMode !== undefined) this.debugMode = config.debugMode
  }

  // 添加事件监听器（类型安全版本）
  on<T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options: {
      once?: boolean
      priority?: number
      namespace?: string
      context?: any
    } = {}
  ): string {
    if (!this.validateListenerLimit(event)) {
      throw new Error(`Cannot add more listeners to event '${event}'`)
    }

    const id = this.generateId()
    const listener: EventListener<EventData<T>> = {
      id,
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      namespace: options.namespace,
      context: options.context,
      createdAt: Date.now()
    }
    
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    
    const listeners = this.events.get(event)!
    listeners.push(listener)
    
    // 按优先级排序（高优先级先执行）
    listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    this.updateStats()
    this.debug(`Added listener for '${event}'`, { id, priority: listener.priority })
    
    return id
  }



  // 添加一次性事件监听器
  once<T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options: {
      priority?: number
      namespace?: string
      context?: any
    } = {}
  ): string {
    return this.on(event, callback, { ...options, once: true })
  }

  // 移除事件监听器
  off(event: string, listenerId?: string): boolean {
    const listeners = this.events.get(event)
    if (!listeners) return false

    if (listenerId) {
      // 移除特定监听器
      const index = listeners.findIndex(listener => listener.id === listenerId)
      if (index > -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          this.events.delete(event)
        }
        this.updateStats()
        this.debug(`Removed listener '${listenerId}' from '${event}'`)
        return true
      }
    } else {
      // 移除所有监听器
      this.events.delete(event)
      this.updateStats()
      this.debug(`Removed all listeners from '${event}'`)
      return true
    }
    
    return false
  }

  // 按过滤器移除监听器
  offByFilter(filter: EventFilter): number {
    let removedCount = 0
    
    this.events.forEach((listeners, event) => {
      const toRemove: number[] = []
      
      listeners.forEach((listener, index) => {
        let shouldRemove = true
        
        if (filter.namespace && listener.namespace !== filter.namespace) {
          shouldRemove = false
        }
        if (filter.priority !== undefined && listener.priority !== filter.priority) {
          shouldRemove = false
        }
        if (filter.pattern && !filter.pattern.test(event)) {
          shouldRemove = false
        }
        
        if (shouldRemove) {
          toRemove.push(index)
        }
      })
      
      // 从后往前删除，避免索引变化
      toRemove.reverse().forEach(index => {
        listeners.splice(index, 1)
        removedCount++
      })
      
      if (listeners.length === 0) {
        this.events.delete(event)
      }
    })
    
    this.updateStats()
    this.debug(`Removed ${removedCount} listeners by filter`, filter)
    
    return removedCount
  }

  // 触发事件（类型安全版本）
  emit<T extends EventName>(event: T, data: EventData<T>): void {
    const listeners = this.events.get(event)
    if (!listeners || listeners.length === 0) {
      this.debug(`No listeners for event '${event}'`)
      return
    }

    // 复制监听器数组，避免在执行过程中被修改
    const listenersToExecute = [...listeners]
    
    this.stats.totalEvents++
    this.debug(`Emitting event '${event}' to ${listenersToExecute.length} listeners`, data)
    
    listenersToExecute.forEach(listener => {
      try {
        listener.callback(data)
        
        // 如果是一次性监听器，执行后移除
        if (listener.once) {
          this.off(event, listener.id)
        }
      } catch (error) {
        console.error(`Error in event listener for '${event}' (ID: ${listener.id}):`, error)
        // 可选：移除出错的监听器
        // this.off(event, listener.id)
      }
    })
  }



  // 异步触发事件
  async emitAsync<T extends EventName>(event: T, data: EventData<T>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(event, data)
        resolve()
      }, 0)
    })
  }

  // 获取事件监听器数量
  listenerCount(event: string): number {
    const listeners = this.events.get(event)
    return listeners ? listeners.length : 0
  }

  // 获取所有事件名称
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }

  // 获取事件监听器详情
  getListeners(event: string): EventListener[] {
    return this.events.get(event) || []
  }

  // 获取统计信息
  getStats(): EventStats {
    this.updateStats()
    return { ...this.stats }
  }

  // 清理过期的监听器（超过指定时间未使用）
  cleanupStaleListeners(maxAge: number = 300000): number { // 默认5分钟
    const now = Date.now()
    let removedCount = 0
    
    this.events.forEach((listeners, event) => {
      const toRemove: number[] = []
      
      listeners.forEach((listener, index) => {
        if (now - listener.createdAt > maxAge) {
          toRemove.push(index)
        }
      })
      
      toRemove.reverse().forEach(index => {
        listeners.splice(index, 1)
        removedCount++
      })
      
      if (listeners.length === 0) {
        this.events.delete(event)
      }
    })
    
    this.updateStats()
    this.debug(`Cleaned up ${removedCount} stale listeners`)
    
    return removedCount
  }

  // 清除所有事件监听器
  clear(): void {
    this.events.clear()
    this.stats = {
      totalEvents: 0,
      totalListeners: 0,
      eventCounts: {},
      memoryUsage: 0
    }
    this.debug('Cleared all events and listeners')
  }

  // 清除特定事件的所有监听器
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
      this.debug(`Removed all listeners from '${event}'`)
    } else {
      this.clear()
    }
    this.updateStats()
  }

  // 检查事件是否存在监听器
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0
  }

  // 等待事件触发（Promise版本）
  waitFor<T extends EventName>(
    event: T,
    timeout?: number
  ): Promise<EventData<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined
      
      const listenerId = this.once(event, (data) => {
        if (timeoutId) clearTimeout(timeoutId)
        resolve(data)
      })
      
      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(event, listenerId)
          reject(new Error(`Timeout waiting for event '${event}'`))
        }, timeout)
      }
    })
  }

  // 按命名空间清理监听器
  clearNamespace(namespace: string): number {
    let removedCount = 0
    
    this.events.forEach((listeners, event) => {
      const originalLength = listeners.length
      const filteredListeners = listeners.filter(listener => 
        listener.namespace !== namespace
      )
      
      if (filteredListeners.length !== originalLength) {
        this.events.set(event, filteredListeners)
        removedCount += originalLength - filteredListeners.length
        
        // 如果没有监听器了，删除事件
        if (filteredListeners.length === 0) {
          this.events.delete(event)
        }
      }
    })
    
    this.updateStats()
    this.debug(`Cleared ${removedCount} listeners from namespace '${namespace}'`)
    
    return removedCount
  }

  // 获取指定命名空间的监听器数量
  getNamespaceListenerCount(namespace: string): number {
    let count = 0
    
    this.events.forEach(listeners => {
      count += listeners.filter(listener => 
        listener.namespace === namespace
      ).length
    })
    
    return count
  }

  // 获取所有命名空间
  getNamespaces(): string[] {
    const namespaces = new Set<string>()
    
    this.events.forEach(listeners => {
      listeners.forEach(listener => {
        if (listener.namespace) {
          namespaces.add(listener.namespace)
        }
      })
    })
    
    return Array.from(namespaces)
  }
}

// ============ 实用中间件和验证器 ============

/**
 * 日志中间件 - 记录所有事件的发送和接收
 */
export class LoggingMiddleware implements EventMiddleware {
  constructor(private prefix = '[EventBus]') {}
  
  beforeEmit<T extends EventName>(eventName: T, data: EventDataMap[T]): EventDataMap[T] {
    console.log(`${this.prefix} Emitting event: ${eventName}`, data)
    return data
  }
  
  afterEmit<T extends EventName>(eventName: T, data: EventDataMap[T], results: any[]): void {
    console.log(`${this.prefix} Event ${eventName} processed by ${results.length} listeners`)
  }
}

/**
 * 性能监控中间件 - 监控事件处理性能
 */
export class PerformanceMiddleware implements EventMiddleware {
  private timers = new Map<string, number>()
  
  beforeEmit<T extends EventName>(eventName: T, data: EventDataMap[T]): EventDataMap[T] {
    const timerId = `${eventName}-${Date.now()}`
    this.timers.set(timerId, performance.now())
    return data
  }
  
  afterEmit<T extends EventName>(eventName: T, data: EventDataMap[T], results: any[]): void {
    const timerId = Array.from(this.timers.keys()).find(key => key.startsWith(eventName))
    if (timerId) {
      const startTime = this.timers.get(timerId)!
      const duration = performance.now() - startTime
      console.log(`[Performance] Event ${eventName} took ${duration.toFixed(2)}ms`)
      this.timers.delete(timerId)
    }
  }
}

/**
 * 错误处理中间件 - 统一处理事件错误
 */
export class ErrorHandlingMiddleware implements EventMiddleware {
  constructor(private onError?: (error: Error, eventName: EventName) => void) {}
  
  afterCallback<T extends EventName>(
    eventName: T,
    data: EventDataMap[T],
    result: any,
    callback: EventCallback<EventDataMap[T]>
  ): any {
    if (result instanceof Error) {
      console.error(`[ErrorHandling] Error in event ${eventName}:`, result)
      this.onError?.(result, eventName)
    }
    return result
  }
}

/**
 * 基础数据验证器 - 验证数据是否为对象且非空
 */
export class BaseDataValidator<T extends EventName> implements EventValidator<T> {
  validate(data: EventDataMap[T]): boolean {
    return data !== null && data !== undefined && typeof data === 'object'
  }
  
  sanitize(data: EventDataMap[T]): EventDataMap[T] {
    return data
  }
  
  getErrors(data: EventDataMap[T]): string[] {
    const errors: string[] = []
    if (data === null || data === undefined) {
      errors.push('Data cannot be null or undefined')
    }
    if (typeof data !== 'object') {
      errors.push('Data must be an object')
    }
    return errors
  }
}

/**
 * 窗口事件验证器 - 验证窗口相关事件数据
 */
export class WindowEventValidator implements EventValidator<'WINDOW_RESIZE' | 'WINDOW_FOCUS' | 'WINDOW_BLUR'> {
  validate(data: any): boolean {
    return data && typeof data === 'object' && 
           typeof data.width === 'number' && 
           typeof data.height === 'number'
  }
  
  sanitize(data: any): any {
    return {
      width: Math.max(0, Math.floor(data.width || 0)),
      height: Math.max(0, Math.floor(data.height || 0)),
      timestamp: data.timestamp || Date.now()
    }
  }
  
  getErrors(data: any): string[] {
    const errors: string[] = []
    if (!data || typeof data !== 'object') {
      errors.push('Window event data must be an object')
    } else {
      if (typeof data.width !== 'number') {
        errors.push('Width must be a number')
      }
      if (typeof data.height !== 'number') {
        errors.push('Height must be a number')
      }
    }
    return errors
  }
}

// ============ 增强的事件总线实现 ============

/**
 * 命名空间事件总线
 */
export class NamespaceEventBus {
  constructor(
    private eventBus: TypeSafeEventBus,
    private namespace: string
  ) {}
  
  /**
   * 命名空间内的事件监听
   */
  on<T extends EventName>(
    event: T,
    callback: EventCallback<EventDataMap[T]>,
    options?: Omit<EventListenerOptions, 'once'>
  ): string {
    return (this.eventBus as any).on(event, callback, {
      ...options,
      namespace: this.namespace
    })
  }
  
  /**
   * 命名空间内的一次性事件监听
   */
  once<T extends EventName>(
    event: T,
    callback: EventCallback<EventDataMap[T]>,
    options?: Omit<EventListenerOptions, 'once'>
  ): string {
    return (this.eventBus as any).once(event, callback, {
      ...options,
      namespace: this.namespace
    })
  }
  
  /**
   * 命名空间内的事件触发
   */
  emit<T extends EventName>(event: T, data: EventDataMap[T]): Promise<any[]> {
    return this.eventBus.emit(event, data)
  }
  
  /**
   * 移除命名空间内的事件监听器
   */
  off(event: EventName, listenerId?: string): boolean {
    return (this.eventBus as any).off(event, listenerId)
  }
  
  /**
   * 清理命名空间内的所有监听器
   */
  cleanup(): number {
    return (this.eventBus as any).clearNamespace?.(this.namespace) || 0
  }
  
  /**
   * 获取命名空间内的监听器数量
   */
  listenerCount(event: EventName): number {
    return this.eventBus.listenerCount(event)
  }
  
  /**
   * 检查命名空间内是否有监听器
   */
  hasListeners(event: EventName): boolean {
    return this.eventBus.hasListeners(event)
  }
}

/**
 * 命名空间事件管理器
 */
export class NamespacedEventManager {
  private namespaceEventBuses = new Map<string, NamespaceEventBus>()
  
  constructor(private eventBus: TypeSafeEventBus) {}
  
  /**
   * 获取命名空间事件总线
   */
  getNamespaceEventBus(namespace: string): NamespaceEventBus {
    if (!this.namespaceEventBuses.has(namespace)) {
      this.namespaceEventBuses.set(
        namespace,
        new NamespaceEventBus(this.eventBus, namespace)
      )
    }
    return this.namespaceEventBuses.get(namespace)!
  }
  
  /**
   * 获取命名空间管理器（别名方法）
   */
  namespace(ns: string): NamespaceEventBus {
    return this.getNamespaceEventBus(ns)
  }
  
  /**
   * 清理指定命名空间
   */
  clearNamespace(namespace: string): number {
    const namespaceEventBus = this.namespaceEventBuses.get(namespace)
    if (namespaceEventBus) {
      const count = namespaceEventBus.cleanup()
      this.namespaceEventBuses.delete(namespace)
      return count
    }
    return 0
  }
  
  /**
   * 清理所有命名空间
   */
  clearAllNamespaces(): number {
    let totalCount = 0
    for (const [namespace] of this.namespaceEventBuses) {
      totalCount += this.clearNamespace(namespace)
    }
    return totalCount
  }
  
  /**
   * 获取所有命名空间列表
   */
  getNamespaces(): string[] {
    return Array.from(this.namespaceEventBuses.keys())
  }
  
  /**
   * 获取命名空间数量
   */
  getNamespaceCount(): number {
    return this.namespaceEventBuses.size
  }
}

/**
 * 带验证和中间件的事件总线实现
 */

// ============ 增强的事件总线实现 ============

/**
 * 带验证和中间件的事件总线实现
 */
export class EnhancedEventBus extends EventBus implements ValidatedEventBus {
  private validators = new Map<EventName, EventValidator<any>>()
  private middlewares: EventMiddleware[] = []
  
  /**
   * 注册事件验证器
   */
  registerValidator<T extends EventName>(
    event: T,
    validator: EventValidator<T>
  ): void {
    this.validators.set(event, validator)
    this.debug(`Registered validator for event: ${event}`)
  }
  
  /**
   * 移除事件验证器
   */
  removeValidator(event: EventName): boolean {
    const removed = this.validators.delete(event)
    if (removed) {
      this.debug(`Removed validator for event: ${event}`)
    }
    return removed
  }
  
  /**
   * 注册中间件
   */
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware)
    this.debug(`Registered middleware: ${middleware.constructor.name || 'Anonymous'}`)
  }
  
  /**
   * 移除中间件
   */
  removeMiddleware(middleware: EventMiddleware): boolean {
    const index = this.middlewares.indexOf(middleware)
    if (index > -1) {
      this.middlewares.splice(index, 1)
      this.debug(`Removed middleware: ${middleware.constructor.name || 'Anonymous'}`)
      return true
    }
    return false
  }
  
  /**
   * 清理所有验证器和中间件
   */
  clearValidatorsAndMiddlewares(): void {
    this.validators.clear()
    this.middlewares.length = 0
    this.debug('Cleared all validators and middlewares')
  }
  
  /**
   * 重写 emit 方法，添加验证和中间件支持
   */
  async emit<T extends EventName>(eventName: T, data: EventDataMap[T]): Promise<any[]> {
    try {
      // 1. 验证事件数据
      let validatedData = await this.validateEventData(eventName, data)
      
      // 2. 执行 beforeEmit 中间件
      validatedData = await this.runBeforeEmitMiddlewares(eventName, validatedData)
      
      // 3. 执行原始的 emit 逻辑
      const results = await super.emit(eventName, validatedData)
      
      // 4. 执行 afterEmit 中间件
      await this.runAfterEmitMiddlewares(eventName, validatedData, results)
      
      return results
    } catch (error) {
      this.debug(`Error in enhanced emit for ${eventName}:`, error)
      throw error
    }
  }
  
  /**
   * 重写 on 方法，添加中间件支持
   */
  on<T extends EventName>(
    eventName: T,
    callback: EventCallback<EventDataMap[T]>,
    options?: Omit<EventListenerOptions, 'once'>
  ): string {
    // 通过中间件处理回调函数
    const enhancedCallback = this.enhanceCallback(eventName, callback)
    
    return super.on(eventName, enhancedCallback, options)
  }
  
  /**
   * 重写 once 方法，添加中间件支持
   */
  once<T extends EventName>(
    eventName: T,
    callback: EventCallback<EventDataMap[T]>,
    options?: Omit<EventListenerOptions, 'once'>
  ): string {
    // 通过中间件处理回调函数
    const enhancedCallback = this.enhanceCallback(eventName, callback)
    
    return super.once(eventName, enhancedCallback, options)
  }
  
  /**
   * 验证事件数据
   */
  private async validateEventData<T extends EventName>(
    eventName: T,
    data: EventDataMap[T]
  ): Promise<EventDataMap[T]> {
    const validator = this.validators.get(eventName)
    
    if (validator) {
      if (!validator.validate(data)) {
        const errors = validator.getErrors?.(data) || ['Validation failed']
        throw new EventValidationError(eventName, errors, data)
      }
      
      // 清理和转换数据
      return validator.sanitize(data)
    }
    
    return data
  }
  
  /**
   * 执行 beforeEmit 中间件
   */
  private async runBeforeEmitMiddlewares<T extends EventName>(
    eventName: T,
    data: EventDataMap[T]
  ): Promise<EventDataMap[T]> {
    let processedData = data
    
    for (const middleware of this.middlewares) {
      if (middleware.beforeEmit) {
        try {
          processedData = await middleware.beforeEmit(eventName, processedData)
        } catch (error) {
          throw new EventMiddlewareError(
            eventName,
            middleware.constructor.name || 'Anonymous',
            error as Error
          )
        }
      }
    }
    
    return processedData
  }
  
  /**
   * 执行 afterEmit 中间件
   */
  private async runAfterEmitMiddlewares<T extends EventName>(
    eventName: T,
    data: EventDataMap[T],
    results: any[]
  ): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.afterEmit) {
        try {
          await middleware.afterEmit(eventName, data, results)
        } catch (error) {
          // afterEmit 错误不应该阻止事件处理，只记录日志
          this.debug(`AfterEmit middleware error:`, error)
        }
      }
    }
  }
  
  /**
   * 增强回调函数，添加中间件支持
   */
  private enhanceCallback<T extends EventName>(
    eventName: T,
    originalCallback: EventCallback<EventDataMap[T]>
  ): EventCallback<EventDataMap[T]> {
    // 首先通过 beforeListen 中间件处理回调
    let enhancedCallback = originalCallback
    
    for (const middleware of this.middlewares) {
      if (middleware.beforeListen) {
        enhancedCallback = middleware.beforeListen(eventName, enhancedCallback)
      }
    }
    
    // 返回包装后的回调函数
    return async (data: EventDataMap[T]) => {
      try {
        // 执行 beforeCallback 中间件
        let processedData = data
        for (const middleware of this.middlewares) {
          if (middleware.beforeCallback) {
            processedData = await middleware.beforeCallback(
              eventName,
              processedData,
              enhancedCallback
            )
          }
        }
        
        // 执行原始回调
        const result = await enhancedCallback(processedData)
        
        // 执行 afterCallback 中间件
        let finalResult = result
        for (const middleware of this.middlewares) {
          if (middleware.afterCallback) {
            finalResult = await middleware.afterCallback(
              eventName,
              processedData,
              finalResult,
              enhancedCallback
            )
          }
        }
        
        return finalResult
      } catch (error) {
        this.debug(`Error in enhanced callback for ${eventName}:`, error)
        throw error
      }
    }
  }
}

// ============ 事件总线实例创建和导出 ============

// 创建增强的事件总线实例
const enhancedEventBus = new EnhancedEventBus()

// 注册默认中间件
enhancedEventBus.use(new ErrorHandlingMiddleware())

// 在开发环境下启用日志和性能监控
if (import.meta.env.DEV) {
  enhancedEventBus.use(new LoggingMiddleware('[DevEventBus]'))
  enhancedEventBus.use(new PerformanceMiddleware())
}

// 注册默认验证器
enhancedEventBus.registerValidator('WINDOW_RESIZE', new WindowEventValidator())
enhancedEventBus.registerValidator('WINDOW_FOCUS', new WindowEventValidator())
enhancedEventBus.registerValidator('WINDOW_BLUR', new WindowEventValidator())

// 创建命名空间管理器
const namespaceManager = new NamespacedEventManager(enhancedEventBus)

// 创建各个命名空间的事件总线
export const systemEventBus = namespaceManager.getNamespaceEventBus('system')
export const windowEventBus = namespaceManager.getNamespaceEventBus('window')
export const appEventBus = namespaceManager.getNamespaceEventBus('app')
export const userEventBus = namespaceManager.getNamespaceEventBus('user')
export const themeEventBus = namespaceManager.getNamespaceEventBus('theme')
export const networkEventBus = namespaceManager.getNamespaceEventBus('network')
export const notificationEventBus = namespaceManager.getNamespaceEventBus('notification')

// 全局事件总线实例（向后兼容）
const globalEventBus = enhancedEventBus

// 增强的事件总线组合式函数
export function useEventBus(options: {
  namespace?: string
  autoCleanup?: boolean
  debugMode?: boolean
} = {}) {
  const { namespace, autoCleanup = true, debugMode = false } = options
  
  // 存储当前组件的监听器 ID，用于自动清理
  const listenerIds = ref<string[]>([])
  const componentNamespace = namespace || `component_${Date.now()}`

  // 添加事件监听器（类型安全版本）
  const on = <T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options: {
      once?: boolean
      priority?: number
      context?: any
    } = {}
  ): string => {
    const id = globalEventBus.on(event, callback, {
      ...options,
      namespace: componentNamespace
    })
    if (autoCleanup) {
      listenerIds.value.push(id)
    }
    return id
  }



  // 添加一次性事件监听器
  const once = <T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options: {
      priority?: number
      context?: any
    } = {}
  ): string => {
    const id = globalEventBus.once(event, callback, {
      ...options,
      namespace: componentNamespace
    })
    if (autoCleanup) {
      listenerIds.value.push(id)
    }
    return id
  }

  // 移除事件监听器
  const off = (event: string, listenerId?: string): boolean => {
    const result = globalEventBus.off(event, listenerId)
    if (listenerId && autoCleanup) {
      const index = listenerIds.value.indexOf(listenerId)
      if (index > -1) {
        listenerIds.value.splice(index, 1)
      }
    }
    return result
  }

  // 按过滤器移除监听器
  const offByFilter = (filter: EventFilter): number => {
    return globalEventBus.offByFilter(filter)
  }

  // 移除当前组件的所有监听器
  const offAll = (): number => {
    return globalEventBus.offByFilter({ namespace: componentNamespace })
  }

  // 触发事件（类型安全版本）
  const emit = <T extends EventName>(event: T, data: EventData<T>): void => {
    globalEventBus.emit(event, data)
  }



  // 异步触发事件
  const emitAsync = async <T extends EventName>(event: T, data: EventData<T>): Promise<void> => {
    return globalEventBus.emitAsync(event, data)
  }

  // 等待事件触发
  const waitFor = <T extends EventName>(
    event: T,
    timeout?: number
  ): Promise<EventData<T>> => {
    return globalEventBus.waitFor(event, timeout)
  }

  // 获取监听器数量
  const listenerCount = (event: string): number => {
    return globalEventBus.listenerCount(event)
  }

  // 获取所有事件名称
  const eventNames = (): string[] => {
    return globalEventBus.eventNames()
  }

  // 获取事件监听器详情
  const getListeners = (event: string): EventListener[] => {
    return globalEventBus.getListeners(event)
  }

  // 获取统计信息
  const getStats = (): EventStats => {
    return globalEventBus.getStats()
  }

  // 检查事件是否存在监听器
  const hasListeners = (event: string): boolean => {
    return globalEventBus.hasListeners(event)
  }

  // 清理过期监听器
  const cleanupStaleListeners = (maxAge?: number): number => {
    return globalEventBus.cleanupStaleListeners(maxAge)
  }

  // 组件卸载时自动清理监听器
  if (autoCleanup) {
    onUnmounted(() => {
      if (debugMode) {
        console.log(`[useEventBus] Cleaning up ${listenerIds.value.length} listeners for namespace '${componentNamespace}'`)
      }
      
      // 优化：直接按命名空间清理
      globalEventBus.offByFilter({ namespace: componentNamespace })
      
      // 备用方案：逐个清理
      listenerIds.value.forEach(id => {
        globalEventBus.eventNames().forEach(eventName => {
          globalEventBus.off(eventName, id)
        })
      })
      
      listenerIds.value = []
    })
  }

  return {
    // 类型安全的事件操作
    on,
    once,
    emit,
    emitAsync,
    waitFor,
    

    
    // 监听器管理
    off,
    offByFilter,
    offAll,
    
    // 信息获取
    listenerCount,
    eventNames,
    getListeners,
    getStats,
    hasListeners,
    
    // 维护功能
    cleanupStaleListeners,
    
    // 组件信息
    namespace: componentNamespace,
    listenerIds: readonly(listenerIds),
    
    // 直接访问全局事件总线（高级用法）
    bus: globalEventBus,
  }
}



// 导出主要的事件总线实例（向后兼容）
export { globalEventBus as eventBus }

// 导出增强版事件总线
export { enhancedEventBus }

// 导出命名空间管理器
export { namespaceManager }

// 导出所有相关类型和类
export { EventBus }
export type { 
  TypedEvent, 
  TypedEventListener, 
  EventCreator, 
  TypeSafeEventBus,
  EventValidator,
  EventMiddleware,
  ValidatedEventBus
}

// 事件命名空间和分组管理
export const EVENT_NAMESPACES = {
  APP: 'app',
  SYSTEM: 'system', 
  THEME: 'theme',
  NETWORK: 'network',
  USER: 'user',
  WINDOW: 'window',
  KEYBOARD: 'keyboard',
  NOTIFICATION: 'notification',
  WIDGET: 'widget',
  DOCK: 'dock',
  LAUNCHPAD: 'launchpad',
} as const

// 统一的事件名称常量（与constants/index.ts保持一致并扩展）
export const EVENTS = {
  // 应用相关事件
  APP_OPEN: 'app:open',
  APP_OPENED: 'app:opened',
  APP_CLOSE: 'app:close', 
  APP_CLOSED: 'app:closed',
  APP_FOCUS: 'app:focus',
  APP_FOCUSED: 'app:focused',
  APP_MINIMIZE: 'app:minimize',
  APP_MINIMIZED: 'app:minimized',
  APP_MAXIMIZE: 'app:maximize',
  APP_MAXIMIZED: 'app:maximized',
  APP_RESIZE: 'app:resize',
  APP_MOVE: 'app:move',
  
  // 系统相关事件
  SYSTEM_READY: 'system:ready',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_SLEEP: 'system:sleep',
  SYSTEM_WAKE: 'system:wake',
  SYSTEM_ERROR: 'system:error',
  
  // 主题相关事件
  THEME_CHANGE: 'theme:change',
  THEME_CHANGED: 'theme:changed',
  THEME_FOLLOW_SYSTEM: 'theme:follow-system',
  
  // 网络相关事件
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  NETWORK_SLOW: 'network:slow',
  
  // 用户相关事件
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_PROFILE_UPDATE: 'user:profile-update',
  
  // 窗口相关事件
  WINDOW_RESIZE: 'window:resize',
  WINDOW_FOCUS: 'window:focus',
  WINDOW_BLUR: 'window:blur',
  WINDOW_FULLSCREEN: 'window:fullscreen',
  WINDOW_TITLE_CHANGE: 'window:title-change',
  
  // 键盘相关事件
  KEYBOARD_SHORTCUT: 'keyboard:shortcut',
  KEYBOARD_PRESS: 'keyboard:press',
  KEYBOARD_RELEASE: 'keyboard:release',
  
  // 通知相关事件
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
  NOTIFICATION_CLICK: 'notification:click',
  
  // 音量相关事件
  VOLUME_CHANGE: 'volume:change',
  VOLUME_MUTE: 'volume:mute',
  
  // 语言相关事件
  LANGUAGE_CHANGE: 'language:change',
  
  // 小组件相关事件
  WIDGET_ADD: 'widget:add',
  WIDGET_REMOVE: 'widget:remove',
  WIDGET_UPDATE: 'widget:update',
  
  // Dock相关事件
  DOCK_SHOW: 'dock:show',
  DOCK_HIDE: 'dock:hide',
  DOCK_APP_ADD: 'dock:app-add',
  DOCK_APP_REMOVE: 'dock:app-remove',
  
  // Launchpad相关事件
  LAUNCHPAD_SHOW: 'launchpad:show',
  LAUNCHPAD_HIDE: 'launchpad:hide',
  
  // 应用启动事件
  APP_STARTUP: 'app:startup',
  
  // 数据同步事件
  DATA_SYNC: 'data:sync',
  
  // 测试相关事件
  TEST_ERROR: 'test:error',
  TEST_PERFORMANCE: 'test:performance',
} as const

// ============ 阶段二：架构改进 - 事件工厂模式 ============

// 类型化事件接口
export interface TypedEvent<T extends EventName> {
  readonly type: T
  readonly data: EventDataMap[T]
  readonly timestamp: number
  readonly id: string
}

// 类型化事件监听器接口
export interface TypedEventListener<T extends EventName> {
  readonly eventType: T
  readonly callback: EventCallback<EventDataMap[T]>
  readonly options: EventListenerOptions
}

// 事件创建器接口
export interface EventCreator<T extends EventName> {
  readonly type: T
  create(data: EventDataMap[T]): TypedEvent<T>
  createListener(callback: EventCallback<EventDataMap[T]>): TypedEventListener<T>
}

// 类型安全的事件总线接口
export interface TypeSafeEventBus {
  // 触发事件
  emit<T extends EventName>(event: T, data: EventDataMap[T]): Promise<any[]>
  
  // 添加监听器
  on<T extends EventName>(
    event: T,
    callback: EventCallback<EventDataMap[T]>,
    options?: Omit<EventListenerOptions, 'once'>
  ): string
  
  // 添加一次性监听器
  once<T extends EventName>(
    event: T,
    callback: EventCallback<EventDataMap[T]>,
    options?: Omit<EventListenerOptions, 'once'>
  ): string
  
  // 移除监听器
  off(event: EventName, listenerId?: string): boolean
  
  // 检查是否有监听器
  hasListeners(event: EventName): boolean
  
  // 获取监听器数量
  listenerCount(event: EventName): number
}

// 事件工厂类
export class EventFactory {
  /**
   * 创建类型化事件
   */
  static createEvent<T extends EventName>(
    type: T,
    data: EventDataMap[T]
  ): TypedEvent<T> {
    return {
      type,
      data,
      timestamp: Date.now(),
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }
  
  /**
   * 创建类型化事件监听器
   */
  static createListener<T extends EventName>(
    eventType: T,
    callback: EventCallback<EventDataMap[T]>,
    options: EventListenerOptions = {}
  ): TypedEventListener<T> {
    return {
      eventType,
      callback,
      options
    }
  }
  
  /**
   * 创建事件创建器
   */
  static createEventCreator<T extends EventName>(type: T): EventCreator<T> {
    return {
      type,
      create: (data: EventDataMap[T]) => EventFactory.createEvent(type, data),
      createListener: (callback: EventCallback<EventDataMap[T]>) => 
        EventFactory.createListener(type, callback)
    }
  }
}



// ============ 事件验证和中间件系统 ============

// 事件数据验证器接口
export interface EventValidator<T extends EventName> {
  /**
   * 验证事件数据
   */
  validate(data: any): data is EventDataMap[T]
  
  /**
   * 清理和转换事件数据
   */
  sanitize(data: any): EventDataMap[T]
  
  /**
   * 获取验证错误信息
   */
  getErrors?(data: any): string[]
}

// 事件中间件接口
export interface EventMiddleware {
  /**
   * 事件触发前的处理
   */
  beforeEmit?<T extends EventName>(
    event: T,
    data: EventDataMap[T]
  ): EventDataMap[T] | Promise<EventDataMap[T]>
  
  /**
   * 事件触发后的处理
   */
  afterEmit?<T extends EventName>(
    event: T,
    data: EventDataMap[T],
    results?: any[]
  ): void | Promise<void>
  
  /**
   * 监听器注册前的处理
   */
  beforeListen?<T extends EventName>(
    event: T,
    callback: EventCallback<EventDataMap[T]>
  ): EventCallback<EventDataMap[T]>
  
  /**
   * 监听器执行前的处理
   */
  beforeCallback?<T extends EventName>(
    event: T,
    data: EventDataMap[T],
    callback: EventCallback<EventDataMap[T]>
  ): EventDataMap[T] | Promise<EventDataMap[T]>
  
  /**
   * 监听器执行后的处理
   */
  afterCallback?<T extends EventName>(
    event: T,
    data: EventDataMap[T],
    result: any,
    callback: EventCallback<EventDataMap[T]>
  ): any | Promise<any>
}

// 带验证的事件总线接口
export interface ValidatedEventBus extends TypeSafeEventBus {
  /**
   * 注册事件验证器
   */
  registerValidator<T extends EventName>(
    event: T,
    validator: EventValidator<T>
  ): void
  
  /**
   * 移除事件验证器
   */
  removeValidator(event: EventName): boolean
  
  /**
   * 注册中间件
   */
  use(middleware: EventMiddleware): void
  
  /**
   * 移除中间件
   */
  removeMiddleware(middleware: EventMiddleware): boolean
  
  /**
   * 清理所有验证器和中间件
   */
  clearValidatorsAndMiddlewares(): void
}

// 验证错误类
export class EventValidationError extends Error {
  constructor(
    public eventType: EventName,
    public errors: string[],
    public originalData: any
  ) {
    super(`Event validation failed for ${eventType}: ${errors.join(', ')}`)
    this.name = 'EventValidationError'
  }
}

// 中间件错误类
export class EventMiddlewareError extends Error {
  constructor(
    public eventType: EventName,
    public middlewareName: string,
    public originalError: Error
  ) {
    super(`Middleware error in ${middlewareName} for event ${eventType}: ${originalError.message}`)
    this.name = 'EventMiddlewareError'
  }
}

// ============ 增强的事件总线实现 ============
