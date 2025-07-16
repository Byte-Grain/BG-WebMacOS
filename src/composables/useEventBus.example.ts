// 事件系统使用示例
// 本文件展示了如何使用优化后的事件系统

import { useEventBus, EVENTS, type EventData } from './useEventBus'
import { ref, onMounted } from 'vue'

// 示例1：基础用法
export function basicEventExample() {
  const { on, emit, off } = useEventBus()
  
  // 监听应用打开事件
  const listenerId = on(EVENTS.APP_OPENED, (data) => {
    console.log('应用已打开:', data.appKey, '进程ID:', data.pid)
  })
  
  // 触发应用打开事件
  emit(EVENTS.APP_OPENED, {
    appKey: 'system_finder',
    pid: 12345
  })
  
  // 移除监听器
  off(EVENTS.APP_OPENED, listenerId)
}

// 示例2：组件中使用（自动清理）
export function componentEventExample() {
  const { on, emit, once, namespace } = useEventBus({
    namespace: 'my-component',
    debugMode: true
  })
  
  onMounted(() => {
    // 监听主题变化
    on(EVENTS.THEME_CHANGED, (data) => {
      console.log('主题已变更:', data.theme)
      // 更新组件样式
    })
    
    // 一次性监听系统就绪事件
    once(EVENTS.SYSTEM_READY, () => {
      console.log('系统已就绪')
      // 初始化组件
    })
    
    console.log('组件命名空间:', namespace)
  })
  
  // 组件卸载时会自动清理所有监听器
}

// 示例3：高级功能使用
export function advancedEventExample() {
  const { 
    on, 
    emit, 
    emitAsync, 
    waitFor, 
    getStats, 
    offByFilter,
    cleanupStaleListeners 
  } = useEventBus({
    namespace: 'advanced-component'
  })
  
  // 带优先级的监听器
  on(EVENTS.APP_FOCUS, (data) => {
    console.log('高优先级处理:', data.appKey)
  }, { priority: 10 })
  
  on(EVENTS.APP_FOCUS, (data) => {
    console.log('低优先级处理:', data.appKey)
  }, { priority: 1 })
  
  // 异步触发事件
  const handleAsyncEvent = async () => {
    await emitAsync(EVENTS.SYSTEM_READY, undefined)
    console.log('异步事件已触发')
  }
  
  // 等待事件触发
  const waitForUserLogin = async () => {
    try {
      const loginData = await waitFor(EVENTS.USER_LOGIN, 5000) // 5秒超时
      console.log('用户已登录:', loginData.username)
    } catch (error) {
      console.log('等待登录超时')
    }
  }
  
  // 获取统计信息
  const showStats = () => {
    const stats = getStats()
    console.log('事件统计:', stats)
  }
  
  // 按命名空间清理监听器
  const cleanupByNamespace = () => {
    const removed = offByFilter({ namespace: 'old-component' })
    console.log('已清理监听器数量:', removed)
  }
  
  // 清理过期监听器（超过5分钟）
  const cleanupStale = () => {
    const removed = cleanupStaleListeners(300000)
    console.log('已清理过期监听器数量:', removed)
  }
  
  return {
    handleAsyncEvent,
    waitForUserLogin,
    showStats,
    cleanupByNamespace,
    cleanupStale
  }
}

// 示例4：类型安全的事件处理
export function typeSafeEventExample() {
  const { on, emit } = useEventBus()
  
  // TypeScript 会自动推断事件数据类型
  on(EVENTS.APP_RESIZE, (data) => {
    // data 的类型自动推断为 { appKey: string; pid: number; width: number; height: number }
    console.log(`应用 ${data.appKey} 调整大小: ${data.width}x${data.height}`)
  })
  
  // 触发事件时必须提供正确的数据类型
  emit(EVENTS.APP_RESIZE, {
    appKey: 'system_finder',
    pid: 12345,
    width: 800,
    height: 600
  })
  
  // 错误示例：类型不匹配会报错
  // emit(EVENTS.APP_RESIZE, { appKey: 'test' }) // ❌ 缺少必需字段
}

// 示例5：事件命名空间管理
export function namespaceEventExample() {
  const appEventBus = useEventBus({ namespace: 'app-manager' })
  const themeEventBus = useEventBus({ namespace: 'theme-manager' })
  
  // 不同命名空间的监听器可以独立管理
  appEventBus.on(EVENTS.APP_OPENED, (data) => {
    console.log('[App Manager] 应用打开:', data.appKey)
  })
  
  themeEventBus.on(EVENTS.THEME_CHANGED, (data) => {
    console.log('[Theme Manager] 主题变更:', data.theme)
  })
  
  // 清理特定命名空间的监听器
  const cleanupAppListeners = () => {
    appEventBus.offAll()
  }
  
  return { cleanupAppListeners }
}

// 示例6：错误处理和调试
export function errorHandlingExample() {
  const { on, emit, bus } = useEventBus({
    debugMode: true // 启用调试模式
  })
  
  // 配置事件总线
  bus.setConfig({
    maxListeners: 50, // 设置最大监听器数量
    enableStats: true, // 启用统计
    debugMode: true // 启用调试
  })
  
  // 监听器中的错误会被自动捕获
  on(EVENTS.SYSTEM_ERROR, (data) => {
    console.error('系统错误:', data.error.message)
    if (data.context) {
      console.error('错误上下文:', data.context)
    }
  })
  
  // 触发系统错误事件
  const triggerError = (error: Error, context?: string) => {
    emit(EVENTS.SYSTEM_ERROR, { error, context })
  }
  
  return { triggerError }
}

// 示例7：性能优化
export function performanceExample() {
  const { on, emit, cleanupStaleListeners, getStats } = useEventBus()
  
  // 定期清理过期监听器
  const startCleanupTimer = () => {
    setInterval(() => {
      const removed = cleanupStaleListeners(600000) // 清理10分钟前的监听器
      if (removed > 0) {
        console.log(`清理了 ${removed} 个过期监听器`)
      }
    }, 300000) // 每5分钟检查一次
  }
  
  // 监控事件系统性能
  const monitorPerformance = () => {
    setInterval(() => {
      const stats = getStats()
      console.log('事件系统统计:', {
        总事件数: stats.totalEvents,
        总监听器数: stats.totalListeners,
        内存使用: `${stats.memoryUsage} bytes`,
        热门事件: Object.entries(stats.eventCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      })
    }, 60000) // 每分钟输出一次统计
  }
  
  return {
    startCleanupTimer,
    monitorPerformance
  }
}
