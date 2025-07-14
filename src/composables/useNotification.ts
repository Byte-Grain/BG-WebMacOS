import { ref, reactive, computed } from 'vue'
import { useEventBus, EVENTS } from './useEventBus'
import { useUtils } from './useUtils'

// 通知类型
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

// 通知位置
export type NotificationPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'top-center'
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center'
  | 'center'

// 通知配置
export interface NotificationConfig {
  id?: string
  title?: string
  message: string
  type?: NotificationType
  duration?: number // 显示时长，0 表示不自动关闭
  position?: NotificationPosition
  showClose?: boolean
  persistent?: boolean // 是否持久化（页面刷新后仍显示）
  icon?: string
  avatar?: string
  actions?: NotificationAction[]
  onClick?: () => void
  onClose?: () => void
  customClass?: string
  html?: boolean // 是否允许 HTML 内容
}

// 通知操作按钮
export interface NotificationAction {
  text: string
  action: () => void
  type?: 'primary' | 'secondary' | 'danger'
}

// 通知实例
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
  
  // 通知列表
  const notifications = ref<NotificationInstance[]>([])
  
  // 全局配置
  const globalConfig = reactive<Partial<NotificationConfig>>({ ...DEFAULT_CONFIG })
  
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
    const notification = createNotification(config)
    
    // 检查是否已存在相同 ID 的通知
    const existingIndex = notifications.value.findIndex(n => n.id === notification.id)
    if (existingIndex > -1) {
      // 更新现有通知
      clearTimeout(notifications.value[existingIndex].timer)
      notifications.value[existingIndex] = notification
    } else {
      // 添加新通知
      notifications.value.push(notification)
    }
    
    // 设置自动关闭定时器
    if (notification.duration > 0) {
      notification.timer = setTimeout(() => {
        close(notification.id)
      }, notification.duration)
    }
    
    // 触发显示事件
    emit(EVENTS.NOTIFICATION_SHOW, notification)
    
    return notification.id
  }

  // 关闭通知
  const close = (id: string): boolean => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index === -1) return false
    
    const notification = notifications.value[index]
    
    // 清除定时器
    if (notification.timer) {
      clearTimeout(notification.timer)
    }
    
    // 执行关闭回调
    if (notification.onClose) {
      try {
        notification.onClose()
      } catch (error) {
        console.error('Error in notification onClose callback:', error)
      }
    }
    
    // 移除通知
    notifications.value.splice(index, 1)
    
    // 触发隐藏事件
    emit(EVENTS.NOTIFICATION_HIDE, notification)
    
    return true
  }

  // 关闭所有通知
  const closeAll = (): void => {
    const notificationIds = notifications.value.map(n => n.id)
    notificationIds.forEach(id => close(id))
  }

  // 关闭指定类型的通知
  const closeByType = (type: NotificationType): void => {
    const notificationIds = notifications.value
      .filter(n => n.type === type)
      .map(n => n.id)
    notificationIds.forEach(id => close(id))
  }

  // 关闭指定位置的通知
  const closeByPosition = (position: NotificationPosition): void => {
    const notificationIds = notifications.value
      .filter(n => n.position === position)
      .map(n => n.id)
    notificationIds.forEach(id => close(id))
  }

  // 更新全局配置
  const updateGlobalConfig = (config: Partial<NotificationConfig>): void => {
    Object.assign(globalConfig, config)
  }

  // 获取通知实例
  const getNotification = (id: string): NotificationInstance | undefined => {
    return notifications.value.find(n => n.id === id)
  }

  // 检查通知是否存在
  const hasNotification = (id: string): boolean => {
    return notifications.value.some(n => n.id === id)
  }

  // 便捷方法
  const info = (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>): string => {
    return show({ ...config, message, type: 'info' })
  }

  const success = (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>): string => {
    return show({ ...config, message, type: 'success' })
  }

  const warning = (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>): string => {
    return show({ ...config, message, type: 'warning' })
  }

  const error = (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>): string => {
    return show({ ...config, message, type: 'error' })
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
      localStorage.setItem('persistent_notifications', JSON.stringify(persistentNotifications))
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
          // 重新添加持久化通知，但不设置自动关闭定时器
          notifications.value.push({ ...notification, timer: undefined })
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
  info: (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>) => 
    globalNotification.initialize().info(message, config),
  success: (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>) => 
    globalNotification.initialize().success(message, config),
  warning: (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>) => 
    globalNotification.initialize().warning(message, config),
  error: (message: string, config?: Omit<NotificationConfig, 'message' | 'type'>) => 
    globalNotification.initialize().error(message, config),
  close: (id: string) => globalNotification.initialize().close(id),
  closeAll: () => globalNotification.initialize().closeAll(),
}