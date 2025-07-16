/**
 * 桌面图标位置
 */
export interface IconPosition {
  x: number
  y: number
  gridX?: number
  gridY?: number
}

/**
 * 桌面图标配置
 */
export interface DesktopIcon {
  id: string
  appKey: string
  name: string
  icon: string
  position: IconPosition
  size: 'small' | 'medium' | 'large'
  visible: boolean
  locked: boolean
  category?: string
  customIcon?: string
  badge?: {
    count?: number
    text?: string
    color?: string
  }
}

/**
 * 壁纸配置
 */
export interface WallpaperConfig {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'dynamic' | 'solid'
  fit: 'cover' | 'contain' | 'fill' | 'stretch' | 'center'
  position: 'center' | 'top' | 'bottom' | 'left' | 'right'
  opacity?: number
  blur?: number
  brightness?: number
  contrast?: number
  saturation?: number
  hue?: number
  animation?: {
    enabled: boolean
    type: 'parallax' | 'zoom' | 'slide' | 'fade'
    duration: number
    direction?: 'horizontal' | 'vertical'
  }
  schedule?: {
    enabled: boolean
    interval: number // 分钟
    shuffle: boolean
    playlist: string[]
  }
}

/**
 * 桌面网格配置
 */
export interface DesktopGrid {
  enabled: boolean
  size: number
  snap: boolean
  visible: boolean
  color: string
  opacity: number
}

/**
 * 桌面布局配置
 */
export interface DesktopLayout {
  id: string
  name: string
  icons: DesktopIcon[]
  wallpaper: WallpaperConfig
  grid: DesktopGrid
  widgets: DesktopWidget[]
  createdAt: number
  updatedAt: number
}

/**
 * 桌面小部件
 */
export interface DesktopWidget {
  id: string
  type: string
  name: string
  position: IconPosition
  size: {
    width: number
    height: number
  }
  config: Record<string, any>
  visible: boolean
  locked: boolean
  zIndex: number
}

/**
 * 桌面管理器配置
 */
export interface DesktopManagerConfig {
  grid: DesktopGrid
  iconSize: {
    small: number
    medium: number
    large: number
  }
  iconSpacing: number
  autoArrange: boolean
  snapToGrid: boolean
  showHiddenIcons: boolean
  doubleClickToOpen: boolean
  rightClickMenu: boolean
  dragAndDrop: boolean
  multiSelect: boolean
  contextMenu: {
    enabled: boolean
    items: string[]
  }
  wallpaper: {
    changeInterval: number
    enableTransition: boolean
    transitionDuration: number
    preloadNext: boolean
  }
}

/**
 * 图标排列选项
 */
export interface IconArrangeOptions {
  type: 'grid' | 'list' | 'circle' | 'custom'
  direction: 'horizontal' | 'vertical'
  alignment: 'left' | 'center' | 'right' | 'top' | 'bottom'
  spacing: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
  groupBy?: 'category' | 'name' | 'type' | 'size'
  sortBy?: 'name' | 'date' | 'size' | 'type' | 'custom'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 桌面事件类型
 */
export type DesktopEventType = 
  | 'icon-added'
  | 'icon-removed'
  | 'icon-moved'
  | 'icon-selected'
  | 'icon-deselected'
  | 'wallpaper-changed'
  | 'layout-changed'
  | 'widget-added'
  | 'widget-removed'
  | 'widget-moved'
  | 'grid-changed'
  | 'context-menu'
  | 'double-click'
  | 'right-click'

/**
 * 桌面事件
 */
export interface DesktopEvent {
  type: DesktopEventType
  target?: {
    type: 'icon' | 'widget' | 'desktop'
    id: string
  }
  position?: IconPosition
  data?: any
  timestamp: number
}

/**
 * 图标搜索选项
 */
export interface IconSearchOptions {
  query?: string
  category?: string
  visible?: boolean
  locked?: boolean
  size?: 'small' | 'medium' | 'large'
  hasCustomIcon?: boolean
  hasBadge?: boolean
}

/**
 * 图标过滤器
 */
export interface IconFilter {
  (icon: DesktopIcon): boolean
}

/**
 * 图标排序器
 */
export interface IconSorter {
  (a: DesktopIcon, b: DesktopIcon): number
}

/**
 * 桌面统计信息
 */
export interface DesktopStats {
  totalIcons: number
  visibleIcons: number
  hiddenIcons: number
  lockedIcons: number
  iconsByCategory: Record<string, number>
  iconsBySize: Record<string, number>
  totalWidgets: number
  visibleWidgets: number
  wallpaperChanges: number
  layoutChanges: number
}

/**
 * 壁纸过滤选项
 */
export interface WallpaperFilterOptions {
  type?: 'image' | 'video' | 'dynamic' | 'solid'
  name?: string
  tags?: string[]
  resolution?: string
  aspectRatio?: string
}

/**
 * 壁纸元数据
 */
export interface WallpaperMetadata {
  width: number
  height: number
  size: number
  format: string
  colorPalette?: string[]
  dominantColor?: string
  tags?: string[]
  author?: string
  license?: string
  source?: string
}

/**
 * 扩展壁纸配置
 */
export interface ExtendedWallpaperConfig extends WallpaperConfig {
  metadata?: WallpaperMetadata
  thumbnail?: string
  preview?: string
  favorite?: boolean
  downloadProgress?: number
  lastUsed?: number
  usageCount?: number
}

/**
 * 小部件配置
 */
export interface WidgetConfig {
  id: string
  name: string
  description: string
  icon: string
  component: string
  defaultSize: {
    width: number
    height: number
  }
  minSize: {
    width: number
    height: number
  }
  maxSize: {
    width: number
    height: number
  }
  resizable: boolean
  configurable: boolean
  defaultConfig: Record<string, any>
  permissions: string[]
  category: string
}

/**
 * 桌面快照
 */
export interface DesktopSnapshot {
  id: string
  name: string
  description?: string
  layout: DesktopLayout
  timestamp: number
  thumbnail?: string
}