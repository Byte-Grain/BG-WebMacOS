/**
 * 应用事件权限管理器
 * 实现细粒度的权限控制和动态权限管理
 */

import type { AppEventPermissions } from './AppEventManager'
import type { EventName } from './useEventBus'

// 权限级别
export enum PermissionLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  ADMIN = 3,
  SYSTEM = 4
}

// 权限类型
export enum PermissionType {
  EVENT_EMIT = 'event_emit',
  EVENT_LISTEN = 'event_listen',
  SYSTEM_EVENT = 'system_event',
  CROSS_APP_COMMUNICATION = 'cross_app_communication',
  GLOBAL_EVENT_ACCESS = 'global_event_access',
  LIFECYCLE_CONTROL = 'lifecycle_control',
  PERMISSION_MANAGEMENT = 'permission_management'
}

// 权限规则
export interface PermissionRule {
  id: string
  type: PermissionType
  level: PermissionLevel
  target?: string // 目标应用ID、事件名称等
  pattern?: RegExp // 匹配模式
  conditions?: PermissionCondition[]
  expiry?: number // 过期时间戳
  metadata?: Record<string, any>
}

// 权限条件
export interface PermissionCondition {
  type: 'time' | 'count' | 'rate' | 'context' | 'custom'
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'matches'
  value: any
  field?: string
}

// 权限检查结果
export interface PermissionCheckResult {
  allowed: boolean
  level: PermissionLevel
  reason?: string
  rule?: PermissionRule
  suggestions?: string[]
}

// 权限请求
export interface PermissionRequest {
  appId: string
  type: PermissionType
  target?: string
  level: PermissionLevel
  reason?: string
  temporary?: boolean
  duration?: number
}

// 权限审计日志
export interface PermissionAuditLog {
  id: string
  timestamp: number
  appId: string
  action: 'grant' | 'deny' | 'revoke' | 'check' | 'request'
  type: PermissionType
  target?: string
  level: PermissionLevel
  result: boolean
  reason?: string
  metadata?: Record<string, any>
}

// 权限策略
export interface PermissionPolicy {
  id: string
  name: string
  description: string
  rules: PermissionRule[]
  priority: number
  enabled: boolean
  appPatterns?: string[] // 适用的应用模式
  metadata?: Record<string, any>
}

// 权限上下文
export interface PermissionContext {
  appId: string
  eventName?: string
  targetAppId?: string
  timestamp: number
  userAgent?: string
  sessionId?: string
  metadata?: Record<string, any>
}

// 应用事件权限管理器
export class AppEventPermissionManager {
  private appPermissions = new Map<string, AppEventPermissions>()
  private permissionRules = new Map<string, PermissionRule[]>()
  private globalPolicies: PermissionPolicy[] = []
  private auditLogs: PermissionAuditLog[] = []
  private rateLimits = new Map<string, { count: number; resetTime: number }>()
  private permissionCache = new Map<string, { result: PermissionCheckResult; expiry: number }>()
  
  constructor() {
    this.setupDefaultPolicies()
    this.startCleanupTimer()
  }
  
  // 设置应用权限
  setAppPermissions(appId: string, permissions: AppEventPermissions): void {
    this.appPermissions.set(appId, { ...permissions })
    this.clearPermissionCache(appId)
    
    this.auditLog({
      appId,
      action: 'grant',
      type: PermissionType.PERMISSION_MANAGEMENT,
      level: PermissionLevel.ADMIN,
      result: true,
      reason: 'Permissions updated'
    })
  }
  
  // 获取应用权限
  getAppPermissions(appId: string): AppEventPermissions | undefined {
    return this.appPermissions.get(appId)
  }
  
