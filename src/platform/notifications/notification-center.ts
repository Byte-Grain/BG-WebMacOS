import type {
  Notification,
  NotificationGroup,
  NotificationHistory,
  NotificationPermission,
  NotificationRule,
  NotificationTemplate,
  NotificationCenterConfig,
  NotificationEvent,
  NotificationEventType,
  NotificationFilter,
  NotificationSearchOptions,
  NotificationSnapshot,
  NotificationExportOptions,
  NotificationImportOptions,
  NotificationValidationResult
} from './types'

/**
 * 通知中心
 * 负责管理通知的集中显示、历史记录和用户交互
 */
export class NotificationCenter {
  private config: NotificationCenterConfig
  private groups: Map<string, NotificationGroup> = new Map()
  private history: NotificationHistory[] = []
  private permissions: Map<string, NotificationPermission> = new Map()
  private rules: Map<string, NotificationRule> = new Map()
  private templates: Map<string, NotificationTemplate> = new Map()
  private snapshots: Map<string, NotificationSnapshot> = new Map()
  private eventListeners: Map<NotificationEventType, Set<(event: NotificationEvent) => void>> = new Map()
  private isVisible = false
  private selectedNotifications: Set<string> = new Set()
  private searchQuery = ''
  private activeFilter: NotificationFilter | null = null
  private sortBy: 'timestamp' | 'priority' | 'type' | 'title' = 'timestamp'
  private sortOrder: 'asc' | 'desc' = 'desc'

  constructor(config?: Partial<NotificationCenterConfig>) {
    this.config = this.getDefaultConfig()
    
    if (config) {
      this.updateConfig(config)
    }

    this.initializeGroups()
    this.initializePermissions()
    this.loadHistory()
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): NotificationCenterConfig {
    return {
      maxHistorySize: 1000,
      groupByApp: true,
      groupByType: false,
      groupByDate: true,
      autoCleanupDays: 30,
      showUnreadCount: true,
      enableSearch: true,
      enableFiltering: true,
      enableSorting: true,
      enableBulkActions: true,
      enableExport: true,
      enableImport: true,
      theme: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        borderColor: '#e0e0e0',
        accentColor: '#007aff',
        headerHeight: 60,
        itemHeight: 80,
        spacing: 8
      },
      layout: {
        width: 400,
        maxHeight: 600,
        position: 'top-right',
        showHeader: true,
        showFooter: true,
        showGroupHeaders: true
      },
      animations: {
        enabled: true,
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }

  /**
   * 初始化分组
   */
  private initializeGroups(): void {
    const defaultGroups: NotificationGroup[] = [
      {
        id: 'today',
        name: 'Today',
        type: 'date',
        notifications: [],
        expanded: true,
        unreadCount: 0,
        lastUpdated: Date.now()
      },
      {
        id: 'yesterday',
        name: 'Yesterday',
        type: 'date',
        notifications: [],
        expanded: false,
        unreadCount: 0,
        lastUpdated: Date.now()
      },
      {
        id: 'earlier',
        name: 'Earlier',
        type: 'date',
        notifications: [],
        expanded: false,
        unreadCount: 0,
        lastUpdated: Date.now()
      }
    ]

    defaultGroups.forEach(group => {
      this.groups.set(group.id, group)
    })
  }

  /**
   * 初始化权限
   */
  private initializePermissions(): void {
    const defaultPermissions: NotificationPermission[] = [
      {
        id: 'system',
        source: 'system',
        granted: true,
        level: 'all',
        settings: {
          allowSound: true,
          allowVibration: true,
          allowBadge: true,
          allowPersistent: true
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission)
    })
  }

  /**
   * 加载历史记录
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('notification-center-history')
      if (stored) {
        this.history = JSON.parse(stored)
        this.organizeNotifications()
      }
    } catch (error) {
      console.error('Failed to load notification history:', error)
    }
  }

  /**
   * 保存历史记录
   */
  private saveHistory(): void {
    try {
      localStorage.setItem('notification-center-history', JSON.stringify(this.history))
    } catch (error) {
      console.error('Failed to save notification history:', error)
    }
  }

  /**
   * 显示通知中心
   */
  show(): void {
    if (this.isVisible) return
    
    this.isVisible = true
    this.emitEvent('center-shown')
  }

  /**
   * 隐藏通知中心
   */
  hide(): void {
    if (!this.isVisible) return
    
    this.isVisible = false
    this.emitEvent('center-hidden')
  }

  /**
   * 切换通知中心显示状态
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 检查是否可见
   */
  isShown(): boolean {
    return this.isVisible
  }

  /**
   * 添加通知到历史记录
   */
  addNotification(notification: Notification): void {
    // 检查权限
    if (!this.hasPermission(notification.source?.app || 'unknown')) {
      return
    }

    // 添加到历史记录
    const historyItem: NotificationHistory = {
      notification,
      readAt: null,
      archivedAt: null,
      deletedAt: null
    }

    this.history.unshift(historyItem)

    // 限制历史记录大小
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(0, this.config.maxHistorySize)
    }

    // 重新组织通知
    this.organizeNotifications()
    
    // 保存历史记录
    this.saveHistory()
    
    this.emitEvent('notification-added', { notification })
  }

