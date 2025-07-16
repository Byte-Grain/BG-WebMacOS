import type {
  MenuItem,
  MenuItemType,
  MenuItemState,
  MenuItemFilter,
  MenuItemSearchOptions,
  MenuItemTemplate
} from './types'

/**
 * 菜单项管理器
 * 负责管理单个菜单项的状态、行为和交互
 */
export class MenuItemManager {
  private templates: Map<MenuItemType, MenuItemTemplate> = new Map()
  private itemStates: Map<string, any> = new Map()
  private radioGroups: Map<string, Set<string>> = new Map()
  private shortcuts: Map<string, string> = new Map() // shortcut -> itemId

  constructor() {
    this.initializeTemplates()
  }

  /**
   * 初始化项目模板
   */
  private initializeTemplates(): void {
    const templates: MenuItemTemplate[] = [
      {
        type: 'menu',
        label: 'Menu',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true
        }
      },
      {
        type: 'item',
        label: 'Menu Item',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true
        }
      },
      {
        type: 'separator',
        label: '',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          separator: true
        }
      },
      {
        type: 'submenu',
        label: 'Submenu',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          submenu: []
        }
      },
      {
        type: 'checkbox',
        label: 'Checkbox Item',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          checked: false
        }
      },
      {
        type: 'radio',
        label: 'Radio Item',
        defaultConfig: {
          state: 'normal',
          visible: true,
          enabled: true,
          checked: false,
          radioGroup: 'default'
        }
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.type, template)
    })
  }

  /**
   * 创建新菜单项
   */
  createMenuItem(type: MenuItemType, config: Partial<MenuItem>): Omit<MenuItem, 'id'> {
    const template = this.templates.get(type)
    if (!template) {
      throw new Error(`Unknown menu item type: ${type}`)
    }

    const defaultItem: Omit<MenuItem, 'id'> = {
      type,
      label: config.label || template.label,
      state: 'normal',
      visible: true,
      enabled: true,
      ...template.defaultConfig,
      ...config
    }

    // 注册快捷键
    if (defaultItem.shortcut) {
      this.registerShortcut(defaultItem.shortcut, config.id || '')
    }

    // 注册单选组
    if (defaultItem.type === 'radio' && defaultItem.radioGroup) {
      this.registerRadioGroup(defaultItem.radioGroup, config.id || '')
    }

    return defaultItem
  }

  /**
   * 验证菜单项配置
   */
  validateMenuItem(item: Partial<MenuItem>): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    if (!item.type) {
      errors.push('Menu item type is required')
    }

    if (!item.label && item.type !== 'separator') {
      errors.push('Menu item label is required for non-separator items')
    }

    if (item.label && item.label.trim() === '' && item.type !== 'separator') {
      errors.push('Menu item label cannot be empty for non-separator items')
    }

    // 检查快捷键格式
    if (item.shortcut) {
      if (!this.isValidShortcut(item.shortcut)) {
        errors.push(`Invalid shortcut format: ${item.shortcut}`)
      }
    }

    // 检查单选组
    if (item.type === 'radio') {
      if (!item.radioGroup || item.radioGroup.trim() === '') {
        warnings.push('Radio items should have a radio group')
      }
    }

    // 检查子菜单
    if (item.type === 'submenu') {
      if (!item.submenu || !Array.isArray(item.submenu)) {
        warnings.push('Submenu items should have a submenu array')
      } else if (item.submenu.length === 0) {
        warnings.push('Submenu is empty')
      }
    }

    // 检查复选框
    if (item.type === 'checkbox') {
      if (item.checked === undefined) {
        warnings.push('Checkbox items should have a checked property')
      }
    }

    // 检查动作
    if (item.type === 'item' && !item.action) {
      warnings.push('Menu items should have an action')
    }

    // 检查图标
    if (item.icon && !this.isValidIcon(item.icon)) {
      warnings.push(`Invalid icon format: ${item.icon}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证快捷键格式
   */
  private isValidShortcut(shortcut: string): boolean {
    // 简单的快捷键格式验证
    const shortcutPattern = /^(Ctrl|Cmd|Alt|Shift|Meta)(\+(Ctrl|Cmd|Alt|Shift|Meta))*\+[A-Za-z0-9]$/
    const functionKeyPattern = /^F[1-9]|F1[0-2]$/
    const specialKeyPattern = /^(Enter|Escape|Space|Tab|Backspace|Delete|Home|End|PageUp|PageDown|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/
    
    return shortcutPattern.test(shortcut) || functionKeyPattern.test(shortcut) || specialKeyPattern.test(shortcut)
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
   * 更新菜单项状态
   */
  updateItemState(item: MenuItem, state: MenuItemState): MenuItem {
    return {
      ...item,
      state
    }
  }

  /**
   * 切换菜单项启用状态
   */
  toggleItemEnabled(item: MenuItem): MenuItem {
    const newEnabled = !item.enabled
    return {
      ...item,
      enabled: newEnabled,
      state: newEnabled ? 'normal' : 'disabled'
    }
  }

  /**
   * 切换菜单项可见性
   */
  toggleItemVisibility(item: MenuItem): MenuItem {
    return {
      ...item,
      visible: !item.visible
    }
  }

  /**
   * 切换复选框状态
   */
  toggleCheckbox(item: MenuItem): MenuItem {
    if (item.type !== 'checkbox') {
      throw new Error('Item is not a checkbox')
    }

    const newChecked = !item.checked
    return {
      ...item,
      checked: newChecked,
      state: newChecked ? 'checked' : 'normal'
    }
  }

  /**
   * 设置单选按钮选择
   */
  setRadioSelection(items: MenuItem[], radioGroup: string, selectedId: string): MenuItem[] {
    return items.map(item => {
      if (item.type === 'radio' && item.radioGroup === radioGroup) {
        const isSelected = item.id === selectedId
        return {
          ...item,
          checked: isSelected,
          state: isSelected ? 'checked' : 'normal'
        }
      }
      return item
    })
  }

  /**
   * 添加子菜单项
   */
  addSubmenuItem(parentItem: MenuItem, newItem: MenuItem): MenuItem {
    if (parentItem.type !== 'submenu') {
      throw new Error('Parent item is not a submenu')
    }

    const updatedSubmenu = [...(parentItem.submenu || []), newItem]
    return {
      ...parentItem,
      submenu: updatedSubmenu
    }
  }

  /**
   * 从子菜单移除项目
   */
  removeSubmenuItem(parentItem: MenuItem, itemId: string): MenuItem {
    if (parentItem.type !== 'submenu' || !parentItem.submenu) {
      throw new Error('Parent item is not a submenu or has no submenu')
    }

    const updatedSubmenu = parentItem.submenu.filter(item => item.id !== itemId)
    return {
      ...parentItem,
      submenu: updatedSubmenu
    }
  }

  /**
   * 更新菜单项徽章
   */
  updateItemBadge(item: MenuItem, badge?: MenuItem['badge']): MenuItem {
    return {
      ...item,
      badge
    }
  }

  /**
   * 设置菜单项快捷键
   */
  setItemShortcut(item: MenuItem, shortcut?: string): MenuItem {
    // 移除旧快捷键
    if (item.shortcut) {
      this.unregisterShortcut(item.shortcut)
    }

    // 注册新快捷键
    if (shortcut) {
      if (!this.isValidShortcut(shortcut)) {
        throw new Error(`Invalid shortcut format: ${shortcut}`)
      }
      this.registerShortcut(shortcut, item.id)
    }

    return {
      ...item,
      shortcut
    }
  }

  /**
   * 注册快捷键
   */
  private registerShortcut(shortcut: string, itemId: string): void {
    if (this.shortcuts.has(shortcut)) {
      console.warn(`Shortcut ${shortcut} is already registered`)
    }
    this.shortcuts.set(shortcut, itemId)
  }

  /**
   * 注销快捷键
   */
  private unregisterShortcut(shortcut: string): void {
    this.shortcuts.delete(shortcut)
  }

  /**
   * 注册单选组
   */
  private registerRadioGroup(radioGroup: string, itemId: string): void {
    if (!this.radioGroups.has(radioGroup)) {
      this.radioGroups.set(radioGroup, new Set())
    }
    this.radioGroups.get(radioGroup)!.add(itemId)
  }

  /**
   * 获取快捷键对应的项目ID
   */
  getItemIdByShortcut(shortcut: string): string | undefined {
    return this.shortcuts.get(shortcut)
  }

  /**
   * 获取单选组中的所有项目ID
   */
  getRadioGroupItems(radioGroup: string): string[] {
    const items = this.radioGroups.get(radioGroup)
    return items ? Array.from(items) : []
  }

  /**
   * 过滤菜单项
   */
  filterItems(items: MenuItem[], filter: MenuItemFilter): MenuItem[] {
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

      if (filter.hasSubmenu !== undefined) {
        const hasSubmenu = !!(item.submenu && item.submenu.length > 0)
        if (hasSubmenu !== filter.hasSubmenu) {
          return false
        }
      }

      if (filter.hasIcon !== undefined) {
        const hasIcon = !!item.icon
        if (hasIcon !== filter.hasIcon) {
          return false
        }
      }

      if (filter.hasShortcut !== undefined) {
        const hasShortcut = !!item.shortcut
        if (hasShortcut !== filter.hasShortcut) {
          return false
        }
      }

      if (filter.radioGroup && item.radioGroup !== filter.radioGroup) {
        return false
      }

      return true
    })
  }

  /**
   * 搜索菜单项
   */
  searchItems(items: MenuItem[], options: MenuItemSearchOptions): MenuItem[] {
    let filteredItems = this.filterItems(items, options)

    if (options.query) {
      const query = options.query.toLowerCase()
      filteredItems = filteredItems.filter(item => 
        item.label.toLowerCase().includes(query) ||
        (item.tooltip && item.tooltip.toLowerCase().includes(query)) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(query))
      )
    }

    if (options.action) {
      filteredItems = filteredItems.filter(item => item.action === options.action)
    }

    // 递归搜索子菜单
    if (options.includeSubmenu) {
      const submenuResults: MenuItem[] = []
      filteredItems.forEach(item => {
        if (item.submenu) {
          const submenuItems = this.searchItems(item.submenu, options)
          submenuResults.push(...submenuItems)
        }
      })
      filteredItems.push(...submenuResults)
    }

    return filteredItems
  }

  /**
   * 排序菜单项
   */
  sortItems(items: MenuItem[], sortBy: 'label' | 'type' | 'state' | 'position' = 'label', ascending = true): MenuItem[] {
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
          // 假设有position属性
          const aPos = (a as any).position || 0
          const bPos = (b as any).position || 0
          comparison = aPos - bPos
          break
      }

      return ascending ? comparison : -comparison
    })

    return sorted
  }

  /**
   * 克隆菜单项
   */
  cloneItem(item: MenuItem, newId?: string): MenuItem {
    const cloned = JSON.parse(JSON.stringify(item))
    if (newId) {
      cloned.id = newId
    }
    return cloned
  }

  /**
   * 合并菜单项
   */
  mergeItems(target: MenuItem, source: Partial<MenuItem>): MenuItem {
    return {
      ...target,
      ...source,
      id: target.id // 保持原ID
    }
  }

  /**
   * 获取菜单项模板
   */
  getTemplate(type: MenuItemType): MenuItemTemplate | undefined {
    return this.templates.get(type)
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): MenuItemTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 添加自定义模板
   */
  addTemplate(template: MenuItemTemplate): void {
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
   * 获取所有已注册的快捷键
   */
  getAllShortcuts(): Map<string, string> {
    return new Map(this.shortcuts)
  }

  /**
   * 获取所有单选组
   */
  getAllRadioGroups(): Map<string, string[]> {
    const result = new Map<string, string[]>()
    this.radioGroups.forEach((items, group) => {
      result.set(group, Array.from(items))
    })
    return result
  }

  /**
   * 检查快捷键是否已被使用
   */
  isShortcutUsed(shortcut: string): boolean {
    return this.shortcuts.has(shortcut)
  }

  /**
   * 生成唯一的菜单项ID
   */
  generateItemId(prefix = 'item'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.templates.clear()
    this.itemStates.clear()
    this.radioGroups.clear()
    this.shortcuts.clear()
  }
}

// 导出单例实例
export const menuItemManager = new MenuItemManager()
