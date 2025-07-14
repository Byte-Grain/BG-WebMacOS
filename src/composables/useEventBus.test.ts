// 事件系统测试文件
// 用于验证事件系统的各项功能

import { useEventBus, eventBus, EVENTS, type EventData } from './useEventBus'
import { ref } from 'vue'

// 测试工具函数
function createMockComponent() {
  return {
    mounted: false,
    unmounted: false,
    onMounted: (fn: () => void) => fn(),
    onUnmounted: (fn: () => void) => {
      // 模拟组件卸载
      setTimeout(fn, 0)
    }
  }
}

// 基础功能测试
export function testBasicFunctionality() {
  console.log('🧪 测试基础功能...')
  
  const { on, emit, off, listenerCount } = useEventBus()
  let received = false
  
  // 测试监听和触发
  const listenerId = on(EVENTS.SYSTEM_READY, () => {
    received = true
  })
  
  console.assert(listenerCount(EVENTS.SYSTEM_READY) === 1, '监听器数量应为1')
  
  emit(EVENTS.SYSTEM_READY, undefined)
  console.assert(received === true, '应该接收到事件')
  
  // 测试移除监听器
  off(EVENTS.SYSTEM_READY, listenerId)
  console.assert(listenerCount(EVENTS.SYSTEM_READY) === 0, '移除后监听器数量应为0')
  
  console.log('✅ 基础功能测试通过')
}

// 类型安全测试
export function testTypeSafety() {
  console.log('🧪 测试类型安全...')
  
  const { on, emit } = useEventBus()
  let receivedData: EventData<typeof EVENTS.APP_OPENED> | null = null
  
  on(EVENTS.APP_OPENED, (data) => {
    receivedData = data
    // TypeScript 应该推断出 data 的正确类型
    console.assert(typeof data.appKey === 'string', 'appKey 应为字符串')
    console.assert(typeof data.pid === 'number', 'pid 应为数字')
  })
  
  emit(EVENTS.APP_OPENED, {
    appKey: 'test-app',
    pid: 12345
  })
  
  console.assert(receivedData !== null, '应该接收到数据')
  console.assert(receivedData?.appKey === 'test-app', 'appKey 应匹配')
  console.assert(receivedData?.pid === 12345, 'pid 应匹配')
  
  console.log('✅ 类型安全测试通过')
}

// 优先级测试
export function testPriority() {
  console.log('🧪 测试事件优先级...')
  
  const { on, emit } = useEventBus()
  const executionOrder: number[] = []
  
  // 添加不同优先级的监听器
  on(EVENTS.SYSTEM_READY, () => {
    executionOrder.push(1)
  }, { priority: 1 })
  
  on(EVENTS.SYSTEM_READY, () => {
    executionOrder.push(10)
  }, { priority: 10 })
  
  on(EVENTS.SYSTEM_READY, () => {
    executionOrder.push(5)
  }, { priority: 5 })
  
  emit(EVENTS.SYSTEM_READY, undefined)
  
  // 应该按优先级从高到低执行：10, 5, 1
  console.assert(
    JSON.stringify(executionOrder) === JSON.stringify([10, 5, 1]),
    `执行顺序应为 [10, 5, 1]，实际为 ${JSON.stringify(executionOrder)}`
  )
  
  console.log('✅ 优先级测试通过')
}

// 一次性监听器测试
export function testOnceListener() {
  console.log('🧪 测试一次性监听器...')
  
  const { once, emit, listenerCount } = useEventBus()
  let callCount = 0
  
  once(EVENTS.USER_LOGIN, () => {
    callCount++
  })
  
  console.assert(listenerCount(EVENTS.USER_LOGIN) === 1, '初始监听器数量应为1')
  
  // 第一次触发
  emit(EVENTS.USER_LOGIN, {
    username: 'test',
    timestamp: Date.now()
  })
  
  console.assert(callCount === 1, '第一次触发后调用次数应为1')
  console.assert(listenerCount(EVENTS.USER_LOGIN) === 0, '一次性监听器应被自动移除')
  
  // 第二次触发
  emit(EVENTS.USER_LOGIN, {
    username: 'test',
    timestamp: Date.now()
  })
  
  console.assert(callCount === 1, '第二次触发后调用次数仍应为1')
  
  console.log('✅ 一次性监听器测试通过')
}

// 命名空间测试
export function testNamespace() {
  console.log('🧪 测试命名空间...')
  
  const bus1 = useEventBus({ namespace: 'test-namespace-1' })
  const bus2 = useEventBus({ namespace: 'test-namespace-2' })
  
  let count1 = 0
  let count2 = 0
  
  bus1.on(EVENTS.SYSTEM_READY, () => { count1++ })
  bus2.on(EVENTS.SYSTEM_READY, () => { count2++ })
  
  // 全局触发事件
  eventBus.emit(EVENTS.SYSTEM_READY, undefined)
  
  console.assert(count1 === 1, '命名空间1应接收到事件')
  console.assert(count2 === 1, '命名空间2应接收到事件')
  
  // 清理命名空间1的监听器
  bus1.offAll()
  
  eventBus.emit(EVENTS.SYSTEM_READY, undefined)
  
  console.assert(count1 === 1, '命名空间1清理后不应接收到事件')
  console.assert(count2 === 2, '命名空间2应继续接收事件')
  
  console.log('✅ 命名空间测试通过')
}

