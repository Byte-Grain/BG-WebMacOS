import type {
  DesktopIcon,
  DesktopLayout,
  DesktopWidget,
  DesktopManagerConfig,
  IconArrangeOptions,
  DesktopEvent,
  DesktopEventType,
  IconSearchOptions,
  IconFilter,
  IconSorter,
  DesktopStats,
  DesktopSnapshot,
  IconPosition,
  WallpaperConfig
} from './types'

/**
 * 桌面管理器
 * 负责管理桌面环境、图标布局、小部件和整体桌面状态
 */
export class DesktopManager {
  private config: DesktopManagerConfig
  private currentLayout: DesktopLayout | null = null
  private layouts = new Map<string, DesktopLayout>()
  private snapshots = new Map<string, DesktopSnapshot>()
  private eventListeners = new Map<DesktopEventType, Set<(event: DesktopEvent) => void>>()
  private selectedIcons = new Set<string>()
  private draggedIcon: DesktopIcon | null = null
  private stats: DesktopStats

  constructor(config: DesktopManagerConfig) {
    this.config = { ...config }
    this.stats = this.initializeStats()
    this.initializeEventListeners()
  }

  /**
   * 初始化桌面管理器
   */
  async initialize(): Promise<void> {
    // 加载默认布局
    await this.loadDefaultLayout()
    
    // 初始化事件监听
    this.setupDOMEventListeners()
    
    // 触发初始化完成事件
    this.emitEvent('layout-changed', {
      data: { layout: this.currentLayout }
    })
  }

  /**
   * 获取当前布局
   */
  getCurrentLayout(): DesktopLayout | null {
    return this.currentLayout
  }

  /**
   * 设置当前布局
   */
  async setCurrentLayout(layoutId: string): Promise<boolean> {
    const layout = this.layouts.get(layoutId)
    if (!layout) {
      return false
    }

    this.currentLayout = { ...layout }
    this.updateStats()
    
    this.emitEvent('layout-changed', {
      data: { layout: this.currentLayout }
    })

    return true
  }

