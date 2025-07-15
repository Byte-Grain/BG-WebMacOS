/**
 * 事件路由系统
 * 提供基于模式的事件路由和智能分发机制
 */

import { ref, reactive, computed } from 'vue'
import type { EventName, EventData, EventCallback } from './useEventBus'

// 路由模式类型
export type RoutePattern = string | RegExp | ((eventName: string) => boolean)

// 路由配置
export interface RouteConfig {
  name: string
  pattern: RoutePattern
  priority: number
  enabled: boolean
  weight?: number
  condition?: (eventName: string, eventData: any) => boolean
  transform?: (eventName: string, eventData: any) => { eventName: string; eventData: any }
  metadata?: Record<string, any>
}

// 路由目标
export interface RouteTarget {
  id: string
  callback: EventCallback
  config: RouteTargetConfig
  stats: RouteTargetStats
}

// 路由目标配置
export interface RouteTargetConfig {
  name?: string
  group?: string
  priority: number
  enabled: boolean
  maxConcurrency?: number
  timeout?: number
  retryCount?: number
  retryDelay?: number
}

// 路由目标统计
export interface RouteTargetStats {
  totalCalls: number
  successCalls: number
  errorCalls: number
  averageExecutionTime: number
  lastExecuted?: number
  currentConcurrency: number
}

// 路由匹配结果
export interface RouteMatch {
  route: RouteConfig
  targets: RouteTarget[]
  score: number
  transformedEvent?: { eventName: string; eventData: any }
}

// 分发策略
export type DistributionStrategy = 
  | 'all'           // 分发给所有匹配的目标
  | 'first'         // 只分发给第一个匹配的目标
  | 'random'        // 随机选择一个目标
  | 'round-robin'   // 轮询分发
  | 'weighted'      // 基于权重分发
  | 'load-balanced' // 负载均衡分发

// 分发配置
export interface DistributionConfig {
  strategy: DistributionStrategy
  maxConcurrency: number
  timeout: number
  retryEnabled: boolean
  retryCount: number
  retryDelay: number
  batchSize?: number
  batchDelay?: number
}

// 分发结果
export interface DistributionResult {
  success: boolean
  targetId: string
  executionTime: number
  error?: Error
  retryCount?: number
}

// 路由统计
export interface RouterStats {
  totalRoutes: number
  enabledRoutes: number
  totalTargets: number
  totalDispatches: number
  successfulDispatches: number
  failedDispatches: number
  averageDispatchTime: number
}

/**
 * 事件路由组合式函数
 */
