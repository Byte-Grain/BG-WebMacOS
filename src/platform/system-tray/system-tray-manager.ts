import type {
  TrayItem,
  TrayConfig,
  TrayEvent,
  TrayEventType,
  TrayLayout,
  TrayStats,
  TraySnapshot,
  TrayItemFilter,
  TrayItemSearchOptions,
  TrayTheme,
  TrayPreset,
  TrayManagerConfig,
  TrayValidationResult,
  TrayExportOptions,
  TrayImportOptions
} from './types'

/**
 * 系统托盘管理器
 * 负责管理系统托盘的显示、项目管理和配置
 */
export class SystemTrayManager {
  private items: Map<string, TrayItem> = new Map()
  private config: TrayConfig
  private theme: TrayTheme
  private isVisible = true
  private isAutoHidden = false
  private autoHideTimer?: number
  private eventListeners: Map<TrayEventType, Set<(event: TrayEvent) => void>> = new Map()
  private snapshots: Map<string, TraySnapshot> = new Map()
  private presets: Map<string, TrayPreset> = new Map()
  private container?: HTMLElement

  constructor(config?: Partial<TrayManagerConfig>) {
    this.config = this.getDefaultConfig()
    this.theme = this.getDefaultTheme()
    
    if (config) {
      this.updateConfig(config)
    }

    this.initializePresets()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): TrayConfig {
    return {
      position: 'top-right',
      size: 'medium',
      autoHide: false,
      autoHideDelay: 3000,
      maxItems: 20,
      itemSpacing: 4,
      padding: {
        top: 8,
        right: 8,
        bottom: 8,
        left: 8
      },
      background: {
        color: 'rgba(0, 0, 0, 0.8)',
        opacity: 0.9,
        blur: 10
      },
      border: {
        width: 1,
        color: 'rgba(255, 255, 255, 0.2)',
        radius: 8
      },
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.3)',
        blur: 10,
        offset: { x: 0, y: 2 }
      },
      animation: {
        enabled: true,
        duration: 200,
        easing: 'ease-out'
      },
      accessibility: {
        enabled: true,
        announceChanges: true,
        keyboardNavigation: true
      }
    }
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(): TrayTheme {
    return {
      name: 'default',
      colors: {
        background: 'rgba(0, 0, 0, 0.8)',
        foreground: '#ffffff',
        border: 'rgba(255, 255, 255, 0.2)',
        shadow: 'rgba(0, 0, 0, 0.3)',
        accent: '#007AFF',
        hover: 'rgba(255, 255, 255, 0.1)',
        active: 'rgba(255, 255, 255, 0.2)',
        disabled: 'rgba(255, 255, 255, 0.3)'
      },
      fonts: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        size: 12,
        weight: '400'
      },
      spacing: {
        item: 4,
        padding: 8,
        margin: 4
      },
      effects: {
        blur: 10,
        opacity: 0.9,
        borderRadius: 8
      }
    }
  }

  /**
   * 初始化预设
   */
  private initializePresets(): void {
    const presets: TrayPreset[] = [
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean and minimal system tray',
        config: {
          size: 'small',
          itemSpacing: 2,
          background: { opacity: 0.7 }
        },
        items: []
      },
      {
        id: 'compact',
        name: 'Compact',
        description: 'Space-efficient layout',
        config: {
          size: 'small',
          maxItems: 15,
          itemSpacing: 1
        },
        items: []
      },
      {
        id: 'expanded',
        name: 'Expanded',
        description: 'Spacious layout with large icons',
        config: {
          size: 'large',
          itemSpacing: 8,
          maxItems: 10
        },
        items: []
      }
    ]

    presets.forEach(preset => {
      this.presets.set(preset.id, preset)
    })
  }

  /**
   * 显示系统托盘
   */
  show(): void {
    if (this.isVisible) return

    this.isVisible = true
    this.isAutoHidden = false
    this.clearAutoHideTimer()
    this.emitEvent('tray-shown')
  }

  /**
   * 隐藏系统托盘
   */
  hide(): void {
    if (!this.isVisible) return

    this.isVisible = false
    this.clearAutoHideTimer()
    this.emitEvent('tray-hidden')
  }

  /**
   * 切换系统托盘显示状态
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 设置自动隐藏
   */
  private setAutoHide(): void {
    if (!this.config.autoHide || this.isAutoHidden) return

    this.clearAutoHideTimer()
    this.autoHideTimer = window.setTimeout(() => {
      this.isAutoHidden = true
      this.hide()
    }, this.config.autoHideDelay)
  }

  /**
   * 清除自动隐藏定时器
   */
  private clearAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
      this.autoHideTimer = undefined
    }
  }

  /**
   * 添加托盘项目
   */
  addItem(item: Omit<TrayItem, 'id'> | TrayItem): string {
    const id = 'id' in item ? item.id : this.generateItemId()
    const newItem: TrayItem = {
      id,
      state: 'normal',
      visible: true,
      enabled: true,
      ...item
    }

    // 检查最大项目数限制
    if (this.items.size >= this.config.maxItems) {
      throw new Error(`Maximum number of tray items (${this.config.maxItems}) exceeded`)
    }

    this.items.set(id, newItem)
    this.emitEvent('item-added', { item: newItem })
    return id
  }

  /**
   * 移除托盘项目
   */
  removeItem(id: string): boolean {
    const item = this.items.get(id)
    if (!item) return false

    this.items.delete(id)
    this.emitEvent('item-removed', { item })
    return true
  }

  /**
   * 更新托盘项目
   */
  updateItem(id: string, updates: Partial<TrayItem>): boolean {
    const item = this.items.get(id)
    if (!item) return false

    const updatedItem = { ...item, ...updates, id }
    this.items.set(id, updatedItem)
    this.emitEvent('item-updated', { item: updatedItem })
    return true
  }

  /**
   * 获取托盘项目
   */
  getItem(id: string): TrayItem | undefined {
    return this.items.get(id)
  }

  /**
   * 获取所有托盘项目
   */
  getAllItems(): TrayItem[] {
    return Array.from(this.items.values())
  }

  /**
   * 获取可见的托盘项目
   */
  getVisibleItems(): TrayItem[] {
    return this.getAllItems().filter(item => item.visible)
  }

  /**
   * 搜索托盘项目
   */
  searchItems(options: TrayItemSearchOptions): TrayItem[] {
    let items = this.getAllItems()

    // 应用过滤器
    items = this.filterItems(items, options)

    // 应用查询
    if (options.query) {
      const query = options.query.toLowerCase()
      items = items.filter(item => {
        const matchesLabel = item.label.toLowerCase().includes(query)
        const matchesTooltip = options.includeTooltip && item.tooltip?.toLowerCase().includes(query)
        const matchesMetadata = options.includeMetadata && 
          item.metadata && 
          Object.values(item.metadata).some(value => 
            String(value).toLowerCase().includes(query)
          )
        
        return matchesLabel || matchesTooltip || matchesMetadata
      })
    }

    return items
  }

  /**
   * 过滤托盘项目
   */
  filterItems(items: TrayItem[], filter: TrayItemFilter): TrayItem[] {
    return items.filter(item => {
      if (filter.type && item.type !== filter.type) return false
      if (filter.state && item.state !== filter.state) return false
      if (filter.visible !== undefined && item.visible !== filter.visible) return false
      if (filter.enabled !== undefined && item.enabled !== filter.enabled) return false
      if (filter.hasBadge !== undefined) {
        const hasBadge = !!item.badge
        if (hasBadge !== filter.hasBadge) return false
      }
      if (filter.hasContextMenu !== undefined) {
        const hasContextMenu = !!(item.contextMenu && item.contextMenu.length > 0)
        if (hasContextMenu !== filter.hasContextMenu) return false
      }
      return true
    })
  }

  /**
   * 移动托盘项目
   */
  moveItem(id: string, newPosition: number): boolean {
    const item = this.items.get(id)
    if (!item) return false

    const updatedItem = { ...item, position: newPosition }
    this.items.set(id, updatedItem)
    this.emitEvent('item-updated', { item: updatedItem })
    return true
  }

  /**
   * 计算布局
   */
  calculateLayout(): TrayLayout {
    const visibleItems = this.getVisibleItems()
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    const itemSize = this.getItemSize()
    const spacing = this.config.itemSpacing
    const padding = this.config.padding

    let currentX = padding.left
    let currentY = padding.top
    const itemPositions: TrayLayout['itemPositions'] = []

    visibleItems.forEach(item => {
      itemPositions.push({
        id: item.id,
        x: currentX,
        y: currentY,
        width: itemSize.width,
        height: itemSize.height
      })

      currentX += itemSize.width + spacing
    })

    const totalWidth = Math.max(
      currentX - spacing + padding.right,
      padding.left + padding.right
    )
    const totalHeight = itemSize.height + padding.top + padding.bottom

    return {
      items: visibleItems,
      totalWidth,
      totalHeight,
      itemPositions
    }
  }

  /**
   * 获取项目大小
   */
  private getItemSize(): { width: number; height: number } {
    const sizeMap = {
      small: { width: 20, height: 20 },
      medium: { width: 24, height: 24 },
      large: { width: 32, height: 32 }
    }
    return sizeMap[this.config.size]
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<TrayManagerConfig>): void {
    if (updates.tray) {
      this.config = { ...this.config, ...updates.tray }
    }
    if (updates.theme) {
      this.theme = { ...this.theme, ...updates.theme }
    }
    this.emitEvent('config-updated')
  }

  /**
   * 获取配置
   */
  getConfig(): TrayConfig {
    return { ...this.config }
  }

  /**
   * 获取主题
   */
  getTheme(): TrayTheme {
    return { ...this.theme }
  }

  /**
   * 设置主题
   */
  setTheme(theme: Partial<TrayTheme>): void {
    this.theme = { ...this.theme, ...theme }
    this.emitEvent('config-updated')
  }

  /**
   * 获取统计信息
   */
  getStats(): TrayStats {
    const items = this.getAllItems()
    const visibleItems = items.filter(item => item.visible)
    const enabledItems = items.filter(item => item.enabled)

    const itemsByType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const itemsByState = items.reduce((acc, item) => {
      acc[item.state] = (acc[item.state] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const itemSize = this.getItemSize()
    const layout = this.calculateLayout()

    return {
      totalItems: items.length,
      visibleItems: visibleItems.length,
      enabledItems: enabledItems.length,
      itemsByType: itemsByType as any,
      itemsByState: itemsByState as any,
      averageItemSize: itemSize,
      totalSize: {
        width: layout.totalWidth,
        height: layout.totalHeight
      }
    }
  }

  /**
   * 创建快照
   */
  createSnapshot(name: string): string {
    const id = `snapshot-${Date.now()}`
    const snapshot: TraySnapshot = {
      id,
      name,
      timestamp: Date.now(),
      items: this.getAllItems(),
      config: this.getConfig(),
      layout: this.calculateLayout()
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

    // 清除当前项目
    this.items.clear()

    // 恢复项目
    snapshot.items.forEach(item => {
      this.items.set(item.id, { ...item })
    })

    // 恢复配置
    this.config = { ...snapshot.config }

    this.emitEvent('config-updated')
    return true
  }

  /**
   * 获取快照
   */
  getSnapshot(id: string): TraySnapshot | undefined {
    return this.snapshots.get(id)
  }

  /**
   * 获取所有快照
   */
  getAllSnapshots(): TraySnapshot[] {
    return Array.from(this.snapshots.values())
  }

  /**
   * 删除快照
   */
  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id)
  }

  /**
   * 应用预设
   */
  applyPreset(id: string): boolean {
    const preset = this.presets.get(id)
    if (!preset) return false

    // 应用配置
    if (preset.config) {
      this.config = { ...this.config, ...preset.config }
    }

    // 应用主题
    if (preset.theme) {
      this.theme = { ...this.theme, ...preset.theme }
    }

    // 应用项目
    if (preset.items && preset.items.length > 0) {
      this.items.clear()
      preset.items.forEach(itemTemplate => {
        this.addItem(itemTemplate)
      })
    }

    this.emitEvent('config-updated')
    return true
  }

  /**
   * 获取预设
   */
  getPreset(id: string): TrayPreset | undefined {
    return this.presets.get(id)
  }

  /**
   * 获取所有预设
   */
  getAllPresets(): TrayPreset[] {
    return Array.from(this.presets.values())
  }

  /**
   * 添加自定义预设
   */
  addPreset(preset: TrayPreset): void {
    this.presets.set(preset.id, preset)
  }

  /**
   * 验证配置
   */
  validateConfig(config: Partial<TrayConfig>): TrayValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (config.maxItems !== undefined) {
      if (config.maxItems < 1) {
        errors.push('maxItems must be at least 1')
      } else if (config.maxItems > 50) {
        warnings.push('maxItems is very high, may affect performance')
      }
    }

    if (config.autoHideDelay !== undefined) {
      if (config.autoHideDelay < 0) {
        errors.push('autoHideDelay cannot be negative')
      } else if (config.autoHideDelay < 1000) {
        warnings.push('autoHideDelay is very short')
      }
    }

    if (config.itemSpacing !== undefined && config.itemSpacing < 0) {
      errors.push('itemSpacing cannot be negative')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 导出配置
   */
  exportConfig(options: TrayExportOptions): string {
    const data: any = {}

    if (options.includeConfig) {
      data.config = this.getConfig()
    }

    if (options.includeItems) {
      data.items = this.getAllItems()
    }

    if (options.includeTheme) {
      data.theme = this.getTheme()
    }

    if (options.includeSnapshots) {
      data.snapshots = this.getAllSnapshots()
    }

    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'xml':
      case 'yaml':
        // 简化实现，实际应该使用专门的库
        return JSON.stringify(data, null, 2)
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  /**
   * 导入配置
   */
  importConfig(data: string, options: TrayImportOptions): boolean {
    try {
      const parsed = JSON.parse(data)

      if (options.validateBeforeImport) {
        if (parsed.config) {
          const validation = this.validateConfig(parsed.config)
          if (!validation.valid) {
            throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
          }
        }
      }

      if (parsed.config && options.mergeConfig) {
        this.config = options.mergeConfig ? 
          { ...this.config, ...parsed.config } : 
          parsed.config
      }

      if (parsed.theme && options.mergeTheme) {
        this.theme = options.mergeTheme ? 
          { ...this.theme, ...parsed.theme } : 
          parsed.theme
      }

      if (parsed.items && options.mergeItems) {
        if (!options.mergeItems) {
          this.items.clear()
        }
        parsed.items.forEach((item: TrayItem) => {
          if (options.overwriteExisting || !this.items.has(item.id)) {
            this.items.set(item.id, item)
          }
        })
      }

      this.emitEvent('config-updated')
      return true
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }

  /**
   * 生成项目ID
   */
  private generateItemId(): string {
    return `tray-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: TrayEventType, listener: (event: TrayEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: TrayEventType, listener: (event: TrayEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: TrayEventType, data?: any): void {
    const event: TrayEvent = {
      type,
      timestamp: Date.now(),
      data
    }

    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in tray event listener for ${type}:`, error)
        }
      })
    }
  }

  /**
   * 检查是否可见
   */
  isShown(): boolean {
    return this.isVisible
  }

  /**
   * 检查是否自动隐藏
   */
  isAutoHidden(): boolean {
    return this.isAutoHidden
  }

  /**
   * 清空所有项目
   */
  clear(): void {
    this.items.clear()
    this.emitEvent('config-updated')
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.clearAutoHideTimer()
    this.items.clear()
    this.eventListeners.clear()
    this.snapshots.clear()
    this.presets.clear()
  }
}

// 导出单例实例
export const systemTrayManager = new SystemTrayManager()