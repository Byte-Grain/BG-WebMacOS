import { reactive, ref, computed } from 'vue'
import type { AppConfig } from '../../core/app-registry/types'
import type {
  WindowConfig,
  WindowPosition,
  WindowSize,
  WindowState,
  WindowManagerConfig,
  WindowEvent,
  WindowEventType,
  WindowAnimationOptions,
  WindowLayoutOptions,
  WindowSnapshot,
  WindowGroup,
  WindowFilter,
  WindowSortOptions,
  WindowStats
} from './types'
import { WindowAnimations } from './window-animations'

/**
 * 窗口管理器
 * 负责管理所有窗口的创建、销毁、状态变更、布局等
 */
export class WindowManager {
  private config: WindowManagerConfig
  private windows = reactive(new Map<string, WindowConfig>())
  private windowStates = reactive(new Map<string, WindowState>())
  private windowGroups = reactive(new Map<string, WindowGroup>())
  private eventListeners = new Map<WindowEventType, Set<(event: WindowEvent) => void>>()
  private nextZIndex = ref(1000)
  private activeWindowId = ref<string | null>(null)
  private animations: WindowAnimations

  constructor(config?: Partial<WindowManagerConfig>) {
    this.config = {
      defaultOffset: { x: 50, y: 50 },
      baseZIndex: 1000,
      maxWindows: 20,
      animationsEnabled: true,
      animationDuration: 300,
      windowSpacing: 20,
      snapEnabled: true,
      snapDistance: 10,
      shadowEnabled: true,
      defaultOpacity: 1,
      multiMonitorSupport: false,
      ...config
    }

    this.nextZIndex.value = this.config.baseZIndex
    this.animations = new WindowAnimations({
      enabled: this.config.animationsEnabled,
      duration: this.config.animationDuration
    })

    // 初始化事件监听器
    this.initializeEventListeners()
  }

  /**
   * 创建窗口
   */
  async createWindow(app: AppConfig, options?: Partial<WindowConfig>): Promise<string> {
    // 检查窗口数量限制
    if (this.windows.size >= this.config.maxWindows) {
      throw new Error(`Maximum number of windows (${this.config.maxWindows}) reached`)
    }

    const windowId = this.generateWindowId(app.key)
    const position = this.calculateWindowPosition(options?.position)
    const size = this.calculateWindowSize(app, options?.size)

    const windowConfig: WindowConfig = {
      id: windowId,
      app,
      position,
      size,
      minSize: app.window?.minWidth && app.window?.minHeight ? {
        width: app.window.minWidth,
        height: app.window.minHeight
      } : { width: 200, height: 150 },
      maxSize: app.window?.maxWidth && app.window?.maxHeight ? {
        width: app.window.maxWidth,
        height: app.window.maxHeight
      } : undefined,
      resizable: app.window?.resizable ?? true,
      draggable: app.window?.draggable ?? true,
      closable: app.window?.closable ?? true,
      minimizable: app.window?.minimizable ?? true,
      maximizable: app.window?.maximizable ?? true,
      zIndex: this.getNextZIndex(),
      alwaysOnTop: false,
      title: app.title,
      icon: app.icon,
      modal: false,
      opacity: this.config.defaultOpacity,
      shadow: this.config.shadowEnabled,
      borderRadius: 8,
      ...options
    }

    // 存储窗口配置和状态
    this.windows.set(windowId, windowConfig)
    this.windowStates.set(windowId, 'normal')

    // 设置为活动窗口
    this.setActiveWindow(windowId)

    // 触发事件
    await this.emitEvent('open', windowId)

    // 播放打开动画
    if (this.config.animationsEnabled) {
      await this.animations.playOpenAnimation(windowId, {
        type: 'scale',
        direction: 'center',
        duration: this.config.animationDuration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      })
    }

    return windowId
  }

