import { ref, reactive, computed } from 'vue'
import { useEventBus, EVENTS } from '../../../core/event-system/useEventBus'
import { useUtils } from '../utils/useUtils'
import { 
  notificationManager, 
  notificationCenter,
  type NotificationType,
  type NotificationPosition,
  type NotificationConfig as PlatformNotificationConfig,
  type Notification as PlatformNotification,
  type NotificationAction as PlatformNotificationAction
} from '@/platform/notifications'

// 为了保持向后兼容，重新导出类型
export type { NotificationType, NotificationPosition }

// 兼容性类型映射
export interface NotificationConfig {
  id?: string
  title?: string
  message: string
  type?: NotificationType
  duration?: number
  position?: NotificationPosition
  showClose?: boolean
  persistent?: boolean
  icon?: string
  avatar?: string
  actions?: NotificationAction[]
  onClick?: () => void
  onClose?: () => void
  customClass?: string
  html?: boolean
  data?: any
}

export interface NotificationAction {
  text: string
  action: () => void
  type?: 'primary' | 'secondary' | 'danger'
}

export interface NotificationInstance extends Required<Omit<NotificationConfig, 'actions' | 'onClick' | 'onClose'>> {
  id: string
  createdAt: number
  actions?: NotificationAction[]
  onClick?: () => void
  onClose?: () => void
  timer?: NodeJS.Timeout
}

// 默认配置
const DEFAULT_CONFIG: Partial<NotificationConfig> = {
  type: 'info',
  duration: 4000,
  position: 'top-right',
  showClose: true,
  persistent: false,
  html: false,
}

