import type {
  DockItem,
  DockConfig,
  DockEvent,
  DockEventType,
  DockLayout,
  DockStats,
  DockSnapshot,
  DockManagerConfig,
  DockItemSearchOptions,
  DockItemFilter,
  DockPosition,
  DockSize,
  DockTheme,
  DockGestureConfig,
  DockPreset
} from './types'

/**
 * Dock管理器
 * 负责管理Dock的显示、隐藏、项目管理、布局和配置
 */
export class DockManager {
  private items: Map<string, DockItem> = new Map()
  private config: DockConfig
  private layout: DockLayout
  private eventListeners: Map<DockEventType, Set<(event: DockEvent) => void>> = new Map()
  private isVisible = true
  private isAutoHidden = false
  private dragData: any = null
  private snapshots: Map<string, DockSnapshot> = new Map()
  private presets: Map<string, DockPreset> = new Map()
  private theme: DockTheme
  private gestureConfig: DockGestureConfig

  constructor(config?: Partial<DockManagerConfig>) {
    this.config = this.getDefaultConfig()
    this.theme = this.getDefaultTheme()
    this.gestureConfig = this.getDefaultGestureConfig()
    this.layout = this.calculateLayout()

    if (config) {
      this.updateConfig(config)
    }

    this.initializeDefaultItems()
    this.setupEventListeners()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): DockConfig {
    return {
      position: 'bottom',
      size: 'medium',
      autoHide: false,
      magnification: true,
      magnificationSize: 1.5,
      minimizeEffect: 'genie',
      showIndicators: true,
      showLabels: false,
      animationDuration: 300,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backgroundOpacity: 0.8,
      borderRadius: 12,
      padding: {
        horizontal: 8,
        vertical: 8
      },
      spacing: 4,
      maxItems: 20,
      persistentApps: ['finder', 'safari', 'mail', 'calendar'],
      recentApps: {
        enabled: true,
        maxCount: 5
      },
      folders: {
        enabled: true,
        maxItems: 10,
        autoCollapse: true
      }
    }
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(): DockTheme {
    return {
      id: 'default',
      name: 'Default',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backgroundOpacity: 0.8,
      borderRadius: 12,
      indicatorColor: '#007AFF',
      labelColor: '#000000',
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 2 }
    }
  }

  /**
   * 获取默认手势配置
   */
  private getDefaultGestureConfig(): DockGestureConfig {
    return {
      enabled: true,
      swipeToShow: true,
      swipeToHide: true,
      pinchToResize: false,
      longPressForMenu: true,
      doubleClickAction: 'none',
      sensitivity: 0.5
    }
  }

