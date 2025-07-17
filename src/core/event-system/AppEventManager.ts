/**
 * 应用事件管理器
 * 负责管理应用的事件集成、权限控制和生命周期绑定
 */

import type { EventName, EventData, EventCallback, EventListenerOptions } from './useEventBus'
import { EnhancedEventBus } from './useEventBus'
import { getAppEventPermissionManager, type PermissionType, type PermissionContext } from './AppEventPermissionManager'
import { getAppEventMonitor } from './AppEventMonitor'

// 应用事件权限定义
export interface AppEventPermissions {
  // 可以监听的系统事件
  systemEvents: EventName[]
  // 可以触发的系统事件
  emitSystemEvents: EventName[]
  // 可以与之通信的应用列表
  allowedApps: string[]
  // 是否允许监听全局事件
  globalListen: boolean
  // 是否允许触发全局事件
  globalEmit: boolean
}

// 应用事件上下文
export interface AppEventContext {
  appId: string
  appName: string
  version: string
  permissions: AppEventPermissions
  namespace: string
  sandboxed: boolean
}

// 权限错误类
export class EventPermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EventPermissionError'
  }
}

// 事件权限验证器
export class EventPermissionValidator {
  private systemEventWhitelist = new Set<EventName>([
    'system:ready',
    'theme:changed',
    'network:online',
    'network:offline',
    'window:resize',
    'window:focus',
    'window:blur',
  ])
  
  private systemEventEmitWhitelist = new Set<EventName>([
    'notification:show',
    'notification:hide',
    'user:profile-update',
    'app:focus',
    'app:minimize',
  ])
  
  // 检查是否可以监听系统事件
  canListenSystemEvent(context: AppEventContext, event: EventName): boolean {
    // 检查全局权限
    if (!context.permissions.globalListen) {
      return false
    }
    
    // 检查特定事件权限
    if (!context.permissions.systemEvents.includes(event)) {
      return false
    }
    
    // 检查系统白名单
    return this.systemEventWhitelist.has(event)
  }
  
  // 检查是否可以触发系统事件
  canEmitSystemEvent(context: AppEventContext, event: EventName): boolean {
    // 检查全局权限
    if (!context.permissions.globalEmit) {
      return false
    }
    
    // 检查特定事件权限
    if (!context.permissions.emitSystemEvents.includes(event)) {
      return false
    }
    
    // 检查系统白名单
    return this.systemEventEmitWhitelist.has(event)
  }
  
  // 检查是否可以与特定应用通信
  canCommunicateWithApp(context: AppEventContext, targetAppId: string): boolean {
    // 检查是否在允许列表中
    if (context.permissions.allowedApps.includes('*')) {
      return true
    }
    
    return context.permissions.allowedApps.includes(targetAppId)
  }
}

// 跨应用通信通道
export class CrossAppChannel {
  private sourceAppId: string
  private targetAppId: string
  private globalEventBus: EnhancedEventBus
  private channelId: string
  private listeners = new Set<string>()
  
  constructor(
    sourceAppId: string,
    targetAppId: string,
    globalEventBus: EnhancedEventBus
  ) {
    this.sourceAppId = sourceAppId
    this.targetAppId = targetAppId
    this.globalEventBus = globalEventBus
    this.channelId = `channel:${sourceAppId}:${targetAppId}`
  }
  
  // 发送消息到目标应用
  send<T extends EventName>(event: T, data: EventData<T>): Promise<any[]> {
    const channelEvent = `${this.channelId}:${event}` as EventName
    
    return this.globalEventBus.emit(channelEvent, {
      ...data,
      _channel: {
        sourceAppId: this.sourceAppId,
        targetAppId: this.targetAppId,
        originalEvent: event,
        timestamp: Date.now()
      }
    } as EventData<T>)
  }
  
  // 监听来自源应用的消息
  on<T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options?: EventListenerOptions
  ): string {
    const channelEvent = `channel:${this.targetAppId}:${this.sourceAppId}:${event}` as EventName
    
    const listenerId = this.globalEventBus.on(channelEvent, callback, options)
    this.listeners.add(listenerId)
    return listenerId
  }
  
  // 清理通道
  cleanup(): void {
    this.listeners.forEach(listenerId => {
      this.globalEventBus.off('*' as EventName, listenerId)
    })
    this.listeners.clear()
  }
}

// 应用专用事件总线
export class AppEventBus {
  private context: AppEventContext
  private globalEventBus: EnhancedEventBus
  private permissionValidator: EventPermissionValidator
  private localEventBus: EnhancedEventBus
  private listeners = new Set<string>()
  private crossAppChannels = new Map<string, CrossAppChannel>()
  private permissionManager = getAppEventPermissionManager()
  private monitor = getAppEventMonitor()
  
