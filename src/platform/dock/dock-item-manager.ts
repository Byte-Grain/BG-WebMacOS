import type {
  DockItem,
  DockItemType,
  DockItemState,
  DockItemFilter,
  DockItemSearchOptions,
  DockContextMenuItem,
  DockItemTemplate
} from './types'

/**
 * Dock项目管理器
 * 负责管理单个Dock项目的状态、行为和交互
 */
export class DockItemManager {
  private contextMenus: Map<string, DockContextMenuItem[]> = new Map()
  private templates: Map<DockItemType, DockItemTemplate> = new Map()
  private itemStates: Map<string, any> = new Map()
  private dragState: {
    isDragging: boolean
    draggedItem?: DockItem
    dragStartPosition?: { x: number; y: number }
    dragCurrentPosition?: { x: number; y: number }
  } = {
    isDragging: false
  }

  constructor() {
    this.initializeTemplates()
    this.initializeDefaultContextMenus()
  }

  /**
   * 初始化项目模板
   */
  private initializeTemplates(): void {
    const templates: DockItemTemplate[] = [
      {
        type: 'app',
        name: 'Application',
        icon: '/icons/app-default.png',
        defaultConfig: {
          state: 'normal',
          visible: true,
          pinned: false,
          animation: {
            bounce: true,
            glow: false,
            scale: 1
          }
        }
      },
      {
        type: 'folder',
        name: 'Folder',
        icon: '/icons/folder.png',
        defaultConfig: {
          state: 'normal',
          visible: true,
          pinned: false,
          folder: {
            items: [],
            expanded: false,
            layout: 'grid'
          }
        }
      },
      {
        type: 'separator',
        name: 'Separator',
        icon: '',
        defaultConfig: {
          state: 'normal',
          visible: true,
          pinned: false
        }
      },
      {
        type: 'trash',
        name: 'Trash',
        icon: '/icons/trash.png',
        defaultConfig: {
          state: 'normal',
          visible: true,
          pinned: true
        }
      },
      {
        type: 'widget',
        name: 'Widget',
        icon: '/icons/widget.png',
        defaultConfig: {
          state: 'normal',
          visible: true,
          pinned: false
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
    // 应用项目上下文菜单
    this.contextMenus.set('app', [
      {
        id: 'open',
        label: 'Open',
        icon: '/icons/open.png',
        action: 'open',
        enabled: true
      },
      {
        id: 'separator1',
        label: '',
        action: '',
        enabled: true,
        separator: true
      },
      {
        id: 'pin',
        label: 'Keep in Dock',
        action: 'toggle-pin',
        enabled: true
      },
      {
        id: 'remove',
        label: 'Remove from Dock',
        action: 'remove',
        enabled: true
      },
      {
        id: 'separator2',
        label: '',
        action: '',
        enabled: true,
        separator: true
      },
      {
        id: 'show-in-finder',
        label: 'Show in Finder',
        action: 'show-in-finder',
        enabled: true
      },
      {
        id: 'options',
        label: 'Options',
        action: 'options',
        enabled: true,
        submenu: [
          {
            id: 'open-at-login',
            label: 'Open at Login',
            action: 'toggle-auto-start',
            enabled: true
          },
          {
            id: 'show-all-windows',
            label: 'Show All Windows',
            action: 'show-all-windows',
            enabled: true
          }
        ]
      }
    ])

    // 文件夹项目上下文菜单
    this.contextMenus.set('folder', [
      {
        id: 'open',
        label: 'Open',
        action: 'open',
        enabled: true
      },
      {
        id: 'expand',
        label: 'Expand',
        action: 'expand',
        enabled: true
      },
      {
        id: 'separator1',
        label: '',
        action: '',
        enabled: true,
        separator: true
      },
      {
        id: 'add-item',
        label: 'Add Item',
        action: 'add-item',
        enabled: true
      },
      {
        id: 'remove',
        label: 'Remove from Dock',
        action: 'remove',
        enabled: true
      },
      {
        id: 'separator2',
        label: '',
        action: '',
        enabled: true,
        separator: true
      },
      {
        id: 'show-in-finder',
        label: 'Show in Finder',
        action: 'show-in-finder',
        enabled: true
      }
    ])

    // 垃圾桶项目上下文菜单
    this.contextMenus.set('trash', [
      {
        id: 'open',
        label: 'Open',
        action: 'open',
        enabled: true
      },
      {
        id: 'empty',
        label: 'Empty Trash',
        action: 'empty-trash',
        enabled: true
      }
    ])
  }

  /**
   * 创建新项目
   */
  createItem(type: DockItemType, config: Partial<DockItem>): Omit<DockItem, 'id'> {
    const template = this.templates.get(type)
    if (!template) {
      throw new Error(`Unknown dock item type: ${type}`)
    }

    const defaultItem: Omit<DockItem, 'id'> = {
      type,
      name: config.name || template.name,
      icon: config.icon || template.icon,
      state: 'normal',
      position: config.position || 0,
      visible: true,
      pinned: false,
      ...template.defaultConfig,
      ...config
    }

    return defaultItem
  }

  /**
   * 验证项目配置
   */
  validateItem(item: Partial<DockItem>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查必需字段
    if (!item.type) {
      errors.push('Item type is required')
    }

    if (!item.name || item.name.trim() === '') {
      errors.push('Item name is required')
    }

    if (item.type !== 'separator' && (!item.icon || item.icon.trim() === '')) {
      errors.push('Item icon is required for non-separator items')
    }

    // 检查位置
    if (item.position !== undefined && (item.position < 0 || !Number.isInteger(item.position))) {
      errors.push('Item position must be a non-negative integer')
    }

    // 检查应用键
    if (item.type === 'app' && item.appKey && item.appKey.trim() === '') {
      errors.push('App key cannot be empty for app items')
    }

    // 检查文件夹配置
    if (item.type === 'folder' && item.folder) {
      if (!Array.isArray(item.folder.items)) {
        errors.push('Folder items must be an array')
      }

      if (item.folder.layout && !['grid', 'list'].includes(item.folder.layout)) {
        errors.push('Folder layout must be "grid" or "list"')
      }
    }

    // 检查徽章配置
    if (item.badge) {
      if (item.badge.count !== undefined && (item.badge.count < 0 || !Number.isInteger(item.badge.count))) {
        errors.push('Badge count must be a non-negative integer')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 更新项目状态
   */
  updateItemState(item: DockItem, state: DockItemState): DockItem {
    return {
      ...item,
      state
    }
  }

  /**
   * 切换项目固定状态
   */
  toggleItemPin(item: DockItem): DockItem {
    return {
      ...item,
      pinned: !item.pinned
    }
  }

  /**
   * 更新项目徽章
   */
  updateItemBadge(item: DockItem, badge?: DockItem['badge']): DockItem {
    return {
      ...item,
      badge
    }
  }

  /**
   * 添加项目到文件夹
   */
  addItemToFolder(folderItem: DockItem, newItem: DockItem): DockItem {
    if (folderItem.type !== 'folder' || !folderItem.folder) {
      throw new Error('Target item is not a folder')
    }

    const updatedFolder = {
      ...folderItem,
      folder: {
        ...folderItem.folder,
        items: [...folderItem.folder.items, newItem]
      }
    }

    return updatedFolder
  }

  /**
   * 从文件夹移除项目
   */
  removeItemFromFolder(folderItem: DockItem, itemId: string): DockItem {
    if (folderItem.type !== 'folder' || !folderItem.folder) {
      throw new Error('Target item is not a folder')
    }

    const updatedFolder = {
      ...folderItem,
      folder: {
        ...folderItem.folder,
        items: folderItem.folder.items.filter(item => item.id !== itemId)
      }
    }

    return updatedFolder
  }

  /**
   * 展开/折叠文件夹
   */
  toggleFolderExpansion(folderItem: DockItem): DockItem {
    if (folderItem.type !== 'folder' || !folderItem.folder) {
      throw new Error('Item is not a folder')
    }

    return {
      ...folderItem,
      folder: {
        ...folderItem.folder,
        expanded: !folderItem.folder.expanded
      }
    }
  }

  /**
   * 获取项目上下文菜单
   */
  getContextMenu(item: DockItem): DockContextMenuItem[] {
    // 如果项目有自定义上下文菜单，使用自定义的
    if (item.contextMenu) {
      return item.contextMenu
    }

    // 否则使用默认的
    const defaultMenu = this.contextMenus.get(item.type)
    if (!defaultMenu) {
      return []
    }

    // 根据项目状态动态调整菜单
    return this.adjustContextMenu(defaultMenu, item)
  }

  /**
   * 调整上下文菜单
   */
  private adjustContextMenu(menu: DockContextMenuItem[], item: DockItem): DockContextMenuItem[] {
    return menu.map(menuItem => {
      const adjustedItem = { ...menuItem }

      // 根据项目状态调整菜单项
      switch (menuItem.id) {
        case 'pin':
          adjustedItem.label = item.pinned ? 'Remove from Dock' : 'Keep in Dock'
          break
        case 'remove':
          adjustedItem.enabled = !item.pinned
          break
        case 'expand':
          if (item.type === 'folder' && item.folder) {
            adjustedItem.label = item.folder.expanded ? 'Collapse' : 'Expand'
          }
          break
        case 'empty':
          if (item.type === 'trash') {
            // 这里可以检查垃圾桶是否为空
            adjustedItem.enabled = true
          }
          break
      }

      // 递归处理子菜单
      if (adjustedItem.submenu) {
        adjustedItem.submenu = this.adjustContextMenu(adjustedItem.submenu, item)
      }

      return adjustedItem
    })
  }

  /**
   * 开始拖拽
   */
  startDrag(item: DockItem, position: { x: number; y: number }): void {
    this.dragState = {
      isDragging: true,
      draggedItem: item,
      dragStartPosition: position,
      dragCurrentPosition: position
    }
  }

  /**
   * 更新拖拽位置
   */
  updateDragPosition(position: { x: number; y: number }): void {
    if (this.dragState.isDragging) {
      this.dragState.dragCurrentPosition = position
    }
  }

  /**
   * 结束拖拽
   */
  endDrag(): { item?: DockItem; startPosition?: { x: number; y: number }; endPosition?: { x: number; y: number } } {
    const result = {
      item: this.dragState.draggedItem,
      startPosition: this.dragState.dragStartPosition,
      endPosition: this.dragState.dragCurrentPosition
    }

    this.dragState = {
      isDragging: false
    }

    return result
  }

  /**
   * 检查是否正在拖拽
   */
  isDragging(): boolean {
    return this.dragState.isDragging
  }

  /**
   * 获取拖拽的项目
   */
  getDraggedItem(): DockItem | undefined {
    return this.dragState.draggedItem
  }

  /**
   * 计算拖拽距离
   */
  getDragDistance(): number {
    if (!this.dragState.isDragging || !this.dragState.dragStartPosition || !this.dragState.dragCurrentPosition) {
      return 0
    }

    const dx = this.dragState.dragCurrentPosition.x - this.dragState.dragStartPosition.x
    const dy = this.dragState.dragCurrentPosition.y - this.dragState.dragStartPosition.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 过滤项目
   */
  filterItems(items: DockItem[], filter: DockItemFilter): DockItem[] {
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

      if (filter.pinned !== undefined && item.pinned !== filter.pinned) {
        return false
      }

      if (filter.hasApp !== undefined) {
        const hasApp = !!item.appKey
        if (hasApp !== filter.hasApp) {
          return false
        }
      }

      if (filter.hasBadge !== undefined) {
        const hasBadge = !!item.badge
        if (hasBadge !== filter.hasBadge) {
          return false
        }
      }

      return true
    })
  }

  /**
   * 搜索项目
   */
  searchItems(items: DockItem[], options: DockItemSearchOptions): DockItem[] {
    let filteredItems = this.filterItems(items, options)

    if (options.query) {
      const query = options.query.toLowerCase()
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.appKey && item.appKey.toLowerCase().includes(query)) ||
        (item.tooltip && item.tooltip.toLowerCase().includes(query))
      )
    }

    if (options.appKey) {
      filteredItems = filteredItems.filter(item => item.appKey === options.appKey)
    }

    return filteredItems
  }

  /**
   * 获取项目模板
   */
  getTemplate(type: DockItemType): DockItemTemplate | undefined {
    return this.templates.get(type)
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): DockItemTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 添加自定义模板
   */
  addTemplate(template: DockItemTemplate): void {
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
   * 销毁管理器
   */
  destroy(): void {
    this.contextMenus.clear()
    this.templates.clear()
    this.itemStates.clear()
    this.dragState = { isDragging: false }
  }
}

// 导出单例实例
export const dockItemManager = new DockItemManager()
