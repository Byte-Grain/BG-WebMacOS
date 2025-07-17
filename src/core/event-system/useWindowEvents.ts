import { inject, provide, type InjectionKey } from 'vue'
import { useEventBus, EVENTS, type EventData } from './useEventBus'
import { useAppManager } from '@/shared/composables'
import { getAppByKey } from '@core/app-registry'

// 窗口事件类型定义
export interface WindowEventData {
  // 窗口状态事件
  windowMaxSize: { appKey?: string; pid?: number }
  windowNormalSize: { appKey?: string; pid?: number }
  windowMinSize: { appKey?: string; pid?: number }
  windowFullSize: { appKey?: string; pid?: number }
  windowClose: { appKey?: string; pid?: number }
  
  // 应用操作事件
  openApp: { app: string; data?: any }
  closeApp: { app?: string; pid?: number }
  
  // 窗口属性事件
  setWindowTitle: { title: string; appKey?: string; pid?: number }
  
  // 窗口位置和大小事件
  setWindowPosition: { x: number; y: number; appKey?: string; pid?: number }
  setWindowSize: { width: number; height: number; appKey?: string; pid?: number }
  
  // 窗口焦点事件
  focusWindow: { appKey?: string; pid?: number }
  blurWindow: { appKey?: string; pid?: number }
}

export type WindowEventName = keyof WindowEventData

// 窗口事件管理器
export class WindowEventManager {
  private eventBus = useEventBus()
  private appManager = useAppManager()
  
  constructor() {
    this.setupEventListeners()
  }
  
  // 设置事件监听器
  private setupEventListeners() {
    // 监听窗口状态变化事件
    this.eventBus.on(EVENTS.APP_MAXIMIZE, this.handleAppMaximize.bind(this))
    this.eventBus.on(EVENTS.APP_MINIMIZED, this.handleAppMinimize.bind(this))
    this.eventBus.on(EVENTS.APP_CLOSE, this.handleAppClose.bind(this))
    this.eventBus.on(EVENTS.APP_FOCUS, this.handleAppFocus.bind(this))
    this.eventBus.on(EVENTS.WINDOW_RESIZE, this.handleWindowResize.bind(this))
    this.eventBus.on(EVENTS.WINDOW_FULLSCREEN, this.handleWindowFullscreen.bind(this))
  }
  
  // 触发窗口事件
  emit<T extends WindowEventName>(eventName: T, data: WindowEventData[T]) {
    this.handleWindowEvent(eventName, data)
  }
  
  // 处理窗口事件的核心方法
  private handleWindowEvent<T extends WindowEventName>(eventName: T, data: WindowEventData[T]) {
    switch (eventName) {
      case 'windowMaxSize':
        this.handleWindowMaxSize(data as WindowEventData['windowMaxSize'])
        break
      case 'windowNormalSize':
        this.handleWindowNormalSize(data as WindowEventData['windowNormalSize'])
        break
      case 'windowMinSize':
        this.handleWindowMinSize(data as WindowEventData['windowMinSize'])
        break
      case 'windowFullSize':
        this.handleWindowFullSize(data as WindowEventData['windowFullSize'])
        break
      case 'windowClose':
        this.handleWindowClose(data as WindowEventData['windowClose'])
        break
      case 'openApp':
        this.handleOpenApp(data as WindowEventData['openApp'])
        break
      case 'closeApp':
        this.handleCloseApp(data as WindowEventData['closeApp'])
        break
      case 'setWindowTitle':
        this.handleSetWindowTitle(data as WindowEventData['setWindowTitle'])
        break
      case 'setWindowPosition':
        this.handleSetWindowPosition(data as WindowEventData['setWindowPosition'])
        break
      case 'setWindowSize':
        this.handleSetWindowSize(data as WindowEventData['setWindowSize'])
        break
      case 'focusWindow':
        this.handleFocusWindow(data as WindowEventData['focusWindow'])
        break
      case 'blurWindow':
        this.handleBlurWindow(data as WindowEventData['blurWindow'])
        break
      default:
        console.warn(`Unknown window event: ${eventName}`)
    }
  }
  
