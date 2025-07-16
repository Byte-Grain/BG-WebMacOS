import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 性能监控组合式函数
 * 用于监控组件的渲染性能和内存使用情况
 */
export function usePerformance(componentName: string = 'Component') {
  const renderCount = ref(0)
  const lastRenderTime = ref(0)
  const averageRenderTime = ref(0)
  const memoryUsage = ref(0)
  const performanceObserver = ref<PerformanceObserver | null>(null)
  
  // 记录渲染开始时间
  const startRender = () => {
    lastRenderTime.value = performance.now()
  }
  
  // 记录渲染结束时间并计算平均值
  const endRender = () => {
    const endTime = performance.now()
    const renderTime = endTime - lastRenderTime.value
    renderCount.value++
    
    // 计算平均渲染时间
    averageRenderTime.value = (
      (averageRenderTime.value * (renderCount.value - 1) + renderTime) / renderCount.value
    )
    
    // 在开发环境下输出性能信息
    if (import.meta.env.DEV && renderTime > 16) { // 超过一帧的时间
      console.warn(`${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`)
    }
  }
  
  // 获取内存使用情况
  const updateMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = memory.usedJSHeapSize / 1024 / 1024 // 转换为MB
    }
  }
  
  // 监控长任务
  const observeLongTasks = () => {
    if ('PerformanceObserver' in window) {
      try {
        performanceObserver.value = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.duration > 50) { // 超过50ms的任务
              console.warn(`${componentName} 检测到长任务: ${entry.duration.toFixed(2)}ms`)
            }
          })
        })
        
        performanceObserver.value.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('PerformanceObserver 不支持 longtask 类型')
      }
    }
  }
  
  // 获取性能报告
  const getPerformanceReport = () => {
    return {
      componentName,
      renderCount: renderCount.value,
      averageRenderTime: averageRenderTime.value.toFixed(2),
      memoryUsage: memoryUsage.value.toFixed(2),
      lastRenderTime: lastRenderTime.value
    }
  }
  
  // 重置性能统计
  const resetPerformanceStats = () => {
    renderCount.value = 0
    averageRenderTime.value = 0
    lastRenderTime.value = 0
  }
  
  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  }
  
  // 节流函数
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  // 生命周期钩子
  onMounted(() => {
    observeLongTasks()
    updateMemoryUsage()
    
    // 定期更新内存使用情况
    const memoryInterval = setInterval(updateMemoryUsage, 5000)
    
    onUnmounted(() => {
      clearInterval(memoryInterval)
      if (performanceObserver.value) {
        performanceObserver.value.disconnect()
      }
    })
  })
  
  return {
    // 状态
    renderCount,
    averageRenderTime,
    memoryUsage,
    
    // 方法
    startRender,
    endRender,
    updateMemoryUsage,
    getPerformanceReport,
    resetPerformanceStats,
    debounce,
    throttle
  }
}

/**
 * 虚拟滚动组合式函数
 * 用于处理大量列表项的性能优化
 */
export function useVirtualScroll({
  itemHeight,
  containerHeight,
  items
}: {
  itemHeight: number
  containerHeight: number
  items: any[]
}) {
  const scrollTop = ref(0)
  const startIndex = ref(0)
  const endIndex = ref(0)
  const visibleItems = ref<any[]>([])
  
  // 计算可见项目
  const updateVisibleItems = () => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount + 1, items.length)
    
    startIndex.value = Math.max(0, start - 1)
    endIndex.value = end
    visibleItems.value = items.slice(startIndex.value, endIndex.value)
  }
  
  // 处理滚动事件
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    updateVisibleItems()
  }
  
  // 获取容器样式
  const getContainerStyle = () => {
    return {
      height: `${items.length * itemHeight}px`,
      position: 'relative' as const
    }
  }
  
  // 获取可见区域样式
  const getVisibleStyle = () => {
    return {
      transform: `translateY(${startIndex.value * itemHeight}px)`,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0
    }
  }
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    handleScroll,
    getContainerStyle,
    getVisibleStyle,
    updateVisibleItems
  }
}