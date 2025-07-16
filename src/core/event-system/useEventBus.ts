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
class EventBus {
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
}

// 全局事件总线实例
const globalEventBus = new EventBus()

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



// 导出全局事件总线实例（用于非组合式函数中使用）
export { globalEventBus as eventBus }

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
} as const

// 事件数据类型定义
export interface EventDataMap {
  // 应用事件数据
  [EVENTS.APP_OPEN]: { appKey: string; config?: any }
  [EVENTS.APP_OPENED]: { appKey: string; pid: number; timestamp?: number }
  [EVENTS.APP_CLOSE]: { appKey: string; pid?: number }
  [EVENTS.APP_CLOSED]: { appKey: string; pid: number; reason?: string; source?: string }
  [EVENTS.APP_FOCUS]: { appKey: string; pid: number; previousApp?: string }
  [EVENTS.APP_FOCUSED]: { appKey: string; pid: number }
  [EVENTS.APP_MINIMIZE]: { appKey: string; pid: number }
  [EVENTS.APP_MINIMIZED]: { appKey: string; pid: number; position?: { x: number; y: number } }
  [EVENTS.APP_MAXIMIZE]: { appKey: string; pid: number }
  [EVENTS.APP_MAXIMIZED]: { appKey: string; pid: number; previousSize?: { width: number; height: number } }
  [EVENTS.APP_RESIZE]: { appKey: string; pid: number; width: number; height: number }
  [EVENTS.APP_MOVE]: { appKey: string; pid: number; x: number; y: number }
  
  // 系统事件数据
  [EVENTS.SYSTEM_READY]: { bootTime: number; version?: string }
  [EVENTS.SYSTEM_SHUTDOWN]: { reason?: string; forced?: boolean }
  [EVENTS.SYSTEM_SLEEP]: { trigger?: 'user' | 'auto' | 'schedule' }
  [EVENTS.SYSTEM_WAKE]: { trigger?: 'user' | 'timer' | 'network' }
  [EVENTS.SYSTEM_ERROR]: { error: Error; context?: string; component?: string; recoverable?: boolean }
  
  // 主题事件数据
  [EVENTS.THEME_CHANGE]: { theme: string; previous?: string }
  [EVENTS.THEME_CHANGED]: { theme: string; previous?: string; timestamp: number }
  [EVENTS.THEME_FOLLOW_SYSTEM]: { enabled: boolean }
  
  // 网络事件数据
  [EVENTS.NETWORK_ONLINE]: { timestamp: number; connectionType?: string }
  [EVENTS.NETWORK_OFFLINE]: { timestamp: number; reason?: string }
  [EVENTS.NETWORK_SLOW]: { speed: number; threshold: number; timestamp: number }
  
  // 用户事件数据
  [EVENTS.USER_LOGIN]: { username: string; timestamp: number; method?: string; ip?: string }
  [EVENTS.USER_LOGOUT]: { username?: string; timestamp: number; reason?: string }
  [EVENTS.USER_PROFILE_UPDATE]: { field: string; value: any; timestamp: number }
  
  // 窗口事件数据
  [EVENTS.WINDOW_RESIZE]: { windowId?: string; width: number; height: number; oldSize?: { width: number; height: number } }
  [EVENTS.WINDOW_FOCUS]: { windowId?: string; appKey?: string; timestamp: number }
  [EVENTS.WINDOW_BLUR]: { windowId?: string; appKey?: string; timestamp: number }
  [EVENTS.WINDOW_FULLSCREEN]: { enabled: boolean; windowId?: string }
  
  // 键盘事件数据
  [EVENTS.KEYBOARD_SHORTCUT]: { key: string; modifiers: string[]; action: string; timestamp: number }
  [EVENTS.KEYBOARD_PRESS]: { key: string; code: string; timestamp: number }
  [EVENTS.KEYBOARD_RELEASE]: { key: string; code: string; timestamp: number }
  
  // 通知事件数据
  [EVENTS.NOTIFICATION_SHOW]: { id: string; title: string; message?: string; type?: string; duration?: number }
  [EVENTS.NOTIFICATION_HIDE]: { id: string; reason?: 'timeout' | 'user' | 'system' }
  [EVENTS.NOTIFICATION_CLICK]: { id: string; action?: string }
  
  // 音量事件数据
  [EVENTS.VOLUME_CHANGE]: { volume: number; previous?: number; timestamp: number }
  [EVENTS.VOLUME_MUTE]: { muted: boolean; timestamp: number }
  
  // 语言事件数据
  [EVENTS.LANGUAGE_CHANGE]: { language: string; previous?: string; timestamp: number }
  
  // 小组件事件数据
  [EVENTS.WIDGET_ADD]: { widgetId: string; type: string; position?: { x: number; y: number } }
  [EVENTS.WIDGET_REMOVE]: { widgetId: string; reason?: string }
  [EVENTS.WIDGET_UPDATE]: { widgetId: string; data: any; timestamp: number }
  
  // Dock事件数据
  [EVENTS.DOCK_SHOW]: { timestamp: number; trigger?: string }
  [EVENTS.DOCK_HIDE]: { timestamp: number; trigger?: string }
  [EVENTS.DOCK_APP_ADD]: { appKey: string; position?: number }
  [EVENTS.DOCK_APP_REMOVE]: { appKey: string; position?: number }
  
  // Launchpad事件数据
  [EVENTS.LAUNCHPAD_SHOW]: { timestamp: number; trigger?: string }
  [EVENTS.LAUNCHPAD_HIDE]: { timestamp: number; trigger?: string }
  
  // 错误监控事件
  'error:app': { appKey: string; error: string; stack?: string; severity: 'low' | 'medium' | 'high' | 'critical' }
  'error:system': { component: string; error: string; recoverable: boolean }
  'error:network': { url?: string; status?: number; error: string }
  'error:performance': { component: string; metric: string; value: number; threshold: number }
  
  // 性能监控事件
  'performance:memory': { used: number; available: number; percentage: number }
  'performance:cpu': { usage: number; processes?: string[] }
  'performance:render': { component: string; duration: number; frame?: number }
  
  // 业务相关事件
  'business:feature-used': { feature: string; userId?: string; metadata?: any }
  'business:conversion': { action: string; value?: number; metadata?: any }
  'business:engagement': { type: string; duration: number; metadata?: any }
  
  // 自定义事件（兼容性）
  [key: string]: any
}

export type EventName = keyof EventDataMap
export type EventData<T extends EventName> = EventDataMap[T]
