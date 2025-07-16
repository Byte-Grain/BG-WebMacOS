/**
 * 应用事件系统工具函数
 * 提供常用的辅助功能和实用工具
 */

import type { EventName, EventData } from './useEventBus'
import type { AppEventContext, AppEventPermissions } from './AppEventManager'
import type { PermissionType, PermissionContext } from './AppEventPermissionManager'
import { getAppEventConfig } from './AppEventConfig'

// 事件名称工具
export class EventNameUtils {
  // 生成命名空间事件名
  static createNamespacedEvent(namespace: string, eventName: string): string {
    return `${namespace}:${eventName}`
  }
  
  // 解析命名空间事件名
  static parseNamespacedEvent(namespacedEvent: string): { namespace: string; eventName: string } {
    const parts = namespacedEvent.split(':')
    if (parts.length < 2) {
      return { namespace: '', eventName: namespacedEvent }
    }
    return {
      namespace: parts[0],
      eventName: parts.slice(1).join(':')
    }
  }
  
  // 检查是否为系统事件
  static isSystemEvent(eventName: string): boolean {
    const systemPrefixes = ['system:', 'app:', 'lifecycle:', 'error:', 'debug:']
    return systemPrefixes.some(prefix => eventName.startsWith(prefix))
  }
  
  // 检查是否为跨应用事件
  static isCrossAppEvent(eventName: string): boolean {
    return eventName.startsWith('crossapp:') || eventName.includes('@')
  }
  
