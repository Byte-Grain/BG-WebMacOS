import { ref, onUnmounted } from 'vue'

// 事件类型定义
export interface EventCallback<T = any> {
  (data: T): void
}

export interface EventListener<T = any> {
  id: string
  callback: EventCallback<T>
  once?: boolean
}

// 事件总线类
class EventBus {
  private events: Map<string, EventListener[]> = new Map()
  private eventId = 0

  // 生成唯一事件监听器 ID
  private generateId(): string {
    return `event_${++this.eventId}_${Date.now()}`
  }

  // 添加事件监听器
  on<T = any>(event: string, callback: EventCallback<T>, once = false): string {
    const id = this.generateId()
    const listener: EventListener<T> = { id, callback, once }
    
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    
    this.events.get(event)!.push(listener)
    return id
  }

  // 添加一次性事件监听器
  once<T = any>(event: string, callback: EventCallback<T>): string {
    return this.on(event, callback, true)
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
        return true
      }
    } else {
      // 移除所有监听器
      this.events.delete(event)
      return true
    }
    
    return false
  }

  // 触发事件
  emit<T = any>(event: string, data?: T): void {
    const listeners = this.events.get(event)
    if (!listeners || listeners.length === 0) return

    // 复制监听器数组，避免在执行过程中被修改
    const listenersToExecute = [...listeners]
    
    listenersToExecute.forEach(listener => {
      try {
        listener.callback(data)
        
        // 如果是一次性监听器，执行后移除
        if (listener.once) {
          this.off(event, listener.id)
        }
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error)
      }
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

  // 清除所有事件监听器
  clear(): void {
    this.events.clear()
  }

  // 清除特定事件的所有监听器
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }
}

// 全局事件总线实例
const globalEventBus = new EventBus()

// 事件总线组合式函数
export function useEventBus() {
  // 存储当前组件的监听器 ID，用于自动清理
  const listenerIds = ref<string[]>([])

  // 添加事件监听器
  const on = <T = any>(event: string, callback: EventCallback<T>, once = false): string => {
    const id = globalEventBus.on(event, callback, once)
    listenerIds.value.push(id)
    return id
  }

  // 添加一次性事件监听器
  const once = <T = any>(event: string, callback: EventCallback<T>): string => {
    const id = globalEventBus.once(event, callback)
    listenerIds.value.push(id)
    return id
  }

  // 移除事件监听器
  const off = (event: string, listenerId?: string): boolean => {
    const result = globalEventBus.off(event, listenerId)
    if (listenerId) {
      const index = listenerIds.value.indexOf(listenerId)
      if (index > -1) {
        listenerIds.value.splice(index, 1)
      }
    }
    return result
  }

  // 触发事件
  const emit = <T = any>(event: string, data?: T): void => {
    globalEventBus.emit(event, data)
  }

  // 获取监听器数量
  const listenerCount = (event: string): number => {
    return globalEventBus.listenerCount(event)
  }

  // 获取所有事件名称
  const eventNames = (): string[] => {
    return globalEventBus.eventNames()
  }

  // 组件卸载时自动清理监听器
  onUnmounted(() => {
    listenerIds.value.forEach(id => {
      // 遍历所有事件，找到并移除对应的监听器
      globalEventBus.eventNames().forEach(eventName => {
        globalEventBus.off(eventName, id)
      })
    })
    listenerIds.value = []
  })

  return {
    // 事件操作
    on,
    once,
    off,
    emit,
    
    // 信息获取
    listenerCount,
    eventNames,
    
    // 直接访问全局事件总线（高级用法）
    bus: globalEventBus,
  }
}

// 导出全局事件总线实例（用于非组合式函数中使用）
export { globalEventBus as eventBus }

// 常用事件名称常量
export const EVENTS = {
  // 应用相关
  APP_OPENED: 'app:opened',
  APP_CLOSED: 'app:closed',
  APP_FOCUSED: 'app:focused',
  APP_MINIMIZED: 'app:minimized',
  APP_MAXIMIZED: 'app:maximized',
  
  // 系统相关
  SYSTEM_READY: 'system:ready',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_SLEEP: 'system:sleep',
  SYSTEM_WAKE: 'system:wake',
  
  // 主题相关
  THEME_CHANGED: 'theme:changed',
  THEME_FOLLOW_SYSTEM: 'theme:follow-system',
  
  // 网络相关
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  
  // 用户相关
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  
  // 窗口相关
  WINDOW_RESIZE: 'window:resize',
  WINDOW_FOCUS: 'window:focus',
  WINDOW_BLUR: 'window:blur',
  
  // 键盘相关
  KEYBOARD_SHORTCUT: 'keyboard:shortcut',
  
  // 通知相关
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]