export function useEventRouter() {
  // 路由注册表
  const routes = reactive<Map<string, RouteConfig>>(new Map())
  
  // 路由目标注册表
  const targets = reactive<Map<string, Map<string, RouteTarget>>>(new Map())
  
  // 轮询计数器
  const roundRobinCounters = reactive<Map<string, number>>(new Map())
  
  // 统计信息
  const stats = reactive<RouterStats>({
    totalRoutes: 0,
    enabledRoutes: 0,
    totalTargets: 0,
    totalDispatches: 0,
    successfulDispatches: 0,
    failedDispatches: 0,
    averageDispatchTime: 0
  })

  // 默认分发配置
  const defaultDistributionConfig: DistributionConfig = {
    strategy: 'all',
    maxConcurrency: 10,
    timeout: 5000,
    retryEnabled: true,
    retryCount: 3,
    retryDelay: 1000
  }

  // 是否启用路由系统
  const enabled = ref(true)

  /**
   * 注册路由
   */
  function registerRoute(config: RouteConfig): string {
    const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    routes.set(id, config)
    
    // 为路由创建目标映射
    if (!targets.has(id)) {
      targets.set(id, new Map())
    }
    
    updateStats()
    return id
  }

  /**
   * 注销路由
   */
  function unregisterRoute(routeId: string): boolean {
    const result = routes.delete(routeId)
    if (result) {
      targets.delete(routeId)
      roundRobinCounters.delete(routeId)
      updateStats()
    }
    return result
  }

  /**
   * 为路由添加目标
   */
  function addTarget(
    routeId: string,
    callback: EventCallback,
    config: Partial<RouteTargetConfig> = {}
  ): string {
    const routeTargets = targets.get(routeId)
    if (!routeTargets) {
      throw new Error(`Route ${routeId} not found`)
    }

    const targetId = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const target: RouteTarget = {
      id: targetId,
      callback,
      config: {
        priority: 0,
        enabled: true,
        maxConcurrency: 1,
        timeout: 5000,
        retryCount: 0,
        retryDelay: 1000,
        ...config
      },
      stats: {
        totalCalls: 0,
        successCalls: 0,
        errorCalls: 0,
        averageExecutionTime: 0,
        currentConcurrency: 0
      }
    }

    routeTargets.set(targetId, target)
    updateStats()
    return targetId
  }

  /**
   * 移除目标
   */
  function removeTarget(routeId: string, targetId: string): boolean {
    const routeTargets = targets.get(routeId)
    if (!routeTargets) {
      return false
    }
    
    const result = routeTargets.delete(targetId)
    if (result) {
      updateStats()
    }
    return result
  }

  /**
   * 匹配路由
   */
  function matchRoutes(eventName: string, eventData: any): RouteMatch[] {
    if (!enabled.value) {
      return []
    }

    const matches: RouteMatch[] = []

    for (const [routeId, route] of routes.entries()) {
      if (!route.enabled) {
        continue
      }

      // 检查条件
      if (route.condition && !route.condition(eventName, eventData)) {
        continue
      }

      // 模式匹配
      let isMatch = false
      let score = 0

      if (typeof route.pattern === 'string') {
        // 字符串模式（支持通配符）
        const regex = new RegExp(route.pattern.replace(/\*/g, '.*'))
        isMatch = regex.test(eventName)
        score = eventName === route.pattern ? 100 : 50
      } else if (route.pattern instanceof RegExp) {
        // 正则表达式模式
        isMatch = route.pattern.test(eventName)
        score = 75
      } else if (typeof route.pattern === 'function') {
        // 函数模式
        isMatch = route.pattern(eventName)
        score = 60
      }

      if (isMatch) {
        const routeTargets = targets.get(routeId)
        const enabledTargets = routeTargets 
          ? Array.from(routeTargets.values()).filter(t => t.config.enabled)
          : []

        // 应用事件转换
        let transformedEvent: { eventName: string; eventData: any } | undefined
        if (route.transform) {
          transformedEvent = route.transform(eventName, eventData)
        }

        matches.push({
          route,
          targets: enabledTargets,
          score: score + route.priority,
          transformedEvent
        })
      }
    }

    // 按分数排序
    return matches.sort((a, b) => b.score - a.score)
  }

  /**
   * 分发事件
   */
  async function dispatch(
    eventName: string,
    eventData: any,
    config: Partial<DistributionConfig> = {}
  ): Promise<DistributionResult[]> {
    const distributionConfig = { ...defaultDistributionConfig, ...config }
    const matches = matchRoutes(eventName, eventData)
    const results: DistributionResult[] = []

    for (const match of matches) {
      if (match.targets.length === 0) {
        continue
      }

      // 使用转换后的事件数据（如果有）
      const finalEventName = match.transformedEvent?.eventName || eventName
      const finalEventData = match.transformedEvent?.eventData || eventData

      // 根据策略选择目标
      const selectedTargets = selectTargets(match.targets, distributionConfig, match.route.name)
      
      // 分发到选中的目标
      const dispatchResults = await dispatchToTargets(
        selectedTargets,
        finalEventName,
        finalEventData,
        distributionConfig
      )
      
      results.push(...dispatchResults)
    }

    // 更新统计信息
    updateDispatchStats(results)
    
    return results
  }

  /**
   * 根据策略选择目标
   */
  function selectTargets(
    targets: RouteTarget[],
    config: DistributionConfig,
    routeName: string
  ): RouteTarget[] {
    if (targets.length === 0) {
      return []
    }

    // 过滤可用目标（检查并发限制）
    const availableTargets = targets.filter(target => 
      target.config.maxConcurrency === undefined || 
      target.stats.currentConcurrency < target.config.maxConcurrency
    )

    if (availableTargets.length === 0) {
      return []
    }

    switch (config.strategy) {
      case 'all':
        return availableTargets
      
      case 'first':
        return [availableTargets[0]]
      
      case 'random':
        const randomIndex = Math.floor(Math.random() * availableTargets.length)
        return [availableTargets[randomIndex]]
      
      case 'round-robin':
        const counter = roundRobinCounters.get(routeName) || 0
        const selectedIndex = counter % availableTargets.length
        roundRobinCounters.set(routeName, counter + 1)
        return [availableTargets[selectedIndex]]
      
      case 'weighted':
        return selectWeightedTargets(availableTargets)
      
      case 'load-balanced':
        return selectLoadBalancedTargets(availableTargets)
      
      default:
        return availableTargets
    }
  }

  /**
   * 基于权重选择目标
   */
  function selectWeightedTargets(targets: RouteTarget[]): RouteTarget[] {
    const totalWeight = targets.reduce((sum, target) => 
      sum + (target.config.priority || 1), 0
    )
    
    const random = Math.random() * totalWeight
    let currentWeight = 0
    
    for (const target of targets) {
      currentWeight += target.config.priority || 1
      if (random <= currentWeight) {
        return [target]
      }
    }
    
    return [targets[0]]
  }

  /**
   * 基于负载均衡选择目标
   */
  function selectLoadBalancedTargets(targets: RouteTarget[]): RouteTarget[] {
    // 选择当前并发数最少的目标
    const sortedTargets = [...targets].sort((a, b) => {
      const aLoad = a.stats.currentConcurrency / (a.config.maxConcurrency || 1)
      const bLoad = b.stats.currentConcurrency / (b.config.maxConcurrency || 1)
      return aLoad - bLoad
    })
    
    return [sortedTargets[0]]
  }

  /**
   * 分发到目标
   */
  async function dispatchToTargets(
    targets: RouteTarget[],
    eventName: string,
    eventData: any,
    config: DistributionConfig
  ): Promise<DistributionResult[]> {
    const results: DistributionResult[] = []
    
    // 批处理分发
    if (config.batchSize && targets.length > config.batchSize) {
      for (let i = 0; i < targets.length; i += config.batchSize) {
        const batch = targets.slice(i, i + config.batchSize)
        const batchResults = await Promise.all(
          batch.map(target => dispatchToTarget(target, eventName, eventData, config))
        )
        results.push(...batchResults)
        
        // 批次间延迟
        if (config.batchDelay && i + config.batchSize < targets.length) {
          await new Promise(resolve => setTimeout(resolve, config.batchDelay))
        }
      }
    } else {
      // 并发分发
      const dispatchPromises = targets.map(target => 
        dispatchToTarget(target, eventName, eventData, config)
      )
      
      const batchResults = await Promise.all(dispatchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  /**
   * 分发到单个目标
   */
  async function dispatchToTarget(
    target: RouteTarget,
    eventName: string,
    eventData: any,
    config: DistributionConfig
  ): Promise<DistributionResult> {
    const startTime = performance.now()
    let retryCount = 0
    
    // 增加并发计数
    target.stats.currentConcurrency++
    target.stats.totalCalls++
    
    while (retryCount <= (config.retryEnabled ? config.retryCount : 0)) {
      try {
        // 设置超时
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Target execution timeout')), 
            target.config.timeout || config.timeout)
        })
        
        // 执行回调
        const executePromise = Promise.resolve(target.callback(eventData))
        
        await Promise.race([executePromise, timeoutPromise])
        
        const executionTime = performance.now() - startTime
        
        // 更新成功统计
        updateTargetStats(target, executionTime, true)
        
        return {
          success: true,
          targetId: target.id,
          executionTime,
          retryCount
        }
        
      } catch (error) {
        retryCount++
        
        if (retryCount > (config.retryEnabled ? config.retryCount : 0)) {
          const executionTime = performance.now() - startTime
          const err = error instanceof Error ? error : new Error(String(error))
          
          // 更新失败统计
          updateTargetStats(target, executionTime, false)
          
          return {
            success: false,
            targetId: target.id,
            executionTime,
            error: err,
            retryCount: retryCount - 1
          }
        }
        
        // 重试延迟
        if (config.retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay))
        }
      }
    }
    
    // 这里不应该到达，但为了类型安全
    const executionTime = performance.now() - startTime
    updateTargetStats(target, executionTime, false)
    
    return {
      success: false,
      targetId: target.id,
      executionTime,
      error: new Error('Unexpected error'),
      retryCount
    }
  }

  /**
   * 更新目标统计信息
   */
  function updateTargetStats(target: RouteTarget, executionTime: number, success: boolean): void {
    // 减少并发计数
    target.stats.currentConcurrency = Math.max(0, target.stats.currentConcurrency - 1)
    
    // 更新统计
    if (success) {
      target.stats.successCalls++
    } else {
      target.stats.errorCalls++
    }
    
    // 更新平均执行时间
    const totalCalls = target.stats.successCalls + target.stats.errorCalls
    target.stats.averageExecutionTime = 
      (target.stats.averageExecutionTime * (totalCalls - 1) + executionTime) / totalCalls
    
    target.stats.lastExecuted = Date.now()
  }

  /**
   * 更新分发统计信息
   */
  function updateDispatchStats(results: DistributionResult[]): void {
    stats.totalDispatches += results.length
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount
    
    stats.successfulDispatches += successCount
    stats.failedDispatches += failCount
    
    // 更新平均分发时间
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0)
    const avgTime = results.length > 0 ? totalTime / results.length : 0
    
    stats.averageDispatchTime = 
      (stats.averageDispatchTime * (stats.totalDispatches - results.length) + totalTime) / 
      stats.totalDispatches
  }

  /**
   * 更新统计信息
   */
  function updateStats(): void {
    stats.totalRoutes = routes.size
    stats.enabledRoutes = Array.from(routes.values()).filter(r => r.enabled).length
    stats.totalTargets = Array.from(targets.values())
      .reduce((sum, routeTargets) => sum + routeTargets.size, 0)
  }

  /**
   * 获取路由列表
   */
  function getRoutes(): RouteConfig[] {
    return Array.from(routes.values())
  }

  /**
   * 获取路由目标
   */
  function getTargets(routeId?: string): RouteTarget[] {
    if (routeId) {
      const routeTargets = targets.get(routeId)
      return routeTargets ? Array.from(routeTargets.values()) : []
    }
    
    const allTargets: RouteTarget[] = []
    for (const routeTargets of targets.values()) {
      allTargets.push(...Array.from(routeTargets.values()))
    }
    return allTargets
  }

  /**
   * 清理路由
   */
  function clearRoutes(): void {
    routes.clear()
    targets.clear()
    roundRobinCounters.clear()
    updateStats()
  }

  /**
   * 重置统计信息
   */
  function resetStats(): void {
    stats.totalDispatches = 0
    stats.successfulDispatches = 0
    stats.failedDispatches = 0
    stats.averageDispatchTime = 0
    
    // 重置所有目标的统计
    for (const routeTargets of targets.values()) {
      for (const target of routeTargets.values()) {
        target.stats.totalCalls = 0
        target.stats.successCalls = 0
        target.stats.errorCalls = 0
        target.stats.averageExecutionTime = 0
        target.stats.lastExecuted = undefined
        target.stats.currentConcurrency = 0
      }
    }
  }

  return {
    // 状态
    enabled,
    stats: readonly(stats),
    
    // 路由管理
    registerRoute,
    unregisterRoute,
    addTarget,
    removeTarget,
    getRoutes,
    getTargets,
    
    // 分发
    dispatch,
    matchRoutes,
    
    // 工具
    clearRoutes,
    resetStats
  }
}

// 导出类型
export type {
  RoutePattern,
  RouteConfig,
  RouteTarget,
  RouteTargetConfig,
  RouteTargetStats,
  RouteMatch,
  DistributionStrategy,
  DistributionConfig,
  DistributionResult,
  RouterStats
}