  constructor(
    context: AppEventContext,
    globalEventBus: EnhancedEventBus,
    permissionValidator: EventPermissionValidator
  ) {
    this.context = context
    this.globalEventBus = globalEventBus
    this.permissionValidator = permissionValidator
    this.localEventBus = new EnhancedEventBus()
  }
  
  // 应用内部事件监听
  on<T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options?: EventListenerOptions
  ): string {
    const listenerId = this.localEventBus.on(event, callback, {
      ...options,
      context: this.context
    })
    
    this.listeners.add(listenerId)
    return listenerId
  }
  
  // 监听事件
  listen<T extends EventName>(
    eventName: T,
    callback: EventCallback<EventData<T>>,
    options?: EventListenerOptions
  ): () => void {
    // 使用权限管理器进行更细粒度的权限检查
    const hasPermission = this.permissionManager.checkPermission(
      this.context.appId,
      'listen',
      { eventName: String(eventName), targetApp: 'global' }
    )
    
    if (!hasPermission) {
      throw new EventPermissionError(
        `App ${this.context.appId} permission denied for listening to event: ${String(eventName)}`
      )
    }
    
    // 包装回调函数，添加应用上下文和监控
    const wrappedCallback: EventCallback<EventData<T>> = (data, meta) => {
      const startTime = performance.now()
      let success = false
      let error: Error | undefined
      
      try {
        const result = callback(data, {
          ...meta,
          __receiverAppId: this.context.appId
        })
        
        success = true
        return result
      } catch (err) {
        error = err as Error
        throw err
      } finally {
        // 记录监控数据
        const duration = performance.now() - startTime
        this.monitor.recordEvent(
          String(eventName),
          'listen',
          this.context.appId,
          duration,
          success,
          error?.message,
          { sourceApp: meta?.__appId || 'unknown' }
        )
      }
    }
    
    // 注册到全局事件总线
    const listenerId = this.globalEventBus.on(eventName, wrappedCallback, options)
    this.listeners.add(listenerId)
    
    return () => {
      this.globalEventBus.off(eventName, listenerId)
      this.listeners.delete(listenerId)
    }
  }
  
  // 应用内部事件触发
  emit<T extends EventName>(event: T, data: EventData<T>): Promise<any[]> {
    const startTime = performance.now()
    let success = false
    let error: Error | undefined
    
    try {
      // 使用权限管理器进行权限检查
      const hasPermission = this.permissionManager.checkPermission(
        this.context.appId,
        'emit',
        { eventName: String(event), targetApp: 'local' }
      )
      
      if (!hasPermission) {
        throw new EventPermissionError(
          `App ${this.context.appId} permission denied for emitting event: ${String(event)}`
        )
      }
      
      const result = this.localEventBus.emit(event, data)
      success = true
      return result
    } catch (err) {
      error = err as Error
      throw err
    } finally {
      // 记录监控数据
      const duration = performance.now() - startTime
      this.monitor.recordEvent(
        String(event),
        'emit',
        this.context.appId,
        duration,
        success,
        error?.message,
        { targetApp: 'local' }
      )
    }
  }
  
  // 监听系统事件（需要权限验证）
  onSystemEvent<T extends EventName>(
    event: T,
    callback: EventCallback<EventData<T>>,
    options?: EventListenerOptions
  ): string {
    if (!this.permissionValidator.canListenSystemEvent(this.context, event)) {
      throw new EventPermissionError(
        `App ${this.context.appId} does not have permission to listen to system event ${event}`
      )
    }
    
    const listenerId = this.globalEventBus.on(event, callback, {
      ...options,
      context: this.context,
      namespace: this.context.namespace
    })
    
    this.listeners.add(listenerId)
    return listenerId
  }
  
  // 触发系统事件（需要权限验证）
  emitSystemEvent<T extends EventName>(
    event: T,
    data: EventData<T>
  ): Promise<any[]> {
    const startTime = performance.now()
    let success = false
    let error: Error | undefined
    
    try {
      if (!this.permissionValidator.canEmitSystemEvent(this.context, event)) {
        throw new EventPermissionError(
          `App ${this.context.appId} does not have permission to emit system event ${event}`
        )
      }
      
      // 使用权限管理器进行更细粒度的权限检查
      const hasPermission = this.permissionManager.checkPermission(
        this.context.appId,
        'emit',
        { eventName: String(event), targetApp: 'system' }
      )
      
      if (!hasPermission) {
        throw new EventPermissionError(
          `App ${this.context.appId} permission denied for emitting system event: ${String(event)}`
        )
      }
      
      const result = this.globalEventBus.emit(event, {
        ...data,
        _source: {
          appId: this.context.appId,
          appName: this.context.appName,
          timestamp: Date.now()
        }
      } as EventData<T>)
      
      success = true
      return result
    } catch (err) {
      error = err as Error
      throw err
    } finally {
      // 记录监控数据
      const duration = performance.now() - startTime
      this.monitor.recordEvent(
        String(event),
        'emit',
        this.context.appId,
        duration,
        success,
        error?.message,
        { targetApp: 'system' }
      )
    }
  }
  
  // 跨应用通信
  sendToApp<T extends EventName>(
    targetAppId: string,
    event: T,
    data: EventData<T>
  ): Promise<any[]> {
    const startTime = performance.now()
    let success = false
    let error: Error | undefined
    
    try {
      if (!this.permissionValidator.canCommunicateWithApp(this.context, targetAppId)) {
        throw new EventPermissionError(
          `App ${this.context.appId} does not have permission to communicate with app ${targetAppId}`
        )
      }
      
      // 使用权限管理器进行更细粒度的权限检查
      const hasPermission = this.permissionManager.checkPermission(
        this.context.appId,
        'emit',
        { eventName: String(event), targetApp: targetAppId }
      )
      
      if (!hasPermission) {
        throw new EventPermissionError(
          `App ${this.context.appId} permission denied for sending event to app ${targetAppId}: ${String(event)}`
        )
      }
      
      const channel = this.getCrossAppChannel(targetAppId)
      const result = channel.send(event, data)
      success = true
      return result
    } catch (err) {
      error = err as Error
      throw err
    } finally {
      // 记录监控数据
      const duration = performance.now() - startTime
      this.monitor.recordEvent(
        String(event),
        'emit',
        this.context.appId,
        duration,
        success,
        error?.message,
        { targetApp: targetAppId }
      )
    }
  }
  
  // 监听来自特定应用的事件
  onAppEvent<T extends EventName>(
    sourceAppId: string,
    event: T,
    callback: EventCallback<EventData<T>>,
    options?: EventListenerOptions
  ): string {
    if (!this.permissionValidator.canCommunicateWithApp(this.context, sourceAppId)) {
      throw new EventPermissionError(
        `App ${this.context.appId} does not have permission to listen to events from app ${sourceAppId}`
      )
    }
    
    const channel = this.getCrossAppChannel(sourceAppId)
    const listenerId = channel.on(event, callback, options)
    this.listeners.add(listenerId)
    return listenerId
  }
  
  // 移除监听器
  off(event: EventName, listenerId?: string): boolean {
    if (listenerId) {
      this.listeners.delete(listenerId)
      // 尝试从本地和全局事件总线中移除
      const localResult = this.localEventBus.off(event, listenerId)
      const globalResult = this.globalEventBus.off(event, listenerId)
      return localResult || globalResult
    } else {
      // 移除所有该事件的监听器
      return this.localEventBus.off(event) && this.globalEventBus.off(event)
    }
  }
  
  // 获取跨应用通信通道
  private getCrossAppChannel(targetAppId: string): CrossAppChannel {
    if (!this.crossAppChannels.has(targetAppId)) {
      const channel = new CrossAppChannel(
        this.context.appId,
        targetAppId,
        this.globalEventBus
      )
      this.crossAppChannels.set(targetAppId, channel)
    }
    return this.crossAppChannels.get(targetAppId)!
  }
  
  // 清理所有监听器
  cleanup(): void {
    // 清理本地监听器
    this.listeners.forEach(listenerId => {
      this.localEventBus.off('*' as EventName, listenerId)
      this.globalEventBus.off('*' as EventName, listenerId)
    })
    this.listeners.clear()
    
    // 清理跨应用通道
    this.crossAppChannels.forEach(channel => channel.cleanup())
    this.crossAppChannels.clear()
    
    // 清理本地事件总线
    if (typeof this.localEventBus.cleanup === 'function') {
      this.localEventBus.cleanup()
    }
  }
  
  // 获取应用上下文信息
  getContext(): AppEventContext {
    return { ...this.context }
  }
  
  // 检查是否有监听器
  hasListeners(event: EventName): boolean {
    return this.localEventBus.hasListeners(event) || this.globalEventBus.hasListeners(event)
  }
  
  // 获取监听器数量
  listenerCount(event: EventName): number {
    return this.localEventBus.listenerCount(event) + this.globalEventBus.listenerCount(event)
  }
}

