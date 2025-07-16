import { getCurrentInstance, onMounted, onUnmounted, ref } from 'vue'
import { useWindowEvents } from './useWindowEvents'
import { useEventBus, EVENTS } from './useEventBus'

/**
 * 应用窗口事件组合式函数
 * 为应用组件提供统一的窗口事件处理能力
 */
export function useAppWindowEvents() {
  const instance = getCurrentInstance()
  const windowEvents = useWindowEvents()
  const eventBus = useEventBus()
  const eventCleanupFunctions = ref<(() => void)[]>([])
  
  // 获取当前应用的信息
  const getCurrentApp = () => {
    // 尝试从props中获取app信息
    const props = instance?.props as any
    return props?.app || null
  }
  
  // 获取当前应用的key和pid
  const getAppIdentifiers = () => {
    const app = getCurrentApp()
    return {
      appKey: app?.key,
      pid: app?.pid
    }
  }
  
  // 窗口操作方法
  const windowOperations = {
    // 最大化窗口
    maximize() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.maximizeWindow(appKey, pid)
    },
    
    // 恢复正常大小
    normalize() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.normalizeWindow(appKey, pid)
    },
    
    // 最小化窗口
    minimize() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.minimizeWindow(appKey, pid)
    },
    
    // 全屏
    fullscreen() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.fullscreenWindow(appKey, pid)
    },
    
    // 关闭窗口
    close() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.closeWindow(appKey, pid)
    },
    
    // 设置窗口标题
    setTitle(title: string) {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.setWindowTitle(title, appKey, pid)
    },
    
    // 设置窗口位置
    setPosition(x: number, y: number) {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.setWindowPosition(x, y, appKey, pid)
    },
    
    // 设置窗口大小
    setSize(width: number, height: number) {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.setWindowSize(width, height, appKey, pid)
    },
    
    // 获得焦点
    focus() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.focusWindow(appKey, pid)
    },
    
    // 失去焦点
    blur() {
      const { appKey, pid } = getAppIdentifiers()
      windowEvents.blurWindow(appKey, pid)
    }
  }
  
  // 应用操作方法
  const appOperations = {
    // 打开应用
    openApp(appKey: string, data?: any) {
      windowEvents.openApp(appKey, data)
    },
    
    // 关闭应用
    closeApp(appKey?: string, pid?: number) {
      windowEvents.closeApp(appKey, pid)
    }
  }
  
  // 事件监听方法
  const eventListeners = {
    // 监听窗口状态变化
    onWindowStateChange(callback: (state: 'maximized' | 'minimized' | 'normal' | 'fullscreen') => void) {
      const { appKey, pid } = getAppIdentifiers()
      
      const maximizeListenerId = eventBus.on(EVENTS.APP_MAXIMIZE, (data) => {
        if (data.appKey === appKey || data.pid === pid) {
          callback('maximized')
        }
      })
      
      const minimizeListenerId = eventBus.on(EVENTS.APP_MINIMIZE, (data) => {
        if (data.appKey === appKey || data.pid === pid) {
          callback('minimized')
        }
      })
      
      const fullscreenListenerId = eventBus.on(EVENTS.WINDOW_FULLSCREEN, (data) => {
        if (data.windowId === appKey) {
          callback(data.enabled ? 'fullscreen' : 'normal')
        }
      })
      
      const resizeListenerId = eventBus.on(EVENTS.WINDOW_RESIZE, (data) => {
        if (data.windowId === appKey) {
          callback('normal')
        }
      })
      
      const cleanupFn = () => {
        eventBus.off(EVENTS.APP_MAXIMIZE, maximizeListenerId)
        eventBus.off(EVENTS.APP_MINIMIZE, minimizeListenerId)
        eventBus.off(EVENTS.WINDOW_FULLSCREEN, fullscreenListenerId)
        eventBus.off(EVENTS.WINDOW_RESIZE, resizeListenerId)
      }
      
      eventCleanupFunctions.value.push(cleanupFn)
      
      return cleanupFn
    },
    
    // 监听窗口位置变化
    onWindowPositionChange(callback: (position: { x: number; y: number }) => void) {
      const { appKey, pid } = getAppIdentifiers()
      
      const moveListenerId = eventBus.on(EVENTS.APP_MOVE, (data) => {
        if (data.appKey === appKey || data.pid === pid) {
          callback({ x: data.x, y: data.y })
        }
      })
      
      const cleanupFn = () => {
        eventBus.off(EVENTS.APP_MOVE, moveListenerId)
      }
      
      eventCleanupFunctions.value.push(cleanupFn)
      
      return cleanupFn
    },
    
    // 监听窗口大小变化
    onWindowSizeChange(callback: (size: { width: number; height: number }) => void) {
      const { appKey, pid } = getAppIdentifiers()
      
      const resizeListenerId = eventBus.on(EVENTS.APP_RESIZE, (data) => {
        if (data.appKey === appKey || data.pid === pid) {
          callback({ width: data.width, height: data.height })
        }
      })
      
      const cleanupFn = () => {
        eventBus.off(EVENTS.APP_RESIZE, resizeListenerId)
      }
      
      eventCleanupFunctions.value.push(cleanupFn)
      
      return cleanupFn
    },
    
    // 监听窗口焦点变化
    onWindowFocusChange(callback: (focused: boolean) => void) {
      const { appKey, pid } = getAppIdentifiers()
      
      const focusListenerId = eventBus.on(EVENTS.APP_FOCUS, (data) => {
        if (data.appKey === appKey || data.pid === pid) {
          callback(true)
        }
      })
      
      const blurListenerId = eventBus.on(EVENTS.WINDOW_BLUR, (data) => {
        if (data.windowId === appKey || data.appKey === appKey) {
          callback(false)
        }
      })
      
      const cleanupFn = () => {
        eventBus.off(EVENTS.APP_FOCUS, focusListenerId)
        eventBus.off(EVENTS.WINDOW_BLUR, blurListenerId)
      }
      
      eventCleanupFunctions.value.push(cleanupFn)
      
      return cleanupFn
    },
    
    // 监听应用打开/关闭事件
    onAppLifecycle(callbacks: {
      onOpen?: (data: { appKey: string; config?: any }) => void
      onClose?: (data: { appKey: string; pid: number; reason?: string }) => void
    }) {
      const listenerIds: string[] = []
      
      if (callbacks.onOpen) {
        const openListenerId = eventBus.on(EVENTS.APP_OPEN, callbacks.onOpen)
        listenerIds.push(openListenerId)
      }
      
      if (callbacks.onClose) {
        const closeListenerId = eventBus.on(EVENTS.APP_CLOSE, callbacks.onClose)
        listenerIds.push(closeListenerId)
      }
      
      const cleanupFn = () => {
        if (callbacks.onOpen && listenerIds[0]) {
          eventBus.off(EVENTS.APP_OPEN, listenerIds[0])
        }
        if (callbacks.onClose && listenerIds[callbacks.onOpen ? 1 : 0]) {
          eventBus.off(EVENTS.APP_CLOSE, listenerIds[callbacks.onOpen ? 1 : 0])
        }
      }
      
      eventCleanupFunctions.value.push(cleanupFn)
      
      return cleanupFn
    }
  }
  

  
  // 清理所有事件监听器
  const cleanup = () => {
    eventCleanupFunctions.value.forEach(cleanupFn => cleanupFn())
    eventCleanupFunctions.value = []
  }
  
  // 组件卸载时自动清理
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    // 窗口操作
    window: windowOperations,
    
    // 应用操作
    app: appOperations,
    
    // 事件监听
    on: eventListeners,
    

    
    // 手动清理
    cleanup,
    
    // 获取当前应用信息
    getCurrentApp,
    getAppIdentifiers
  }
}

// 导出类型
export type AppWindowEvents = ReturnType<typeof useAppWindowEvents>