  // 窗口最大化
  private handleWindowMaxSize(data: WindowEventData['windowMaxSize']) {
    this.eventBus.emit(EVENTS.APP_MAXIMIZE, {
      appKey: data.appKey || '',
      pid: data.pid || 0
    })
  }
  
  // 窗口正常大小
  private handleWindowNormalSize(data: WindowEventData['windowNormalSize']) {
    // 触发窗口恢复正常大小事件
    this.eventBus.emit(EVENTS.WINDOW_RESIZE, {
      width: 0, // 将由具体组件处理
      height: 0,
      windowId: data.appKey
    })
  }
  
  // 窗口最小化
  private handleWindowMinSize(data: WindowEventData['windowMinSize']) {
    this.eventBus.emit(EVENTS.APP_MINIMIZE, {
      appKey: data.appKey || '',
      pid: data.pid || 0
    })
  }
  
  // 窗口全屏
  private handleWindowFullSize(data: WindowEventData['windowFullSize']) {
    this.eventBus.emit(EVENTS.WINDOW_FULLSCREEN, {
      enabled: true,
      windowId: data.appKey
    })
  }
  
  // 关闭窗口
  private handleWindowClose(data: WindowEventData['windowClose']) {
    if (data.pid) {
      this.appManager.closeAppByPid(data.pid)
    } else if (data.appKey) {
      const app = getAppByKey(data.appKey)
      if (app) {
        this.appManager.closeApp(app)
      }
    }
    
    this.eventBus.emit(EVENTS.APP_CLOSE, {
      appKey: data.appKey || '',
      pid: data.pid
    })
  }
  
  // 打开应用
  private handleOpenApp(data: WindowEventData['openApp']) {
    const app = getAppByKey(data.app)
    if (app) {
      if (data.data) {
        this.appManager.openAppWithData(app, data.data)
      } else {
        this.appManager.openApp(app)
      }
      
      this.eventBus.emit(EVENTS.APP_OPEN, {
        appKey: data.app,
        config: data.data
      })
    } else {
      console.warn(`App not found: ${data.app}`)
    }
  }
  
  // 关闭应用
  private handleCloseApp(data: WindowEventData['closeApp']) {
    if (data.pid) {
      this.appManager.closeAppByPid(data.pid)
    } else if (data.app) {
      const app = getAppByKey(data.app)
      if (app) {
        this.appManager.closeApp(app)
      }
    }
  }
  
  // 设置窗口标题
  private handleSetWindowTitle(data: WindowEventData['setWindowTitle']) {
    // 这个事件需要传递给具体的窗口组件处理
    this.eventBus.emit(EVENTS.WINDOW_TITLE_CHANGE, {
      title: data.title,
      appKey: data.appKey,
      pid: data.pid
    })
  }
  
  // 设置窗口位置
  private handleSetWindowPosition(data: WindowEventData['setWindowPosition']) {
    this.eventBus.emit(EVENTS.APP_MOVE, {
      appKey: data.appKey || '',
      pid: data.pid || 0,
      x: data.x,
      y: data.y
    })
  }
  
  // 设置窗口大小
  private handleSetWindowSize(data: WindowEventData['setWindowSize']) {
    this.eventBus.emit(EVENTS.APP_RESIZE, {
      appKey: data.appKey || '',
      pid: data.pid || 0,
      width: data.width,
      height: data.height
    })
  }
  
  // 窗口获得焦点
  private handleFocusWindow(data: WindowEventData['focusWindow']) {
    if (data.appKey) {
      const app = getAppByKey(data.appKey)
      if (app) {
        this.appManager.showApp(app)
      }
    }
    
    this.eventBus.emit(EVENTS.APP_FOCUS, {
      appKey: data.appKey || '',
      pid: data.pid || 0,
      previousApp: undefined
    })
  }
  
  // 窗口失去焦点
  private handleBlurWindow(data: WindowEventData['blurWindow']) {
    this.eventBus.emit(EVENTS.WINDOW_BLUR, {
      windowId: data.appKey,
      appKey: data.appKey,
      timestamp: Date.now()
    })
  }
  
