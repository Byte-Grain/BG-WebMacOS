/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system' | 'app'

/**
 * 通知优先级
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * 通知状态
 */
export type NotificationState = 'pending' | 'shown' | 'dismissed' | 'expired' | 'clicked'

/**
 * 通知位置
 */
export type NotificationPosition = 
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'center'

/**
 * 通知动作
 */
export interface NotificationAction {
  id: string
  label: string
  icon?: string
  primary?: boolean
  destructive?: boolean
  action: () => void | Promise<void>
}

/**
 * 通知附件
 */
export interface NotificationAttachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'file'
  url: string
  name?: string
  size?: number
  thumbnail?: string
}

/**
 * 通知
 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  icon?: string
  image?: string
  priority: NotificationPriority
  state: NotificationState
  persistent: boolean
  silent: boolean
  timestamp: number
  expiresAt?: number
  actions?: NotificationAction[]
  attachments?: NotificationAttachment[]
  data?: Record<string, any>
  source?: {
    app?: string
    url?: string
    process?: string
  }
  progress?: {
    value: number
    max: number
    indeterminate?: boolean
  }
  onClick?: () => void
  onDismiss?: () => void
  onExpire?: () => void
  metadata?: Record<string, any>
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  position: NotificationPosition
  maxNotifications: number
  defaultDuration: number
  stackSpacing: number
  animationDuration: number
  showProgress: boolean
  allowDuplicates: boolean
  groupSimilar: boolean
  pauseOnHover: boolean
  closeOnClick: boolean
  enableSound: boolean
  soundVolume: number
  enableVibration: boolean
  theme: {
    borderRadius: number
    shadow: string
    backdrop: string
    maxWidth: number
    minHeight: number
  }
  accessibility: {
    enabled: boolean
    announceNew: boolean
    announceActions: boolean
    keyboardNavigation: boolean
  }
}

/**
 * 通知事件类型
 */
export type NotificationEventType = 
  | 'notification-added'
  | 'notification-shown'
  | 'notification-dismissed'
  | 'notification-clicked'
  | 'notification-expired'
  | 'notification-action-clicked'
  | 'notifications-cleared'
  | 'config-updated'

/**
 * 通知事件
 */
export interface NotificationEvent {
  type: NotificationEventType
  timestamp: number
  notification?: Notification
  action?: NotificationAction
  data?: any
}

/**
 * 通知动画选项
 */
export interface NotificationAnimationOptions {
  duration: number
  easing: string
  delay?: number
  direction?: 'in' | 'out'
  scale?: number
  opacity?: number
  transform?: string
}

/**
 * 通知过滤器
 */
export interface NotificationFilter {
  type?: NotificationType
  priority?: NotificationPriority
  state?: NotificationState
  persistent?: boolean
  silent?: boolean
  hasActions?: boolean
  hasAttachments?: boolean
  source?: string
  dateRange?: {
    start: number
    end: number
  }
}

/**
 * 通知搜索选项
 */
export interface NotificationSearchOptions extends NotificationFilter {
  query?: string
  includeMessage?: boolean
  includeData?: boolean
  includeMetadata?: boolean
  sortBy?: 'timestamp' | 'priority' | 'type' | 'title'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * 通知统计信息
 */
export interface NotificationStats {
  total: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
  byState: Record<NotificationState, number>
  pending: number
  shown: number
  dismissed: number
  expired: number
  clicked: number
  averageDisplayTime: number
  clickThroughRate: number
}

/**
 * 通知组
 */
export interface NotificationGroup {
  id: string
  title: string
  notifications: string[] // notification IDs
  collapsed: boolean
  icon?: string
  color?: string
  priority: NotificationPriority
  timestamp: number
}

/**
 * 通知模板
 */
export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  title: string
  message: string
  icon?: string
  priority: NotificationPriority
  persistent: boolean
  actions?: Omit<NotificationAction, 'action'>[]
  defaultData?: Record<string, any>
}