  /**
   * 标记通知为已读
   */
  markAsRead(notificationId: string): boolean {
    const historyItem = this.history.find(item => 
      item.notification.id === notificationId && !item.deletedAt
    )
    
    if (!historyItem || historyItem.readAt) {
      return false
    }

    historyItem.readAt = Date.now()
    this.updateGroupUnreadCount()
    this.saveHistory()
    
    this.emitEvent('notification-read', { notification: historyItem.notification })
    return true
  }

  /**
   * 标记所有通知为已读
   */
  markAllAsRead(): void {
    const now = Date.now()
    let markedCount = 0

    this.history.forEach(item => {
      if (!item.readAt && !item.deletedAt) {
        item.readAt = now
        markedCount++
      }
    })

    if (markedCount > 0) {
      this.updateGroupUnreadCount()
      this.saveHistory()
      this.emitEvent('notifications-marked-read', { count: markedCount })
    }
  }

  /**
   * 归档通知
   */
  archiveNotification(notificationId: string): boolean {
    const historyItem = this.history.find(item => 
      item.notification.id === notificationId && !item.deletedAt
    )
    
    if (!historyItem || historyItem.archivedAt) {
      return false
    }

    historyItem.archivedAt = Date.now()
    if (!historyItem.readAt) {
      historyItem.readAt = Date.now()
    }
    
    this.organizeNotifications()
    this.saveHistory()
    
    this.emitEvent('notification-archived', { notification: historyItem.notification })
    return true
  }

  /**
   * 删除通知
   */
  deleteNotification(notificationId: string): boolean {
    const historyItem = this.history.find(item => 
      item.notification.id === notificationId && !item.deletedAt
    )
    
    if (!historyItem) {
      return false
    }

    historyItem.deletedAt = Date.now()
    this.organizeNotifications()
    this.saveHistory()
    
    this.emitEvent('notification-deleted', { notification: historyItem.notification })
    return true
  }

  /**
   * 批量操作
   */
  bulkAction(action: 'read' | 'archive' | 'delete', notificationIds: string[]): number {
    let processedCount = 0

    notificationIds.forEach(id => {
      let success = false
      
      switch (action) {
        case 'read':
          success = this.markAsRead(id)
          break
        case 'archive':
          success = this.archiveNotification(id)
          break
        case 'delete':
          success = this.deleteNotification(id)
          break
      }
      
      if (success) {
        processedCount++
      }
    })

    this.emitEvent('bulk-action-completed', { action, count: processedCount })
    return processedCount
  }

  /**
   * 获取通知
   */
  getNotification(id: string): Notification | null {
    const historyItem = this.history.find(item => 
      item.notification.id === id && !item.deletedAt
    )
    return historyItem ? historyItem.notification : null
  }

  /**
   * 获取所有通知
   */
  getAllNotifications(includeArchived = false, includeDeleted = false): NotificationHistory[] {
    return this.history.filter(item => {
      if (!includeDeleted && item.deletedAt) return false
      if (!includeArchived && item.archivedAt) return false
      return true
    })
  }

  /**
   * 获取未读通知数量
   */
  getUnreadCount(): number {
    return this.history.filter(item => 
      !item.readAt && !item.deletedAt && !item.archivedAt
    ).length
  }

  /**
   * 获取分组
   */
  getGroups(): NotificationGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * 获取分组
   */
  getGroup(id: string): NotificationGroup | null {
    return this.groups.get(id) || null
  }

  /**
   * 展开/折叠分组
   */
  toggleGroup(groupId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false

    group.expanded = !group.expanded
    this.emitEvent('group-toggled', { group })
    return true
  }

  /**
   * 搜索通知
   */
  search(query: string, options?: NotificationSearchOptions): NotificationHistory[] {
    this.searchQuery = query
    
    if (!query.trim()) {
      return this.getAllNotifications()
    }

    const searchOptions: NotificationSearchOptions = {
      query: query.toLowerCase(),
      includeMessage: true,
      includeData: false,
      includeMetadata: false,
      ...options
    }

    return this.history.filter(item => {
      if (item.deletedAt) return false
      
      const notification = item.notification
      const matchesTitle = notification.title.toLowerCase().includes(searchOptions.query!)
      const matchesMessage = searchOptions.includeMessage && 
        notification.message.toLowerCase().includes(searchOptions.query!)
      const matchesData = searchOptions.includeData && 
        notification.data && 
        Object.values(notification.data).some(value => 
          String(value).toLowerCase().includes(searchOptions.query!)
        )
      const matchesMetadata = searchOptions.includeMetadata && 
        notification.metadata && 
        Object.values(notification.metadata).some(value => 
          String(value).toLowerCase().includes(searchOptions.query!)
        )
      
      return matchesTitle || matchesMessage || matchesData || matchesMetadata
    })
  }

