/**
 * 系统托盘项目类型
 */
export type TrayItemType = 'app' | 'system' | 'notification' | 'widget' | 'separator'

/**
 * 系统托盘项目状态
 */
export type TrayItemState = 'normal' | 'active' | 'disabled' | 'hidden' | 'highlighted' | 'loading'

/**
 * 系统托盘位置
 */
export type TrayPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * 系统托盘大小
 */
export type TraySize = 'small' | 'medium' | 'large'

/**
 * 系统托盘项目
 */
export interface TrayItem {
  id: string
  type: TrayItemType
  label: string
  icon?: string
  tooltip?: string
  state: TrayItemState
  visible: boolean
  enabled: boolean
  position?: number
  badge?: {
    text: string
    color?: string
    backgroundColor?: string
  }
  contextMenu?: TrayContextMenuItem[]
  onClick?: () => void
  onDoubleClick?: () => void
  onRightClick?: () => void
  onMiddleClick?: () => void
  metadata?: Record<string, any>
}

/**
 * 系统托盘上下文菜单项
 */
export interface TrayContextMenuItem {
  id: string
  label: string
  icon?: string
  enabled?: boolean
  visible?: boolean
  separator?: boolean
  submenu?: TrayContextMenuItem[]
  shortcut?: string
  action?: () => void
}

/**
 * 系统托盘配置
 */
export interface TrayConfig {
  position: TrayPosition
  size: TraySize
  autoHide: boolean
  autoHideDelay: number
  maxItems: number
  itemSpacing: number
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  background: {
    color: string
    opacity: number
    blur: number
  }
  border: {
    width: number
    color: string
    radius: number
  }
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
  accessibility: {
    enabled: boolean
    announceChanges: boolean
    keyboardNavigation: boolean
  }
}

/**
 * 系统托盘事件类型
 */
export type TrayEventType = 
  | 'item-added'
  | 'item-removed'
  | 'item-updated'
  | 'item-clicked'
  | 'item-double-clicked'
  | 'item-right-clicked'
  | 'item-middle-clicked'
  | 'item-hover'
  | 'item-leave'
  | 'tray-shown'
  | 'tray-hidden'
  | 'tray-moved'
  | 'tray-resized'
  | 'config-updated'

/**
 * 系统托盘事件
 */
export interface TrayEvent {
  type: TrayEventType
  timestamp: number
  data?: any
  item?: TrayItem
}

/**
 * 系统托盘动画选项
 */
export interface TrayAnimationOptions {
  duration: number
  easing: string
  delay?: number
  direction?: 'in' | 'out'
  scale?: number
  opacity?: number
  transform?: string
}

/**
 * 系统托盘布局
 */
export interface TrayLayout {
  items: TrayItem[]
  totalWidth: number
  totalHeight: number
  itemPositions: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
  }>
}

/**
 * 系统托盘项目过滤器
 */
export interface TrayItemFilter {
  type?: TrayItemType
  state?: TrayItemState
  visible?: boolean
  enabled?: boolean
  hasBadge?: boolean
  hasContextMenu?: boolean
}

/**
 * 系统托盘项目搜索选项
 */
export interface TrayItemSearchOptions extends TrayItemFilter {
  query?: string
  includeTooltip?: boolean
  includeMetadata?: boolean
}

/**
 * 系统托盘统计信息
 */
export interface TrayStats {
  totalItems: number
  visibleItems: number
  enabledItems: number
  itemsByType: Record<TrayItemType, number>
  itemsByState: Record<TrayItemState, number>
  averageItemSize: { width: number; height: number }
  totalSize: { width: number; height: number }
}

/**
 * 系统托盘主题
 */
export interface TrayTheme {
  name: string
  colors: {
    background: string
    foreground: string
    border: string
    shadow: string
    accent: string
    hover: string
    active: string
    disabled: string
  }
  fonts: {
    family: string
    size: number
    weight: string
  }
  spacing: {
    item: number
    padding: number
    margin: number
  }
  effects: {
    blur: number
    opacity: number
    borderRadius: number
  }
}

/**
 * 系统托盘快照
 */
export interface TraySnapshot {
  id: string
  name: string
  timestamp: number
  items: TrayItem[]
  config: TrayConfig
  layout: TrayLayout
  metadata?: Record<string, any>
}

/**
 * 系统托盘项目组
 */
export interface TrayItemGroup {
  id: string
  name: string
  items: string[] // item IDs
  collapsed: boolean
  icon?: string
  color?: string
}

/**
 * 系统托盘预设
 */
export interface TrayPreset {
  id: string
  name: string
  description?: string
  config: Partial<TrayConfig>
  items: Omit<TrayItem, 'id'>[]
  theme?: Partial<TrayTheme>
}

/**
 * 系统托盘项目模板
 */
export interface TrayItemTemplate {
  type: TrayItemType
  label: string
  icon?: string
  defaultConfig: Partial<TrayItem>
}

/**
 * 系统托盘手势配置
 */
export interface TrayGestureConfig {
  enabled: boolean
  swipeToHide: boolean
  pinchToResize: boolean
  doubleClickToToggle: boolean
  rightClickForMenu: boolean
  middleClickForAction: boolean
  scrollToNavigate: boolean
  hoverToShow: boolean
  hoverDelay: number
}

/**
 * 系统托盘管理器配置
 */
export interface TrayManagerConfig {
  tray: TrayConfig
  theme: TrayTheme
  gestures: TrayGestureConfig
  accessibility: {
    enabled: boolean
    announceChanges: boolean
    keyboardNavigation: boolean
    screenReaderSupport: boolean
  }
  performance: {
    enableVirtualization: boolean
    maxRenderItems: number
    updateThrottle: number
    animationOptimization: boolean
  }
  persistence: {
    enabled: boolean
    storageKey: string
    autoSave: boolean
    saveInterval: number
  }
}

/**
 * 系统托盘渲染选项
 */
export interface TrayRenderOptions {
  container: HTMLElement
  theme: TrayTheme
  layout: TrayLayout
  animations: boolean
  accessibility: boolean
}

/**
 * 系统托盘项目渲染数据
 */
export interface TrayItemRenderData {
  item: TrayItem
  position: { x: number; y: number }
  size: { width: number; height: number }
  state: TrayItemState
  animations: TrayAnimationOptions[]
}

/**
 * 系统托盘验证结果
 */
export interface TrayValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 系统托盘导出选项
 */
export interface TrayExportOptions {
  includeConfig: boolean
  includeItems: boolean
  includeTheme: boolean
  includeSnapshots: boolean
  format: 'json' | 'xml' | 'yaml'
  compression: boolean
}

/**
 * 系统托盘导入选项
 */
export interface TrayImportOptions {
  mergeConfig: boolean
  mergeItems: boolean
  mergeTheme: boolean
  overwriteExisting: boolean
  validateBeforeImport: boolean
}
