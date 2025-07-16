import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'
import { useEventBus } from '../../../core/event-system/useEventBus'

// 性能指标类型
export interface PerformanceMetrics {
  // 内存使用
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  // FPS
  fps: number
  // 页面加载时间
  loadTime: number
  // DOM 节点数量
  domNodes: number
  // 网络延迟
  networkLatency: number
  // 渲染时间
  renderTime: number
}

// 性能阈值配置
export interface PerformanceThresholds {
  memoryWarning: number // 内存使用警告阈值 (百分比)
  memoryCritical: number // 内存使用严重阈值 (百分比)
  fpsWarning: number // FPS 警告阈值
  fpsCritical: number // FPS 严重阈值
  loadTimeWarning: number // 加载时间警告阈值 (ms)
  loadTimeCritical: number // 加载时间严重阈值 (ms)
  domNodesWarning: number // DOM 节点警告阈值
  domNodesCritical: number // DOM 节点严重阈值
  networkLatencyWarning: number // 网络延迟警告阈值 (ms)
  networkLatencyCritical: number // 网络延迟严重阈值 (ms)
}

// 性能监控配置
export interface PerformanceMonitorConfig {
  enabled: boolean
  interval: number // 监控间隔 (ms)
  thresholds: PerformanceThresholds
  autoReport: boolean // 自动上报性能问题
  enableFpsMonitoring: boolean // 启用 FPS 监控
  enableMemoryMonitoring: boolean // 启用内存监控
  enableNetworkMonitoring: boolean // 启用网络监控
}

// 默认配置
const defaultConfig: PerformanceMonitorConfig = {
  enabled: true,
  interval: 5000, // 5秒
  thresholds: {
    memoryWarning: 70,
    memoryCritical: 90,
    fpsWarning: 30,
    fpsCritical: 15,
    loadTimeWarning: 3000,
    loadTimeCritical: 5000,
    domNodesWarning: 5000,
    domNodesCritical: 10000,
    networkLatencyWarning: 1000,
    networkLatencyCritical: 3000
  },
  autoReport: true,
  enableFpsMonitoring: true,
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true
}

