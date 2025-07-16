import type {
  DesktopIcon,
  IconPosition,
  IconArrangeOptions,
  IconSearchOptions,
  IconFilter,
  IconSorter
} from './types'

/**
 * 图标管理器
 * 负责管理桌面图标的布局、排列、选择和交互
 */
export class IconManager {
  private icons = new Map<string, DesktopIcon>()
  private selectedIcons = new Set<string>()
  private draggedIcon: DesktopIcon | null = null
  private gridSize: number = 20
  private iconSpacing: number = 16
  private iconSizes = {
    small: 32,
    medium: 48,
    large: 64
  }
  private eventListeners = new Map<string, Set<Function>>()

  constructor(config: {
    gridSize?: number
    iconSpacing?: number
    iconSizes?: { small: number; medium: number; large: number }
  } = {}) {
    this.gridSize = config.gridSize || 20
    this.iconSpacing = config.iconSpacing || 16
    this.iconSizes = { ...this.iconSizes, ...config.iconSizes }
    this.initializeEventListeners()
  }

  /**
   * 添加图标
   */
  addIcon(icon: DesktopIcon): void {
    this.icons.set(icon.id, { ...icon })
    this.emitEvent('icon-added', { icon })
  }

  /**
   * 移除图标
   */
  removeIcon(iconId: string): boolean {
    const icon = this.icons.get(iconId)
    if (!icon) {
      return false
    }

    this.icons.delete(iconId)
    this.selectedIcons.delete(iconId)
    this.emitEvent('icon-removed', { icon })
    return true
  }

  /**
   * 更新图标
   */
  updateIcon(iconId: string, updates: Partial<DesktopIcon>): boolean {
    const icon = this.icons.get(iconId)
    if (!icon) {
      return false
    }

    Object.assign(icon, updates)
    this.emitEvent('icon-updated', { icon })
    return true
  }

  /**
   * 获取图标
   */
  getIcon(iconId: string): DesktopIcon | null {
    return this.icons.get(iconId) || null
  }

  /**
   * 获取所有图标
   */
  getAllIcons(): DesktopIcon[] {
    return Array.from(this.icons.values())
  }

  /**
   * 获取可见图标
   */
  getVisibleIcons(): DesktopIcon[] {
    return this.getAllIcons().filter(icon => icon.visible)
  }

  /**
   * 移动图标
   */
  moveIcon(iconId: string, newPosition: IconPosition): boolean {
    const icon = this.icons.get(iconId)
    if (!icon || icon.locked) {
      return false
    }

    const oldPosition = { ...icon.position }
    icon.position = newPosition

    this.emitEvent('icon-moved', {
      icon,
      oldPosition,
      newPosition
    })

    return true
  }

  /**
   * 批量移动图标
   */
  moveIcons(moves: Array<{ iconId: string; position: IconPosition }>): boolean {
    const movedIcons: Array<{ icon: DesktopIcon; oldPosition: IconPosition; newPosition: IconPosition }> = []

    for (const { iconId, position } of moves) {
      const icon = this.icons.get(iconId)
      if (!icon || icon.locked) {
        continue
      }

      const oldPosition = { ...icon.position }
      icon.position = position
      movedIcons.push({ icon, oldPosition, newPosition: position })
    }

    if (movedIcons.length > 0) {
      this.emitEvent('icons-moved', { movedIcons })
      return true
    }

    return false
  }

  /**
   * 自动排列图标
   */
  arrangeIcons(options: IconArrangeOptions): void {
    const visibleIcons = this.getVisibleIcons()
    if (visibleIcons.length === 0) {
      return
    }

    // 按指定方式排序
    let sortedIcons = [...visibleIcons]
    if (options.sortBy) {
      sortedIcons = this.sortIconsBy(sortedIcons, options.sortBy, options.sortOrder)
    }

    // 按指定方式分组
    if (options.groupBy) {
      sortedIcons = this.groupIconsBy(sortedIcons, options.groupBy)
    }

    // 计算新位置
    const newPositions = this.calculateArrangedPositions(sortedIcons, options)
    
    // 应用新位置
    const moves = sortedIcons.map((icon, index) => ({
      iconId: icon.id,
      position: newPositions[index]
    }))

    this.moveIcons(moves)
    this.emitEvent('icons-arranged', { options, icons: sortedIcons })
  }

