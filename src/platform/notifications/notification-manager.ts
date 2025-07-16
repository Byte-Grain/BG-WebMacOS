import type {
  Notification,
  NotificationConfig,
  NotificationEvent,
  NotificationEventType,
  NotificationFilter,
  NotificationSearchOptions,
  NotificationStats,
  NotificationTemplate,
  NotificationRule,
  NotificationPermission,
  NotificationManagerConfig,
  NotificationValidationResult,
  NotificationExportOptions,
  NotificationImportOptions,
  NotificationSnapshot,
  NotificationQueueItem,
  NotificationBatchOptions
} from './types'

/**
 * 通知管理器
 * 负责管理通知的创建、显示、队列和生命周期
 */
export class NotificationManager {
  private notifications: Map<string, Notification> = new Map()
  private queue: NotificationQueueItem[] = []
  private activeNotifications: Set<string> = new Set()
  private config: NotificationConfig
  private templates: Map<string, NotificationTemplate> = new Map()
  private rules: Map<string, NotificationRule> = new Map()
  private permissions: Map<string, NotificationPermission> = new Map()
  private eventListeners: Map<NotificationEventType, Set<(event: NotificationEvent) => void>> = new Map()
  private snapshots: Map<string, NotificationSnapshot> = new Map()
  private timers: Map<string, number> = new Map()
  private isProcessingQueue = false
  private batchProcessor?: number

  constructor(config?: Partial<NotificationManagerConfig>) {
    this.config = this.getDefaultConfig()
    
    if (config?.notification) {
      this.updateConfig(config.notification)
    }

    this.initializeTemplates()
    this.initializeRules()
    this.startQueueProcessor()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): NotificationConfig {
    return {
      position: 'top-right',
      maxNotifications: 5,
      defaultDuration: 5000,
      stackSpacing: 10,
      animationDuration: 300,
      showProgress: true,
      allowDuplicates: false,
      groupSimilar: true,
      pauseOnHover: true,
      closeOnClick: false,
      enableSound: true,
      soundVolume: 0.5,
      enableVibration: true,
      theme: {
        borderRadius: 8,
        shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdrop: 'rgba(255, 255, 255, 0.95)',
        maxWidth: 400,
        minHeight: 80
      },
      accessibility: {
        enabled: true,
        announceNew: true,
        announceActions: true,
        keyboardNavigation: true
      }
    }
  }

  /**
   * 初始化模板
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'info',
        name: 'Information',
        type: 'info',
        title: 'Information',
        message: 'This is an information notification.',
        icon: '/icons/info.svg',
        priority: 'normal',
        persistent: false
      },
      {
        id: 'success',
        name: 'Success',
        type: 'success',
        title: 'Success',
        message: 'Operation completed successfully.',
        icon: '/icons/success.svg',
        priority: 'normal',
        persistent: false
      },
      {
        id: 'warning',
        name: 'Warning',
        type: 'warning',
        title: 'Warning',
        message: 'Please pay attention to this warning.',
        icon: '/icons/warning.svg',
        priority: 'high',
        persistent: true
      },
      {
        id: 'error',
        name: 'Error',
        type: 'error',
        title: 'Error',
        message: 'An error has occurred.',
        icon: '/icons/error.svg',
        priority: 'critical',
        persistent: true,
        actions: [
          {
            id: 'retry',
            label: 'Retry',
            primary: true
          },
          {
            id: 'dismiss',
            label: 'Dismiss'
          }
        ]
      },
      {
        id: 'system',
        name: 'System',
        type: 'system',
        title: 'System Notification',
        message: 'System notification message.',
        icon: '/icons/system.svg',
        priority: 'normal',
        persistent: false
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * 初始化规则
   */
  private initializeRules(): void {
    const rules: NotificationRule[] = [
      {
        id: 'block-spam',
        name: 'Block Spam',
        enabled: true,
        conditions: {
          keywords: ['spam', 'advertisement', 'promotion']
        },
        actions: {
          block: true
        }
      },
      {
        id: 'silent-night',
        name: 'Silent Night Mode',
        enabled: true,
        conditions: {
          timeRange: {
            start: '22:00',
            end: '08:00'
          }
        },
        actions: {
          silent: true
        }
      },
      {
        id: 'critical-priority',
        name: 'Critical Priority',
        enabled: true,
        conditions: {
          type: ['error'],
          priority: ['critical']
        },
        actions: {
          priority: 'critical',
          duration: 0 // persistent
        }
      }
    ]

    rules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * 启动队列处理器
   */
  private startQueueProcessor(): void {
    this.batchProcessor = window.setInterval(() => {
      this.processQueue()
    }, 100)
  }

  /**
   * 创建通知
   */
  create(notification: Omit<Notification, 'id' | 'timestamp' | 'state'>): string {
    const id = this.generateNotificationId()
    const now = Date.now()
    
    const newNotification: Notification = {
      id,
      timestamp: now,
      state: 'pending',
      priority: 'normal',
      persistent: false,
      silent: false,
      ...notification
    }

    // 验证通知
    const validation = this.validateNotification(newNotification)
    if (!validation.valid) {
      throw new Error(`Invalid notification: ${validation.errors.join(', ')}`)
    }

    // 应用规则
    const processedNotification = this.applyRules(newNotification)
    if (!processedNotification) {
      return id // 被规则阻止
    }

    // 检查重复
    if (!this.config.allowDuplicates && this.isDuplicate(processedNotification)) {
      return id
    }

    // 设置过期时间
    if (!processedNotification.persistent && !processedNotification.expiresAt) {
      processedNotification.expiresAt = now + this.config.defaultDuration
    }

    this.notifications.set(id, processedNotification)
    this.addToQueue(processedNotification)
    this.emitEvent('notification-added', { notification: processedNotification })

    return id
  }

  /**
   * 从模板创建通知
   */
  createFromTemplate(templateId: string, data?: Record<string, any>): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const notification: Omit<Notification, 'id' | 'timestamp' | 'state'> = {
      type: template.type,
      title: this.interpolateTemplate(template.title, data),
      message: this.interpolateTemplate(template.message, data),
      icon: template.icon,
      priority: template.priority,
      persistent: template.persistent,
      silent: false,
      actions: template.actions?.map(action => ({
        ...action,
        action: () => console.log(`Action ${action.id} clicked`)
      })),
      data: { ...template.defaultData, ...data }
    }

    return this.create(notification)
  }