  /**
   * 关闭窗口
   */
  async closeWindow(windowId: string): Promise<void> {
    const window = this.windows.get(windowId)
    if (!window) {
      throw new Error(`Window ${windowId} not found`)
    }

    if (!window.closable) {
      throw new Error(`Window ${windowId} is not closable`)
    }

    // 设置关闭状态
    this.windowStates.set(windowId, 'closing')

    // 播放关闭动画
    if (this.config.animationsEnabled) {
      await this.animations.playCloseAnimation(windowId, {
        type: 'scale',
        direction: 'center',
        duration: this.config.animationDuration,
        easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)'
      })
    }

    // 移除窗口
    this.windows.delete(windowId)
    this.windowStates.delete(windowId)

    // 如果是活动窗口，切换到下一个窗口
    if (this.activeWindowId.value === windowId) {
      this.activateNextWindow()
    }

    // 从所有组中移除
    this.removeWindowFromAllGroups(windowId)

    // 触发事件
    await this.emitEvent('close', windowId)
  }

  /**
   * 最小化窗口
   */
  async minimizeWindow(windowId: string): Promise<void> {
    const window = this.windows.get(windowId)
    if (!window) {
      throw new Error(`Window ${windowId} not found`)
    }

    if (!window.minimizable) {
      throw new Error(`Window ${windowId} is not minimizable`)
    }

    // 播放最小化动画
    if (this.config.animationsEnabled) {
      await this.animations.playMinimizeAnimation(windowId, {
        type: 'slide',
        direction: 'down',
        duration: this.config.animationDuration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      })
    }

    this.windowStates.set(windowId, 'minimized')

    // 如果是活动窗口，切换到下一个窗口
    if (this.activeWindowId.value === windowId) {
      this.activateNextWindow()
    }

    await this.emitEvent('minimize', windowId)
  }

  /**
   * 最大化窗口
   */
  async maximizeWindow(windowId: string): Promise<void> {
    const window = this.windows.get(windowId)
    if (!window) {
      throw new Error(`Window ${windowId} not found`)
    }

    if (!window.maximizable) {
      throw new Error(`Window ${windowId} is not maximizable`)
    }

    const currentState = this.windowStates.get(windowId)
    
    if (currentState === 'maximized') {
      // 如果已经最大化，则恢复
      await this.restoreWindow(windowId)
    } else {
      // 保存当前位置和尺寸
      this.saveWindowSnapshot(windowId)

      // 设置为全屏尺寸
      const screenSize = this.getScreenSize()
      window.position = { x: 0, y: 0 }
      window.size = screenSize

      this.windowStates.set(windowId, 'maximized')
      this.setActiveWindow(windowId)

      await this.emitEvent('maximize', windowId)
    }
  }

  /**
   * 恢复窗口
   */
  async restoreWindow(windowId: string): Promise<void> {
    const window = this.windows.get(windowId)
    if (!window) {
      throw new Error(`Window ${windowId} not found`)
    }

    const currentState = this.windowStates.get(windowId)
    
    if (currentState === 'minimized') {
      // 从最小化恢复
      if (this.config.animationsEnabled) {
        await this.animations.playRestoreAnimation(windowId, {
          type: 'slide',
          direction: 'up',
          duration: this.config.animationDuration,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        })
      }
    } else if (currentState === 'maximized') {
      // 从最大化恢复
      this.restoreWindowSnapshot(windowId)
    }

    this.windowStates.set(windowId, 'normal')
    this.setActiveWindow(windowId)

    await this.emitEvent('restore', windowId)
  }

  /**
   * 移动窗口
   */
  async moveWindow(windowId: string, position: WindowPosition): Promise<void> {
    const window = this.windows.get(windowId)
    if (!window) {
      throw new Error(`Window ${windowId} not found`)
    }

    if (!window.draggable) {
      throw new Error(`Window ${windowId} is not draggable`)
    }

    // 应用吸附
    const snappedPosition = this.config.snapEnabled 
      ? this.applySnapping(windowId, position)
      : position

    window.position = snappedPosition

    await this.emitEvent('move', windowId, { position: snappedPosition })
  }

  /**
   * 调整窗口大小
   */
  async resizeWindow(windowId: string, size: WindowSize): Promise<void> {
    const window = this.windows.get(windowId)
    if (!window) {
      throw new Error(`Window ${windowId} not found`)
    }

    if (!window.resizable) {
      throw new Error(`Window ${windowId} is not resizable`)
    }

    // 应用尺寸限制
    const constrainedSize = this.constrainWindowSize(window, size)
    window.size = constrainedSize

    await this.emitEvent('resize', windowId, { size: constrainedSize })
  }

  /**
   * 设置活动窗口
   */
  setActiveWindow(windowId: string): void {
    const window = this.windows.get(windowId)
    if (!window) {
      return
    }

    // 更新层级
    window.zIndex = this.getNextZIndex()
    
    // 设置为活动窗口
    const previousActiveId = this.activeWindowId.value
    this.activeWindowId.value = windowId

    // 触发焦点事件
    if (previousActiveId && previousActiveId !== windowId) {
      this.emitEvent('blur', previousActiveId)
    }
    this.emitEvent('focus', windowId)
  }

  /**
   * 获取窗口配置
   */
  getWindow(windowId: string): WindowConfig | undefined {
    return this.windows.get(windowId)
  }

  /**
   * 获取窗口状态
   */
  getWindowState(windowId: string): WindowState | undefined {
    return this.windowStates.get(windowId)
  }

  /**
   * 获取所有窗口
   */
  getAllWindows(): WindowConfig[] {
    return Array.from(this.windows.values())
  }

  /**
   * 获取可见窗口
   */
  getVisibleWindows(): WindowConfig[] {
    return this.getAllWindows().filter(window => {
      const state = this.windowStates.get(window.id)
      return state !== 'minimized' && state !== 'hidden'
    })
  }

  /**
   * 按应用获取窗口
   */
  getWindowsByApp(appKey: string): WindowConfig[] {
    return this.getAllWindows().filter(window => window.app.key === appKey)
  }

  /**
   * 过滤窗口
   */
  filterWindows(filter: WindowFilter): WindowConfig[] {
    return this.getAllWindows().filter(window => {
      const state = this.windowStates.get(window.id)
      
      if (filter.appKey && window.app.key !== filter.appKey) return false
      if (filter.state && state !== filter.state) return false
      if (filter.visible !== undefined) {
        const isVisible = state !== 'minimized' && state !== 'hidden'
        if (filter.visible !== isVisible) return false
      }
      if (filter.modal !== undefined && window.modal !== filter.modal) return false
      if (filter.minZIndex !== undefined && window.zIndex < filter.minZIndex) return false
      if (filter.maxZIndex !== undefined && window.zIndex > filter.maxZIndex) return false
      
      return true
    })
  }

  /**
   * 排序窗口
   */
  sortWindows(windows: WindowConfig[], options: WindowSortOptions): WindowConfig[] {
    return [...windows].sort((a, b) => {
      let valueA: any
      let valueB: any
      
      switch (options.field) {
        case 'zIndex':
          valueA = a.zIndex
          valueB = b.zIndex
          break
        case 'title':
          valueA = a.title
          valueB = b.title
          break
        case 'appKey':
          valueA = a.app.key
          valueB = b.app.key
          break
        default:
          return 0
      }
      
      if (valueA < valueB) return options.direction === 'asc' ? -1 : 1
      if (valueA > valueB) return options.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  /**
   * 布局窗口
   */
  async layoutWindows(windowIds: string[], options: WindowLayoutOptions): Promise<void> {
    const windows = windowIds.map(id => this.windows.get(id)).filter(Boolean) as WindowConfig[]
    
    if (windows.length === 0) return

    const area = options.area || {
      x: 0,
      y: 0,
      ...this.getScreenSize()
    }
    
    const spacing = options.spacing || this.config.windowSpacing

    switch (options.type) {
      case 'cascade':
        await this.layoutCascade(windows, area, spacing)
        break
      case 'tile':
        await this.layoutTile(windows, area, spacing)
        break
      case 'grid':
        await this.layoutGrid(windows, area, spacing)
        break
      case 'stack':
        await this.layoutStack(windows, area)
        break
    }
  }

  /**
   * 获取窗口统计
   */
  getWindowStats(): WindowStats {
    const windows = this.getAllWindows()
    const stats: WindowStats = {
      total: windows.length,
      visible: 0,
      minimized: 0,
      maximized: 0,
      modal: 0,
      byApp: {},
      byState: {
        normal: 0,
        minimized: 0,
        maximized: 0,
        fullscreen: 0,
        hidden: 0,
        closing: 0,
        loading: 0
      }
    }

    windows.forEach(window => {
      const state = this.windowStates.get(window.id) || 'normal'
      
      // 按状态统计
      stats.byState[state]++
      
      if (state !== 'minimized' && state !== 'hidden') stats.visible++
      if (state === 'minimized') stats.minimized++
      if (state === 'maximized') stats.maximized++
      if (window.modal) stats.modal++
      
      // 按应用统计
      const appKey = window.app.key
      stats.byApp[appKey] = (stats.byApp[appKey] || 0) + 1
    })

    return stats
  }

  /**
   * 事件监听
   */
  on(eventType: WindowEventType, listener: (event: WindowEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(listener)
  }

  /**
   * 移除事件监听
   */
  off(eventType: WindowEventType, listener: (event: WindowEvent) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 清理所有窗口
   */
  async closeAllWindows(): Promise<void> {
    const windowIds = Array.from(this.windows.keys())
    
    for (const windowId of windowIds) {
      try {
        await this.closeWindow(windowId)
      } catch (error) {
        console.warn(`Failed to close window ${windowId}:`, error)
      }
    }
  }

  // 私有方法

  private generateWindowId(appKey: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `${appKey}_${timestamp}_${random}`
  }

  private calculateWindowPosition(preferredPosition?: WindowPosition): WindowPosition {
    if (preferredPosition) {
      return preferredPosition
    }

    // 计算级联位置
    const offset = this.config.defaultOffset
    const windowCount = this.windows.size
    
    return {
      x: offset.x + (windowCount * 30),
      y: offset.y + (windowCount * 30)
    }
  }

  private calculateWindowSize(app: AppConfig, preferredSize?: WindowSize): WindowSize {
    if (preferredSize) {
      return preferredSize
    }

    return {
      width: app.window?.width || 800,
      height: app.window?.height || 600
    }
  }

  private getNextZIndex(): number {
    return ++this.nextZIndex.value
  }

  private activateNextWindow(): void {
    const visibleWindows = this.getVisibleWindows()
    if (visibleWindows.length > 0) {
      // 按层级排序，选择最高的窗口
      const sortedWindows = this.sortWindows(visibleWindows, {
        field: 'zIndex',
        direction: 'desc'
      })
      this.setActiveWindow(sortedWindows[0].id)
    } else {
      this.activeWindowId.value = null
    }
  }

  private removeWindowFromAllGroups(windowId: string): void {
    this.windowGroups.forEach(group => {
      const index = group.windowIds.indexOf(windowId)
      if (index > -1) {
        group.windowIds.splice(index, 1)
      }
    })
  }

  private applySnapping(windowId: string, position: WindowPosition): WindowPosition {
    const window = this.windows.get(windowId)!
    const snapDistance = this.config.snapDistance
    const screenSize = this.getScreenSize()
    
    let { x, y } = position
    
    // 屏幕边缘吸附
    if (Math.abs(x) < snapDistance) x = 0
    if (Math.abs(y) < snapDistance) y = 0
    if (Math.abs(x + window.size.width - screenSize.width) < snapDistance) {
      x = screenSize.width - window.size.width
    }
    if (Math.abs(y + window.size.height - screenSize.height) < snapDistance) {
      y = screenSize.height - window.size.height
    }
    
    // 其他窗口吸附
    const otherWindows = this.getVisibleWindows().filter(w => w.id !== windowId)
    
    for (const otherWindow of otherWindows) {
      const otherRight = otherWindow.position.x + otherWindow.size.width
      const otherBottom = otherWindow.position.y + otherWindow.size.height
      
      // 左边缘吸附
      if (Math.abs(x - otherRight) < snapDistance) {
        x = otherRight
      }
      
      // 右边缘吸附
      if (Math.abs(x + window.size.width - otherWindow.position.x) < snapDistance) {
        x = otherWindow.position.x - window.size.width
      }
      
      // 上边缘吸附
      if (Math.abs(y - otherBottom) < snapDistance) {
        y = otherBottom
      }
      
      // 下边缘吸附
      if (Math.abs(y + window.size.height - otherWindow.position.y) < snapDistance) {
        y = otherWindow.position.y - window.size.height
      }
    }
    
    return { x, y }
  }

  private constrainWindowSize(window: WindowConfig, size: WindowSize): WindowSize {
    let { width, height } = size
    
    // 应用最小尺寸限制
    if (window.minSize) {
      width = Math.max(width, window.minSize.width)
      height = Math.max(height, window.minSize.height)
    }
    
    // 应用最大尺寸限制
    if (window.maxSize) {
      width = Math.min(width, window.maxSize.width)
      height = Math.min(height, window.maxSize.height)
    }
    
    // 应用屏幕尺寸限制
    const screenSize = this.getScreenSize()
    width = Math.min(width, screenSize.width)
    height = Math.min(height, screenSize.height)
    
    return { width, height }
  }

  private getScreenSize(): WindowSize {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  private saveWindowSnapshot(windowId: string): void {
    // 实现窗口快照保存逻辑
  }

  private restoreWindowSnapshot(windowId: string): void {
    // 实现窗口快照恢复逻辑
  }

  private async layoutCascade(windows: WindowConfig[], area: any, spacing: number): Promise<void> {
    windows.forEach((window, index) => {
      window.position = {
        x: area.x + (index * spacing),
        y: area.y + (index * spacing)
      }
    })
  }

  private async layoutTile(windows: WindowConfig[], area: any, spacing: number): Promise<void> {
    const cols = Math.ceil(Math.sqrt(windows.length))
    const rows = Math.ceil(windows.length / cols)
    
    const windowWidth = (area.width - (cols - 1) * spacing) / cols
    const windowHeight = (area.height - (rows - 1) * spacing) / rows
    
    windows.forEach((window, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      
      window.position = {
        x: area.x + col * (windowWidth + spacing),
        y: area.y + row * (windowHeight + spacing)
      }
      
      window.size = {
        width: windowWidth,
        height: windowHeight
      }
    })
  }

  private async layoutGrid(windows: WindowConfig[], area: any, spacing: number): Promise<void> {
    // 网格布局实现
    await this.layoutTile(windows, area, spacing)
  }

  private async layoutStack(windows: WindowConfig[], area: any): Promise<void> {
    windows.forEach(window => {
      window.position = { x: area.x, y: area.y }
      window.size = { width: area.width, height: area.height }
    })
  }

  private async emitEvent(type: WindowEventType, windowId: string, data?: any): Promise<void> {
    const event: WindowEvent = {
      type,
      windowId,
      timestamp: Date.now(),
      data
    }
    
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in window event listener for ${type}:`, error)
        }
      })
    }
  }

  private initializeEventListeners(): void {
    // 初始化默认事件监听器
  }

  // 计算属性
  get activeWindow(): WindowConfig | null {
    return this.activeWindowId.value ? this.windows.get(this.activeWindowId.value) || null : null
  }

  get windowCount(): number {
    return this.windows.size
  }

  get visibleWindowCount(): number {
    return this.getVisibleWindows().length
  }
}

// 导出单例实例
export const windowManager = new WindowManager()