  /**
   * 搜索图标
   */
  searchIcons(options: IconSearchOptions): DesktopIcon[] {
    return this.getAllIcons().filter(icon => {
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
    return this.getAllIcons().filter(filter)
  }

  /**
   * 排序图标
   */
  sortIcons(sorter: IconSorter): DesktopIcon[] {
    return [...this.getAllIcons()].sort(sorter)
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
      iconId,
      selectedIcons: Array.from(this.selectedIcons)
    })
  }

  /**
   * 取消选择图标
   */
  deselectIcon(iconId: string): void {
    this.selectedIcons.delete(iconId)
    this.emitEvent('icon-deselected', {
      iconId,
      selectedIcons: Array.from(this.selectedIcons)
    })
  }

  /**
   * 选择多个图标
   */
  selectIcons(iconIds: string[], replace = true): void {
    if (replace) {
      this.clearSelection()
    }

    iconIds.forEach(id => this.selectedIcons.add(id))
    this.emitEvent('icons-selected', {
      iconIds,
      selectedIcons: Array.from(this.selectedIcons)
    })
  }

  /**
   * 清空选择
   */
  clearSelection(): void {
    const previousSelected = Array.from(this.selectedIcons)
    this.selectedIcons.clear()
    
    if (previousSelected.length > 0) {
      this.emitEvent('selection-cleared', {
        previousSelected
      })
    }
  }

  /**
   * 获取选中的图标
   */
  getSelectedIcons(): string[] {
    return Array.from(this.selectedIcons)
  }

  /**
   * 检查图标是否被选中
   */
  isIconSelected(iconId: string): boolean {
    return this.selectedIcons.has(iconId)
  }

  /**
   * 开始拖拽图标
   */
  startDrag(iconId: string): boolean {
    const icon = this.icons.get(iconId)
    if (!icon || icon.locked) {
      return false
    }

    this.draggedIcon = icon
    this.emitEvent('drag-start', { icon })
    return true
  }

  /**
   * 拖拽图标中
   */
  dragIcon(position: IconPosition): void {
    if (!this.draggedIcon) {
      return
    }

    this.emitEvent('drag-move', {
      icon: this.draggedIcon,
      position
    })
  }

  /**
   * 结束拖拽图标
   */
  endDrag(finalPosition?: IconPosition): boolean {
    if (!this.draggedIcon) {
      return false
    }

    const icon = this.draggedIcon
    this.draggedIcon = null

    if (finalPosition) {
      const success = this.moveIcon(icon.id, finalPosition)
      this.emitEvent('drag-end', {
        icon,
        finalPosition,
        success
      })
      return success
    }

    this.emitEvent('drag-cancel', { icon })
    return false
  }

  /**
   * 获取拖拽中的图标
   */
  getDraggedIcon(): DesktopIcon | null {
    return this.draggedIcon
  }

  /**
   * 检查位置是否可用
   */
  isPositionAvailable(position: IconPosition, iconSize: 'small' | 'medium' | 'large', excludeIconId?: string): boolean {
    const iconSizePixels = this.iconSizes[iconSize]
    const icons = this.getVisibleIcons().filter(icon => icon.id !== excludeIconId)

    for (const icon of icons) {
      const existingIconSize = this.iconSizes[icon.size]
      const distance = Math.sqrt(
        Math.pow(position.x - icon.position.x, 2) + 
        Math.pow(position.y - icon.position.y, 2)
      )
      
      const minDistance = (iconSizePixels + existingIconSize) / 2 + this.iconSpacing
      
      if (distance < minDistance) {
        return false
      }
    }

    return true
  }

