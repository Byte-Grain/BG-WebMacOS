/**
 * 菜单项类型
 */
export type MenuItemType = 'menu' | 'item' | 'separator' | 'submenu' | 'checkbox' | 'radio'

/**
 * 菜单项状态
 */
export type MenuItemState = 'normal' | 'disabled' | 'checked' | 'highlighted' | 'pressed'

/**
 * 菜单栏位置
 */
export type MenuBarPosition = 'top' | 'bottom'

/**
 * 菜单项
 */
export interface MenuItem {
  id: string
  type: MenuItemType
  label: string
  icon?: string
  shortcut?: string
  state: MenuItemState
  visible: boolean
  enabled: boolean
  checked?: boolean
  radioGroup?: string
  action?: string
  data?: any
  submenu?: MenuItem[]
  separator?: boolean
  tooltip?: string
  badge?: {
    text?: string
    count?: number
    color?: string
  }
  customRender?: boolean
  className?: string
  style?: Record<string, string>
}

/**
 * 菜单配置
 */
export interface Menu {
  id: string
  title: string
  icon?: string
  items: MenuItem[]
  visible: boolean
  enabled: boolean
  position: number
  width?: number
  maxHeight?: number
  autoClose?: boolean
  persistent?: boolean
  className?: string
  style?: Record<string, string>
}

/**
 * 菜单栏配置
 */
export interface MenuBarConfig {
  position: MenuBarPosition
  height: number
  backgroundColor: string
  textColor: string
  hoverColor: string
  activeColor: string
  borderColor?: string
  borderWidth?: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  padding: {
    horizontal: number
    vertical: number
  }
  spacing: number
  borderRadius: number
  shadow: {
    enabled: boolean
    color: string
    blur: number
    offset: { x: number; y: number }
  }
  animation: {
    enabled: boolean
    duration: number
    easing: string
  }
  autoHide: boolean
  showIcons: boolean
  showShortcuts: boolean
  maxMenuWidth: number
  submenuDelay: number
  closeDelay: number
}

/**
 * 菜单栏事件类型
 */
export type MenuBarEventType = 
  | 'menu-opened'
  | 'menu-closed'
  | 'menu-item-clicked'
  | 'menu-item-hovered'
  | 'menu-item-selected'
  | 'submenu-opened'
  | 'submenu-closed'
  | 'menubar-shown'
  | 'menubar-hidden'
  | 'config-changed'

/**
 * 菜单栏事件
 */
export interface MenuBarEvent {
  type: MenuBarEventType
  menu?: Menu
  menuItem?: MenuItem
  position?: { x: number; y: number }
  data?: any
  timestamp: number
}

/**
 * 菜单动画选项
 */
export interface MenuAnimationOptions {
  type: 'fade' | 'slide' | 'scale' | 'bounce'
  duration: number
  easing: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

/**
 * 菜单布局信息
 */
export interface MenuLayout {
  menu: Menu
  position: { x: number; y: number }
  size: { width: number; height: number }
  visible: boolean
  zIndex: number
}

/**
 * 菜单项过滤选项
 */
export interface MenuItemFilter {
  type?: MenuItemType
  state?: MenuItemState
  visible?: boolean
  enabled?: boolean
  hasSubmenu?: boolean
  hasIcon?: boolean
  hasShortcut?: boolean
  radioGroup?: string
}

/**
 * 菜单项搜索选项
 */
export interface MenuItemSearchOptions extends MenuItemFilter {
  query?: string
  action?: string
  includeSubmenu?: boolean
}

/**
 * 菜单栏统计信息
 */
export interface MenuBarStats {
  totalMenus: number
  visibleMenus: number
  totalItems: number
  visibleItems: number
  enabledItems: number
  itemsByType: Record<MenuItemType, number>
  itemsByState: Record<MenuItemState, number>
  menusWithSubmenu: number
  averageItemsPerMenu: number
}

/**
 * 菜单主题配置
 */
export interface MenuBarTheme {
  id: string
  name: string
  menuBar: {
    backgroundColor: string
    textColor: string
    hoverColor: string
    activeColor: string
    borderColor?: string
    shadow?: {
      color: string
      blur: number
      offset: { x: number; y: number }
    }
  }
  menu: {
    backgroundColor: string
    textColor: string
    hoverColor: string
    activeColor: string
    disabledColor: string
    separatorColor: string
    borderColor?: string
    borderRadius: number
    shadow: {
      color: string
      blur: number
      offset: { x: number; y: number }
    }
  }
  menuItem: {
    padding: { horizontal: number; vertical: number }
    fontSize: number
    fontWeight: string
    iconSize: number
    shortcutColor: string
    checkmarkColor: string
    submenuArrowColor: string
  }
}

/**
 * 菜单快照
 */
export interface MenuBarSnapshot {
  id: string
  name: string
  description?: string
  config: MenuBarConfig
  menus: Menu[]
  theme: MenuBarTheme
  timestamp: number
}

/**
 * 菜单模板
 */
export interface MenuTemplate {
  id: string
  name: string
  description: string
  menus: Omit<Menu, 'id'>[]
  preview?: string
  category?: string
  tags?: string[]
}

/**
 * 菜单项模板
 */
export interface MenuItemTemplate {
  type: MenuItemType
  label: string
  icon?: string
  shortcut?: string
  defaultConfig: Partial<MenuItem>
}

/**
 * 菜单上下文
 */
export interface MenuContext {
  activeMenu?: Menu
  activeMenuItem?: MenuItem
  openMenus: Menu[]
  mousePosition: { x: number; y: number }
  keyboardNavigation: boolean
  focusedItem?: MenuItem
}

/**
 * 菜单快捷键配置
 */
export interface MenuShortcut {
  key: string
  modifiers: string[]
  action: string
  menuId?: string
  itemId?: string
  global?: boolean
  enabled: boolean
}

/**
 * 菜单访问性配置
 */
export interface MenuAccessibilityConfig {
  enabled: boolean
  announceMenuChanges: boolean
  announceItemSelection: boolean
  keyboardNavigation: boolean
  focusIndicator: {
    enabled: boolean
    color: string
    width: number
    style: 'solid' | 'dashed' | 'dotted'
  }
  highContrast: boolean
  reducedMotion: boolean
}

/**
 * 菜单栏管理器配置
 */
export interface MenuBarManagerConfig {
  menuBar: MenuBarConfig
  theme: MenuBarTheme
  accessibility: MenuAccessibilityConfig
  shortcuts: MenuShortcut[]
  persistence: {
    enabled: boolean
    key: string
    debounceMs: number
  }
}

/**
 * 菜单渲染选项
 */
export interface MenuRenderOptions {
  container?: HTMLElement
  position?: { x: number; y: number }
  maxWidth?: number
  maxHeight?: number
  autoPosition?: boolean
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
  animation?: MenuAnimationOptions
}

/**
 * 菜单项渲染数据
 */
export interface MenuItemRenderData {
  item: MenuItem
  index: number
  level: number
  parent?: MenuItem
  isFirst: boolean
  isLast: boolean
  hasSubmenu: boolean
  isOpen: boolean
  isFocused: boolean
  isHovered: boolean
}

/**
 * 菜单验证结果
 */
export interface MenuValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 菜单导出选项
 */
export interface MenuExportOptions {
  format: 'json' | 'xml' | 'yaml'
  includeConfig: boolean
  includeTheme: boolean
  includeDisabled: boolean
  minify: boolean
}

/**
 * 菜单导入选项
 */
export interface MenuImportOptions {
  merge: boolean
  overwrite: boolean
  validateBeforeImport: boolean
  preserveIds: boolean
}