  /**
   * 插值模板字符串
   */
  private interpolateTemplate(template: string, data?: Record<string, any>): string {
    if (!data) return template
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match
    })
  }

  /**
   * 显示通知
   */
  show(id: string): boolean {
    const notification = this.notifications.get(id)
    if (!notification || notification.state !== 'pending') {
      return false
    }

    // 检查是否超过最大显示数量
    if (this.activeNotifications.size >= this.config.maxNotifications) {
      return false // 保持在队列中
    }

    notification.state = 'shown'
    this.activeNotifications.add(id)
    this.emitEvent('notification-shown', { notification })

    // 设置自动过期
    if (notification.expiresAt) {
      const timeUntilExpiry = notification.expiresAt - Date.now()
      if (timeUntilExpiry > 0) {
        const timer = window.setTimeout(() => {
          this.expire(id)
        }, timeUntilExpiry)
        this.timers.set(id, timer)
      }
    }

    return true
  }

  /**
   * 关闭通知
   */
  dismiss(id: string): boolean {
    const notification = this.notifications.get(id)
    if (!notification) return false

    notification.state = 'dismissed'
    this.activeNotifications.delete(id)
    this.clearTimer(id)
    
    if (notification.onDismiss) {
      try {
        notification.onDismiss()
      } catch (error) {
        console.error(`Error in notification dismiss handler:`, error)
      }
    }

    this.emitEvent('notification-dismissed', { notification })
    return true
  }

  /**
   * 通知过期
   */
  private expire(id: string): boolean {
    const notification = this.notifications.get(id)
    if (!notification) return false

    notification.state = 'expired'
    this.activeNotifications.delete(id)
    this.clearTimer(id)
    
    if (notification.onExpire) {
      try {
        notification.onExpire()
      } catch (error) {
        console.error(`Error in notification expire handler:`, error)
      }
    }

    this.emitEvent('notification-expired', { notification })
    return true
  }

  /**
   * 点击通知
   */
  click(id: string): boolean {
    const notification = this.notifications.get(id)
    if (!notification || !this.activeNotifications.has(id)) {
      return false
    }

    notification.state = 'clicked'
    
    if (notification.onClick) {
      try {
        notification.onClick()
      } catch (error) {
        console.error(`Error in notification click handler:`, error)
      }
    }

    this.emitEvent('notification-clicked', { notification })

    // 如果配置为点击关闭，则关闭通知
    if (this.config.closeOnClick) {
      this.dismiss(id)
    }

    return true
  }

  /**
   * 执行通知动作
   */
  executeAction(notificationId: string, actionId: string): boolean {
    const notification = this.notifications.get(notificationId)
    if (!notification || !notification.actions) {
      return false
    }

    const action = notification.actions.find(a => a.id === actionId)
    if (!action) return false

    try {
      const result = action.action()
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`Error in notification action handler:`, error)
        })
      }
    } catch (error) {
      console.error(`Error in notification action handler:`, error)
      return false
    }

    this.emitEvent('notification-action-clicked', { notification, action })
    
    // 执行动作后通常关闭通知
    this.dismiss(notificationId)
    return true
  }

  /**
   * 获取通知
   */
  get(id: string): Notification | undefined {
    return this.notifications.get(id)
  }

  /**
   * 获取所有通知
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values())
  }

  /**
   * 获取活动通知
   */
  getActive(): Notification[] {
    return Array.from(this.activeNotifications)
      .map(id => this.notifications.get(id)!)
      .filter(Boolean)
  }

  /**
   * 搜索通知
   */
  search(options: NotificationSearchOptions): Notification[] {
    let notifications = this.getAll()

    // 应用过滤器
    notifications = this.filter(notifications, options)

    // 应用查询
    if (options.query) {
      const query = options.query.toLowerCase()
      notifications = notifications.filter(notification => {
        const matchesTitle = notification.title.toLowerCase().includes(query)
        const matchesMessage = options.includeMessage && 
          notification.message.toLowerCase().includes(query)
        const matchesData = options.includeData && 
          notification.data && 
          Object.values(notification.data).some(value => 
            String(value).toLowerCase().includes(query)
          )
        const matchesMetadata = options.includeMetadata && 
          notification.metadata && 
          Object.values(notification.metadata).some(value => 
            String(value).toLowerCase().includes(query)
          )
        
        return matchesTitle || matchesMessage || matchesData || matchesMetadata
      })
    }

    // 排序
    if (options.sortBy) {
      notifications.sort((a, b) => {
        let comparison = 0
        
        switch (options.sortBy) {
          case 'timestamp':
            comparison = a.timestamp - b.timestamp
            break
          case 'priority':
            const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 }
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
            break
          case 'type':
            comparison = a.type.localeCompare(b.type)
            break
          case 'title':
            comparison = a.title.localeCompare(b.title)
            break
        }
        
        return options.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    // 分页
    if (options.offset || options.limit) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      notifications = notifications.slice(start, end)
    }

    return notifications
  }

  /**
   * 过滤通知
   */
  filter(notifications: Notification[], filter: NotificationFilter): Notification[] {
    return notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) return false
      if (filter.priority && notification.priority !== filter.priority) return false
      if (filter.state && notification.state !== filter.state) return false
      if (filter.persistent !== undefined && notification.persistent !== filter.persistent) return false
      if (filter.silent !== undefined && notification.silent !== filter.silent) return false
      if (filter.hasActions !== undefined) {
        const hasActions = !!(notification.actions && notification.actions.length > 0)
        if (hasActions !== filter.hasActions) return false
      }
      if (filter.hasAttachments !== undefined) {
        const hasAttachments = !!(notification.attachments && notification.attachments.length > 0)
        if (hasAttachments !== filter.hasAttachments) return false
      }
      if (filter.source && notification.source?.app !== filter.source) return false
      if (filter.dateRange) {
        if (notification.timestamp < filter.dateRange.start || 
            notification.timestamp > filter.dateRange.end) {
          return false
        }
      }
      return true
    })
  }

  /**
   * 清除所有通知
   */
  clear(): void {
    // 清除所有定时器
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()

    // 清除通知
    this.notifications.clear()
    this.activeNotifications.clear()
    this.queue.length = 0

    this.emitEvent('notifications-cleared')
  }

  /**
   * 清除已关闭的通知
   */
  clearDismissed(): void {
    const dismissedIds: string[] = []
    
    this.notifications.forEach((notification, id) => {
      if (notification.state === 'dismissed' || notification.state === 'expired') {
        dismissedIds.push(id)
      }
    })

    dismissedIds.forEach(id => {
      this.notifications.delete(id)
      this.clearTimer(id)
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): NotificationStats {
    const notifications = this.getAll()
    const total = notifications.length

    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPriority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byState = notifications.reduce((acc, notification) => {
      acc[notification.state] = (acc[notification.state] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const clickedNotifications = notifications.filter(n => n.state === 'clicked')
    const shownNotifications = notifications.filter(n => 
      n.state === 'shown' || n.state === 'clicked' || n.state === 'dismissed'
    )

    return {
      total,
      byType: byType as any,
      byPriority: byPriority as any,
      byState: byState as any,
      pending: byState.pending || 0,
      shown: byState.shown || 0,
      dismissed: byState.dismissed || 0,
      expired: byState.expired || 0,
      clicked: byState.clicked || 0,
      averageDisplayTime: this.calculateAverageDisplayTime(),
      clickThroughRate: shownNotifications.length > 0 ? 
        clickedNotifications.length / shownNotifications.length : 0
    }
  }

  /**
   * 计算平均显示时间
   */
  private calculateAverageDisplayTime(): number {
    const completedNotifications = this.getAll().filter(n => 
      n.state === 'dismissed' || n.state === 'expired' || n.state === 'clicked'
    )

    if (completedNotifications.length === 0) return 0

    const totalTime = completedNotifications.reduce((sum, notification) => {
      const displayTime = (notification.expiresAt || Date.now()) - notification.timestamp
      return sum + displayTime
    }, 0)

    return totalTime / completedNotifications.length
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    if (this.isProcessingQueue || this.queue.length === 0) return
    if (this.activeNotifications.size >= this.config.maxNotifications) return

    this.isProcessingQueue = true

    // 按优先级排序队列
    this.queue.sort((a, b) => b.priority - a.priority)

    const item = this.queue.shift()
    if (item) {
      const success = this.show(item.notification.id)
      if (!success && item.retryCount < item.maxRetries) {
        item.retryCount++
        this.queue.unshift(item) // 重新加入队列前端
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * 添加到队列
   */
  private addToQueue(notification: Notification): void {
    const priority = this.getPriorityValue(notification.priority)
    const queueItem: NotificationQueueItem = {
      notification,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    }
    
    this.queue.push(queueItem)
  }

  /**
   * 获取优先级数值
   */
  private getPriorityValue(priority: Notification['priority']): number {
    const priorityMap = {
      low: 1,
      normal: 2,
      high: 3,
      critical: 4
    }
    return priorityMap[priority]
  }

  /**
   * 应用规则
   */
  private applyRules(notification: Notification): Notification | null {
    let processedNotification = { ...notification }

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      if (this.matchesRule(processedNotification, rule)) {
        // 应用规则动作
        if (rule.actions.block) {
          return null // 阻止通知
        }
        
        if (rule.actions.silent) {
          processedNotification.silent = true
        }
        
        if (rule.actions.priority) {
          processedNotification.priority = rule.actions.priority
        }
        
        if (rule.actions.duration !== undefined) {
          if (rule.actions.duration === 0) {
            processedNotification.persistent = true
            processedNotification.expiresAt = undefined
          } else {
            processedNotification.persistent = false
            processedNotification.expiresAt = Date.now() + rule.actions.duration
          }
        }
      }
    }

    return processedNotification
  }

  /**
   * 检查通知是否匹配规则
   */
  private matchesRule(notification: Notification, rule: NotificationRule): boolean {
    const { conditions } = rule

    // 检查类型
    if (conditions.type && !conditions.type.includes(notification.type)) {
      return false
    }

    // 检查来源
    if (conditions.source && notification.source?.app && 
        !conditions.source.includes(notification.source.app)) {
      return false
    }

    // 检查关键词
    if (conditions.keywords) {
      const text = `${notification.title} ${notification.message}`.toLowerCase()
      const hasKeyword = conditions.keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      )
      if (!hasKeyword) return false
    }

    // 检查时间范围
    if (conditions.timeRange) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      if (currentTime < conditions.timeRange.start || currentTime > conditions.timeRange.end) {
        return false
      }
    }

    // 检查优先级
    if (conditions.priority && !conditions.priority.includes(notification.priority)) {
      return false
    }

    return true
  }

  /**
   * 检查是否重复
   */
  private isDuplicate(notification: Notification): boolean {
    return Array.from(this.notifications.values()).some(existing => 
      existing.title === notification.title &&
      existing.message === notification.message &&
      existing.type === notification.type &&
      existing.state !== 'dismissed' &&
      existing.state !== 'expired'
    )
  }

  /**
   * 验证通知
   */
  private validateNotification(notification: Partial<Notification>): NotificationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!notification.title || notification.title.trim() === '') {
      errors.push('Title is required')
    }

    if (!notification.message || notification.message.trim() === '') {
      errors.push('Message is required')
    }

    if (notification.title && notification.title.length > 100) {
      warnings.push('Title is very long, consider shortening it')
    }

    if (notification.message && notification.message.length > 500) {
      warnings.push('Message is very long, consider shortening it')
    }

    if (notification.actions && notification.actions.length > 3) {
      warnings.push('Too many actions, consider reducing the number')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 清除定时器
   */
  private clearTimer(id: string): void {
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
  }

  /**
   * 生成通知ID
   */
  private generateNotificationId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...updates }
    this.emitEvent('config-updated')
  }

  /**
   * 获取配置
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: NotificationEventType, listener: (event: NotificationEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: NotificationEventType, listener: (event: NotificationEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: NotificationEventType, data?: any): void {
    const event: NotificationEvent = {
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
          console.error(`Error in notification event listener for ${type}:`, error)
        }
      })
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 停止队列处理器
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor)
    }

    // 清除所有定时器
    this.timers.forEach(timer => clearTimeout(timer))
    
    // 清除数据
    this.notifications.clear()
    this.queue.length = 0
    this.activeNotifications.clear()
    this.eventListeners.clear()
    this.timers.clear()
    this.templates.clear()
    this.rules.clear()
    this.permissions.clear()
    this.snapshots.clear()
  }
}

// 导出单例实例
export const notificationManager = new NotificationManager()