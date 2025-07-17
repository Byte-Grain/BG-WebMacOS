/**
 * 应用生命周期管理器
 * 负责管理应用生命周期与事件系统的集成
 */

import type { AppEventManager, AppEventContext } from './AppEventManager'
import type { EventName, EventData } from './useEventBus'

// 应用生命周期事件
export const APP_LIFECYCLE_EVENTS = {
  BEFORE_MOUNT: 'app:lifecycle:before-mount',
  MOUNTED: 'app:lifecycle:mounted',
  BEFORE_UNMOUNT: 'app:lifecycle:before-unmount',
  UNMOUNTED: 'app:lifecycle:unmounted',
  ERROR: 'app:lifecycle:error',
  ACTIVATED: 'app:lifecycle:activated',
  DEACTIVATED: 'app:lifecycle:deactivated',
  SUSPENDED: 'app:lifecycle:suspended',
  RESUMED: 'app:lifecycle:resumed',
} as const

export type AppLifecycleEvent = typeof APP_LIFECYCLE_EVENTS[keyof typeof APP_LIFECYCLE_EVENTS]

// 生命周期钩子接口
export interface LifecycleHooks {
  beforeMount?: (data?: any) => void | Promise<void>
  mounted?: (data?: any) => void | Promise<void>
  beforeUnmount?: (data?: any) => void | Promise<void>
  unmounted?: (data?: any) => void | Promise<void>
  activated?: (data?: any) => void | Promise<void>
  deactivated?: (data?: any) => void | Promise<void>
  suspended?: (data?: any) => void | Promise<void>
  resumed?: (data?: any) => void | Promise<void>
  error?: (data?: any) => void | Promise<void>
}

// 生命周期状态
export enum AppLifecycleState {
  CREATED = 'created',
  MOUNTING = 'mounting',
  MOUNTED = 'mounted',
  ACTIVATED = 'activated',
  DEACTIVATED = 'deactivated',
  SUSPENDED = 'suspended',
  UNMOUNTING = 'unmounting',
  UNMOUNTED = 'unmounted',
  ERROR = 'error'
}

// 应用生命周期信息
export interface AppLifecycleInfo {
  appId: string
  state: AppLifecycleState
  hooks: LifecycleHooks
  mountTime?: number
  unmountTime?: number
  lastStateChange: number
  errorCount: number
  lastError?: Error
}

// 生命周期事件数据
export interface LifecycleEventData {
  appId: string
  appName: string
  state: AppLifecycleState
  previousState?: AppLifecycleState
  timestamp: number
  data?: any
  error?: Error
}

// 应用生命周期管理器
export class AppLifecycleManager {
  private appEventManager: AppEventManager
  private lifecycleInfos = new Map<string, AppLifecycleInfo>()
  private stateTransitions = new Map<string, AppLifecycleState[]>()
  
  constructor(appEventManager: AppEventManager) {
    this.appEventManager = appEventManager
    this.setupGlobalLifecycleListeners()
  }
  
  // 注册应用生命周期
  registerAppLifecycle(
    appId: string,
    hooks: LifecycleHooks
  ): void {
    // 检查应用是否已注册到事件系统
    if (!this.appEventManager.isAppRegistered(appId)) {
      throw new Error(`App ${appId} is not registered in the event system`)
    }
    
    // 增强钩子函数，添加自动清理逻辑
    const enhancedHooks = this.enhanceHooks(appId, hooks)
    
    const lifecycleInfo: AppLifecycleInfo = {
      appId,
      state: AppLifecycleState.CREATED,
      hooks: enhancedHooks,
      lastStateChange: Date.now(),
      errorCount: 0
    }
    
    this.lifecycleInfos.set(appId, lifecycleInfo)
    this.stateTransitions.set(appId, [AppLifecycleState.CREATED])
    
    // 触发生命周期注册事件
    this.emitLifecycleEvent(appId, APP_LIFECYCLE_EVENTS.BEFORE_MOUNT, {
      message: 'App lifecycle registered'
    })
  }
  
  // 注销应用生命周期
  unregisterAppLifecycle(appId: string): void {
    const lifecycleInfo = this.lifecycleInfos.get(appId)
    if (!lifecycleInfo) {
      return
    }
    
    // 如果应用还在运行，先触发卸载流程
    if (lifecycleInfo.state !== AppLifecycleState.UNMOUNTED) {
      this.triggerLifecycleEvent(appId, 'BEFORE_UNMOUNT')
      this.triggerLifecycleEvent(appId, 'UNMOUNTED')
    }
    
    this.lifecycleInfos.delete(appId)
    this.stateTransitions.delete(appId)
  }
  
