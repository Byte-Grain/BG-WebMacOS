/**
 * 应用事件集成组合式API
 * 为Vue应用提供便捷的事件集成接口
 */

import { ref, onMounted, onUnmounted, getCurrentInstance, type Ref } from 'vue'
import type { AppEventManager, AppEventContext, AppEventPermissions } from './AppEventManager'
import type { AppLifecycleManager, LifecycleHooks, AppLifecycleState } from './AppLifecycleManager'
import type { EventName, EventData, EventCallback } from './useEventBus'
import { getAppEventManager } from './AppEventManager'
import { getAppLifecycleManager } from './AppLifecycleManager'

// 应用事件配置
export interface AppEventConfig {
  appId: string
  appName: string
  version?: string
  permissions?: Partial<AppEventPermissions>
  lifecycleHooks?: LifecycleHooks
  autoRegister?: boolean
  autoCleanup?: boolean
}

// 应用事件状态
export interface AppEventState {
  isRegistered: boolean
  lifecycleState: AppLifecycleState | null
  permissions: AppEventPermissions | null
  context: AppEventContext | null
  errorCount: number
  lastError: Error | null
}

// 跨应用通信接口
export interface CrossAppCommunication {
  sendToApp: (targetAppId: string, eventName: string, data?: any) => Promise<boolean>
  broadcastToApps: (eventName: string, data?: any, excludeApps?: string[]) => Promise<number>
  requestFromApp: (targetAppId: string, eventName: string, data?: any, timeout?: number) => Promise<any>
  subscribeToApp: (sourceAppId: string, eventName: string, callback: EventCallback) => string
  unsubscribeFromApp: (sourceAppId: string, listenerId: string) => void
}

// 系统事件接口
export interface SystemEventInterface {
  emitSystemEvent: (eventName: string, data?: any) => void
  onSystemEvent: (eventName: string, callback: EventCallback) => string
  offSystemEvent: (eventName: string, listenerId?: string) => void
}

// 应用事件组合式API返回值
export interface UseAppEventReturn {
  // 状态
  state: Ref<AppEventState>
  isRegistered: Ref<boolean>
  lifecycleState: Ref<AppLifecycleState | null>
  
  // 注册和注销
  register: () => Promise<void>
  unregister: () => Promise<void>
  
  // 生命周期管理
  triggerLifecycle: (event: string, data?: any) => Promise<void>
  waitForState: (targetState: AppLifecycleState, timeout?: number) => Promise<boolean>
  
  // 事件监听
  on: (eventName: string, callback: EventCallback) => string
  off: (eventName: string, listenerId?: string) => void
  emit: (eventName: string, data?: any) => void
  
  // 跨应用通信
  crossApp: CrossAppCommunication
  
  // 系统事件
  system: SystemEventInterface
  
  // 权限管理
  hasPermission: (permission: keyof AppEventPermissions) => boolean
  requestPermission: (permission: keyof AppEventPermissions) => Promise<boolean>
  
  // 错误处理
  onError: (callback: (error: Error) => void) => void
  clearErrors: () => void
}

