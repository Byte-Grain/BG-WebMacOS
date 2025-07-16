import type {
  Menu,
  MenuItem,
  MenuBarConfig,
  MenuBarEvent,
  MenuBarEventType,
  MenuBarStats,
  MenuBarSnapshot,
  MenuBarTheme,
  MenuBarManagerConfig,
  MenuContext,
  MenuShortcut,
  MenuAccessibilityConfig,
  MenuItemSearchOptions,
  MenuTemplate,
  MenuValidationResult,
  MenuExportOptions,
  MenuImportOptions
} from './types'

/**
 * 菜单栏管理器
 * 负责管理菜单栏的显示、菜单管理、事件处理和配置
 */
export class MenuBarManager {
  private menus: Map<string, Menu> = new Map()
  private config: MenuBarConfig
  private theme: MenuBarTheme
  private accessibilityConfig: MenuAccessibilityConfig
  private shortcuts: Map<string, MenuShortcut> = new Map()
  private eventListeners: Map<MenuBarEventType, Set<(event: MenuBarEvent) => void>> = new Map()
  private context: MenuContext
  private snapshots: Map<string, MenuBarSnapshot> = new Map()
  private templates: Map<string, MenuTemplate> = new Map()
  private isVisible = true
  private currentOpenMenu: Menu | null = null
  private menuTimeouts: Map<string, number> = new Map()