  // 触发生命周期事件
  triggerLifecycleEvent(
    appId: string,
    event: keyof typeof APP_LIFECYCLE_EVENTS,
    data?: any
  ): Promise<void> {
    const lifecycleInfo = this.lifecycleInfos.get(appId)
    if (!lifecycleInfo) {
      console.warn(`No lifecycle info found for app ${appId}`)
      return Promise.resolve()
    }
    
    const hookName = this.getHookName(event)
    const hook = lifecycleInfo.hooks[hookName]
    
    if (!hook) {
      return Promise.resolve()
    }
    
    return this.executeHook(appId, hookName, hook, data)
  }
  
  // 执行生命周期钩子
  private async executeHook(
    appId: string,
    hookName: keyof LifecycleHooks,
    hook: NonNullable<LifecycleHooks[keyof LifecycleHooks]>,
    data?: any
  ): Promise<void> {
    const lifecycleInfo = this.lifecycleInfos.get(appId)!
    const previousState = lifecycleInfo.state
    
    try {
      // 更新状态
      const newState = this.getStateFromHook(hookName)
      if (newState) {
        this.updateAppState(appId, newState, previousState)
      }
      
      // 执行钩子
      await hook(data)
      
      // 记录成功执行
      if (hookName === 'mounted') {
        lifecycleInfo.mountTime = Date.now()
      } else if (hookName === 'unmounted') {
        lifecycleInfo.unmountTime = Date.now()
      }
      
    } catch (error) {
      console.error(`Error in ${hookName} hook for app ${appId}:`, error)
      
      // 更新错误信息
      lifecycleInfo.errorCount++
      lifecycleInfo.lastError = error as Error
      this.updateAppState(appId, AppLifecycleState.ERROR, previousState)
      
      // 触发错误钩子
      if (hookName !== 'error' && lifecycleInfo.hooks.error) {
        try {
          await lifecycleInfo.hooks.error({ error, hook: hookName, data })
        } catch (errorHookError) {
          console.error(`Error in error hook for app ${appId}:`, errorHookError)
        }
      }
      
      // 触发全局错误事件
      this.emitLifecycleEvent(appId, APP_LIFECYCLE_EVENTS.ERROR, {
        error,
        hook: hookName,
        data
      })
      
      throw error
    }
  }
  
  // 更新应用状态
  private updateAppState(
    appId: string,
    newState: AppLifecycleState,
    previousState?: AppLifecycleState
  ): void {
    const lifecycleInfo = this.lifecycleInfos.get(appId)
    if (!lifecycleInfo) {
      return
    }
    
    const oldState = lifecycleInfo.state
    lifecycleInfo.state = newState
    lifecycleInfo.lastStateChange = Date.now()
    
    // 记录状态转换历史
    const transitions = this.stateTransitions.get(appId) || []
    transitions.push(newState)
    this.stateTransitions.set(appId, transitions)
    
    // 触发状态变化事件
    this.emitLifecycleEvent(appId, this.getLifecycleEventFromState(newState), {
      previousState: previousState || oldState,
      newState,
      timestamp: Date.now()
    })
  }
  
  // 增强钩子函数
  private enhanceHooks(appId: string, hooks: LifecycleHooks): LifecycleHooks {
    const enhancedHooks = { ...hooks }
    
    // 增强 beforeUnmount 钩子，添加自动清理逻辑
    const originalBeforeUnmount = enhancedHooks.beforeUnmount
    enhancedHooks.beforeUnmount = async (data?: any) => {
      // 执行原始钩子
      if (originalBeforeUnmount) {
        await originalBeforeUnmount(data)
      }
      
      // 自动清理事件监听器
      this.appEventManager.unregisterApp(appId)
    }
    
    // 增强 error 钩子，添加错误恢复逻辑
    const originalError = enhancedHooks.error
    enhancedHooks.error = async (data?: any) => {
      // 执行原始钩子
      if (originalError) {
        await originalError(data)
      }
      
      // 错误恢复逻辑
      const lifecycleInfo = this.lifecycleInfos.get(appId)
      if (lifecycleInfo && lifecycleInfo.errorCount > 3) {
        console.warn(`App ${appId} has too many errors, triggering unmount`)
        await this.triggerLifecycleEvent(appId, 'BEFORE_UNMOUNT', {
          reason: 'too_many_errors',
          errorCount: lifecycleInfo.errorCount
        })
      }
    }
    
    return enhancedHooks
  }
  