// 异步事件测试
export async function testAsyncEvents() {
  console.log('🧪 测试异步事件...')
  
  const { emitAsync, waitFor } = useEventBus()
  let received = false
  
  // 设置监听器
  setTimeout(() => {
    eventBus.emit(EVENTS.USER_LOGIN, {
      username: 'async-test',
      timestamp: Date.now()
    })
  }, 100)
  
  // 等待事件
  try {
    const data = await waitFor(EVENTS.USER_LOGIN, 200)
    console.assert(data.username === 'async-test', '应接收到正确的异步数据')
    received = true
  } catch (error) {
    console.error('异步事件测试失败:', error)
  }
  
  console.assert(received === true, '应该接收到异步事件')
  
  // 测试超时
  try {
    await waitFor(EVENTS.SYSTEM_SHUTDOWN, 50) // 50ms 超时
    console.assert(false, '应该超时')
  } catch (error) {
    console.assert(error instanceof Error, '应该抛出超时错误')
  }
  
  console.log('✅ 异步事件测试通过')
}

// 错误处理测试
export function testErrorHandling() {
  console.log('🧪 测试错误处理...')
  
  const { on, emit } = useEventBus()
  let errorCaught = false
  
  // 模拟控制台错误输出
  const originalError = console.error
  console.error = (...args: any[]) => {
    if (args[0]?.includes('Error in event listener')) {
      errorCaught = true
    }
    originalError(...args)
  }
  
  // 添加会抛出错误的监听器
  on(EVENTS.SYSTEM_ERROR, () => {
    throw new Error('测试错误')
  })
  
  // 触发事件
  emit(EVENTS.SYSTEM_ERROR, {
    error: new Error('系统错误'),
    context: '测试上下文'
  })
  
  // 恢复控制台
  console.error = originalError
  
  console.assert(errorCaught === true, '应该捕获监听器中的错误')
  
  console.log('✅ 错误处理测试通过')
}

// 性能测试
export function testPerformance() {
  console.log('🧪 测试性能...')
  
  const { on, emit, getStats } = useEventBus()
  
  // 添加大量监听器
  const listenerCount = 1000
  for (let i = 0; i < listenerCount; i++) {
    on(EVENTS.SYSTEM_READY, () => {
      // 空操作
    })
  }
  
  const stats = getStats()
  console.assert(
    stats.totalListeners >= listenerCount,
    `监听器数量应至少为 ${listenerCount}`
  )
  
  // 测试大量事件触发的性能
  const startTime = performance.now()
  const eventCount = 1000
  
  for (let i = 0; i < eventCount; i++) {
    emit(EVENTS.SYSTEM_READY, undefined)
  }
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  console.log(`触发 ${eventCount} 个事件耗时: ${duration.toFixed(2)}ms`)
  console.assert(duration < 1000, '性能应该可接受（< 1秒）')
  
  console.log('✅ 性能测试通过')
}

// 内存清理测试
export function testMemoryCleanup() {
  console.log('🧪 测试内存清理...')
  
  const { cleanupStaleListeners, getStats } = useEventBus()
  
  // 获取初始统计
  const initialStats = getStats()
  
  // 添加一些监听器
  const bus = useEventBus({ namespace: 'cleanup-test' })
  for (let i = 0; i < 10; i++) {
    bus.on(EVENTS.SYSTEM_READY, () => {})
  }
  
  const beforeCleanup = getStats()
  console.assert(
    beforeCleanup.totalListeners > initialStats.totalListeners,
    '添加监听器后数量应增加'
  )
  
  // 清理过期监听器（设置很短的过期时间）
  setTimeout(() => {
    const removed = cleanupStaleListeners(0) // 立即过期
    console.assert(removed >= 10, `应该清理至少10个监听器，实际清理了${removed}个`)
    
    const afterCleanup = getStats()
    console.assert(
      afterCleanup.totalListeners < beforeCleanup.totalListeners,
      '清理后监听器数量应减少'
    )
  }, 10)
  
  console.log('✅ 内存清理测试通过')
}

// 运行所有测试
export async function runAllTests() {
  console.log('🚀 开始运行事件系统测试...')
  
  try {
    testBasicFunctionality()
    testTypeSafety()
    testPriority()
    testOnceListener()
    testNamespace()
    await testAsyncEvents()
    testErrorHandling()
    testPerformance()
    testMemoryCleanup()
    
    console.log('🎉 所有测试通过！')
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 如果在浏览器环境中，可以直接运行测试
if (typeof window !== 'undefined') {
  // 延迟运行，确保模块加载完成
  setTimeout(() => {
    runAllTests()
  }, 100)
}