  // 添加权限规则
  addPermissionRule(appId: string, rule: PermissionRule): void {
    if (!this.permissionRules.has(appId)) {
      this.permissionRules.set(appId, [])
    }
    
    const rules = this.permissionRules.get(appId)!
    rules.push(rule)
    
    // 按优先级排序（level 越高优先级越高）
    rules.sort((a, b) => b.level - a.level)
    
    this.clearPermissionCache(appId)
    
    this.auditLog({
      appId,
      action: 'grant',
      type: rule.type,
      level: rule.level,
      target: rule.target,
      result: true,
      reason: 'Permission rule added'
    })
  }
  
  // 移除权限规则
  removePermissionRule(appId: string, ruleId: string): boolean {
    const rules = this.permissionRules.get(appId)
    if (!rules) return false
    
    const index = rules.findIndex(rule => rule.id === ruleId)
    if (index === -1) return false
    
    const removedRule = rules.splice(index, 1)[0]
    this.clearPermissionCache(appId)
    
    this.auditLog({
      appId,
      action: 'revoke',
      type: removedRule.type,
      level: removedRule.level,
      target: removedRule.target,
      result: true,
      reason: 'Permission rule removed'
    })
    
    return true
  }
  
  // 检查权限
  checkPermission(
    appId: string,
    type: PermissionType,
    context: PermissionContext
  ): PermissionCheckResult {
    // 检查缓存
    const cacheKey = this.getCacheKey(appId, type, context)
    const cached = this.permissionCache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return cached.result
    }
    
    const result = this.performPermissionCheck(appId, type, context)
    
    // 缓存结果（5分钟）
    this.permissionCache.set(cacheKey, {
      result,
      expiry: Date.now() + 5 * 60 * 1000
    })
    
    // 审计日志
    this.auditLog({
      appId,
      action: 'check',
      type,
      target: context.targetAppId || context.eventName,
      level: result.level,
      result: result.allowed,
      reason: result.reason
    })
    