  // 事件处理器
  private handleAppMaximize(data: EventData<typeof EVENTS.APP_MAXIMIZE>) {
    // 可以在这里添加额外的最大化逻辑
    console.log('App maximized:', data)
  }
  
  private handleAppMinimize(data: EventData<typeof EVENTS.APP_MINIMIZED>) {
    // 可以在这里添加额外的最小化逻辑
    console.log('App minimized:', data)
  }
  
  private handleAppClose(data: EventData<typeof EVENTS.APP_CLOSE>) {
    // 可以在这里添加额外的关闭逻辑
    console.log('App closed:', data)
  }
  
  private handleAppFocus(data: EventData<typeof EVENTS.APP_FOCUS>) {
    // 可以在这里添加额外的焦点逻辑
    console.log('App focused:', data)
  }
  
  private handleWindowResize(data: EventData<typeof EVENTS.WINDOW_RESIZE>) {
    // 可以在这里添加额外的调整大小逻辑
    console.log('Window resized:', data)
  }
  
  private handleWindowFullscreen(data: EventData<typeof EVENTS.WINDOW_FULLSCREEN>) {
    // 可以在这里添加额外的全屏逻辑
    console.log('Window fullscreen:', data)
  }
  
  // 清理事件监听器
  destroy() {
    // 移除所有事件监听器
    this.eventBus.removeAllListeners()
  }
}

// 全局窗口事件管理器实例
let globalWindowEventManager: WindowEventManager | null = null

// 依赖注入键
const WindowEventManagerKey: InjectionKey<WindowEventManager> = Symbol('WindowEventManager')

// 组合式函数
export function useWindowEvents() {
  // 尝试从依赖注入中获取
  let manager = inject(WindowEventManagerKey, null)
  
  if (!manager) {
    // 如果没有注入的实例，使用全局实例
    if (!globalWindowEventManager) {
      globalWindowEventManager = new WindowEventManager()
    }
    manager = globalWindowEventManager
  }
  
  return {
    // 触发窗口事件
    emit: <T extends WindowEventName>(eventName: T, data: WindowEventData[T]) => {
      manager!.emit(eventName, data)
    },
    
    // 便捷方法
    maximizeWindow: (appKey?: string, pid?: number) => {
      manager!.emit('windowMaxSize', { appKey, pid })
    },
    
    normalizeWindow: (appKey?: string, pid?: number) => {
      manager!.emit('windowNormalSize', { appKey, pid })
    },
    
    minimizeWindow: (appKey?: string, pid?: number) => {
      manager!.emit('windowMinSize', { appKey, pid })
    },
    
    fullscreenWindow: (appKey?: string, pid?: number) => {
      manager!.emit('windowFullSize', { appKey, pid })
    },
    
    closeWindow: (appKey?: string, pid?: number) => {
      manager!.emit('windowClose', { appKey, pid })
    },
    
    openApp: (app: string, data?: any) => {
      manager!.emit('openApp', { app, data })
    },
    
    closeApp: (app?: string, pid?: number) => {
      manager!.emit('closeApp', { app, pid })
    },
    
    setWindowTitle: (title: string, appKey?: string, pid?: number) => {
      manager!.emit('setWindowTitle', { title, appKey, pid })
    },
    
    setWindowPosition: (x: number, y: number, appKey?: string, pid?: number) => {
      manager!.emit('setWindowPosition', { x, y, appKey, pid })
    },
    
    setWindowSize: (width: number, height: number, appKey?: string, pid?: number) => {
      manager!.emit('setWindowSize', { width, height, appKey, pid })
    },
    
    focusWindow: (appKey?: string, pid?: number) => {
      manager!.emit('focusWindow', { appKey, pid })
    },
    
    blurWindow: (appKey?: string, pid?: number) => {
      manager!.emit('blurWindow', { appKey, pid })
    }
  }
}

// 提供窗口事件管理器
export function provideWindowEventManager() {
  const manager = new WindowEventManager()
  provide(WindowEventManagerKey, manager)
  return manager
}

// 导出类型
export type { WindowEventManager }
