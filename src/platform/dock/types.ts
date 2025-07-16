/**
 * Dock项目类型
 */
export type DockItemType = 'app' | 'folder' | 'separator' | 'trash' | 'widget'

/**
 * Dock项目状态
 */
export type DockItemState = 'normal' | 'running' | 'attention' | 'hidden'

/**
 * Dock位置
 */
export type DockPosition = 'bottom' | 'left' | 'right' | 'top'

/**
 * Dock大小
 */
export type DockSize = 'small' | 'medium' | 'large'

/**
 * Dock项目配置
 */
export interface DockItem {
  id: string
  type: DockItemType
  appKey?: string
  name: string
  icon: string
  state: DockItemState
  position: number
  visible: boolean
  pinned: boolean
  badge?: {
    count?: number
    text?: string
    color?: string
    pulse?: boolean
  }
  tooltip?: string
  contextMenu?: DockContextMenuItem[]
  animation?: {
    bounce?: boolean
    glow?: boolean
    scale?: number
  }
  folder?: {
    items: DockItem[]
    expanded: boolean
    layout: 'grid' | 'list'
  }
}

/**
 * Dock上下文菜单项
 */
export interface DockContextMenuItem {
  id: string
  label: string
  icon?: string
  action: string
  enabled: boolean
  separator?: boolean
  submenu?: DockContextMenuItem[]
}

/**
 * Dock配置
 */
export interface DockConfig {
  position: DockPosition
  size: DockSize
  autoHide: boolean
  magnification: boolean
  magnificationSize: number
  minimizeEffect: 'genie' | 'scale' | 'none'
  showIndicators: boolean
  showLabels: boolean
  animationDuration: number
  backgroundColor: string
  backgroundOpacity: number
  borderRadius: number
  padding: {
    horizontal: number
    vertical: number
  }
  spacing: number
  maxItems: number
  persistentApps: string[]
  recentApps: {
    enabled: boolean
    maxCount: number
  }
  folders: {
    enabled: boolean
    maxItems: number
    autoCollapse: boolean
  }
}

/**
 * Dock动画选项
 */
export interface DockAnimationOptions {
  type: 'bounce' | 'scale' | 'glow' | 'slide' | 'fade'
  duration: number
  easing: string
  delay?: number
  repeat?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

/**
 * Dock事件类型
 */
export type DockEventType = 
  | 'item-added'
  | 'item-removed'
  | 'item-moved'
  | 'item-clicked'
  | 'item-right-clicked'
  | 'item-hover'
  | 'item-leave'
  | 'item-drag-start'
  | 'item-drag-end'
  | 'dock-show'
  | 'dock-hide'
  | 'dock-position-changed'
  | 'dock-config-changed'
  | 'folder-expanded'
  | 'folder-collapsed'

/**
 * Dock事件
 */
export interface DockEvent {
  type: DockEventType
  item?: DockItem
  position?: { x: number; y: number }
  data?: any
  timestamp: number
}

/**
 * Dock拖拽数据
 */
export interface DockDragData {
  item: DockItem
  sourceIndex: number
  targetIndex?: number
  external?: boolean
  data?: any
}

/**
 * Dock布局信息
 */
export interface DockLayout {
  position: DockPosition
  size: {
    width: number
    height: number
  }
  itemSize: number
  spacing: number
  padding: {
    horizontal: number
    vertical: number
  }
  maxItems: number
  visibleItems: number
}

/**
 * Dock项目过滤选项
 */
export interface DockItemFilter {
  type?: DockItemType
  state?: DockItemState
  visible?: boolean
  pinned?: boolean
  hasApp?: boolean
  hasBadge?: boolean
}

/**
 * Dock项目搜索选项
 */
export interface DockItemSearchOptions extends DockItemFilter {
  query?: string
  appKey?: string
}

/**
 * Dock统计信息
 */
export interface DockStats {
  totalItems: number
  visibleItems: number
  pinnedItems: number
  runningApps: number
  folders: number
  itemsByType: Record<DockItemType, number>
  itemsByState: Record<DockItemState, number>
}

/**
 * Dock主题配置
 */
export interface DockTheme {
  id: string
  name: string
  backgroundColor: string
  backgroundOpacity: number
  borderColor?: string
  borderWidth?: number
  borderRadius: number
  itemBackground?: string
  itemHoverBackground?: string
  itemActiveBackground?: string
  indicatorColor: string
  labelColor: string
  labelBackground?: string
  shadowColor?: string
  shadowBlur?: number
  shadowOffset?: { x: number; y: number }
}

/**
 * Dock手势配置
 */
export interface DockGestureConfig {
  enabled: boolean
  swipeToShow: boolean
  swipeToHide: boolean
  pinchToResize: boolean
  longPressForMenu: boolean
  doubleClickAction: 'none' | 'minimize' | 'maximize' | 'close'
  sensitivity: number
}

/**
 * Dock快照
 */
export interface DockSnapshot {
  id: string
  name: string
  description?: string
  config: DockConfig
  items: DockItem[]
  timestamp: number
}

/**
 * Dock项目组
 */
export interface DockItemGroup {
  id: string
  name: string
  items: string[] // DockItem IDs
  collapsed: boolean
  icon?: string
  color?: string
}

/**
 * Dock预设配置
 */
export interface DockPreset {
  id: string
  name: string
  description: string
  config: DockConfig
  items: Omit<DockItem, 'id'>[]
  preview?: string
}

/**
 * Dock项目模板
 */
export interface DockItemTemplate {
  type: DockItemType
  name: string
  icon: string
  defaultConfig: Partial<DockItem>
}

/**
 * Dock管理器配置
 */
export interface DockManagerConfig {
  dock: DockConfig
  theme: DockTheme
  gestures: DockGestureConfig
  animations: {
    enabled: boolean
    duration: number
    easing: string
  }
  persistence: {
    enabled: boolean
    key: string
    debounceMs: number
  }
}