/**
 * 通知规则
 */
export interface NotificationRule {
  id: string
  name: string
  enabled: boolean
  conditions: {
    type?: NotificationType[]
    source?: string[]
    keywords?: string[]
    timeRange?: {
      start: string // HH:mm format
      end: string // HH:mm format
    }
    priority?: NotificationPriority[]
  }
  actions: {
    block?: boolean
    silent?: boolean
    priority?: NotificationPriority
    duration?: number
    redirect?: string
    autoAction?: string // action ID to auto-execute
  }
}

/**
 * 通知权限
 */
export interface NotificationPermission {
  source: string
  granted: boolean
  timestamp: number
  settings: {
    allowSound: boolean
    allowVibration: boolean
    allowPersistent: boolean
    maxPriority: NotificationPriority
    rateLimit: number // notifications per minute
  }
}

/**
 * 通知历史记录
 */
export interface NotificationHistory {
  id: string
  notifications: Notification[]
  timestamp: number
  metadata?: Record<string, any>
}

/**
 * 通知中心配置
 */
export interface NotificationCenterConfig {
  enabled: boolean
  position: NotificationPosition
  maxHistory: number
  groupByApp: boolean
  groupByDate: boolean
  autoCleanup: boolean
  cleanupInterval: number // hours
  showUnreadCount: boolean
  enableSearch: boolean
  enableFilters: boolean
  theme: {
    width: number
    maxHeight: number
    borderRadius: number
    shadow: string
    backdrop: string
  }
}

/**
 * 通知管理器配置
 */
export interface NotificationManagerConfig {
  notification: NotificationConfig
  center: NotificationCenterConfig
  permissions: {
    requirePermission: boolean
    defaultGranted: boolean
    showPermissionPrompt: boolean
  }
  storage: {
    enabled: boolean
    maxSize: number // MB
    compression: boolean
    encryption: boolean
  }
  performance: {
    enableVirtualization: boolean
    maxRenderNotifications: number
    updateThrottle: number
    animationOptimization: boolean
  }
}

/**
 * 通知渲染选项
 */
export interface NotificationRenderOptions {
  container: HTMLElement
  position: NotificationPosition
  animations: boolean
  accessibility: boolean
  theme: NotificationConfig['theme']
}

/**
 * 通知渲染数据
 */
export interface NotificationRenderData {
  notification: Notification
  position: { x: number; y: number }
  size: { width: number; height: number }
  state: NotificationState
  animations: NotificationAnimationOptions[]
  progress?: number
}

/**
 * 通知验证结果
 */
export interface NotificationValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 通知导出选项
 */
export interface NotificationExportOptions {
  includeHistory: boolean
  includeConfig: boolean
  includeRules: boolean
  includePermissions: boolean
  dateRange?: {
    start: number
    end: number
  }
  format: 'json' | 'csv' | 'xml'
  compression: boolean
}

/**
 * 通知导入选项
 */
export interface NotificationImportOptions {
  mergeHistory: boolean
  mergeConfig: boolean
  mergeRules: boolean
  mergePermissions: boolean
  overwriteExisting: boolean
  validateBeforeImport: boolean
}

/**
 * 通知快照
 */
export interface NotificationSnapshot {
  id: string
  name: string
  timestamp: number
  notifications: Notification[]
  config: NotificationConfig
  rules: NotificationRule[]
  permissions: NotificationPermission[]
  metadata?: Record<string, any>
}

/**
 * 通知队列项
 */
export interface NotificationQueueItem {
  notification: Notification
  priority: number
  timestamp: number
  retryCount: number
  maxRetries: number
}

/**
 * 通知批处理选项
 */
export interface NotificationBatchOptions {
  maxBatchSize: number
  batchDelay: number
  groupBy?: 'type' | 'source' | 'priority'
  mergeStrategy?: 'replace' | 'append' | 'merge'
}