// 应用事件管理器
export class AppEventManager {
  private appContexts = new Map<string, AppEventContext>()
  private appEventBuses = new Map<string, AppEventBus>()
  private globalEventBus: EnhancedEventBus
  private permissionValidator: EventPermissionValidator
  private permissionManager = getAppEventPermissionManager()
  private monitor = getAppEventMonitor()
  
  constructor(globalEventBus: EnhancedEventBus) {
    this.globalEventBus = globalEventBus
    this.permissionValidator = new EventPermissionValidator()
  }
  
  // 注册应用
  registerApp(context: AppEventContext): AppEventBus {
    // 验证应用ID唯一性
    if (this.appContexts.has(context.appId)) {
      throw new Error(`App with ID ${context.appId} is already registered`)
    }
    
    // 设置权限管理器中的应用权限
    this.permissionManager.setAppPermissions(context.appId, context.permissions)
    
    this.appContexts.set(context.appId, context)
    
    const appEventBus = new AppEventBus(
      context,
      this.globalEventBus,
      this.permissionValidator
    )
    
    this.appEventBuses.set(context.appId, appEventBus)
    
    // 记录监控数据
    this.monitor.recordEvent(
      'app:registered',
      'system',
      context.appId,
      0,
      true,
      undefined,
      { appName: context.appName, version: context.version }
    )
    
    // 触发应用注册事件
    this.globalEventBus.emit('app:registered' as EventName, {
      appId: context.appId,
      appName: context.appName,
      version: context.version,
      timestamp: Date.now()
    })
    
    return appEventBus
  }
  