// 应用事件组合式API
export function useAppEvent(config: AppEventConfig): UseAppEventReturn {
  const instance = getCurrentInstance()
  const appEventManager = getAppEventManager()
  const lifecycleManager = getAppLifecycleManager(appEventManager)
  
  // 状态管理
  const state = ref<AppEventState>({
    isRegistered: false,
    lifecycleState: null,
    permissions: null,
    context: null,
    errorCount: 0,
    lastError: null
  })
  
  const isRegistered = ref(false)
  const lifecycleState = ref<AppLifecycleState | null>(null)
  
  // 错误处理回调
  const errorCallbacks = new Set<(error: Error) => void>()
  
  // 事件监听器管理
  const eventListeners = new Map<string, Set<string>>()
  
  // 更新状态
  const updateState = () => {
    const registered = appEventManager.isAppRegistered(config.appId)
    const context = appEventManager.getAppContext(config.appId)
    const lifecycleInfo = lifecycleManager.getAppLifecycleInfo(config.appId)
    
    state.value = {
      isRegistered: registered,
      lifecycleState: lifecycleInfo?.state || null,
      permissions: context?.permissions || null,
      context,
      errorCount: lifecycleInfo?.errorCount || 0,
      lastError: lifecycleInfo?.lastError || null
    }
    
    isRegistered.value = registered
    lifecycleState.value = lifecycleInfo?.state || null
  }
  
  // 注册应用
  const register = async (): Promise<void> => {
    try {
      // 注册到事件系统
      appEventManager.registerApp({
        appId: config.appId,
        appName: config.appName,
        version: config.version || '1.0.0',
        permissions: {
          canEmitSystemEvents: false,
          canListenSystemEvents: true,
          canCommunicateWithApps: [],
          canAccessGlobalEvents: false,
          maxEventListeners: 50,
          maxEventEmitsPerSecond: 100,
          ...config.permissions
        }
      })
      
      // 注册生命周期
      if (config.lifecycleHooks) {
        lifecycleManager.registerAppLifecycle(config.appId, config.lifecycleHooks)
      }
      
      updateState()
      
      // 触发mounted生命周期
      if (config.lifecycleHooks?.mounted) {
        await lifecycleManager.triggerLifecycleEvent(config.appId, 'MOUNTED')
      }
      
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }
  
  // 注销应用
  const unregister = async (): Promise<void> => {
    try {
      // 触发beforeUnmount生命周期
      if (config.lifecycleHooks?.beforeUnmount) {
        await lifecycleManager.triggerLifecycleEvent(config.appId, 'BEFORE_UNMOUNT')
      }
      
      // 清理所有事件监听器
      eventListeners.forEach((listeners, eventName) => {
        listeners.forEach(listenerId => {
          appEventManager.off(config.appId, eventName, listenerId)
        })
      })
      eventListeners.clear()
      
      // 注销生命周期
      lifecycleManager.unregisterAppLifecycle(config.appId)
      
      // 注销应用
      appEventManager.unregisterApp(config.appId)
      
      updateState()
      
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }
  
  // 触发生命周期事件
  const triggerLifecycle = async (event: string, data?: any): Promise<void> => {
    try {
      await lifecycleManager.triggerLifecycleEvent(
        config.appId,
        event as keyof typeof import('./AppLifecycleManager').APP_LIFECYCLE_EVENTS,
        data
      )
      updateState()
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }
  
  // 等待状态
  const waitForState = (targetState: AppLifecycleState, timeout = 5000): Promise<boolean> => {
    return lifecycleManager.waitForAppState(config.appId, targetState, timeout)
  }
  
  // 事件监听
  const on = (eventName: string, callback: EventCallback): string => {
    try {
      const listenerId = appEventManager.on(config.appId, eventName, callback)
      
      // 记录监听器
      if (!eventListeners.has(eventName)) {
        eventListeners.set(eventName, new Set())
      }
      eventListeners.get(eventName)!.add(listenerId)
      
      return listenerId
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }
  
  // 取消事件监听
  const off = (eventName: string, listenerId?: string): void => {
    try {
      if (listenerId) {
        appEventManager.off(config.appId, eventName, listenerId)
        eventListeners.get(eventName)?.delete(listenerId)
      } else {
        // 取消所有该事件的监听器
        const listeners = eventListeners.get(eventName)
        if (listeners) {
          listeners.forEach(id => {
            appEventManager.off(config.appId, eventName, id)
          })
          eventListeners.delete(eventName)
        }
      }
    } catch (error) {
      handleError(error as Error)
    }
  }
  
  // 触发事件
  const emit = (eventName: string, data?: any): void => {
    try {
      appEventManager.emit(config.appId, eventName, data)
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }
  
  // 跨应用通信
  const crossApp: CrossAppCommunication = {
    sendToApp: async (targetAppId: string, eventName: string, data?: any): Promise<boolean> => {
      try {
        return await appEventManager.sendToApp(config.appId, targetAppId, eventName, data)
      } catch (error) {
        handleError(error as Error)
        return false
      }
    },
    
    broadcastToApps: async (eventName: string, data?: any, excludeApps?: string[]): Promise<number> => {
      try {
        return await appEventManager.broadcastToApps(config.appId, eventName, data, excludeApps)
      } catch (error) {
        handleError(error as Error)
        return 0
      }
    },
    
    requestFromApp: async (targetAppId: string, eventName: string, data?: any, timeout = 5000): Promise<any> => {
      try {
        return await appEventManager.requestFromApp(config.appId, targetAppId, eventName, data, timeout)
      } catch (error) {
        handleError(error as Error)
        throw error
      }
    },
    
    subscribeToApp: (sourceAppId: string, eventName: string, callback: EventCallback): string => {
      try {
        return appEventManager.subscribeToApp(config.appId, sourceAppId, eventName, callback)
      } catch (error) {
        handleError(error as Error)
        throw error
      }
    },
    
    unsubscribeFromApp: (sourceAppId: string, listenerId: string): void => {
      try {
        appEventManager.unsubscribeFromApp(config.appId, sourceAppId, listenerId)
      } catch (error) {
        handleError(error as Error)
      }
    }
  }
  
  // 系统事件
  const system: SystemEventInterface = {
    emitSystemEvent: (eventName: string, data?: any): void => {
      try {
        appEventManager.emitSystemEvent(config.appId, eventName, data)
      } catch (error) {
        handleError(error as Error)
        throw error
      }
    },
    
    onSystemEvent: (eventName: string, callback: EventCallback): string => {
      try {
        return appEventManager.onSystemEvent(config.appId, eventName, callback)
      } catch (error) {
        handleError(error as Error)
        throw error
      }
    },
    
    offSystemEvent: (eventName: string, listenerId?: string): void => {
      try {
        appEventManager.offSystemEvent(config.appId, eventName, listenerId)
      } catch (error) {
        handleError(error as Error)
      }
    }
  }
  
  // 权限检查
  const hasPermission = (permission: keyof AppEventPermissions): boolean => {
    const context = appEventManager.getAppContext(config.appId)
    if (!context) return false
    
    const permissions = context.permissions
    switch (permission) {
      case 'canEmitSystemEvents':
      case 'canListenSystemEvents':
      case 'canAccessGlobalEvents':
        return permissions[permission] === true
      case 'canCommunicateWithApps':
        return Array.isArray(permissions[permission]) && permissions[permission].length > 0
      case 'maxEventListeners':
      case 'maxEventEmitsPerSecond':
        return typeof permissions[permission] === 'number' && permissions[permission] > 0
      default:
        return false
    }
  }
  
  // 请求权限
  const requestPermission = async (permission: keyof AppEventPermissions): Promise<boolean> => {
    // 这里可以实现权限请求逻辑，比如弹出确认对话框
    // 目前简单返回当前权限状态
    return hasPermission(permission)
  }
  
  // 错误处理
  const handleError = (error: Error): void => {
    state.value.errorCount++
    state.value.lastError = error
    
    errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError)
      }
    })
  }
  
  const onError = (callback: (error: Error) => void): void => {
    errorCallbacks.add(callback)
  }
  
  const clearErrors = (): void => {
    state.value.errorCount = 0
    state.value.lastError = null
  }
  
  // 生命周期钩子
  onMounted(async () => {
    if (config.autoRegister !== false) {
      await register()
    }
  })
  
  onUnmounted(async () => {
    if (config.autoCleanup !== false) {
      await unregister()
    }
  })
  
  // 监听状态变化
  const setupStateWatcher = () => {
    const globalEventBus = (appEventManager as any).globalEventBus
    if (globalEventBus) {
      // 监听应用相关的生命周期事件
      const lifecycleEvents = [
        'app:lifecycle:before-mount',
        'app:lifecycle:mounted',
        'app:lifecycle:before-unmount',
        'app:lifecycle:unmounted',
        'app:lifecycle:activated',
        'app:lifecycle:deactivated',
        'app:lifecycle:suspended',
        'app:lifecycle:resumed',
        'app:lifecycle:error'
      ]
      
      lifecycleEvents.forEach(eventName => {
        globalEventBus.on(eventName as EventName, (data: any) => {
          if (data.appId === config.appId) {
            updateState()
          }
        })
      })
    }
  }
  
  setupStateWatcher()
  
  return {
    state,
    isRegistered,
    lifecycleState,
    register,
    unregister,
    triggerLifecycle,
    waitForState,
    on,
    off,
    emit,
    crossApp,
    system,
    hasPermission,
    requestPermission,
    onError,
    clearErrors
  }
}

// 简化版应用事件钩子
export function useSimpleAppEvent(appId: string, appName: string) {
  return useAppEvent({
    appId,
    appName,
    autoRegister: true,
    autoCleanup: true
  })
}

// 应用事件工具函数
export const AppEventUtils = {
  // 创建应用事件配置
  createConfig: (appId: string, appName: string, options?: Partial<AppEventConfig>): AppEventConfig => {
    return {
      appId,
      appName,
      version: '1.0.0',
      autoRegister: true,
      autoCleanup: true,
      ...options
    }
  },
  
  // 创建权限配置
  createPermissions: (options?: Partial<AppEventPermissions>): AppEventPermissions => {
    return {
      canEmitSystemEvents: false,
      canListenSystemEvents: true,
      canCommunicateWithApps: [],
      canAccessGlobalEvents: false,
      maxEventListeners: 50,
      maxEventEmitsPerSecond: 100,
      ...options
    }
  },
  
  // 创建生命周期钩子
  createLifecycleHooks: (hooks?: Partial<LifecycleHooks>): LifecycleHooks => {
    return {
      beforeMount: hooks?.beforeMount,
      mounted: hooks?.mounted,
      beforeUnmount: hooks?.beforeUnmount,
      unmounted: hooks?.unmounted,
      activated: hooks?.activated,
      deactivated: hooks?.deactivated,
      suspended: hooks?.suspended,
      resumed: hooks?.resumed,
      error: hooks?.error
    }
  },
  
  // 验证应用ID格式
  validateAppId: (appId: string): boolean => {
    return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(appId) && appId.length >= 3 && appId.length <= 50
  },
  
  // 生成唯一应用ID
  generateAppId: (appName: string): string => {
    const sanitized = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const timestamp = Date.now().toString(36)
    return `${sanitized}-${timestamp}`
  }
}

// 导出类型
export type {
  AppEventConfig,
  AppEventState,
  CrossAppCommunication,
  SystemEventInterface,
  UseAppEventReturn
}