  // 获取钩子名称
  private getHookName(event: keyof typeof APP_LIFECYCLE_EVENTS): keyof LifecycleHooks {
    const mapping: Record<keyof typeof APP_LIFECYCLE_EVENTS, keyof LifecycleHooks> = {
      BEFORE_MOUNT: 'beforeMount',
      MOUNTED: 'mounted',
      BEFORE_UNMOUNT: 'beforeUnmount',
      UNMOUNTED: 'unmounted',
      ERROR: 'error',
      ACTIVATED: 'activated',
      DEACTIVATED: 'deactivated',
      SUSPENDED: 'suspended',
      RESUMED: 'resumed',
    }
    return mapping[event]
  }
  
  // 从钩子名称获取状态
  private getStateFromHook(hookName: keyof LifecycleHooks): AppLifecycleState | null {
    const mapping: Record<keyof LifecycleHooks, AppLifecycleState | null> = {
      beforeMount: AppLifecycleState.MOUNTING,
      mounted: AppLifecycleState.MOUNTED,
      beforeUnmount: AppLifecycleState.UNMOUNTING,
      unmounted: AppLifecycleState.UNMOUNTED,
      activated: AppLifecycleState.ACTIVATED,
      deactivated: AppLifecycleState.DEACTIVATED,
      suspended: AppLifecycleState.SUSPENDED,
      resumed: AppLifecycleState.ACTIVATED,
      error: AppLifecycleState.ERROR,
    }
    return mapping[hookName]
  }
  
  // 从状态获取生命周期事件
  private getLifecycleEventFromState(state: AppLifecycleState): AppLifecycleEvent {
    const mapping: Record<AppLifecycleState, AppLifecycleEvent> = {
      [AppLifecycleState.CREATED]: APP_LIFECYCLE_EVENTS.BEFORE_MOUNT,
      [AppLifecycleState.MOUNTING]: APP_LIFECYCLE_EVENTS.BEFORE_MOUNT,
      [AppLifecycleState.MOUNTED]: APP_LIFECYCLE_EVENTS.MOUNTED,
      [AppLifecycleState.ACTIVATED]: APP_LIFECYCLE_EVENTS.ACTIVATED,
      [AppLifecycleState.DEACTIVATED]: APP_LIFECYCLE_EVENTS.DEACTIVATED,
      [AppLifecycleState.SUSPENDED]: APP_LIFECYCLE_EVENTS.SUSPENDED,
      [AppLifecycleState.UNMOUNTING]: APP_LIFECYCLE_EVENTS.BEFORE_UNMOUNT,
      [AppLifecycleState.UNMOUNTED]: APP_LIFECYCLE_EVENTS.UNMOUNTED,
      [AppLifecycleState.ERROR]: APP_LIFECYCLE_EVENTS.ERROR,
    }
    return mapping[state]
  }
  
  // 触发生命周期事件到全局事件总线
  private emitLifecycleEvent(
    appId: string,
    event: AppLifecycleEvent,
    data?: any
  ): void {
    const context = this.appEventManager.getAppContext(appId)
    if (!context) {
      return
    }
    
    const lifecycleInfo = this.lifecycleInfos.get(appId)
    
    const eventData: LifecycleEventData = {
      appId: context.appId,
      appName: context.appName,
      state: lifecycleInfo?.state || AppLifecycleState.CREATED,
      timestamp: Date.now(),
      ...data
    }
    
    // 获取全局事件总线并触发事件
    const globalEventBus = (this.appEventManager as any).globalEventBus
    if (globalEventBus && typeof globalEventBus.emit === 'function') {
      globalEventBus.emit(event as EventName, eventData)
    }
  }
  