  // 注销应用
  unregisterApp(appId: string): void {
    const appEventBus = this.appEventBuses.get(appId)
    const context = this.appContexts.get(appId)
    
    if (appEventBus) {
      appEventBus.cleanup()
      this.appEventBuses.delete(appId)
    }
    
    if (context) {
      // 清理权限管理器中的应用权限
      this.permissionManager.revokeAllPermissions(appId)
      
      this.appContexts.delete(appId)
      
      // 记录监控数据
      this.monitor.recordEvent(
        'app:unregistered',
        'system',
        appId,
        0,
        true,
        undefined,
        { appName: context.appName, version: context.version }
      )
      
      // 触发应用注销事件
      this.globalEventBus.emit('app:unregistered' as EventName, {
        appId: context.appId,
        appName: context.appName,
        version: context.version,
        timestamp: Date.now()
      })
    }
  }
  
  // 获取应用事件总线
  getAppEventBus(appId: string): AppEventBus | undefined {
    return this.appEventBuses.get(appId)
  }
  
  // 获取应用上下文
  getAppContext(appId: string): AppEventContext | undefined {
    return this.appContexts.get(appId)
  }
  
  // 获取所有已注册的应用
  getRegisteredApps(): AppEventContext[] {
    return Array.from(this.appContexts.values())
  }
  
  // 检查应用是否已注册
  isAppRegistered(appId: string): boolean {
    return this.appContexts.has(appId)
  }
  
  // 获取监控统计数据
  getMonitorStats() {
    return this.monitor.getStats()
  }
  
  // 获取应用监控统计
  getAppMonitorStats(appId: string) {
    return this.monitor.getAppStats(appId)
  }
  
  // 获取权限管理器
  getPermissionManager() {
    return this.permissionManager
  }
  
  // 获取应用权限
  getAppPermissions(appId: string) {
    return this.permissionManager.getAppPermissions(appId)
  }
  
  // 检查应用权限
  checkAppPermission(appId: string, permissionType: PermissionType, context?: PermissionContext) {
    return this.permissionManager.checkPermission(appId, permissionType, context)
  }
  
  // 导出监控数据
  exportMonitorData() {
    return this.monitor.exportData()
  }
  
  // 更新应用权限
  updateAppPermissions(appId: string, permissions: Partial<AppEventPermissions>): boolean {
    const context = this.appContexts.get(appId)
    if (!context) {
      return false
    }
    
    // 更新权限
    context.permissions = {
      ...context.permissions,
      ...permissions
    }
    
    // 触发权限更新事件
    this.globalEventBus.emit('app:permissions-updated' as EventName, {
      appId,
      permissions: context.permissions,
      timestamp: Date.now()
    })
    
    return true
  }
  
  // 获取权限验证器（用于外部权限检查）
  getPermissionValidator(): EventPermissionValidator {
    return this.permissionValidator
  }
  
  // 清理所有应用
  cleanup(): void {
    // 注销所有应用
    const appIds = Array.from(this.appContexts.keys())
    appIds.forEach(appId => this.unregisterApp(appId))
  }
}

// 创建默认的应用事件管理器实例
let defaultAppEventManager: AppEventManager | null = null

// 获取默认应用事件管理器
export function getAppEventManager(globalEventBus?: EnhancedEventBus): AppEventManager {
  if (!defaultAppEventManager) {
    if (!globalEventBus) {
      throw new Error('Global event bus is required to create AppEventManager')
    }
    defaultAppEventManager = new AppEventManager(globalEventBus)
  }
  return defaultAppEventManager
}

// 重置默认应用事件管理器（主要用于测试）
export function resetAppEventManager(): void {
  if (defaultAppEventManager) {
    defaultAppEventManager.cleanup()
    defaultAppEventManager = null
  }
}