  // 生成唯一事件ID
  static generateEventId(appId: string, eventName: string): string {
    return `${appId}:${eventName}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
  }
}

// 权限工具
export class PermissionUtils {
  // 创建默认权限
  static createDefaultPermissions(appId: string, appType: 'system' | 'user' | 'third-party' = 'user'): AppEventPermissions {
    const basePermissions: AppEventPermissions = {
      canEmit: [],
      canListen: [],
      canEmitSystemEvents: false,
      canListenSystemEvents: false,
      canCommunicateWithApps: [],
      maxListeners: 50,
      rateLimits: {
        eventsPerSecond: 10,
        eventsPerMinute: 100
      }
    }
    
    switch (appType) {
      case 'system':
        return {
          ...basePermissions,
          canEmit: ['*'],
          canListen: ['*'],
          canEmitSystemEvents: true,
          canListenSystemEvents: true,
          canCommunicateWithApps: ['*'],
          maxListeners: 200,
          rateLimits: {
            eventsPerSecond: 100,
            eventsPerMinute: 1000
          }
        }
      
      case 'user':
        return {
          ...basePermissions,
          canEmit: [`${appId}:*`, 'user:*'],
          canListen: [`${appId}:*`, 'user:*', 'system:notification', 'system:theme'],
          canListenSystemEvents: true,
          rateLimits: {
            eventsPerSecond: 20,
            eventsPerMinute: 200
          }
        }
      
      case 'third-party':
        return {
          ...basePermissions,
          canEmit: [`${appId}:*`],
          canListen: [`${appId}:*`, 'system:notification'],
          rateLimits: {
            eventsPerSecond: 5,
            eventsPerMinute: 50
          }
        }
      
      default:
        return basePermissions
    }
  }
  
  // 合并权限
  static mergePermissions(
    base: AppEventPermissions,
    additional: Partial<AppEventPermissions>
  ): AppEventPermissions {
    return {
      canEmit: [...(base.canEmit || []), ...(additional.canEmit || [])],
      canListen: [...(base.canListen || []), ...(additional.canListen || [])],
      canEmitSystemEvents: base.canEmitSystemEvents || additional.canEmitSystemEvents || false,
      canListenSystemEvents: base.canListenSystemEvents || additional.canListenSystemEvents || false,
      canCommunicateWithApps: [
        ...(base.canCommunicateWithApps || []),
        ...(additional.canCommunicateWithApps || [])
      ],
      maxListeners: Math.max(base.maxListeners || 0, additional.maxListeners || 0),
      rateLimits: {
        eventsPerSecond: Math.max(
          base.rateLimits?.eventsPerSecond || 0,
          additional.rateLimits?.eventsPerSecond || 0
        ),
        eventsPerMinute: Math.max(
          base.rateLimits?.eventsPerMinute || 0,
          additional.rateLimits?.eventsPerMinute || 0
        )
      }
    }
  }
  
  // 检查权限模式匹配
  static matchesPattern(pattern: string, target: string): boolean {
    if (pattern === '*') return true
    if (pattern === target) return true
    
    // 支持通配符匹配
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    return new RegExp(`^${regexPattern}$`).test(target)
  }
  
  // 验证权限配置
  static validatePermissions(permissions: AppEventPermissions): boolean {
    try {
      // 检查基本结构
      if (!permissions || typeof permissions !== 'object') {
        return false
      }
      
      // 检查数组字段
      const arrayFields = ['canEmit', 'canListen', 'canCommunicateWithApps']
      for (const field of arrayFields) {
        const value = permissions[field as keyof AppEventPermissions]
        if (value && !Array.isArray(value)) {
          return false
        }
      }
      
      // 检查布尔字段
      const booleanFields = ['canEmitSystemEvents', 'canListenSystemEvents']
      for (const field of booleanFields) {
        const value = permissions[field as keyof AppEventPermissions]
        if (value !== undefined && typeof value !== 'boolean') {
          return false
        }
      }
      
      // 检查数字字段
      if (permissions.maxListeners !== undefined && 
          (typeof permissions.maxListeners !== 'number' || permissions.maxListeners < 0)) {
        return false
      }
      
      // 检查速率限制
      if (permissions.rateLimits) {
        const { eventsPerSecond, eventsPerMinute } = permissions.rateLimits
        if (eventsPerSecond !== undefined && 
            (typeof eventsPerSecond !== 'number' || eventsPerSecond < 0)) {
          return false
        }
        if (eventsPerMinute !== undefined && 
            (typeof eventsPerMinute !== 'number' || eventsPerMinute < 0)) {
          return false
        }
      }
      
      return true
    } catch {
      return false
    }
  }
}

// 事件数据工具
export class EventDataUtils {
  // 序列化事件数据
  static serialize<T extends EventName>(eventName: T, data: EventData<T>): string {
    try {
      return JSON.stringify({
        eventName,
        data,
        timestamp: Date.now(),
        version: '1.0'
      })
    } catch (error) {
      throw new Error(`Failed to serialize event data: ${error}`)
    }
  }
  
  // 反序列化事件数据
  static deserialize<T extends EventName>(serialized: string): {
    eventName: T
    data: EventData<T>
    timestamp: number
    version: string
  } {
    try {
      const parsed = JSON.parse(serialized)
      if (!parsed.eventName || !parsed.data || !parsed.timestamp) {
        throw new Error('Invalid serialized event data format')
      }
      return parsed
    } catch (error) {
      throw new Error(`Failed to deserialize event data: ${error}`)
    }
  }
  
  // 验证事件数据
  static validate<T extends EventName>(eventName: T, data: any): data is EventData<T> {
    try {
      // 基本类型检查
      if (data === null || data === undefined) {
        return false
      }
      
      // 检查是否可序列化
      JSON.stringify(data)
      
      // 检查循环引用
      const seen = new WeakSet()
      const checkCircular = (obj: any): boolean => {
        if (obj && typeof obj === 'object') {
          if (seen.has(obj)) {
            return false
          }
          seen.add(obj)
          for (const key in obj) {
            if (!checkCircular(obj[key])) {
              return false
            }
          }
        }
        return true
      }
      
      return checkCircular(data)
    } catch {
      return false
    }
  }
  
  // 清理事件数据（移除不可序列化的属性）
  static sanitize<T extends EventName>(data: EventData<T>): EventData<T> {
    const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
      // 移除函数
      if (typeof value === 'function') {
        return undefined
      }
      // 移除Symbol
      if (typeof value === 'symbol') {
        return undefined
      }
      // 移除undefined
      if (value === undefined) {
        return null
      }
      return value
    }))
    
    return sanitized
  }
  
  // 计算事件数据大小（字节）
  static calculateSize<T extends EventName>(eventName: T, data: EventData<T>): number {
    try {
      const serialized = this.serialize(eventName, data)
      return new Blob([serialized]).size
    } catch {
      return 0
    }
  }
}

// 性能工具
export class PerformanceUtils {
  private static measurements = new Map<string, number>()
  
  // 开始性能测量
  static startMeasurement(id: string): void {
    this.measurements.set(id, performance.now())
  }
  
  // 结束性能测量
  static endMeasurement(id: string): number {
    const startTime = this.measurements.get(id)
    if (!startTime) {
      return 0
    }
    
    const duration = performance.now() - startTime
    this.measurements.delete(id)
    return duration
  }
  
  // 测量函数执行时间
  static async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now()
    const result = await fn()
    const duration = performance.now() - startTime
    return { result, duration }
  }
  
  // 测量同步函数执行时间
  static measure<T>(fn: () => T): { result: T; duration: number } {
    const startTime = performance.now()
    const result = fn()
    const duration = performance.now() - startTime
    return { result, duration }
  }
  
  // 创建性能监控装饰器
  static createPerformanceDecorator(category: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value
      
      descriptor.value = async function (...args: any[]) {
        const measurementId = `${category}:${propertyKey}:${Date.now()}`
        PerformanceUtils.startMeasurement(measurementId)
        
        try {
          const result = await originalMethod.apply(this, args)
          return result
        } finally {
          const duration = PerformanceUtils.endMeasurement(measurementId)
          const config = getAppEventConfig().getDebugConfig()
          
          if (config.logPerformance) {
            console.debug(`[Performance] ${category}.${propertyKey}: ${duration.toFixed(2)}ms`)
          }
        }
      }
      
      return descriptor
    }
  }
}

// 调试工具
export class DebugUtils {
  private static debugEnabled = false
  
  // 设置调试模式
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled
  }
  
  // 调试日志
  static log(category: string, message: string, data?: any): void {
    if (!this.debugEnabled) return
    
    const config = getAppEventConfig().getDebugConfig()
    if (!config.enabled) return
    
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${category}] ${message}`
    
    switch (config.logLevel) {
      case 'debug':
        console.debug(logMessage, data)
        break
      case 'info':
        console.info(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'error':
        console.error(logMessage, data)
        break
    }
  }
  
  // 事件调试信息
  static logEvent<T extends EventName>(
    action: 'emit' | 'listen',
    eventName: T,
    appId: string,
    data?: EventData<T>
  ): void {
    const config = getAppEventConfig().getDebugConfig()
    if (!config.logEventDetails) return
    
    this.log('Event', `${action.toUpperCase()} ${String(eventName)} from ${appId}`, data)
  }
  
  // 权限调试信息
  static logPermission(
    appId: string,
    permissionType: PermissionType,
    context: PermissionContext | undefined,
    granted: boolean
  ): void {
    this.log(
      'Permission',
      `${appId} ${permissionType} permission ${granted ? 'GRANTED' : 'DENIED'}`,
      context
    )
  }
  
  // 性能调试信息
  static logPerformance(operation: string, duration: number, details?: any): void {
    const config = getAppEventConfig().getDebugConfig()
    if (!config.logPerformance) return
    
    this.log('Performance', `${operation} took ${duration.toFixed(2)}ms`, details)
  }
  
  // 错误调试信息
  static logError(category: string, error: Error, context?: any): void {
    this.log('Error', `${category}: ${error.message}`, {
      stack: error.stack,
      context
    })
  }
}

// 验证工具
export class ValidationUtils {
  // 验证应用ID
  static validateAppId(appId: string): boolean {
    if (!appId || typeof appId !== 'string') {
      return false
    }
    
    // 应用ID应该是有效的标识符
    const appIdRegex = /^[a-zA-Z][a-zA-Z0-9._-]*$/
    return appIdRegex.test(appId) && appId.length >= 3 && appId.length <= 50
  }
  
  // 验证事件名称
  static validateEventName(eventName: string): boolean {
    if (!eventName || typeof eventName !== 'string') {
      return false
    }
    
    // 事件名称应该是有效的标识符，支持命名空间
    const eventNameRegex = /^[a-zA-Z][a-zA-Z0-9._:-]*$/
    return eventNameRegex.test(eventName) && eventName.length >= 1 && eventName.length <= 100
  }
  
  // 验证应用上下文
  static validateAppContext(context: AppEventContext): boolean {
    try {
      return (
        this.validateAppId(context.appId) &&
        typeof context.appName === 'string' &&
        context.appName.length > 0 &&
        typeof context.version === 'string' &&
        context.version.length > 0 &&
        PermissionUtils.validatePermissions(context.permissions)
      )
    } catch {
      return false
    }
  }
}

// 导出所有工具
export const AppEventUtils = {
  EventName: EventNameUtils,
  Permission: PermissionUtils,
  EventData: EventDataUtils,
  Performance: PerformanceUtils,
  Debug: DebugUtils,
  Validation: ValidationUtils
}

export default AppEventUtils