  /**
   * 寻找可用位置
   */
  findAvailablePosition(preferredPosition: IconPosition, iconSize: 'small' | 'medium' | 'large', excludeIconId?: string): IconPosition {
    // 检查首选位置是否可用
    if (this.isPositionAvailable(preferredPosition, iconSize, excludeIconId)) {
      return preferredPosition
    }

    // 寻找最近的可用位置
    const searchRadius = 10
    
    for (let radius = 1; radius <= searchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
            continue
          }
          
          const testPosition = {
            x: preferredPosition.x + dx * this.gridSize,
            y: preferredPosition.y + dy * this.gridSize
          }
          
          if (this.isPositionAvailable(testPosition, iconSize, excludeIconId)) {
            return testPosition
          }
        }
      }
    }

    return preferredPosition
  }

  /**
   * 吸附到网格
   */
  snapToGrid(position: IconPosition): IconPosition {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize,
      gridX: Math.round(position.x / this.gridSize),
      gridY: Math.round(position.y / this.gridSize)
    }
  }

  /**
   * 获取图标统计信息
   */
  getStats(): {
    total: number
    visible: number
    hidden: number
    locked: number
    selected: number
    byCategory: Record<string, number>
    bySize: Record<string, number>
  } {
    const icons = this.getAllIcons()
    const byCategory: Record<string, number> = {}
    const bySize: Record<string, number> = {}

    icons.forEach(icon => {
      const category = icon.category || 'uncategorized'
      byCategory[category] = (byCategory[category] || 0) + 1
      bySize[icon.size] = (bySize[icon.size] || 0) + 1
    })

    return {
      total: icons.length,
      visible: icons.filter(icon => icon.visible).length,
      hidden: icons.filter(icon => !icon.visible).length,
      locked: icons.filter(icon => icon.locked).length,
      selected: this.selectedIcons.size,
      byCategory,
      bySize
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: {
    gridSize?: number
    iconSpacing?: number
    iconSizes?: Partial<{ small: number; medium: number; large: number }>
  }): void {
    if (config.gridSize !== undefined) {
      this.gridSize = config.gridSize
    }
    if (config.iconSpacing !== undefined) {
      this.iconSpacing = config.iconSpacing
    }
    if (config.iconSizes) {
      this.iconSizes = { ...this.iconSizes, ...config.iconSizes }
    }

    this.emitEvent('config-updated', { config })
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 清空所有图标
   */
  clear(): void {
    this.icons.clear()
    this.selectedIcons.clear()
    this.draggedIcon = null
    this.emitEvent('icons-cleared', {})
  }

  /**
   * 销毁图标管理器
   */
  destroy(): void {
    this.clear()
    this.eventListeners.clear()
  }

  // 私有方法

  private initializeEventListeners(): void {
    const events = [
      'icon-added',
      'icon-removed',
      'icon-updated',
      'icon-moved',
      'icons-moved',
      'icons-arranged',
      'icon-selected',
      'icon-deselected',
      'icons-selected',
      'selection-cleared',
      'drag-start',
      'drag-move',
      'drag-end',
      'drag-cancel',
      'config-updated',
      'icons-cleared'
    ]

    events.forEach(event => {
      this.eventListeners.set(event, new Set())
    })
  }

  private sortIconsBy(
    icons: DesktopIcon[], 
    sortBy: 'name' | 'date' | 'size' | 'type' | 'custom',
    order: 'asc' | 'desc' = 'asc'
  ): DesktopIcon[] {
    const sorted = [...icons].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          const sizeOrder = { small: 1, medium: 2, large: 3 }
          comparison = sizeOrder[a.size] - sizeOrder[b.size]
          break
        case 'type':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        default:
          comparison = 0
      }

      return order === 'desc' ? -comparison : comparison
    })

    return sorted
  }

  private groupIconsBy(
    icons: DesktopIcon[], 
    groupBy: 'category' | 'name' | 'type' | 'size'
  ): DesktopIcon[] {
    const groups: Record<string, DesktopIcon[]> = {}

    icons.forEach(icon => {
      let groupKey = ''
      
      switch (groupBy) {
        case 'category':
          groupKey = icon.category || 'uncategorized'
          break
        case 'name':
          groupKey = icon.name.charAt(0).toUpperCase()
          break
        case 'type':
          groupKey = icon.category || 'unknown'
          break
        case 'size':
          groupKey = icon.size
          break
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(icon)
    })

    // 将分组后的图标按组顺序排列
    const sortedGroups = Object.keys(groups).sort()
    const result: DesktopIcon[] = []
    
    sortedGroups.forEach(groupKey => {
      result.push(...groups[groupKey])
    })

    return result
  }

  private calculateArrangedPositions(
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
        x: margin.left + col * (this.iconSizes[icon.size] + spacing),
        y: margin.top + row * (this.iconSizes[icon.size] + spacing)
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
          x: margin.left + index * (this.iconSizes[icon.size] + spacing),
          y: margin.top
        })
      } else {
        positions.push({
          x: margin.left,
          y: margin.top + index * (this.iconSizes[icon.size] + spacing)
        })
      }
    })
    
    return positions
  }

  private calculateCirclePositions(icons: DesktopIcon[], options: IconArrangeOptions): IconPosition[] {
    const positions: IconPosition[] = []
    const centerX = (typeof window !== 'undefined' ? window.innerWidth : 1920) / 2
    const centerY = (typeof window !== 'undefined' ? window.innerHeight : 1080) / 2
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

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in icon event listener for ${event}:`, error)
        }
      })
    }
  }
}