// 性能监控组合式函数
export function usePerformanceMonitor(config: Partial<PerformanceMonitorConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  const { emit } = useEventBus()
  
  // 响应式状态
  const isMonitoring = ref(false)
  const currentMetrics = ref<PerformanceMetrics>({
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    fps: 0,
    loadTime: 0,
    domNodes: 0,
    networkLatency: 0,
    renderTime: 0
  })
  
  const metricsHistory = ref<PerformanceMetrics[]>([])
  const maxHistoryLength = 100
  
  let monitoringInterval: number | null = null
  let fpsCounter = 0
  let lastFpsTime = performance.now()
  let animationFrameId: number | null = null
  
  // 计算属性
  const averageMetrics = computed(() => {
    if (metricsHistory.value.length === 0) return null
    
    const sum = metricsHistory.value.reduce((acc, metrics) => ({
      memoryUsage: {
        used: acc.memoryUsage.used + metrics.memoryUsage.used,
        total: acc.memoryUsage.total + metrics.memoryUsage.total,
        percentage: acc.memoryUsage.percentage + metrics.memoryUsage.percentage
      },
      fps: acc.fps + metrics.fps,
      loadTime: acc.loadTime + metrics.loadTime,
      domNodes: acc.domNodes + metrics.domNodes,
      networkLatency: acc.networkLatency + metrics.networkLatency,
      renderTime: acc.renderTime + metrics.renderTime
    }), {
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      fps: 0,
      loadTime: 0,
      domNodes: 0,
      networkLatency: 0,
      renderTime: 0
    })
    
    const count = metricsHistory.value.length
    return {
      memoryUsage: {
        used: sum.memoryUsage.used / count,
        total: sum.memoryUsage.total / count,
        percentage: sum.memoryUsage.percentage / count
      },
      fps: sum.fps / count,
      loadTime: sum.loadTime / count,
      domNodes: sum.domNodes / count,
      networkLatency: sum.networkLatency / count,
      renderTime: sum.renderTime / count
    }
  })
  
  const performanceStatus = computed(() => {
    const metrics = currentMetrics.value
    const thresholds = finalConfig.thresholds
    
    const issues = []
    
    // 检查内存使用
    if (metrics.memoryUsage.percentage >= thresholds.memoryCritical) {
      issues.push({ type: 'memory', level: 'critical', value: metrics.memoryUsage.percentage })
    } else if (metrics.memoryUsage.percentage >= thresholds.memoryWarning) {
      issues.push({ type: 'memory', level: 'warning', value: metrics.memoryUsage.percentage })
    }
    
    // 检查 FPS
    if (metrics.fps <= thresholds.fpsCritical) {
      issues.push({ type: 'fps', level: 'critical', value: metrics.fps })
    } else if (metrics.fps <= thresholds.fpsWarning) {
      issues.push({ type: 'fps', level: 'warning', value: metrics.fps })
    }
    
    // 检查 DOM 节点数量
    if (metrics.domNodes >= thresholds.domNodesCritical) {
      issues.push({ type: 'dom', level: 'critical', value: metrics.domNodes })
    } else if (metrics.domNodes >= thresholds.domNodesWarning) {
      issues.push({ type: 'dom', level: 'warning', value: metrics.domNodes })
    }
    
    // 检查网络延迟
    if (metrics.networkLatency >= thresholds.networkLatencyCritical) {
      issues.push({ type: 'network', level: 'critical', value: metrics.networkLatency })
    } else if (metrics.networkLatency >= thresholds.networkLatencyWarning) {
      issues.push({ type: 'network', level: 'warning', value: metrics.networkLatency })
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      score: calculatePerformanceScore(metrics, thresholds)
    }
  })
  
  // 计算性能评分 (0-100)
  function calculatePerformanceScore(metrics: PerformanceMetrics, thresholds: PerformanceThresholds): number {
    let score = 100
    
    // 内存使用评分 (权重: 25%)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage.percentage / thresholds.memoryCritical) * 100)
    score -= (100 - memoryScore) * 0.25
    
    // FPS 评分 (权重: 30%)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100)
    score -= (100 - fpsScore) * 0.3
    
    // DOM 节点评分 (权重: 20%)
    const domScore = Math.max(0, 100 - (metrics.domNodes / thresholds.domNodesCritical) * 100)
    score -= (100 - domScore) * 0.2
    
    // 网络延迟评分 (权重: 25%)
    const networkScore = Math.max(0, 100 - (metrics.networkLatency / thresholds.networkLatencyCritical) * 100)
    score -= (100 - networkScore) * 0.25
    
    return Math.max(0, Math.min(100, score))
  }
  
  // 获取内存使用情况
  function getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    }
    return { used: 0, total: 0, percentage: 0 }
  }
  
  // 获取 DOM 节点数量
  function getDomNodeCount(): number {
    return document.querySelectorAll('*').length
  }
  
  // 测量网络延迟
  async function measureNetworkLatency(): Promise<number> {
    if (!finalConfig.enableNetworkMonitoring) return 0
    
    try {
      const start = performance.now()
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      return performance.now() - start
    } catch {
      return 0
    }
  }
  
  // FPS 监控
  function startFpsMonitoring() {
    if (!finalConfig.enableFpsMonitoring) return
    
    function countFrame() {
      fpsCounter++
      animationFrameId = requestAnimationFrame(countFrame)
    }
    
    countFrame()
    
    setInterval(() => {
      const now = performance.now()
      const delta = now - lastFpsTime
      currentMetrics.value.fps = Math.round((fpsCounter * 1000) / delta)
      fpsCounter = 0
      lastFpsTime = now
    }, 1000)
  }
  
  // 收集性能指标
  async function collectMetrics(): Promise<PerformanceMetrics> {
    const startTime = performance.now()
    
    const metrics: PerformanceMetrics = {
      memoryUsage: finalConfig.enableMemoryMonitoring ? getMemoryUsage() : { used: 0, total: 0, percentage: 0 },
      fps: currentMetrics.value.fps,
      loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
      domNodes: getDomNodeCount(),
      networkLatency: await measureNetworkLatency(),
      renderTime: performance.now() - startTime
    }
    
    return metrics
  }
  
  // 检查性能问题并上报
  function checkAndReportIssues(metrics: PerformanceMetrics) {
    if (!finalConfig.autoReport) return
    
    const status = performanceStatus.value
    
    status.issues.forEach(issue => {
      if (issue.level === 'critical') {
        emit('PERFORMANCE_CRITICAL', {
          type: issue.type,
          value: issue.value,
          metrics,
          timestamp: Date.now()
        })
      } else if (issue.level === 'warning') {
        emit('PERFORMANCE_WARNING', {
          type: issue.type,
          value: issue.value,
          metrics,
          timestamp: Date.now()
        })
      }
    })
    
    // 发送性能指标事件
    emit('PERFORMANCE_METRICS', {
      metrics,
      score: status.score,
      timestamp: Date.now()
    })
  }
  
  // 开始监控
  function startMonitoring() {
    if (isMonitoring.value || !finalConfig.enabled) return
    
    isMonitoring.value = true
    startFpsMonitoring()
    
    monitoringInterval = window.setInterval(async () => {
      try {
        const metrics = await collectMetrics()
        currentMetrics.value = metrics
        
        // 添加到历史记录
        metricsHistory.value.push(metrics)
        if (metricsHistory.value.length > maxHistoryLength) {
          metricsHistory.value.shift()
        }
        
        // 检查并上报问题
        checkAndReportIssues(metrics)
      } catch (error) {
        console.error('性能监控收集指标失败:', error)
      }
    }, finalConfig.interval)
  }
  
  // 停止监控
  function stopMonitoring() {
    if (!isMonitoring.value) return
    
    isMonitoring.value = false
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
    
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
  
  // 获取性能报告
  function getPerformanceReport() {
    return {
      current: currentMetrics.value,
      average: averageMetrics.value,
      status: performanceStatus.value,
      history: metricsHistory.value.slice(-10), // 最近10条记录
      config: finalConfig
    }
  }
  
  // 清除历史数据
  function clearHistory() {
    metricsHistory.value = []
  }
  
  // 生命周期
  onMounted(() => {
    if (finalConfig.enabled) {
      startMonitoring()
    }
  })
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    // 状态
    isMonitoring: readonly(isMonitoring),
    currentMetrics: readonly(currentMetrics),
    metricsHistory: readonly(metricsHistory),
    averageMetrics,
    performanceStatus,
    
    // 方法
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
    clearHistory,
    collectMetrics,
    
    // 配置
    config: finalConfig
  }
}

// 全局性能监控实例
let globalPerformanceMonitor: ReturnType<typeof usePerformanceMonitor> | null = null

// 获取全局性能监控实例
export function getGlobalPerformanceMonitor() {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = usePerformanceMonitor({
      enabled: true,
      autoReport: true
    })
  }
  return globalPerformanceMonitor
}

// 快捷方法：获取当前性能指标
export async function getCurrentPerformanceMetrics(): Promise<PerformanceMetrics> {
  const monitor = getGlobalPerformanceMonitor()
  return await monitor.collectMetrics()
}

// 快捷方法：检查性能状态
export function checkPerformanceHealth() {
  const monitor = getGlobalPerformanceMonitor()
  return monitor.performanceStatus.value
}

