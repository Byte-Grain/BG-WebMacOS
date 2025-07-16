import type { AppConfig } from '../../core/app-registry/types'

/**
 * 窗口位置
 */
export interface WindowPosition {
  x: number
  y: number
}

/**
 * 窗口尺寸
 */
export interface WindowSize {
  width: number
  height: number
}

/**
 * 窗口配置
 */
export interface WindowConfig {
  /** 窗口ID */
  id: string
  /** 关联的应用配置 */
  app: AppConfig
  /** 窗口位置 */
  position: WindowPosition
  /** 窗口尺寸 */
  size: WindowSize
  /** 最小尺寸 */
  minSize?: WindowSize
  /** 最大尺寸 */
  maxSize?: WindowSize
  /** 是否可调整大小 */
  resizable: boolean
  /** 是否可拖拽 */
  draggable: boolean
  /** 是否可关闭 */
  closable: boolean
  /** 是否可最小化 */
  minimizable: boolean
  /** 是否可最大化 */
  maximizable: boolean
  /** 窗口层级 */
  zIndex: number
  /** 是否置顶 */
  alwaysOnTop: boolean
  /** 窗口标题 */
  title: string
  /** 窗口图标 */
  icon: string
  /** 是否模态窗口 */
  modal: boolean
  /** 父窗口ID */
  parentId?: string
  /** 窗口透明度 */
  opacity: number
  /** 是否显示阴影 */
  shadow: boolean
  /** 窗口圆角 */
  borderRadius: number
  /** 自定义样式类 */
  customClass?: string
}

/**
 * 窗口状态
 */
export type WindowState = 
  | 'normal'      // 正常状态
  | 'minimized'   // 最小化
  | 'maximized'   // 最大化
  | 'fullscreen'  // 全屏
  | 'hidden'      // 隐藏
  | 'closing'     // 正在关闭
  | 'loading'     // 加载中

/**
 * 窗口事件类型
 */
export type WindowEventType =
  | 'open'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'resize'
  | 'move'
  | 'focus'
  | 'blur'
  | 'show'
  | 'hide'
  | 'fullscreen'
  | 'exitFullscreen'

/**
 * 窗口事件
 */
export interface WindowEvent {
  type: WindowEventType
  windowId: string
  timestamp: number
  data?: any
}

/**
 * 窗口管理器配置
 */
export interface WindowManagerConfig {
  /** 默认窗口位置偏移 */
  defaultOffset: WindowPosition
  /** 窗口层级起始值 */
  baseZIndex: number
  /** 最大窗口数量 */
  maxWindows: number
  /** 是否启用窗口动画 */
  animationsEnabled: boolean
  /** 动画持续时间 */
  animationDuration: number
  /** 窗口间距 */
  windowSpacing: number
  /** 是否启用窗口吸附 */
  snapEnabled: boolean
  /** 吸附距离 */
  snapDistance: number
  /** 是否启用窗口阴影 */
  shadowEnabled: boolean
  /** 默认窗口透明度 */
  defaultOpacity: number
  /** 是否启用多显示器支持 */
  multiMonitorSupport: boolean
}

/**
 * 窗口动画选项
 */
export interface WindowAnimationOptions {
  /** 动画类型 */
  type: 'fade' | 'slide' | 'scale' | 'bounce' | 'flip'
  /** 动画方向 */
  direction?: 'up' | 'down' | 'left' | 'right' | 'center'
  /** 动画持续时间 */
  duration: number
  /** 动画缓动函数 */
  easing: string
  /** 动画延迟 */
  delay?: number
  /** 是否反向播放 */
  reverse?: boolean
}

/**
 * 窗口布局选项
 */
export interface WindowLayoutOptions {
  /** 布局类型 */
  type: 'cascade' | 'tile' | 'grid' | 'stack'
  /** 布局区域 */
  area?: {
    x: number
    y: number
    width: number
    height: number
  }
  /** 窗口间距 */
  spacing?: number
  /** 是否保持宽高比 */
  maintainAspectRatio?: boolean
}

/**
 * 窗口快照
 */
export interface WindowSnapshot {
  /** 窗口ID */
  id: string
  /** 应用键 */
  appKey: string
  /** 窗口配置 */
  config: WindowConfig
  /** 窗口状态 */
  state: WindowState
  /** 快照时间 */
  timestamp: number
  /** 窗口内容预览（可选） */
  preview?: string
}

/**
 * 窗口组
 */
export interface WindowGroup {
  /** 组ID */
  id: string
  /** 组名称 */
  name: string
  /** 窗口ID列表 */
  windowIds: string[]
  /** 组配置 */
  config: {
    /** 是否同步操作 */
    syncOperations: boolean
    /** 是否保持相对位置 */
    maintainRelativePosition: boolean
    /** 组透明度 */
    opacity: number
  }
}

/**
 * 窗口过滤器
 */
export interface WindowFilter {
  /** 应用键过滤 */
  appKey?: string
  /** 状态过滤 */
  state?: WindowState
  /** 是否可见 */
  visible?: boolean
  /** 是否模态 */
  modal?: boolean
  /** 最小层级 */
  minZIndex?: number
  /** 最大层级 */
  maxZIndex?: number
}

/**
 * 窗口排序选项
 */
export interface WindowSortOptions {
  /** 排序字段 */
  field: 'zIndex' | 'title' | 'appKey' | 'createdAt' | 'lastActive'
  /** 排序方向 */
  direction: 'asc' | 'desc'
}

/**
 * 窗口统计信息
 */
export interface WindowStats {
  /** 总窗口数 */
  total: number
  /** 可见窗口数 */
  visible: number
  /** 最小化窗口数 */
  minimized: number
  /** 最大化窗口数 */
  maximized: number
  /** 模态窗口数 */
  modal: number
  /** 按应用分组的统计 */
  byApp: Record<string, number>
  /** 按状态分组的统计 */
  byState: Record<WindowState, number>
}