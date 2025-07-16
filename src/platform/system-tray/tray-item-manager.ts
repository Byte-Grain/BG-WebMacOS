import type {
  TrayItem,
  TrayItemType,
  TrayItemState,
  TrayItemFilter,
  TrayItemSearchOptions,
  TrayItemTemplate,
  TrayContextMenuItem
} from './types'

/**
 * 系统托盘项目管理器
 * 负责管理单个托盘项目的状态、行为和交互
 */
export class TrayItemManager {
  private templates: Map<TrayItemType, TrayItemTemplate> = new Map()
  private itemStates: Map<string, any> = new Map()
  private contextMenus: Map<string, TrayContextMenuItem[]> = new Map()
  private shortcuts: Map<string, string> = new Map() // shortcut -> itemId

  constructor() {
    this.initializeTemplates()
    this.initializeDefaultContextMenus()
  }

  /**
   * 初始化项目模板
   */
  private initializeTemplates(): void {
    const templates: TrayItemTemplate[] = [
      {
        type: 'app',
        label: 'Application',
        icon: '/icons/app-default.svg',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          type: 'app'
        }
      },
      {
        type: 'system',
        label: 'System Item',
        icon: '/icons/system-default.svg',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          type: 'system'
        }
      },
      {
        type: 'notification',
        label: 'Notification',
        icon: '/icons/notification-default.svg',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          type: 'notification',
          badge: {
            text: '1',
            color: '#ffffff',
            backgroundColor: '#ff3b30'
          }
        }
      },
      {
        type: 'widget',
        label: 'Widget',
        icon: '/icons/widget-default.svg',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          type: 'widget'
        }
      },
      {
        type: 'separator',
        label: '',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          type: 'separator'
        }
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.type, template)
    })
  }

  /**
   * 初始化默认上下文菜单
   */
  private initializeDefaultContextMenus(): void {
    // 应用程序默认菜单
    this.contextMenus.set('app', [
      {
        id: 'open',
        label: 'Open',
        icon: '/icons/open.svg',
        action: () => console.log('Open application')
      },
      {
        id: 'separator-1',
        label: '',
        separator: true
      },
      {
        id: 'hide',
        label: 'Hide',
        icon: '/icons/hide.svg',
        action: () => console.log('Hide application')
      },
      {
        id: 'quit',
        label: 'Quit',
        icon: '/icons/quit.svg',
        shortcut: 'Cmd+Q',
        action: () => console.log('Quit application')
      }
    ])

    // 系统项目默认菜单
    this.contextMenus.set('system', [
      {
        id: 'settings',
        label: 'Settings',
        icon: '/icons/settings.svg',
        action: () => console.log('Open settings')
      },
      {
        id: 'separator-1',
        label: '',
        separator: true
      },
      {
        id: 'remove',
        label: 'Remove from Tray',
        icon: '/icons/remove.svg',
        action: () => console.log('Remove from tray')
      }
    ])

    // 通知默认菜单
    this.contextMenus.set('notification', [
      {
        id: 'view',
        label: 'View Notification',
        icon: '/icons/view.svg',
        action: () => console.log('View notification')
      },
      {
        id: 'clear',
        label: 'Clear',
        icon: '/icons/clear.svg',
        action: () => console.log('Clear notification')
      },
      {
        id: 'separator-1',
        label: '',
        separator: true
      },
      {
        id: 'settings',
        label: 'Notification Settings',
        icon: '/icons/settings.svg',
        action: () => console.log('Open notification settings')
      }
    ])

    // 小部件默认菜单
    this.contextMenus.set('widget', [
      {
        id: 'configure',
        label: 'Configure Widget',
        icon: '/icons/configure.svg',
        action: () => console.log('Configure widget')
      },
      {
        id: 'refresh',
        label: 'Refresh',
        icon: '/icons/refresh.svg',
        shortcut: 'F5',
        action: () => console.log('Refresh widget')
      },
      {
        id: 'separator-1',
        label: '',
        separator: true
      },
      {
        id: 'remove',
        label: 'Remove Widget',
        icon: '/icons/remove.svg',
        action: () => console.log('Remove widget')
      }
    ])
  }

  /**
   * 创建新托盘项目
   */
  createTrayItem(type: TrayItemType, config: Partial<TrayItem>): Omit<TrayItem, 'id'> {
    const template = this.templates.get(type)
    if (!template) {
      throw new Error(`Unknown tray item type: ${type}`)
    }

    const defaultItem: Omit<TrayItem, 'id'> = {
      type,
      label: config.label || template.label,
      icon: config.icon || template.icon,
      state: 'normal',
      visible: true,
      enabled: true,
      ...template.defaultConfig,
      ...config
    }

    // 设置默认上下文菜单
    if (!defaultItem.contextMenu && this.contextMenus.has(type)) {
      defaultItem.contextMenu = [...this.contextMenus.get(type)!]
    }

    return defaultItem
  }

  /**
   * 验证托盘项目配置
   */
  validateTrayItem(item: Partial<TrayItem>): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    if (!item.type) {
      errors.push('Tray item type is required')
    }

    if (!item.label && item.type !== 'separator') {
      errors.push('Tray item label is required for non-separator items')
    }

    if (item.label && item.label.trim() === '' && item.type !== 'separator') {
      errors.push('Tray item label cannot be empty for non-separator items')
    }

    // 检查图标
    if (item.type !== 'separator' && !item.icon) {
      warnings.push('Tray item should have an icon')
    }

    if (item.icon && !this.isValidIcon(item.icon)) {
      warnings.push(`Invalid icon format: ${item.icon}`)
    }

    // 检查徽章
    if (item.badge) {
      if (!item.badge.text || item.badge.text.trim() === '') {
        warnings.push('Badge should have text')
      }
      if (item.badge.text && item.badge.text.length > 3) {
        warnings.push('Badge text should be short (max 3 characters)')
      }
    }

    // 检查上下文菜单
    if (item.contextMenu) {
      item.contextMenu.forEach((menuItem, index) => {
        if (!menuItem.id) {
          errors.push(`Context menu item at index ${index} is missing id`)
        }
        if (!menuItem.label && !menuItem.separator) {
          errors.push(`Context menu item at index ${index} is missing label`)
        }
      })
    }

    // 检查位置
    if (item.position !== undefined && item.position < 0) {
      errors.push('Position cannot be negative')
    }

    // 检查点击处理器
    if (item.type === 'app' && !item.onClick) {
      warnings.push('App items should have an onClick handler')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证图标格式
   */
  private isValidIcon(icon: string): boolean {
    // 检查是否是有效的URL或路径
    try {
      new URL(icon)
      return true
    } catch {
      // 检查是否是相对路径
      return icon.startsWith('/') || icon.startsWith('./') || icon.startsWith('../')
    }
  }

  /**
   * 更新托盘项目状态
   */
  updateItemState(item: TrayItem, state: TrayItemState): TrayItem {
    return {
      ...item,
      state
    }
  }

  /**
   * 切换托盘项目启用状态
   */
  toggleItemEnabled(item: TrayItem): TrayItem {
    const newEnabled = !item.enabled
    return {
      ...item,
      enabled: newEnabled,
      state: newEnabled ? 'normal' : 'disabled'
    }
  }

  /**
   * 切换托盘项目可见性
   */
  toggleItemVisibility(item: TrayItem): TrayItem {
    return {
      ...item,
      visible: !item.visible
    }
  }

  /**
   * 设置托盘项目徽章
   */
  setItemBadge(item: TrayItem, badge?: TrayItem['badge']): TrayItem {
    return {
      ...item,
      badge
    }
  }

  /**
   * 更新徽章文本
   */
  updateBadgeText(item: TrayItem, text: string): TrayItem {
    if (!item.badge) {
      return {
        ...item,
        badge: {
          text,
          color: '#ffffff',
          backgroundColor: '#ff3b30'
        }
      }
    }

    return {
      ...item,
      badge: {
        ...item.badge,
        text
      }
    }
  }

  /**
   * 清除徽章
   */
  clearBadge(item: TrayItem): TrayItem {
    const { badge, ...itemWithoutBadge } = item
    return itemWithoutBadge
  }

  /**
   * 设置托盘项目工具提示
   */
  setItemTooltip(item: TrayItem, tooltip?: string): TrayItem {
    return {
      ...item,
      tooltip
    }
  }

  /**
   * 设置托盘项目上下文菜单
   */
  setItemContextMenu(item: TrayItem, contextMenu?: TrayContextMenuItem[]): TrayItem {
    return {
      ...item,
      contextMenu
    }
  }

  /**
   * 添加上下文菜单项
   */
  addContextMenuItem(item: TrayItem, menuItem: TrayContextMenuItem, position?: number): TrayItem {
    const contextMenu = item.contextMenu ? [...item.contextMenu] : []
    
    if (position !== undefined && position >= 0 && position <= contextMenu.length) {
      contextMenu.splice(position, 0, menuItem)
    } else {
      contextMenu.push(menuItem)
    }

    return {
      ...item,
      contextMenu
    }
  }

  /**
   * 移除上下文菜单项
   */
  removeContextMenuItem(item: TrayItem, menuItemId: string): TrayItem {
    if (!item.contextMenu) return item

    const contextMenu = item.contextMenu.filter(menuItem => menuItem.id !== menuItemId)
    return {
      ...item,
      contextMenu
    }
  }

  /**
   * 更新上下文菜单项
   */
  updateContextMenuItem(item: TrayItem, menuItemId: string, updates: Partial<TrayContextMenuItem>): TrayItem {
    if (!item.contextMenu) return item

    const contextMenu = item.contextMenu.map(menuItem => 
      menuItem.id === menuItemId ? { ...menuItem, ...updates } : menuItem
    )

    return {
      ...item,
      contextMenu
    }
  }

  /**
   * 获取默认上下文菜单
   */
  getDefaultContextMenu(type: TrayItemType): TrayContextMenuItem[] {
    return this.contextMenus.get(type) || []
  }

  /**
   * 处理托盘项目点击
   */
  handleItemClick(item: TrayItem, event?: MouseEvent): void {
    if (!item.enabled) return

    // 更新状态为激活
    const updatedItem = this.updateItemState(item, 'active')
    
    // 执行点击处理器
    if (item.onClick) {
      try {
        item.onClick()
      } catch (error) {
        console.error(`Error in tray item click handler for ${item.id}:`, error)
      }
    }

    // 恢复正常状态
    setTimeout(() => {
      this.updateItemState(updatedItem, 'normal')
    }, 150)
  }

  /**
   * 处理托盘项目双击
   */
  handleItemDoubleClick(item: TrayItem, event?: MouseEvent): void {
    if (!item.enabled) return

    if (item.onDoubleClick) {
      try {
        item.onDoubleClick()
      } catch (error) {
        console.error(`Error in tray item double click handler for ${item.id}:`, error)
      }
    }
  }

  /**
   * 处理托盘项目右键点击
   */
  handleItemRightClick(item: TrayItem, event?: MouseEvent): void {
    if (!item.enabled) return

    if (item.onRightClick) {
      try {
        item.onRightClick()
      } catch (error) {
        console.error(`Error in tray item right click handler for ${item.id}:`, error)
      }
    }
  }

  /**
   * 处理托盘项目中键点击
   */
  handleItemMiddleClick(item: TrayItem, event?: MouseEvent): void {
    if (!item.enabled) return

    if (item.onMiddleClick) {
      try {
        item.onMiddleClick()
      } catch (error) {
        console.error(`Error in tray item middle click handler for ${item.id}:`, error)
      }
    }
  }

  /**
   * 过滤托盘项目
   */
  filterItems(items: TrayItem[], filter: TrayItemFilter): TrayItem[] {
    return items.filter(item => {
      if (filter.type && item.type !== filter.type) {
        return false
      }

      if (filter.state && item.state !== filter.state) {
        return false
      }

      if (filter.visible !== undefined && item.visible !== filter.visible) {
        return false
      }

      if (filter.enabled !== undefined && item.enabled !== filter.enabled) {
        return false
      }

      if (filter.hasBadge !== undefined) {
        const hasBadge = !!item.badge
        if (hasBadge !== filter.hasBadge) {
          return false
        }
      }

      if (filter.hasContextMenu !== undefined) {
        const hasContextMenu = !!(item.contextMenu && item.contextMenu.length > 0)
        if (hasContextMenu !== filter.hasContextMenu) {
          return false
        }
      }

      return true
    })
  }

  /**
   * 搜索托盘项目
   */
  searchItems(items: TrayItem[], options: TrayItemSearchOptions): TrayItem[] {
    let filteredItems = this.filterItems(items, options)

    if (options.query) {
      const query = options.query.toLowerCase()
      filteredItems = filteredItems.filter(item => {
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

    return filteredItems
  }

  /**
   * 排序托盘项目
   */
  sortItems(items: TrayItem[], sortBy: 'label' | 'type' | 'state' | 'position' = 'position', ascending = true): TrayItem[] {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'label':
          comparison = a.label.localeCompare(b.label)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'state':
          comparison = a.state.localeCompare(b.state)
          break
        case 'position':
          const aPos = a.position || 0
          const bPos = b.position || 0
          comparison = aPos - bPos
          break
      }

      return ascending ? comparison : -comparison
    })

    return sorted
  }

  /**
   * 克隆托盘项目
   */
  cloneItem(item: TrayItem, newId?: string): TrayItem {
    const cloned = JSON.parse(JSON.stringify(item))
    if (newId) {
      cloned.id = newId
    }
    return cloned
  }

  /**
   * 合并托盘项目
   */
  mergeItems(target: TrayItem, source: Partial<TrayItem>): TrayItem {
    return {
      ...target,
      ...source,
      id: target.id // 保持原ID
    }
  }

  /**
   * 获取托盘项目模板
   */
  getTemplate(type: TrayItemType): TrayItemTemplate | undefined {
    return this.templates.get(type)
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): TrayItemTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 添加自定义模板
   */
  addTemplate(template: TrayItemTemplate): void {
    this.templates.set(template.type, template)
  }

  /**
   * 设置项目状态数据
   */
  setItemState(itemId: string, key: string, value: any): void {
    if (!this.itemStates.has(itemId)) {
      this.itemStates.set(itemId, {})
    }
    this.itemStates.get(itemId)![key] = value
  }

  /**
   * 获取项目状态数据
   */
  getItemState(itemId: string, key: string): any {
    const state = this.itemStates.get(itemId)
    return state ? state[key] : undefined
  }

  /**
   * 清除项目状态数据
   */
  clearItemState(itemId: string): void {
    this.itemStates.delete(itemId)
  }

  /**
   * 生成唯一的托盘项目ID
   */
  generateItemId(prefix = 'tray-item'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证托盘项目ID是否唯一
   */
  isIdUnique(id: string, existingItems: TrayItem[]): boolean {
    return !existingItems.some(item => item.id === id)
  }

  /**
   * 获取下一个可用位置
   */
  getNextAvailablePosition(existingItems: TrayItem[]): number {
    const positions = existingItems
      .map(item => item.position || 0)
      .filter(pos => typeof pos === 'number')
    
    return positions.length > 0 ? Math.max(...positions) + 1 : 0
  }

  /**
   * 重新排序项目位置
   */
  reorderItems(items: TrayItem[]): TrayItem[] {
    return items.map((item, index) => ({
      ...item,
      position: index
    }))
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.templates.clear()
    this.itemStates.clear()
    this.contextMenus.clear()
    this.shortcuts.clear()
  }
}

// 导出单例实例
export const trayItemManager = new TrayItemManager()