    return result
  }
  
  // 执行权限检查
  private performPermissionCheck(
    appId: string,
    type: PermissionType,
    context: PermissionContext
  ): PermissionCheckResult {
    // 1. 检查基础权限
    const basePermissions = this.appPermissions.get(appId)
    if (!basePermissions) {
      return {
        allowed: false,
        level: PermissionLevel.NONE,
        reason: 'App not registered or no permissions set',
        suggestions: ['Register the app first', 'Set basic permissions']
      }
    }
    
    // 2. 检查速率限制
    const rateLimitResult = this.checkRateLimit(appId, type)
    if (!rateLimitResult.allowed) {
      return rateLimitResult
    }
    
    // 3. 检查应用特定规则
    const appRules = this.permissionRules.get(appId) || []
    for (const rule of appRules) {
      if (rule.type === type) {
        const ruleResult = this.evaluateRule(rule, context)
        if (ruleResult !== null) {
          return ruleResult
        }
      }
    }
    
    // 4. 检查全局策略
    for (const policy of this.globalPolicies) {
      if (!policy.enabled) continue
      
      const policyResult = this.evaluatePolicy(policy, appId, type, context)
      if (policyResult !== null) {
        return policyResult
      }
    }
    
    // 5. 检查基础权限配置
    return this.checkBasePermissions(basePermissions, type, context)
  }
  
  // 检查速率限制
  private checkRateLimit(appId: string, type: PermissionType): PermissionCheckResult {
    const permissions = this.appPermissions.get(appId)
    if (!permissions) {
      return { allowed: false, level: PermissionLevel.NONE, reason: 'No permissions' }
    }
    
    const now = Date.now()
    const limitKey = `${appId}:${type}`
    const limit = this.rateLimits.get(limitKey)
    
    if (!limit || limit.resetTime <= now) {
      // 重置计数器
      this.rateLimits.set(limitKey, {
        count: 1,
        resetTime: now + 1000 // 1秒窗口
      })
      return { allowed: true, level: PermissionLevel.READ }
    }
    
    const maxRate = permissions.maxEventEmitsPerSecond || 100
    if (limit.count >= maxRate) {
      return {
        allowed: false,
        level: PermissionLevel.NONE,
        reason: `Rate limit exceeded: ${limit.count}/${maxRate} per second`,
        suggestions: ['Reduce event emission frequency', 'Request higher rate limits']
      }
    }
    
    limit.count++
    return { allowed: true, level: PermissionLevel.READ }
  }
  
  // 评估权限规则
  private evaluateRule(rule: PermissionRule, context: PermissionContext): PermissionCheckResult | null {
    // 检查过期时间
    if (rule.expiry && rule.expiry <= Date.now()) {
      return {
        allowed: false,
        level: PermissionLevel.NONE,
        reason: 'Permission rule expired',
        rule
      }
    }
    
    // 检查目标匹配
    if (rule.target) {
      const target = context.targetAppId || context.eventName
      if (target !== rule.target) {
        return null // 不匹配，继续检查其他规则
      }
    }
    
    // 检查模式匹配
    if (rule.pattern) {
      const target = context.targetAppId || context.eventName || ''
      if (!rule.pattern.test(target)) {
        return null
      }
    }
    
    // 检查条件
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return {
            allowed: false,
            level: PermissionLevel.NONE,
            reason: `Condition not met: ${condition.type}`,
            rule
          }
        }
      }
    }
    
    return {
      allowed: rule.level > PermissionLevel.NONE,
      level: rule.level,
      reason: rule.level > PermissionLevel.NONE ? 'Rule allows access' : 'Rule denies access',
      rule
    }
  }
  
  // 评估权限策略
  private evaluatePolicy(
    policy: PermissionPolicy,
    appId: string,
    type: PermissionType,
    context: PermissionContext
  ): PermissionCheckResult | null {
    // 检查应用模式匹配
    if (policy.appPatterns) {
      const matches = policy.appPatterns.some(pattern => {
        const regex = new RegExp(pattern)
        return regex.test(appId)
      })
      if (!matches) {
        return null
      }
    }
    
    // 评估策略规则
    for (const rule of policy.rules) {
      if (rule.type === type) {
        const result = this.evaluateRule(rule, context)
        if (result !== null) {
          return result
        }
      }
    }
    
    return null
  }
  
  // 检查基础权限
  private checkBasePermissions(
    permissions: AppEventPermissions,
    type: PermissionType,
    context: PermissionContext
  ): PermissionCheckResult {
    switch (type) {
      case PermissionType.SYSTEM_EVENT:
        return {
          allowed: permissions.canEmitSystemEvents || permissions.canListenSystemEvents,
          level: permissions.canEmitSystemEvents ? PermissionLevel.WRITE : PermissionLevel.READ,
          reason: permissions.canEmitSystemEvents || permissions.canListenSystemEvents 
            ? 'Base system event permission granted' 
            : 'No system event permissions'
        }
        
      case PermissionType.CROSS_APP_COMMUNICATION:
        const canCommunicate = permissions.canCommunicateWithApps.includes('*') ||
          (context.targetAppId && permissions.canCommunicateWithApps.includes(context.targetAppId))
        return {
          allowed: canCommunicate,
          level: canCommunicate ? PermissionLevel.WRITE : PermissionLevel.NONE,
          reason: canCommunicate 
            ? 'Cross-app communication allowed' 
            : 'Cross-app communication not permitted'
        }
        
      case PermissionType.GLOBAL_EVENT_ACCESS:
        return {
          allowed: permissions.canAccessGlobalEvents,
          level: permissions.canAccessGlobalEvents ? PermissionLevel.READ : PermissionLevel.NONE,
          reason: permissions.canAccessGlobalEvents 
            ? 'Global event access granted' 
            : 'No global event access'
        }
        
      default:
        return {
          allowed: true,
          level: PermissionLevel.READ,
          reason: 'Default permission granted'
        }
    }
  }
  
  // 评估条件
  private evaluateCondition(condition: PermissionCondition, context: PermissionContext): boolean {
    let actualValue: any
    
    switch (condition.type) {
      case 'time':
        actualValue = context.timestamp
        break
      case 'context':
        actualValue = condition.field ? context.metadata?.[condition.field] : context
        break
      default:
        return true // 未知条件类型，默认通过
    }
    
    return this.compareValues(actualValue, condition.operator, condition.value)
  }
  
  // 比较值
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return actual === expected
      case 'ne': return actual !== expected
      case 'gt': return actual > expected
      case 'gte': return actual >= expected
      case 'lt': return actual < expected
      case 'lte': return actual <= expected
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      case 'not_in': return Array.isArray(expected) && !expected.includes(actual)
      case 'matches': return expected instanceof RegExp && expected.test(String(actual))
      default: return false
    }
  }
  
  // 请求权限
  async requestPermission(request: PermissionRequest): Promise<PermissionCheckResult> {
    this.auditLog({
      appId: request.appId,
      action: 'request',
      type: request.type,
      target: request.target,
      level: request.level,
      result: false, // 待处理
      reason: request.reason
    })
    
    // 这里可以实现权限请求的审批流程
    // 目前简单返回当前权限状态
    const context: PermissionContext = {
      appId: request.appId,
      targetAppId: request.target,
      timestamp: Date.now()
    }
    
    return this.checkPermission(request.appId, request.type, context)
  }
  
  // 授予临时权限
  grantTemporaryPermission(
    appId: string,
    type: PermissionType,
    level: PermissionLevel,
    duration: number,
    target?: string
  ): void {
    const rule: PermissionRule = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      level,
      target,
      expiry: Date.now() + duration,
      metadata: { temporary: true }
    }
    
    this.addPermissionRule(appId, rule)
  }
  
  // 撤销权限
  revokePermission(appId: string, type: PermissionType, target?: string): boolean {
    const rules = this.permissionRules.get(appId)
    if (!rules) return false
    
    let revoked = false
    for (let i = rules.length - 1; i >= 0; i--) {
      const rule = rules[i]
      if (rule.type === type && (!target || rule.target === target)) {
        rules.splice(i, 1)
        revoked = true
        
        this.auditLog({
          appId,
          action: 'revoke',
          type: rule.type,
          target: rule.target,
          level: rule.level,
          result: true,
          reason: 'Permission revoked'
        })
      }
    }
    
    if (revoked) {
      this.clearPermissionCache(appId)
    }
    
    return revoked
  }
  
  // 获取权限审计日志
  getAuditLogs(appId?: string, limit: number = 100): PermissionAuditLog[] {
    let logs = this.auditLogs
    
    if (appId) {
      logs = logs.filter(log => log.appId === appId)
    }
    
    return logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  // 清理过期权限
  cleanupExpiredPermissions(): number {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [appId, rules] of this.permissionRules.entries()) {
      const originalLength = rules.length
      
      // 移除过期规则
      const validRules = rules.filter(rule => !rule.expiry || rule.expiry > now)
      
      if (validRules.length !== originalLength) {
        this.permissionRules.set(appId, validRules)
        this.clearPermissionCache(appId)
        cleanedCount += originalLength - validRules.length
      }
    }
    
    // 清理过期缓存
    for (const [key, cached] of this.permissionCache.entries()) {
      if (cached.expiry <= now) {
        this.permissionCache.delete(key)
      }
    }
    
    return cleanedCount
  }
  
  // 设置默认策略
  private setupDefaultPolicies(): void {
    // 系统应用策略
    this.globalPolicies.push({
      id: 'system-apps-policy',
      name: '系统应用策略',
      description: '为系统应用提供完整权限',
      priority: 100,
      enabled: true,
      appPatterns: ['system-*', 'macos-*'],
      rules: [
        {
          id: 'system-full-access',
          type: PermissionType.SYSTEM_EVENT,
          level: PermissionLevel.SYSTEM
        },
        {
          id: 'system-cross-app',
          type: PermissionType.CROSS_APP_COMMUNICATION,
          level: PermissionLevel.ADMIN
        }
      ]
    })
    
    // 第三方应用策略
    this.globalPolicies.push({
      id: 'third-party-apps-policy',
      name: '第三方应用策略',
      description: '为第三方应用提供受限权限',
      priority: 50,
      enabled: true,
      appPatterns: ['3rdparty-*'],
      rules: [
        {
          id: 'third-party-limited',
          type: PermissionType.SYSTEM_EVENT,
          level: PermissionLevel.READ
        }
      ]
    })
  }
  
  // 审计日志
  private auditLog(log: Omit<PermissionAuditLog, 'id' | 'timestamp'>): void {
    const auditLog: PermissionAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...log
    }
    
    this.auditLogs.push(auditLog)
    
    // 保持日志数量在合理范围内
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000)
    }
  }
  
  // 获取缓存键
  private getCacheKey(appId: string, type: PermissionType, context: PermissionContext): string {
    const target = context.targetAppId || context.eventName || ''
    return `${appId}:${type}:${target}`
  }
  
  // 清理权限缓存
  private clearPermissionCache(appId: string): void {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${appId}:`)) {
        this.permissionCache.delete(key)
      }
    }
  }
  
  // 启动清理定时器
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredPermissions()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }
  
  // 获取应用权限摘要
  getAppPermissionSummary(appId: string): {
    basePermissions: AppEventPermissions | null
    customRules: number
    auditLogCount: number
    lastActivity: number | null
  } {
    const basePermissions = this.appPermissions.get(appId) || null
    const customRules = this.permissionRules.get(appId)?.length || 0
    const appLogs = this.auditLogs.filter(log => log.appId === appId)
    const auditLogCount = appLogs.length
    const lastActivity = appLogs.length > 0 
      ? Math.max(...appLogs.map(log => log.timestamp))
      : null
    
    return {
      basePermissions,
      customRules,
      auditLogCount,
      lastActivity
    }
  }
  
  // 导出权限配置
  exportPermissions(appId?: string): any {
    const result: any = {
      timestamp: Date.now(),
      version: '1.0.0'
    }
    
    if (appId) {
      result.app = {
        id: appId,
        permissions: this.appPermissions.get(appId),
        rules: this.permissionRules.get(appId) || []
      }
    } else {
      result.apps = {}
      for (const [id, permissions] of this.appPermissions.entries()) {
        result.apps[id] = {
          permissions,
          rules: this.permissionRules.get(id) || []
        }
      }
      result.globalPolicies = this.globalPolicies
    }
    
    return result
  }
  
  // 导入权限配置
  importPermissions(data: any): void {
    if (data.app) {
      // 导入单个应用
      const { id, permissions, rules } = data.app
      if (permissions) {
        this.setAppPermissions(id, permissions)
      }
      if (rules) {
        this.permissionRules.set(id, rules)
      }
    } else if (data.apps) {
      // 导入多个应用
      for (const [appId, appData] of Object.entries(data.apps as any)) {
        if (appData.permissions) {
          this.setAppPermissions(appId, appData.permissions)
        }
        if (appData.rules) {
          this.permissionRules.set(appId, appData.rules)
        }
      }
    }
    
    if (data.globalPolicies) {
      this.globalPolicies.splice(0, this.globalPolicies.length, ...data.globalPolicies)
    }
  }
}

// 创建默认的权限管理器实例
let defaultPermissionManager: AppEventPermissionManager | null = null

// 获取默认权限管理器
export function getAppEventPermissionManager(): AppEventPermissionManager {
  if (!defaultPermissionManager) {
    defaultPermissionManager = new AppEventPermissionManager()
  }
  return defaultPermissionManager
}

// 重置默认权限管理器（主要用于测试）
export function resetAppEventPermissionManager(): void {
  defaultPermissionManager = null
}