  constructor(config?: Partial<MenuBarManagerConfig>) {
    this.config = this.getDefaultConfig()
    this.theme = this.getDefaultTheme()
    this.accessibilityConfig = this.getDefaultAccessibilityConfig()
    this.context = this.getInitialContext()

    if (config) {
      this.updateConfig(config)
    }

    this.initializeDefaultMenus()
    this.setupEventListeners()
    this.setupKeyboardNavigation()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): MenuBarConfig {
    return {
      position: 'top',
      height: 28,
      backgroundColor: '#f6f6f6',
      textColor: '#000000',
      hoverColor: '#e5e5e5',
      activeColor: '#007AFF',
      borderColor: '#d1d1d1',
      borderWidth: 1,
      fontSize: 13,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '400',
      padding: {
        horizontal: 12,
        vertical: 4
      },
      spacing: 0,
      borderRadius: 0,
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.1)',
        blur: 4,
        offset: { x: 0, y: 1 }
      },
      animation: {
        enabled: true,
        duration: 200,
        easing: 'ease-out'
      },
      autoHide: false,
      showIcons: true,
      showShortcuts: true,
      maxMenuWidth: 300,
      submenuDelay: 300,
      closeDelay: 100
    }
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(): MenuBarTheme {
    return {
      id: 'default',
      name: 'Default',
      menuBar: {
        backgroundColor: '#f6f6f6',
        textColor: '#000000',
        hoverColor: '#e5e5e5',
        activeColor: '#007AFF',
        borderColor: '#d1d1d1',
        shadow: {
          color: 'rgba(0, 0, 0, 0.1)',
          blur: 4,
          offset: { x: 0, y: 1 }
        }
      },
      menu: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        hoverColor: '#007AFF',
        activeColor: '#005bb5',
        disabledColor: '#999999',
        separatorColor: '#e5e5e5',
        borderColor: '#d1d1d1',
        borderRadius: 6,
        shadow: {
          color: 'rgba(0, 0, 0, 0.2)',
          blur: 8,
          offset: { x: 0, y: 2 }
        }
      },
      menuItem: {
        padding: { horizontal: 12, vertical: 6 },
        fontSize: 13,
        fontWeight: '400',
        iconSize: 16,
        shortcutColor: '#666666',
        checkmarkColor: '#007AFF',
        submenuArrowColor: '#666666'
      }
    }
  }

  /**
   * 获取默认访问性配置
   */
  private getDefaultAccessibilityConfig(): MenuAccessibilityConfig {
    return {
      enabled: true,
      announceMenuChanges: true,
      announceItemSelection: true,
      keyboardNavigation: true,
      focusIndicator: {
        enabled: true,
        color: '#007AFF',
        width: 2,
        style: 'solid'
      },
      highContrast: false,
      reducedMotion: false
    }
  }

  /**
   * 获取初始上下文
   */
  private getInitialContext(): MenuContext {
    return {
      openMenus: [],
      mousePosition: { x: 0, y: 0 },
      keyboardNavigation: false
    }
  }

  /**
   * 初始化默认菜单
   */
  private initializeDefaultMenus(): void {
    const defaultMenus: Omit<Menu, 'id'>[] = [
      {
        title: 'File',
        items: [
          {
            id: 'new',
            type: 'item',
            label: 'New',
            shortcut: 'Cmd+N',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'file.new'
          },
          {
            id: 'open',
            type: 'item',
            label: 'Open',
            shortcut: 'Cmd+O',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'file.open'
          },
          {
            id: 'separator1',
            type: 'separator',
            label: '',
            state: 'normal',
            visible: true,
            enabled: true,
            separator: true
          },
          {
            id: 'save',
            type: 'item',
            label: 'Save',
            shortcut: 'Cmd+S',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'file.save'
          },
          {
            id: 'save-as',
            type: 'item',
            label: 'Save As...',
            shortcut: 'Cmd+Shift+S',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'file.save-as'
          }
        ],
        visible: true,
        enabled: true,
        position: 0
      },
      {
        title: 'Edit',
        items: [
          {
            id: 'undo',
            type: 'item',
            label: 'Undo',
            shortcut: 'Cmd+Z',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'edit.undo'
          },
          {
            id: 'redo',
            type: 'item',
            label: 'Redo',
            shortcut: 'Cmd+Shift+Z',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'edit.redo'
          },
          {
            id: 'separator1',
            type: 'separator',
            label: '',
            state: 'normal',
            visible: true,
            enabled: true,
            separator: true
          },
          {
            id: 'cut',
            type: 'item',
            label: 'Cut',
            shortcut: 'Cmd+X',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'edit.cut'
          },
          {
            id: 'copy',
            type: 'item',
            label: 'Copy',
            shortcut: 'Cmd+C',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'edit.copy'
          },
          {
            id: 'paste',
            type: 'item',
            label: 'Paste',
            shortcut: 'Cmd+V',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'edit.paste'
          }
        ],
        visible: true,
        enabled: true,
        position: 1
      },
      {
        title: 'View',
        items: [
          {
            id: 'zoom-in',
            type: 'item',
            label: 'Zoom In',
            shortcut: 'Cmd+Plus',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'view.zoom-in'
          },
          {
            id: 'zoom-out',
            type: 'item',
            label: 'Zoom Out',
            shortcut: 'Cmd+Minus',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'view.zoom-out'
          },
          {
            id: 'actual-size',
            type: 'item',
            label: 'Actual Size',
            shortcut: 'Cmd+0',
            state: 'normal',
            visible: true,
            enabled: true,
            action: 'view.actual-size'
          }
        ],
        visible: true,
        enabled: true,
        position: 2
      }
    ]

    defaultMenus.forEach(menu => {
      this.addMenu(menu)
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // 监听鼠标移动
      window.addEventListener('mousemove', (event) => {
        this.context.mousePosition = { x: event.clientX, y: event.clientY }
      })

      // 监听点击外部关闭菜单
      window.addEventListener('click', (event) => {
        if (this.currentOpenMenu && !this.isClickInsideMenu(event)) {
          this.closeAllMenus()
        }
      })

      // 监听ESC键关闭菜单
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.currentOpenMenu) {
          this.closeAllMenus()
        }
      })
    }
  }

  /**
   * 设置键盘导航
   */
  private setupKeyboardNavigation(): void {
    if (!this.accessibilityConfig.keyboardNavigation) return

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event) => {
        this.handleKeyboardNavigation(event)
      })
    }
  }

  /**
   * 处理键盘导航
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.currentOpenMenu) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.navigateToNextItem()
        break
      case 'ArrowUp':
        event.preventDefault()
        this.navigateToPreviousItem()
        break
      case 'ArrowRight':
        event.preventDefault()
        this.openSubmenu()
        break
      case 'ArrowLeft':
        event.preventDefault()
        this.closeSubmenu()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.activateFocusedItem()
        break
    }
  }

  /**
   * 导航到下一个项目
   */
  private navigateToNextItem(): void {
    // 实现键盘导航逻辑
  }

  /**
   * 导航到上一个项目
   */
  private navigateToPreviousItem(): void {
    // 实现键盘导航逻辑
  }

  /**
   * 打开子菜单
   */
  private openSubmenu(): void {
    // 实现子菜单打开逻辑
  }

  /**
   * 关闭子菜单
   */
  private closeSubmenu(): void {
    // 实现子菜单关闭逻辑
  }

  /**
   * 激活焦点项目
   */
  private activateFocusedItem(): void {
    if (this.context.focusedItem) {
      this.executeMenuItem(this.context.focusedItem)
    }
  }

  /**
   * 检查点击是否在菜单内
   */
  private isClickInsideMenu(event: MouseEvent): boolean {
    // 实现点击检测逻辑
    return false
  }

  /**
   * 添加菜单
   */
  addMenu(menu: Omit<Menu, 'id'>): string {
    const id = `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMenu: Menu = {
      ...menu,
      id
    }

    this.menus.set(id, newMenu)
    this.emitEvent('config-changed', { menu: newMenu })
    return id
  }

  /**
   * 移除菜单
   */
  removeMenu(id: string): boolean {
    const menu = this.menus.get(id)
    if (!menu) return false

    this.menus.delete(id)
    this.emitEvent('config-changed', { menu })
    return true
  }

  /**
   * 更新菜单
   */
  updateMenu(id: string, updates: Partial<Menu>): boolean {
    const menu = this.menus.get(id)
    if (!menu) return false

    const updatedMenu = { ...menu, ...updates }
    this.menus.set(id, updatedMenu)
    this.emitEvent('config-changed', { menu: updatedMenu })
    return true
  }

  /**
   * 获取菜单
   */
  getMenu(id: string): Menu | undefined {
    return this.menus.get(id)
  }

  /**
   * 获取所有菜单
   */
  getAllMenus(): Menu[] {
    return Array.from(this.menus.values()).sort((a, b) => a.position - b.position)
  }

  /**
   * 获取可见菜单
   */
  getVisibleMenus(): Menu[] {
    return this.getAllMenus().filter(menu => menu.visible)
  }

  /**
   * 打开菜单
   */
  openMenu(id: string): boolean {
    const menu = this.menus.get(id)
    if (!menu || !menu.enabled) return false

    // 关闭其他菜单
    if (this.currentOpenMenu && this.currentOpenMenu.id !== id) {
      this.closeMenu(this.currentOpenMenu.id)
    }

    this.currentOpenMenu = menu
    this.context.activeMenu = menu
    this.context.openMenus = [menu]
    this.emitEvent('menu-opened', { menu })
    return true
  }

  /**
   * 关闭菜单
   */
  closeMenu(id: string): boolean {
    const menu = this.menus.get(id)
    if (!menu) return false

    if (this.currentOpenMenu?.id === id) {
      this.currentOpenMenu = null
      this.context.activeMenu = undefined
      this.context.openMenus = []
      this.context.focusedItem = undefined
    }

    this.emitEvent('menu-closed', { menu })
    return true
  }

  /**
   * 关闭所有菜单
   */
  closeAllMenus(): void {
    if (this.currentOpenMenu) {
      this.closeMenu(this.currentOpenMenu.id)
    }
  }

  /**
   * 切换菜单
   */
  toggleMenu(id: string): boolean {
    if (this.currentOpenMenu?.id === id) {
      return this.closeMenu(id)
    } else {
      return this.openMenu(id)
    }
  }

  /**
   * 执行菜单项
   */
  executeMenuItem(item: MenuItem): void {
    if (!item.enabled || item.state === 'disabled') return

    // 处理复选框
    if (item.type === 'checkbox') {
      item.checked = !item.checked
      item.state = item.checked ? 'checked' : 'normal'
    }

    // 处理单选按钮
    if (item.type === 'radio' && item.radioGroup) {
      this.setRadioGroupSelection(item.radioGroup, item.id)
    }

    this.emitEvent('menu-item-clicked', { menuItem: item })

    // 如果不是子菜单，关闭菜单
    if (item.type !== 'submenu') {
      this.closeAllMenus()
    }
  }

  /**
   * 设置单选组选择
   */
  private setRadioGroupSelection(radioGroup: string, selectedId: string): void {
    this.menus.forEach(menu => {
      this.updateRadioGroupInItems(menu.items, radioGroup, selectedId)
    })
  }

  /**
   * 更新项目中的单选组
   */
  private updateRadioGroupInItems(items: MenuItem[], radioGroup: string, selectedId: string): void {
    items.forEach(item => {
      if (item.type === 'radio' && item.radioGroup === radioGroup) {
        item.checked = item.id === selectedId
        item.state = item.checked ? 'checked' : 'normal'
      }
      if (item.submenu) {
        this.updateRadioGroupInItems(item.submenu, radioGroup, selectedId)
      }
    })
  }

  /**
   * 搜索菜单项
   */
  searchMenuItems(options: MenuItemSearchOptions): MenuItem[] {
    const results: MenuItem[] = []

    this.menus.forEach(menu => {
      const items = this.searchInItems(menu.items, options)
      results.push(...items)
    })

    return results
  }

  /**
   * 在项目中搜索
   */
  private searchInItems(items: MenuItem[], options: MenuItemSearchOptions): MenuItem[] {
    const results: MenuItem[] = []

    items.forEach(item => {
      let matches = true

      if (options.query) {
        const query = options.query.toLowerCase()
        matches = matches && (
          item.label.toLowerCase().includes(query) ||
          (item.tooltip && item.tooltip.toLowerCase().includes(query))
        )
      }

      if (options.type && item.type !== options.type) {
        matches = false
      }

      if (options.state && item.state !== options.state) {
        matches = false
      }

      if (options.visible !== undefined && item.visible !== options.visible) {
        matches = false
      }

      if (options.enabled !== undefined && item.enabled !== options.enabled) {
        matches = false
      }

      if (options.hasSubmenu !== undefined) {
        const hasSubmenu = !!(item.submenu && item.submenu.length > 0)
        if (hasSubmenu !== options.hasSubmenu) {
          matches = false
        }
      }

      if (options.hasIcon !== undefined) {
        const hasIcon = !!item.icon
        if (hasIcon !== options.hasIcon) {
          matches = false
        }
      }

      if (options.hasShortcut !== undefined) {
        const hasShortcut = !!item.shortcut
        if (hasShortcut !== options.hasShortcut) {
          matches = false
        }
      }

      if (options.radioGroup && item.radioGroup !== options.radioGroup) {
        matches = false
      }

      if (options.action && item.action !== options.action) {
        matches = false
      }

      if (matches) {
        results.push(item)
      }

      // 搜索子菜单
      if (options.includeSubmenu && item.submenu) {
        const submenuResults = this.searchInItems(item.submenu, options)
        results.push(...submenuResults)
      }
    })

    return results
  }

  /**
   * 显示菜单栏
   */
  show(): void {
    if (this.isVisible) return

    this.isVisible = true
    this.emitEvent('menubar-shown', {})
  }

  /**
   * 隐藏菜单栏
   */
  hide(): void {
    if (!this.isVisible) return

    this.isVisible = false
    this.closeAllMenus()
    this.emitEvent('menubar-hidden', {})
  }

  /**
   * 切换菜单栏可见性
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
  updateConfig(config: Partial<MenuBarManagerConfig>): void {
    if (config.menuBar) {
      this.config = { ...this.config, ...config.menuBar }
    }

    if (config.theme) {
      this.theme = { ...this.theme, ...config.theme }
    }

    if (config.accessibility) {
      this.accessibilityConfig = { ...this.accessibilityConfig, ...config.accessibility }
    }

    if (config.shortcuts) {
      this.shortcuts.clear()
      config.shortcuts.forEach(shortcut => {
        this.shortcuts.set(shortcut.key, shortcut)
      })
    }

    this.emitEvent('config-changed', {})
  }

  /**
   * 获取配置
   */
  getConfig(): MenuBarConfig {
    return { ...this.config }
  }

  /**
   * 获取主题
   */
  getTheme(): MenuBarTheme {
    return { ...this.theme }
  }

  /**
   * 获取统计信息
   */
  getStats(): MenuBarStats {
    const allMenus = this.getAllMenus()
    const allItems = this.getAllItems()

    const stats: MenuBarStats = {
      totalMenus: allMenus.length,
      visibleMenus: allMenus.filter(menu => menu.visible).length,
      totalItems: allItems.length,
      visibleItems: allItems.filter(item => item.visible).length,
      enabledItems: allItems.filter(item => item.enabled).length,
      itemsByType: {
        menu: 0,
        item: 0,
        separator: 0,
        submenu: 0,
        checkbox: 0,
        radio: 0
      },
      itemsByState: {
        normal: 0,
        disabled: 0,
        checked: 0,
        highlighted: 0,
        pressed: 0
      },
      menusWithSubmenu: 0,
      averageItemsPerMenu: allMenus.length > 0 ? allItems.length / allMenus.length : 0
    }

    allItems.forEach(item => {
      stats.itemsByType[item.type]++
      stats.itemsByState[item.state]++
    })

    allMenus.forEach(menu => {
      if (this.hasSubmenuInItems(menu.items)) {
        stats.menusWithSubmenu++
      }
    })

    return stats
  }

  /**
   * 获取所有项目
   */
  private getAllItems(): MenuItem[] {
    const items: MenuItem[] = []
    this.menus.forEach(menu => {
      items.push(...this.getItemsFromMenu(menu.items))
    })
    return items
  }

  /**
   * 从菜单获取项目
   */
  private getItemsFromMenu(items: MenuItem[]): MenuItem[] {
    const result: MenuItem[] = []
    items.forEach(item => {
      result.push(item)
      if (item.submenu) {
        result.push(...this.getItemsFromMenu(item.submenu))
      }
    })
    return result
  }

  /**
   * 检查项目中是否有子菜单
   */
  private hasSubmenuInItems(items: MenuItem[]): boolean {
    return items.some(item => item.type === 'submenu' || (item.submenu && item.submenu.length > 0))
  }

  /**
   * 创建快照
   */
  createSnapshot(name: string, description?: string): string {
    const id = `snapshot-${Date.now()}`
    const snapshot: MenuBarSnapshot = {
      id,
      name,
      description,
      config: { ...this.config },
      menus: this.getAllMenus().map(menu => ({ ...menu })),
      theme: { ...this.theme },
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

    this.menus.clear()
    snapshot.menus.forEach(menu => {
      this.menus.set(menu.id, { ...menu })
    })

    this.config = { ...snapshot.config }
    this.theme = { ...snapshot.theme }
    this.emitEvent('config-changed', {})
    return true
  }

  /**
   * 验证菜单配置
   */
  validateMenu(menu: Partial<Menu>): MenuValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!menu.title || menu.title.trim() === '') {
      errors.push('Menu title is required')
    }

    if (!menu.items || !Array.isArray(menu.items)) {
      errors.push('Menu items must be an array')
    } else {
      menu.items.forEach((item, index) => {
        const itemValidation = this.validateMenuItem(item)
        if (!itemValidation.valid) {
          errors.push(`Item ${index}: ${itemValidation.errors.join(', ')}`)
        }
        warnings.push(...itemValidation.warnings.map(w => `Item ${index}: ${w}`))
      })
    }

    if (menu.position !== undefined && (menu.position < 0 || !Number.isInteger(menu.position))) {
      errors.push('Menu position must be a non-negative integer')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证菜单项
   */
  private validateMenuItem(item: Partial<MenuItem>): MenuValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!item.id || item.id.trim() === '') {
      errors.push('Item ID is required')
    }

    if (!item.type) {
      errors.push('Item type is required')
    }

    if (!item.label || item.label.trim() === '') {
      if (item.type !== 'separator') {
        errors.push('Item label is required for non-separator items')
      }
    }

    if (item.type === 'radio' && !item.radioGroup) {
      warnings.push('Radio items should have a radio group')
    }

    if (item.submenu && item.submenu.length === 0) {
      warnings.push('Empty submenu')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: MenuBarEventType, listener: (event: MenuBarEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: MenuBarEventType, listener: (event: MenuBarEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: MenuBarEventType, data: Partial<MenuBarEvent>): void {
    const event: MenuBarEvent = {
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
          console.error(`Error in menubar event listener for ${type}:`, error)
        }
      })
    }
  }

  /**
   * 检查是否可见
   */
  isVisibleMenuBar(): boolean {
    return this.isVisible
  }

  /**
   * 获取当前打开的菜单
   */
  getCurrentOpenMenu(): Menu | null {
    return this.currentOpenMenu
  }

  /**
   * 获取上下文
   */
  getContext(): MenuContext {
    return { ...this.context }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.menus.clear()
    this.eventListeners.clear()
    this.snapshots.clear()
    this.templates.clear()
    this.shortcuts.clear()
    this.menuTimeouts.forEach(timeout => clearTimeout(timeout))
    this.menuTimeouts.clear()
  }
}

// 导出单例实例
export const menuBarManager = new MenuBarManager()