  // 设置全局生命周期监听器
  private setupGlobalLifecycleListeners(): void {
    // 监听应用注册事件，自动设置基础生命周期
    const globalEventBus = (this.appEventManager as any).globalEventBus
    if (globalEventBus && typeof globalEventBus.on === 'function') {
      globalEventBus.on('app:registered' as EventName, (data: any) => {
        // 为新注册的应用设置默认生命周期
        if (!this.lifecycleInfos.has(data.appId)) {
          this.registerAppLifecycle(data.appId, {})
        }
      })
      
      globalEventBus.on('app:unregistered' as EventName, (data: any) => {
        // 清理生命周期信息
        this.unregisterAppLifecycle(data.appId)
      })
    }
  }
  
  // 获取应用生命周期信息
  getAppLifecycleInfo(appId: string): AppLifecycleInfo | undefined {
    return this.lifecycleInfos.get(appId)
  }
  
  // 获取应用当前状态
  getAppState(appId: string): AppLifecycleState | undefined {
    return this.lifecycleInfos.get(appId)?.state
  }
  
  // 获取应用状态转换历史
  getAppStateHistory(appId: string): AppLifecycleState[] {
    return this.stateTransitions.get(appId) || []
  }
  
  // 获取所有应用的生命周期信息
  getAllAppsLifecycleInfo(): Map<string, AppLifecycleInfo> {
    return new Map(this.lifecycleInfos)
  }
  
  // 检查应用是否处于特定状态
  isAppInState(appId: string, state: AppLifecycleState): boolean {
    return this.getAppState(appId) === state
  }
  
  // 等待应用达到特定状态
  waitForAppState(
    appId: string,
    targetState: AppLifecycleState,
    timeout: number = 5000
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const currentState = this.getAppState(appId)
      if (currentState === targetState) {
        resolve(true)
        return
      }
      
      const globalEventBus = (this.appEventManager as any).globalEventBus
      if (!globalEventBus) {
        resolve(false)
        return
      }
      
      let timeoutId: NodeJS.Timeout
      let listenerId: string
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (listenerId) globalEventBus.off('*' as EventName, listenerId)
      }
      
      // 设置超时
      timeoutId = setTimeout(() => {
        cleanup()
        resolve(false)
      }, timeout)
      
      // 监听生命周期事件
      const eventPattern = Object.values(APP_LIFECYCLE_EVENTS).join('|')
      listenerId = globalEventBus.on('*' as EventName, (data: LifecycleEventData) => {
        if (data.appId === appId && data.state === targetState) {
          cleanup()
          resolve(true)
        }
      })
    })
  }
  
  // 强制应用进入特定状态
  forceAppState(appId: string, targetState: AppLifecycleState): Promise<void> {
    const currentState = this.getAppState(appId)
    if (currentState === targetState) {
      return Promise.resolve()
    }
    
    // 根据目标状态触发相应的生命周期事件
    switch (targetState) {
      case AppLifecycleState.MOUNTED:
        return this.triggerLifecycleEvent(appId, 'MOUNTED')
      case AppLifecycleState.ACTIVATED:
        return this.triggerLifecycleEvent(appId, 'ACTIVATED')
      case AppLifecycleState.DEACTIVATED:
        return this.triggerLifecycleEvent(appId, 'DEACTIVATED')
      case AppLifecycleState.SUSPENDED:
        return this.triggerLifecycleEvent(appId, 'SUSPENDED')
      case AppLifecycleState.UNMOUNTED:
        return this.triggerLifecycleEvent(appId, 'UNMOUNTED')
      default:
        return Promise.resolve()
    }
  }
  
  // 清理所有生命周期信息
  cleanup(): void {
    const appIds = Array.from(this.lifecycleInfos.keys())
    appIds.forEach(appId => this.unregisterAppLifecycle(appId))
  }
}

// 创建默认的应用生命周期管理器实例
let defaultAppLifecycleManager: AppLifecycleManager | null = null

// 获取默认应用生命周期管理器
export function getAppLifecycleManager(appEventManager?: AppEventManager): AppLifecycleManager {
  if (!defaultAppLifecycleManager) {
    if (!appEventManager) {
      throw new Error('AppEventManager is required to create AppLifecycleManager')
    }
    defaultAppLifecycleManager = new AppLifecycleManager(appEventManager)
  }
  return defaultAppLifecycleManager
}

// 重置默认应用生命周期管理器（主要用于测试）
export function resetAppLifecycleManager(): void {
  if (defaultAppLifecycleManager) {
    defaultAppLifecycleManager.cleanup()
    defaultAppLifecycleManager = null
  }
}