// 通知管理组合式函数
export function useNotification() {
  const { emit } = useEventBus()
  const { generateId } = useUtils()
  
  // 通知列表 - 现在从平台模块获取
  const notifications = computed(() => {
    return notificationManager.getAll().map(platformNotification => {
      return convertPlatformToLegacy(platformNotification)
    })
  })
  
  // 全局配置
  const globalConfig = reactive<Partial<NotificationConfig>>({ ...DEFAULT_CONFIG })
  
  // 转换平台通知到旧版格式
  const convertPlatformToLegacy = (platformNotification: PlatformNotification): NotificationInstance => {
    return {
      id: platformNotification.id,
      title: platformNotification.title || '',
      message: platformNotification.message,
      type: platformNotification.type,
      duration: platformNotification.duration || 4000,
      position: platformNotification.position || 'top-right',
      showClose: platformNotification.showClose ?? true,
      persistent: platformNotification.persistent ?? false,
      icon: platformNotification.icon || '',
      avatar: platformNotification.avatar || '',
      customClass: platformNotification.customClass || '',
      html: platformNotification.html ?? false,
      data: platformNotification.data,
      createdAt: platformNotification.createdAt,
      actions: platformNotification.actions?.map(action => ({
        text: action.text,
        action: action.handler,
        type: action.type as 'primary' | 'secondary' | 'danger'
      })),
      onClick: platformNotification.onClick,
      onClose: platformNotification.onClose
    }
  }
  
  // 转换旧版配置到平台格式
  const convertLegacyToPlatform = (config: NotificationConfig): PlatformNotificationConfig => {
    return {
      id: config.id,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      duration: config.duration,
      position: config.position,
      showClose: config.showClose,
      persistent: config.persistent,
      icon: config.icon,
      avatar: config.avatar,
      customClass: config.customClass,
      html: config.html,
      data: config.data,
      actions: config.actions?.map(action => ({
        text: action.text,
        handler: action.action,
        type: action.type || 'secondary'
      })),
      onClick: config.onClick,
      onClose: config.onClose
    }
  }
  
  // 按位置分组的通知
  const notificationsByPosition = computed(() => {
    const grouped: Record<NotificationPosition, NotificationInstance[]> = {
      'top-right': [],
      'top-left': [],
      'top-center': [],
      'bottom-right': [],
      'bottom-left': [],
      'bottom-center': [],
      'center': [],
    }
    
    notifications.value.forEach(notification => {
      grouped[notification.position].push(notification)
    })
    
    return grouped
  })
  
  // 未读通知数量
  const unreadCount = computed(() => {
    return notifications.value.length
  })

  // 创建通知实例
  const createNotification = (config: NotificationConfig): NotificationInstance => {
    const mergedConfig = { ...globalConfig, ...config }
    
    const notification: NotificationInstance = {
      id: config.id || generateId('notification'),
      title: mergedConfig.title || '',
      message: mergedConfig.message!,
      type: mergedConfig.type!,
      duration: mergedConfig.duration!,
      position: mergedConfig.position!,
      showClose: mergedConfig.showClose!,
      persistent: mergedConfig.persistent!,
      icon: mergedConfig.icon || '',
      avatar: mergedConfig.avatar || '',
      customClass: mergedConfig.customClass || '',
      html: mergedConfig.html!,
      createdAt: Date.now(),
      actions: config.actions,
      onClick: config.onClick,
      onClose: config.onClose,
    }
    
    return notification
  }

  // 显示通知
  const show = (config: NotificationConfig): string => {
    const mergedConfig = { ...globalConfig, ...config }
    const platformConfig = convertLegacyToPlatform(mergedConfig)
    
    // 使用平台模块创建通知
    const id = notificationManager.create(platformConfig)
    
    // 触发显示事件
    emit(EVENTS.NOTIFICATION_SHOW, {
      id: id,
      title: mergedConfig.title || '',
      message: mergedConfig.message,
      type: mergedConfig.type || 'info',
      duration: mergedConfig.duration || 4000
    })
    
    return id
  }

  // 关闭通知
  const close = (id: string): boolean => {
    const success = notificationManager.remove(id)
    
    if (success) {
      // 触发隐藏事件
      emit(EVENTS.NOTIFICATION_HIDE, {
        id: id,
        reason: 'user'
      })
    }
    
    return success
  }

  // 关闭所有通知
  const closeAll = (): void => {
    notificationManager.clear()
  }

  // 关闭指定类型的通知
  const closeByType = (type: NotificationType): void => {
    const typeNotifications = notificationManager.filter({ type })
    typeNotifications.forEach(notification => notificationManager.remove(notification.id))
  }

  // 关闭指定位置的通知
  const closeByPosition = (position: NotificationPosition): void => {
    const positionNotifications = notificationManager.filter({ position })
    positionNotifications.forEach(notification => notificationManager.remove(notification.id))
  }

  // 更新全局配置
  const updateGlobalConfig = (config: Partial<NotificationConfig>): void => {
    Object.assign(globalConfig, config)
  }

  // 获取通知实例
  const getNotification = (id: string): NotificationInstance | undefined => {
    const platformNotification = notificationManager.get(id)
    return platformNotification ? convertPlatformToLegacy(platformNotification) : undefined
  }

  // 检查通知是否存在
  const hasNotification = (id: string): boolean => {
    return notificationManager.has(id)
  }

  // 便捷方法
  const info = (message: string, config?: Partial<NotificationConfig>): string => {
    return show({ ...config, title: message, message: config?.message || message, type: 'info' })
  }

  const success = (message: string, config?: Partial<NotificationConfig>): string => {
    return show({ ...config, title: message, message: config?.message || message, type: 'success' })
  }

  const warning = (message: string, config?: Partial<NotificationConfig>): string => {
    return show({ ...config, title: message, message: config?.message || message, type: 'warning' })
  }

  const error = (message: string, config?: Partial<NotificationConfig>): string => {
    return show({ ...config, title: message, message: config?.message || message, type: 'error' })
  }

  // 系统通知（使用浏览器原生通知 API）
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }
    
    if (Notification.permission === 'granted') {
      return 'granted'
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }
    
    return Notification.permission
  }

  const showSystemNotification = async (
    title: string,
    options?: NotificationOptions
  ): Promise<Notification | null> => {
    const permission = await requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }
    
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      })
      
      return notification
    } catch (error) {
      console.error('Failed to show system notification:', error)
      return null
    }
  }

  // 持久化通知（保存到本地存储）
  const savePersistentNotifications = (): void => {
    const persistentNotifications = notifications.value.filter(n => n.persistent)
    try {
      const serializedNotifications = persistentNotifications.map(notification => ({
        ...notification,
        timer: undefined // 不序列化定时器
      }))
      localStorage.setItem('persistent_notifications', JSON.stringify(serializedNotifications))
    } catch (error) {
      console.warn('Failed to save persistent notifications:', error)
    }
  }

  const loadPersistentNotifications = (): void => {
    try {
      const saved = localStorage.getItem('persistent_notifications')
      if (saved) {
        const persistentNotifications: NotificationInstance[] = JSON.parse(saved)
        persistentNotifications.forEach(notification => {
          // 使用平台模块重新创建持久化通知
          const platformConfig = convertLegacyToPlatform(notification)
          notificationManager.create({ ...platformConfig, id: notification.id })
        })
      }
    } catch (error) {
      console.warn('Failed to load persistent notifications:', error)
    }
  }

  const clearPersistentNotifications = (): void => {
    try {
      localStorage.removeItem('persistent_notifications')
    } catch (error) {
      console.warn('Failed to clear persistent notifications:', error)
    }
  }

  return {
    // 状态
    notifications: readonly(notifications),
    notificationsByPosition,
    unreadCount,
    globalConfig: readonly(globalConfig),
    
    // 基础方法
    show,
    close,
    closeAll,
    closeByType,
    closeByPosition,
    
    // 配置
    updateGlobalConfig,
    
    // 查询
    getNotification,
    hasNotification,
    
    // 便捷方法
    info,
    success,
    warning,
    error,
    
    // 系统通知
    requestPermission,
    showSystemNotification,
    
    // 持久化
    savePersistentNotifications,
    loadPersistentNotifications,
    clearPersistentNotifications,
  }
}

// 全局通知管理器
class GlobalNotificationManager {
  private static instance: GlobalNotificationManager | null = null
  private notificationComposable: ReturnType<typeof useNotification> | null = null
  
  static getInstance(): GlobalNotificationManager {
    if (!GlobalNotificationManager.instance) {
      GlobalNotificationManager.instance = new GlobalNotificationManager()
    }
    return GlobalNotificationManager.instance
  }
  
  initialize() {
    if (!this.notificationComposable) {
      this.notificationComposable = useNotification()
      // 加载持久化通知
      this.notificationComposable.loadPersistentNotifications()
    }
    return this.notificationComposable
  }
  
  getNotification() {
    return this.notificationComposable
  }
}

// 导出全局通知管理器
export const globalNotification = GlobalNotificationManager.getInstance()

// 导出便捷的全局通知方法
export const notify = {
  show: (config: NotificationConfig) => globalNotification.initialize().show(config),
  info: (message: string, config?: Partial<NotificationConfig>) => 
    globalNotification.initialize().info(message, config),
  success: (message: string, config?: Partial<NotificationConfig>) => 
    globalNotification.initialize().success(message, config),
  warning: (message: string, config?: Partial<NotificationConfig>) => 
    globalNotification.initialize().warning(message, config),
  error: (message: string, config?: Partial<NotificationConfig>) => 
    globalNotification.initialize().error(message, config),
  close: (id: string) => globalNotification.initialize().close(id),
  closeAll: () => globalNotification.initialize().closeAll(),
}