  /**
   * 应用过滤器
   */
  applyFilter(filter: NotificationFilter | null): void {
    this.activeFilter = filter
    this.organizeNotifications()
    this.emitEvent('filter-applied', { filter })
  }

  /**
   * 设置排序
   */
  setSorting(sortBy: 'timestamp' | 'priority' | 'type' | 'title', sortOrder: 'asc' | 'desc' = 'desc'): void {
    this.sortBy = sortBy
    this.sortOrder = sortOrder
    this.organizeNotifications()
    this.emitEvent('sorting-changed', { sortBy, sortOrder })
  }

  /**
   * 组织通知到分组中
   */
  private organizeNotifications(): void {
    // 清空现有分组
    this.groups.forEach(group => {
      group.notifications = []
      group.unreadCount = 0
    })

    // 获取有效通知
    let notifications = this.getAllNotifications()

    // 应用过滤器
    if (this.activeFilter) {
      notifications = this.filterNotifications(notifications, this.activeFilter)
    }

    // 排序
    notifications = this.sortNotifications(notifications)

    // 分组
    if (this.config.groupByDate) {
      this.groupByDate(notifications)
    } else if (this.config.groupByApp) {
      this.groupByApp(notifications)
    } else if (this.config.groupByType) {
      this.groupByType(notifications)
    } else {
      // 默认分组
      const defaultGroup = this.groups.get('all') || {
        id: 'all',
        name: 'All Notifications',
        type: 'default',
        notifications: [],
        expanded: true,
        unreadCount: 0,
        lastUpdated: Date.now()
      }
      
      defaultGroup.notifications = notifications.map(item => item.notification)
      defaultGroup.unreadCount = notifications.filter(item => !item.readAt).length
      this.groups.set('all', defaultGroup)
    }

    this.updateGroupUnreadCount()
  }

  /**
   * 按日期分组
   */
  private groupByDate(notifications: NotificationHistory[]): void {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    notifications.forEach(item => {
      const notificationDate = new Date(item.notification.timestamp)
      const notificationDay = new Date(notificationDate.getFullYear(), notificationDate.getMonth(), notificationDate.getDate())
      
      let groupId: string
      if (notificationDay.getTime() === today.getTime()) {
        groupId = 'today'
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groupId = 'yesterday'
      } else {
        groupId = 'earlier'
      }

      const group = this.groups.get(groupId)
      if (group) {
        group.notifications.push(item.notification)
        if (!item.readAt) {
          group.unreadCount++
        }
      }
    })
  }

  /**
   * 按应用分组
   */
  private groupByApp(notifications: NotificationHistory[]): void {
    const appGroups = new Map<string, NotificationHistory[]>()

    notifications.forEach(item => {
      const app = item.notification.source?.app || 'Unknown'
      if (!appGroups.has(app)) {
        appGroups.set(app, [])
      }
      appGroups.get(app)!.push(item)
    })

    appGroups.forEach((items, app) => {
      const groupId = `app-${app}`
      const group: NotificationGroup = {
        id: groupId,
        name: app,
        type: 'app',
        notifications: items.map(item => item.notification),
        expanded: true,
        unreadCount: items.filter(item => !item.readAt).length,
        lastUpdated: Date.now()
      }
      this.groups.set(groupId, group)
    })
  }

  /**
   * 按类型分组
   */
  private groupByType(notifications: NotificationHistory[]): void {
    const typeGroups = new Map<string, NotificationHistory[]>()

    notifications.forEach(item => {
      const type = item.notification.type
      if (!typeGroups.has(type)) {
        typeGroups.set(type, [])
      }
      typeGroups.get(type)!.push(item)
    })

    typeGroups.forEach((items, type) => {
      const groupId = `type-${type}`
      const group: NotificationGroup = {
        id: groupId,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        type: 'type',
        notifications: items.map(item => item.notification),
        expanded: true,
        unreadCount: items.filter(item => !item.readAt).length,
        lastUpdated: Date.now()
      }
      this.groups.set(groupId, group)
    })
  }