  /**
   * 初始化默认项目
   */
  private initializeDefaultItems(): void {
    const defaultItems: Omit<DockItem, 'id'>[] = [
      {
        type: 'app',
        appKey: 'finder',
        name: 'Finder',
        icon: '/icons/finder.png',
        state: 'normal',
        position: 0,
        visible: true,
        pinned: true
      },
      {
        type: 'app',
        appKey: 'safari',
        name: 'Safari',
        icon: '/icons/safari.png',
        state: 'normal',
        position: 1,
        visible: true,
        pinned: true
      },
      {
        type: 'separator',
        name: 'Separator',
        icon: '',
        state: 'normal',
        position: 2,
        visible: true,
        pinned: false
      },
      {
        type: 'trash',
        name: 'Trash',
        icon: '/icons/trash.png',
        state: 'normal',
        position: 3,
        visible: true,
        pinned: true
      }
    ]

    defaultItems.forEach(item => {
      this.addItem(item)
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听窗口大小变化
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.layout = this.calculateLayout()
        this.emitEvent('dock-config-changed', {})
      })
    }
  }

  /**
   * 计算布局
   */
  private calculateLayout(): DockLayout {
    const itemSizes = {
      small: 32,
      medium: 48,
      large: 64
    }

    const itemSize = itemSizes[this.config.size]
    const spacing = this.config.spacing
    const padding = this.config.padding
    const visibleItems = Array.from(this.items.values()).filter(item => item.visible).length

    let width: number
    let height: number

    if (this.config.position === 'bottom' || this.config.position === 'top') {
      width = (visibleItems * itemSize) + ((visibleItems - 1) * spacing) + (padding.horizontal * 2)
      height = itemSize + (padding.vertical * 2)
    } else {
      width = itemSize + (padding.horizontal * 2)
      height = (visibleItems * itemSize) + ((visibleItems - 1) * spacing) + (padding.vertical * 2)
    }

    return {
      position: this.config.position,
      size: { width, height },
      itemSize,
      spacing,
      padding,
      maxItems: this.config.maxItems,
      visibleItems
    }
  }

  /**
   * 添加项目
   */
  addItem(item: Omit<DockItem, 'id'>): string {
    const id = `dock-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const dockItem: DockItem = {
      ...item,
      id
    }

    this.items.set(id, dockItem)
    this.layout = this.calculateLayout()
    this.emitEvent('item-added', { item: dockItem })
    return id
  }

  /**
   * 移除项目
   */
  removeItem(id: string): boolean {
    const item = this.items.get(id)
    if (!item) return false

    this.items.delete(id)
    this.layout = this.calculateLayout()
    this.emitEvent('item-removed', { item })
    return true
  }

  /**
   * 更新项目
   */
  updateItem(id: string, updates: Partial<DockItem>): boolean {
    const item = this.items.get(id)
    if (!item) return false

    const updatedItem = { ...item, ...updates }
    this.items.set(id, updatedItem)
    this.layout = this.calculateLayout()
    this.emitEvent('item-moved', { item: updatedItem })
    return true
  }

  /**
   * 获取项目
   */
  getItem(id: string): DockItem | undefined {
    return this.items.get(id)
  }

  /**
   * 获取所有项目
   */
  getAllItems(): DockItem[] {
    return Array.from(this.items.values()).sort((a, b) => a.position - b.position)
  }

  /**
   * 获取可见项目
   */
  getVisibleItems(): DockItem[] {
    return this.getAllItems().filter(item => item.visible)
  }

  /**
   * 搜索项目
   */
  searchItems(options: DockItemSearchOptions): DockItem[] {
    let items = this.getAllItems()

    if (options.query) {
      const query = options.query.toLowerCase()
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.appKey && item.appKey.toLowerCase().includes(query))
      )
    }

    if (options.type) {
      items = items.filter(item => item.type === options.type)
    }

    if (options.state) {
      items = items.filter(item => item.state === options.state)
    }

    if (options.visible !== undefined) {
      items = items.filter(item => item.visible === options.visible)
    }

    if (options.pinned !== undefined) {
      items = items.filter(item => item.pinned === options.pinned)
    }

    if (options.hasApp !== undefined) {
      items = items.filter(item => options.hasApp ? !!item.appKey : !item.appKey)
    }

    if (options.hasBadge !== undefined) {
      items = items.filter(item => options.hasBadge ? !!item.badge : !item.badge)
    }

    if (options.appKey) {
      items = items.filter(item => item.appKey === options.appKey)
    }

    return items
  }

  /**
   * 移动项目
   */
  moveItem(id: string, newPosition: number): boolean {
    const item = this.items.get(id)
    if (!item) return false

    const items = this.getAllItems()
    const oldPosition = item.position

    // 更新其他项目的位置
    items.forEach(otherItem => {
      if (otherItem.id === id) return

      if (newPosition > oldPosition) {
        // 向后移动
        if (otherItem.position > oldPosition && otherItem.position <= newPosition) {
          otherItem.position--
        }
      } else {
        // 向前移动
        if (otherItem.position >= newPosition && otherItem.position < oldPosition) {
          otherItem.position++
        }
      }
    })

    // 更新目标项目位置
    item.position = newPosition
    this.layout = this.calculateLayout()
    this.emitEvent('item-moved', { item })
    return true
  }

  /**
   * 显示Dock
   */
  show(): void {
    if (this.isVisible) return

    this.isVisible = true
    this.isAutoHidden = false
    this.emitEvent('dock-show', {})
  }

  /**
   * 隐藏Dock
   */
  hide(): void {
    if (!this.isVisible) return

    this.isVisible = false
    this.emitEvent('dock-hide', {})
  }

  /**
   * 自动隐藏Dock
   */
  autoHide(): void {
    if (!this.config.autoHide || this.isAutoHidden) return

    this.isAutoHidden = true
    this.hide()
  }

  /**
   * 自动显示Dock
   */
  autoShow(): void {
    if (!this.isAutoHidden) return

    this.isAutoHidden = false
    this.show()
  }

  /**
   * 切换Dock可见性
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DockManagerConfig>): void {
    if (config.dock) {
      this.config = { ...this.config, ...config.dock }
    }

    if (config.theme) {
      this.theme = { ...this.theme, ...config.theme }
    }

    if (config.gestures) {
      this.gestureConfig = { ...this.gestureConfig, ...config.gestures }
    }

    this.layout = this.calculateLayout()
    this.emitEvent('dock-config-changed', {})
  }

  /**
   * 获取配置
   */
  getConfig(): DockConfig {
    return { ...this.config }
  }

  /**
   * 获取布局
   */
  getLayout(): DockLayout {
    return { ...this.layout }
  }

  /**
   * 获取统计信息
   */
  getStats(): DockStats {
    const items = this.getAllItems()
    const stats: DockStats = {
      totalItems: items.length,
      visibleItems: items.filter(item => item.visible).length,
      pinnedItems: items.filter(item => item.pinned).length,
      runningApps: items.filter(item => item.state === 'running').length,
      folders: items.filter(item => item.type === 'folder').length,
      itemsByType: {
        app: 0,
        folder: 0,
        separator: 0,
        trash: 0,
        widget: 0
      },
      itemsByState: {
        normal: 0,
        running: 0,
        attention: 0,
        hidden: 0
      }
    }

    items.forEach(item => {
      stats.itemsByType[item.type]++
      stats.itemsByState[item.state]++
    })

    return stats
  }

  /**
   * 创建快照
   */
  createSnapshot(name: string, description?: string): string {
    const id = `snapshot-${Date.now()}`
    const snapshot: DockSnapshot = {
      id,
      name,
      description,
      config: { ...this.config },
      items: this.getAllItems().map(item => ({ ...item })),
      timestamp: Date.now()
    }

    this.snapshots.set(id, snapshot)
    return id
  }

  /**
   * 恢复快照
   */
  restoreSnapshot(id: string): boolean {
    const snapshot = this.snapshots.get(id)
    if (!snapshot) return false

    this.items.clear()
    snapshot.items.forEach(item => {
      this.items.set(item.id, { ...item })
    })

    this.config = { ...snapshot.config }
    this.layout = this.calculateLayout()
    this.emitEvent('dock-config-changed', {})
    return true
  }

  /**
   * 获取快照
   */
  getSnapshot(id: string): DockSnapshot | undefined {
    return this.snapshots.get(id)
  }

  /**
   * 获取所有快照
   */
  getAllSnapshots(): DockSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 删除快照
   */
  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id)
  }

  /**
   * 清空所有快照
   */
  clearSnapshots(): void {
    this.snapshots.clear()
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: DockEventType, listener: (event: DockEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: DockEventType, listener: (event: DockEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: DockEventType, data: Partial<DockEvent>): void {
    const event: DockEvent = {
      type,
      timestamp: Date.now(),
      ...data
    }

    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in dock event listener for ${type}:`, error)
        }
      })
    }
  }

  /**
   * 检查是否可见
   */
  isVisibleDock(): boolean {
    return this.isVisible
  }

  /**
   * 检查是否自动隐藏
   */
  isAutoHiddenDock(): boolean {
    return this.isAutoHidden
  }

  /**
   * 获取主题
   */
  getTheme(): DockTheme {
    return { ...this.theme }
  }

  /**
   * 获取手势配置
   */
  getGestureConfig(): DockGestureConfig {
    return { ...this.gestureConfig }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.items.clear()
    this.eventListeners.clear()
    this.snapshots.clear()
    this.presets.clear()
  }
}

// 导出单例实例
export const dockManager = new DockManager()