  /**
   * 创建新布局
   */
  createLayout(name: string, baseLayoutId?: string): DesktopLayout {
    const baseLayout = baseLayoutId ? this.layouts.get(baseLayoutId) : null
    
    const layout: DesktopLayout = {
      id: `layout_${Date.now()}`,
      name,
      icons: baseLayout ? [...baseLayout.icons] : [],
      wallpaper: baseLayout ? { ...baseLayout.wallpaper } : this.getDefaultWallpaper(),
      grid: baseLayout ? { ...baseLayout.grid } : { ...this.config.grid },
      widgets: baseLayout ? [...baseLayout.widgets] : [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.layouts.set(layout.id, layout)
    return layout
  }

  /**
   * 删除布局
   */
  deleteLayout(layoutId: string): boolean {
    if (this.currentLayout?.id === layoutId) {
      return false // 不能删除当前布局
    }

    return this.layouts.delete(layoutId)
  }

  /**
   * 获取所有布局
   */
  getAllLayouts(): DesktopLayout[] {
    return Array.from(this.layouts.values())
  }

  /**
   * 添加桌面图标
   */
  addIcon(icon: Omit<DesktopIcon, 'id'>): DesktopIcon {
    if (!this.currentLayout) {
      throw new Error('No current layout')
    }

    const newIcon: DesktopIcon = {
      ...icon,
      id: `icon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 检查位置冲突并自动调整
    if (this.config.snapToGrid) {
      newIcon.position = this.snapToGrid(newIcon.position)
    }

    newIcon.position = this.findAvailablePosition(newIcon.position, newIcon.size)

    this.currentLayout.icons.push(newIcon)
    this.currentLayout.updatedAt = Date.now()
    this.updateStats()

    this.emitEvent('icon-added', {
      target: { type: 'icon', id: newIcon.id },
      data: { icon: newIcon }
    })

    return newIcon
  }

  /**
   * 移除桌面图标
   */
  removeIcon(iconId: string): boolean {
    if (!this.currentLayout) {
      return false
    }

    const index = this.currentLayout.icons.findIndex(icon => icon.id === iconId)
    if (index === -1) {
      return false
    }

    const removedIcon = this.currentLayout.icons.splice(index, 1)[0]
    this.currentLayout.updatedAt = Date.now()
    this.selectedIcons.delete(iconId)
    this.updateStats()

    this.emitEvent('icon-removed', {
      target: { type: 'icon', id: iconId },
      data: { icon: removedIcon }
    })

    return true
  }

  /**
   * 更新图标
   */
  updateIcon(iconId: string, updates: Partial<DesktopIcon>): boolean {
    if (!this.currentLayout) {
      return false
    }

    const icon = this.currentLayout.icons.find(icon => icon.id === iconId)
    if (!icon) {
      return false
    }

    Object.assign(icon, updates)
    this.currentLayout.updatedAt = Date.now()

    return true
  }

  /**
   * 移动图标
   */
  moveIcon(iconId: string, newPosition: IconPosition): boolean {
    if (!this.currentLayout) {
      return false
    }

    const icon = this.currentLayout.icons.find(icon => icon.id === iconId)
    if (!icon || icon.locked) {
      return false
    }

    const oldPosition = { ...icon.position }
    
    // 应用网格吸附
    if (this.config.snapToGrid) {
      newPosition = this.snapToGrid(newPosition)
    }

    // 检查位置是否可用
    const availablePosition = this.findAvailablePosition(newPosition, icon.size, iconId)
    icon.position = availablePosition
    this.currentLayout.updatedAt = Date.now()

    this.emitEvent('icon-moved', {
      target: { type: 'icon', id: iconId },
      position: newPosition,
      data: { oldPosition, newPosition: availablePosition }
    })

    return true
  }

  /**
   * 获取图标
   */
  getIcon(iconId: string): DesktopIcon | null {
    if (!this.currentLayout) {
      return null
    }

    return this.currentLayout.icons.find(icon => icon.id === iconId) || null
  }

  /**
   * 获取所有图标
   */
  getAllIcons(): DesktopIcon[] {
    return this.currentLayout?.icons || []
  }

  /**
   * 搜索图标
   */
  searchIcons(options: IconSearchOptions): DesktopIcon[] {
    if (!this.currentLayout) {
      return []
    }

    return this.currentLayout.icons.filter(icon => {
      if (options.query && !icon.name.toLowerCase().includes(options.query.toLowerCase())) {
        return false
      }
      if (options.category && icon.category !== options.category) {
        return false
      }
      if (options.visible !== undefined && icon.visible !== options.visible) {
        return false
      }
      if (options.locked !== undefined && icon.locked !== options.locked) {
        return false
      }
      if (options.size && icon.size !== options.size) {
        return false
      }
      if (options.hasCustomIcon !== undefined && !!icon.customIcon !== options.hasCustomIcon) {
        return false
      }
      if (options.hasBadge !== undefined && !!icon.badge !== options.hasBadge) {
        return false
      }
      return true
    })
  }

  /**
   * 过滤图标
   */
  filterIcons(filter: IconFilter): DesktopIcon[] {
    if (!this.currentLayout) {
      return []
    }

    return this.currentLayout.icons.filter(filter)
  }

  /**
   * 排序图标
   */
  sortIcons(sorter: IconSorter): DesktopIcon[] {
    if (!this.currentLayout) {
      return []
    }

    return [...this.currentLayout.icons].sort(sorter)
  }

  /**
   * 自动排列图标
   */
  arrangeIcons(options: IconArrangeOptions): void {
    if (!this.currentLayout) {
      return
    }

    const icons = this.getVisibleIcons()
    const arrangedIcons = this.calculateIconPositions(icons, options)
    
    arrangedIcons.forEach((position, index) => {
      if (icons[index]) {
        icons[index].position = position
      }
    })

    this.currentLayout.updatedAt = Date.now()
    
    this.emitEvent('layout-changed', {
      data: { layout: this.currentLayout }
    })
  }

  /**
   * 选择图标
   */
  selectIcon(iconId: string, multiSelect = false): void {
    if (!multiSelect) {
      this.clearSelection()
    }

    this.selectedIcons.add(iconId)
    
    this.emitEvent('icon-selected', {
      target: { type: 'icon', id: iconId },
      data: { selected: Array.from(this.selectedIcons) }
    })
  }

  /**
   * 取消选择图标
   */
  deselectIcon(iconId: string): void {
    this.selectedIcons.delete(iconId)
    
    this.emitEvent('icon-deselected', {
      target: { type: 'icon', id: iconId },
      data: { selected: Array.from(this.selectedIcons) }
    })
  }

  /**
   * 清空选择
   */
  clearSelection(): void {
    const previousSelected = Array.from(this.selectedIcons)
    this.selectedIcons.clear()
    
    previousSelected.forEach(iconId => {
      this.emitEvent('icon-deselected', {
        target: { type: 'icon', id: iconId },
        data: { selected: [] }
      })
    })
  }

  /**
   * 获取选中的图标
   */
  getSelectedIcons(): string[] {
    return Array.from(this.selectedIcons)
  }

  /**
   * 添加小部件
   */
  addWidget(widget: Omit<DesktopWidget, 'id'>): DesktopWidget {
    if (!this.currentLayout) {
      throw new Error('No current layout')
    }

    const newWidget: DesktopWidget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.currentLayout.widgets.push(newWidget)
    this.currentLayout.updatedAt = Date.now()
    this.updateStats()

    this.emitEvent('widget-added', {
      target: { type: 'widget', id: newWidget.id },
      data: { widget: newWidget }
    })

    return newWidget
  }

  /**
   * 移除小部件
   */
  removeWidget(widgetId: string): boolean {
    if (!this.currentLayout) {
      return false
    }

    const index = this.currentLayout.widgets.findIndex(widget => widget.id === widgetId)
    if (index === -1) {
      return false
    }

    const removedWidget = this.currentLayout.widgets.splice(index, 1)[0]
    this.currentLayout.updatedAt = Date.now()
    this.updateStats()

    this.emitEvent('widget-removed', {
      target: { type: 'widget', id: widgetId },
      data: { widget: removedWidget }
    })

    return true
  }

  /**
   * 更新小部件
   */
  updateWidget(widgetId: string, updates: Partial<DesktopWidget>): boolean {
    if (!this.currentLayout) {
      return false
    }

    const widget = this.currentLayout.widgets.find(widget => widget.id === widgetId)
    if (!widget) {
      return false
    }

    Object.assign(widget, updates)
    this.currentLayout.updatedAt = Date.now()

    return true
  }

  /**
   * 移动小部件
   */
  moveWidget(widgetId: string, newPosition: IconPosition): boolean {
    if (!this.currentLayout) {
      return false
    }

    const widget = this.currentLayout.widgets.find(widget => widget.id === widgetId)
    if (!widget || widget.locked) {
      return false
    }

    const oldPosition = { ...widget.position }
    widget.position = newPosition
    this.currentLayout.updatedAt = Date.now()

    this.emitEvent('widget-moved', {
      target: { type: 'widget', id: widgetId },
      position: newPosition,
      data: { oldPosition, newPosition }
    })

    return true
  }

  /**
   * 创建快照
   */
  createSnapshot(name: string, description?: string): DesktopSnapshot {
    if (!this.currentLayout) {
      throw new Error('No current layout')
    }

    const snapshot: DesktopSnapshot = {
      id: `snapshot_${Date.now()}`,
      name,
      description,
      layout: JSON.parse(JSON.stringify(this.currentLayout)),
      timestamp: Date.now()
    }

    this.snapshots.set(snapshot.id, snapshot)
    return snapshot
  }

  /**
   * 恢复快照
   */
  async restoreSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) {
      return false
    }

    this.currentLayout = JSON.parse(JSON.stringify(snapshot.layout))
    this.currentLayout.updatedAt = Date.now()
    this.updateStats()

    this.emitEvent('layout-changed', {
      data: { layout: this.currentLayout, snapshot }
    })

    return true
  }

  /**
   * 获取所有快照
   */
  getAllSnapshots(): DesktopSnapshot[] {
    return Array.from(this.snapshots.values())
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId)
  }

  /**
   * 获取统计信息
   */
  getStats(): DesktopStats {
    return { ...this.stats }
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<DesktopManagerConfig>): void {
    this.config = { ...this.config, ...updates }
    
    if (this.currentLayout && updates.grid) {
      this.currentLayout.grid = { ...this.currentLayout.grid, ...updates.grid }
      this.emitEvent('grid-changed', {
        data: { grid: this.currentLayout.grid }
      })
    }
  }

  /**
   * 获取配置
   */
  getConfig(): DesktopManagerConfig {
    return { ...this.config }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: DesktopEventType, listener: (event: DesktopEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: DesktopEventType, listener: (event: DesktopEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 销毁桌面管理器
   */
  destroy(): void {
    this.eventListeners.clear()
    this.selectedIcons.clear()
    this.layouts.clear()
    this.snapshots.clear()
    this.currentLayout = null
  }

  // 私有方法

  private async loadDefaultLayout(): Promise<void> {
    // 创建默认布局
    const defaultLayout = this.createLayout('Default')
    this.currentLayout = defaultLayout
  }

  private getDefaultWallpaper(): WallpaperConfig {
    return {
      id: 'default',
      name: 'Default Wallpaper',
      url: '/assets/wallpapers/default.jpg',
      type: 'image',
      fit: 'cover',
      position: 'center'
    }
  }

  private initializeStats(): DesktopStats {
    return {
      totalIcons: 0,
      visibleIcons: 0,
      hiddenIcons: 0,
      lockedIcons: 0,
      iconsByCategory: {},
      iconsBySize: {},
      totalWidgets: 0,
      visibleWidgets: 0,
      wallpaperChanges: 0,
      layoutChanges: 0
    }
  }

  private updateStats(): void {
    if (!this.currentLayout) {
      return
    }

    const icons = this.currentLayout.icons
    const widgets = this.currentLayout.widgets

    this.stats.totalIcons = icons.length
    this.stats.visibleIcons = icons.filter(icon => icon.visible).length
    this.stats.hiddenIcons = icons.filter(icon => !icon.visible).length
    this.stats.lockedIcons = icons.filter(icon => icon.locked).length
    this.stats.totalWidgets = widgets.length
    this.stats.visibleWidgets = widgets.filter(widget => widget.visible).length

    // 按分类统计
    this.stats.iconsByCategory = {}
    icons.forEach(icon => {
      const category = icon.category || 'uncategorized'
      this.stats.iconsByCategory[category] = (this.stats.iconsByCategory[category] || 0) + 1
    })

    // 按大小统计
    this.stats.iconsBySize = {}
    icons.forEach(icon => {
      this.stats.iconsBySize[icon.size] = (this.stats.iconsBySize[icon.size] || 0) + 1
    })
  }

  private initializeEventListeners(): void {
    // 初始化事件监听器映射
    const eventTypes: DesktopEventType[] = [
      'icon-added', 'icon-removed', 'icon-moved', 'icon-selected', 'icon-deselected',
      'wallpaper-changed', 'layout-changed', 'widget-added', 'widget-removed',
      'widget-moved', 'grid-changed', 'context-menu', 'double-click', 'right-click'
    ]

    eventTypes.forEach(type => {
      this.eventListeners.set(type, new Set())
    })
  }

  private setupDOMEventListeners(): void {
    // 设置DOM事件监听（如果在浏览器环境中）
    if (typeof document !== 'undefined') {
      document.addEventListener('contextmenu', this.handleContextMenu.bind(this))
      document.addEventListener('dblclick', this.handleDoubleClick.bind(this))
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    if (this.config.contextMenu.enabled) {
      this.emitEvent('context-menu', {
        position: { x: event.clientX, y: event.clientY },
        data: { originalEvent: event }
      })
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    if (this.config.doubleClickToOpen) {
      this.emitEvent('double-click', {
        position: { x: event.clientX, y: event.clientY },
        data: { originalEvent: event }
      })
    }
  }

  private emitEvent(type: DesktopEventType, eventData: Partial<DesktopEvent> = {}): void {
    const event: DesktopEvent = {
      type,
      timestamp: Date.now(),
      ...eventData
    }

    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in desktop event listener for ${type}:`, error)
        }
      })
    }
  }

  private snapToGrid(position: IconPosition): IconPosition {
    if (!this.config.grid.enabled || !this.config.snapToGrid) {
      return position
    }

    const gridSize = this.config.grid.size
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
      gridX: Math.round(position.x / gridSize),
      gridY: Math.round(position.y / gridSize)
    }
  }

  private findAvailablePosition(
    preferredPosition: IconPosition, 
    iconSize: 'small' | 'medium' | 'large',
    excludeIconId?: string
  ): IconPosition {
    if (!this.currentLayout) {
      return preferredPosition
    }

    const iconSizePixels = this.config.iconSize[iconSize]
    const spacing = this.config.iconSpacing
    
    // 检查首选位置是否可用
    if (this.isPositionAvailable(preferredPosition, iconSizePixels, excludeIconId)) {
      return preferredPosition
    }

    // 寻找最近的可用位置
    const gridSize = this.config.grid.size
    const searchRadius = 10 // 搜索半径（网格单位）
    
    for (let radius = 1; radius <= searchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
            continue // 只检查边界上的点
          }
          
          const testPosition = {
            x: preferredPosition.x + dx * gridSize,
            y: preferredPosition.y + dy * gridSize
          }
          
          if (this.isPositionAvailable(testPosition, iconSizePixels, excludeIconId)) {
            return this.snapToGrid(testPosition)
          }
        }
      }
    }

    // 如果找不到可用位置，返回首选位置
    return preferredPosition
  }

  private isPositionAvailable(
    position: IconPosition, 
    iconSize: number,
    excludeIconId?: string
  ): boolean {
    if (!this.currentLayout) {
      return true
    }

    const icons = this.currentLayout.icons.filter(icon => 
      icon.id !== excludeIconId && icon.visible
    )

    for (const icon of icons) {
      const existingIconSize = this.config.iconSize[icon.size]
      const spacing = this.config.iconSpacing
      
      const distance = Math.sqrt(
        Math.pow(position.x - icon.position.x, 2) + 
        Math.pow(position.y - icon.position.y, 2)
      )
      
      const minDistance = (iconSize + existingIconSize) / 2 + spacing
      
      if (distance < minDistance) {
        return false
      }
    }

    return true
  }

  private getVisibleIcons(): DesktopIcon[] {
    return this.currentLayout?.icons.filter(icon => icon.visible) || []
  }

  private calculateIconPositions(
    icons: DesktopIcon[], 
    options: IconArrangeOptions
  ): IconPosition[] {
    const positions: IconPosition[] = []
    const { type, direction, spacing, margin } = options
    
    switch (type) {
      case 'grid':
        positions.push(...this.calculateGridPositions(icons, options))
        break
      case 'list':
        positions.push(...this.calculateListPositions(icons, options))
        break
      case 'circle':
        positions.push(...this.calculateCirclePositions(icons, options))
        break
      default:
        // 保持当前位置
        positions.push(...icons.map(icon => icon.position))
    }
    
    return positions
  }

  private calculateGridPositions(icons: DesktopIcon[], options: IconArrangeOptions): IconPosition[] {
    const positions: IconPosition[] = []
    const { spacing, margin } = options
    const cols = Math.ceil(Math.sqrt(icons.length))
    
    icons.forEach((icon, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      positions.push({
        x: margin.left + col * (this.config.iconSize[icon.size] + spacing),
        y: margin.top + row * (this.config.iconSize[icon.size] + spacing)
      })
    })
    
    return positions
  }

  private calculateListPositions(icons: DesktopIcon[], options: IconArrangeOptions): IconPosition[] {
    const positions: IconPosition[] = []
    const { direction, spacing, margin } = options
    
    icons.forEach((icon, index) => {
      if (direction === 'horizontal') {
        positions.push({
          x: margin.left + index * (this.config.iconSize[icon.size] + spacing),
          y: margin.top
        })
      } else {
        positions.push({
          x: margin.left,
          y: margin.top + index * (this.config.iconSize[icon.size] + spacing)
        })
      }
    })
    
    return positions
  }

  private calculateCirclePositions(icons: DesktopIcon[], options: IconArrangeOptions): IconPosition[] {
    const positions: IconPosition[] = []
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const radius = Math.min(centerX, centerY) * 0.6
    
    icons.forEach((icon, index) => {
      const angle = (2 * Math.PI * index) / icons.length
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    })
    
    return positions
  }
}

// 导出单例实例
export const desktopManager = new DesktopManager({
  grid: {
    enabled: true,
    size: 20,
    snap: true,
    visible: false,
    color: '#e0e0e0',
    opacity: 0.5
  },
  iconSize: {
    small: 32,
    medium: 48,
    large: 64
  },
  iconSpacing: 16,
  autoArrange: false,
  snapToGrid: true,
  showHiddenIcons: false,
  doubleClickToOpen: true,
  rightClickMenu: true,
  dragAndDrop: true,
  multiSelect: true,
  contextMenu: {
    enabled: true,
    items: ['open', 'rename', 'delete', 'properties']
  },
  wallpaper: {
    changeInterval: 0,
    enableTransition: true,
    transitionDuration: 1000,
    preloadNext: true
  }
})