  /**
   * 过滤通知
   */
  private filterNotifications(notifications: NotificationHistory[], filter: NotificationFilter): NotificationHistory[] {
    return notifications.filter(item => {
      const notification = item.notification
      
      if (filter.type && notification.type !== filter.type) return false
      if (filter.priority && notification.priority !== filter.priority) return false
      if (filter.state && notification.state !== filter.state) return false
      if (filter.persistent !== undefined && notification.persistent !== filter.persistent) return false
      if (filter.silent !== undefined && notification.silent !== filter.silent) return false
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
   * 排序通知
   */
  private sortNotifications(notifications: NotificationHistory[]): NotificationHistory[] {
    return notifications.sort((a, b) => {
      let comparison = 0
      
      switch (this.sortBy) {
        case 'timestamp':
          comparison = a.notification.timestamp - b.notification.timestamp
          break
        case 'priority':
          const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 }
          comparison = priorityOrder[a.notification.priority] - priorityOrder[b.notification.priority]
          break
        case 'type':
          comparison = a.notification.type.localeCompare(b.notification.type)
          break
        case 'title':
          comparison = a.notification.title.localeCompare(b.notification.title)
          break
      }
      
      return this.sortOrder === 'desc' ? -comparison : comparison
    })
  }

  /**
   * 更新分组未读数量
   */
  private updateGroupUnreadCount(): void {
    this.groups.forEach(group => {
      group.unreadCount = group.notifications.filter(notification => {
        const historyItem = this.history.find(item => 
          item.notification.id === notification.id
        )
        return historyItem && !historyItem.readAt && !historyItem.deletedAt
      }).length
    })
  }

  /**
   * 检查权限
   */
  private hasPermission(source: string): boolean {
    const permission = this.permissions.get(source) || this.permissions.get('system')
    return permission ? permission.granted : false
  }

  /**
   * 清理过期通知
   */
  cleanup(): void {
    const cutoffDate = Date.now() - (this.config.autoCleanupDays * 24 * 60 * 60 * 1000)
    const initialCount = this.history.length
    
    this.history = this.history.filter(item => 
      item.notification.timestamp > cutoffDate || !item.deletedAt
    )
    
    const removedCount = initialCount - this.history.length
    if (removedCount > 0) {
      this.organizeNotifications()
      this.saveHistory()
      this.emitEvent('cleanup-completed', { removedCount })
    }
  }

  /**
   * 导出通知
   */
  export(options: NotificationExportOptions): string {
    const notifications = this.getAllNotifications(options.includeArchived, options.includeDeleted)
    
    let filteredNotifications = notifications
    if (options.filter) {
      filteredNotifications = this.filterNotifications(notifications, options.filter)
    }
    
    if (options.dateRange) {
      filteredNotifications = filteredNotifications.filter(item => 
        item.notification.timestamp >= options.dateRange!.start &&
        item.notification.timestamp <= options.dateRange!.end
      )
    }

    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      count: filteredNotifications.length,
      notifications: filteredNotifications
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入通知
   */
  import(data: string, options: NotificationImportOptions): NotificationValidationResult {
    try {
      const importData = JSON.parse(data)
      const errors: string[] = []
      const warnings: string[] = []
      
      if (!importData.notifications || !Array.isArray(importData.notifications)) {
        errors.push('Invalid import data format')
        return { valid: false, errors, warnings }
      }

      let importedCount = 0
      let skippedCount = 0

      importData.notifications.forEach((item: any) => {
        try {
          if (options.skipDuplicates) {
            const exists = this.history.some(existing => 
              existing.notification.id === item.notification.id
            )
            if (exists) {
              skippedCount++
              return
            }
          }

          if (options.validateData) {
            // 基本验证
            if (!item.notification || !item.notification.id || !item.notification.title) {
              warnings.push(`Skipped invalid notification: ${item.notification?.id || 'unknown'}`)
              return
            }
          }

          this.history.push(item)
          importedCount++
        } catch (error) {
          warnings.push(`Failed to import notification: ${error}`)
        }
      })

      if (importedCount > 0) {
        this.organizeNotifications()
        this.saveHistory()
      }

      if (skippedCount > 0) {
        warnings.push(`Skipped ${skippedCount} duplicate notifications`)
      }

      return {
        valid: true,
        errors,
        warnings,
        metadata: {
          imported: importedCount,
          skipped: skippedCount
        }
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to parse import data: ${error}`],
        warnings: []
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<NotificationCenterConfig>): void {
    this.config = { ...this.config, ...updates }
    this.emitEvent('config-updated')
  }

  /**
   * 获取配置
   */
  getConfig(): NotificationCenterConfig {
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
          console.error(`Error in notification center event listener for ${type}:`, error)
        }
      })
    }
  }

  /**
   * 销毁通知中心
   */
  destroy(): void {
    this.groups.clear()
    this.history.length = 0
    this.permissions.clear()
    this.rules.clear()
    this.templates.clear()
    this.snapshots.clear()
    this.eventListeners.clear()
    this.selectedNotifications.clear()
  }
}

// 导出单例实例
export const notificationCenter = new NotificationCenter()
