<template>
  <div class="enhanced-event-system-example">
    <h2>增强事件系统示例</h2>
    
    <!-- 基础事件测试 -->
    <div class="section">
      <h3>基础事件测试</h3>
      <button @click="testBasicEvent">发送基础事件</button>
      <button @click="testValidatedEvent">发送验证事件</button>
      <button @click="testInvalidEvent">发送无效事件</button>
    </div>
    
    <!-- 命名空间事件测试 -->
    <div class="section">
      <h3>命名空间事件测试</h3>
      <button @click="testSystemEvent">系统事件</button>
      <button @click="testWindowEvent">窗口事件</button>
      <button @click="testAppEvent">应用事件</button>
      <button @click="testUserEvent">用户事件</button>
    </div>
    
    <!-- 中间件测试 -->
    <div class="section">
      <h3>中间件测试</h3>
      <button @click="testMiddleware">测试中间件链</button>
      <button @click="testPerformance">性能测试</button>
      <button @click="testErrorHandling">错误处理测试</button>
    </div>
    
    <!-- 事件工厂测试 -->
    <div class="section">
      <h3>事件工厂测试</h3>
      <button @click="testEventFactory">测试事件工厂</button>
      <button @click="testTypedEvents">测试类型化事件</button>
    </div>
    
    <!-- 事件日志 -->
    <div class="section">
      <h3>事件日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in eventLogs" :key="index" :class="['log-item', log.type]">
          <span class="timestamp">{{ log.timestamp }}</span>
          <span class="event">{{ log.event }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
      <button @click="clearLogs">清空日志</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  eventBus,
  enhancedEventBus,
  systemEventBus,
  windowEventBus,
  appEventBus,
  userEventBus,
  EventFactory,
  LoggingMiddleware,
  PerformanceMiddleware,
  ErrorHandlingMiddleware,
  WindowEventValidator,
  BaseDataValidator,
  EVENTS
} from '@/core/event-system/useEventBus'

interface LogItem {
  timestamp: string
  event: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const eventLogs = ref<LogItem[]>([])

// 添加日志
function addLog(event: string, message: string, type: LogItem['type'] = 'info') {
  eventLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event,
    message,
    type
  })
  
  // 限制日志数量
  if (eventLogs.value.length > 50) {
    eventLogs.value = eventLogs.value.slice(0, 50)
  }
}

// 清空日志
function clearLogs() {
  eventLogs.value = []
}

// 基础事件测试
function testBasicEvent() {
  eventBus.emit(EVENTS.TEST_PERFORMANCE, {
    index: Math.floor(Math.random() * 100),
    timestamp: Date.now()
  })
  addLog('TEST_PERFORMANCE', '发送基础事件', 'info')
}

// 验证事件测试
function testValidatedEvent() {
  try {
    enhancedEventBus.emit(EVENTS.WINDOW_RESIZE, {
      width: 1920,
      height: 1080,
      timestamp: Date.now()
    })
    addLog('WINDOW_RESIZE', '发送有效的窗口调整事件', 'success')
  } catch (error) {
    addLog('WINDOW_RESIZE', `验证失败: ${error}`, 'error')
  }
}

// 无效事件测试
function testInvalidEvent() {
  try {
    enhancedEventBus.emit(EVENTS.WINDOW_RESIZE, {
      width: 'invalid',
      height: null
    } as any)
    addLog('WINDOW_RESIZE', '发送无效事件（不应该成功）', 'warning')
  } catch (error) {
    addLog('WINDOW_RESIZE', `验证正确拦截了无效数据: ${error}`, 'success')
  }
}

// 命名空间事件测试
function testSystemEvent() {
  systemEventBus.emit('system:startup', {
    version: '1.0.0',
    timestamp: Date.now()
  })
  addLog('system:startup', '发送系统启动事件', 'info')
}

function testWindowEvent() {
  windowEventBus.emit('window:focus', {
    windowId: 'main-window',
    timestamp: Date.now()
  })
  addLog('window:focus', '发送窗口焦点事件', 'info')
}

function testAppEvent() {
  appEventBus.emit('app:theme-change', {
    theme: 'dark',
    timestamp: Date.now()
  })
  addLog('app:theme-change', '发送应用主题变更事件', 'info')
}

function testUserEvent() {
  userEventBus.emit('user:action', {
    action: 'click',
    target: 'button',
    timestamp: Date.now()
  })
  addLog('user:action', '发送用户操作事件', 'info')
}

// 中间件测试
function testMiddleware() {
  // 创建一个临时的中间件
  class TestMiddleware {
    beforeEmit(eventName: any, data: any) {
      addLog(eventName, '中间件: beforeEmit 执行', 'info')
      return { ...data, middlewareProcessed: true }
    }
    
    afterEmit(eventName: any, data: any, results: any[]) {
      addLog(eventName, `中间件: afterEmit 执行，处理了 ${results.length} 个监听器`, 'info')
    }
  }
  
  const middleware = new TestMiddleware()
  enhancedEventBus.use(middleware)
  
  enhancedEventBus.emit(EVENTS.TEST_PERFORMANCE, {
    index: 999,
    timestamp: Date.now()
  })
  
  // 移除中间件
  setTimeout(() => {
    enhancedEventBus.removeMiddleware(middleware)
    addLog('middleware', '测试中间件已移除', 'info')
  }, 1000)
}

// 性能测试
function testPerformance() {
  const startTime = performance.now()
  
  // 发送多个事件
  for (let i = 0; i < 100; i++) {
    eventBus.emit(EVENTS.TEST_PERFORMANCE, {
      index: i,
      timestamp: Date.now()
    })
  }
  
  const endTime = performance.now()
  addLog('performance', `发送100个事件耗时: ${(endTime - startTime).toFixed(2)}ms`, 'success')
}

// 错误处理测试
function testErrorHandling() {
  // 注册一个会抛出错误的监听器
  const listenerId = eventBus.on(EVENTS.TEST_PERFORMANCE, () => {
    throw new Error('测试错误处理')
  })
  
  try {
    eventBus.emit(EVENTS.TEST_PERFORMANCE, {
      index: -1,
      timestamp: Date.now()
    })
    addLog('error-test', '错误处理测试完成', 'success')
  } catch (error) {
    addLog('error-test', `捕获到错误: ${error}`, 'error')
  }
  
  // 清理监听器
  eventBus.off(listenerId)
}

// 事件工厂测试
function testEventFactory() {
  // 创建类型化事件
  const typedEvent = EventFactory.createEvent('TEST_PERFORMANCE', {
    index: 42,
    timestamp: Date.now()
  })
  
  addLog('event-factory', `创建类型化事件: ${typedEvent.name}`, 'info')
  
  // 创建事件监听器
  const listener = EventFactory.createListener((data) => {
    addLog('typed-listener', `接收到数据: index=${data.index}`, 'success')
  })
  
  const listenerId = eventBus.on(EVENTS.TEST_PERFORMANCE, listener)
  eventBus.emit(EVENTS.TEST_PERFORMANCE, typedEvent.data)
  
  // 清理
  setTimeout(() => eventBus.off(listenerId), 1000)
}

// 类型化事件测试
function testTypedEvents() {
  // 创建事件创建器
  const createPerformanceEvent = EventFactory.createEventCreator<'TEST_PERFORMANCE'>('TEST_PERFORMANCE')
  
  const event = createPerformanceEvent({
    index: 100,
    timestamp: Date.now()
  })
  
  eventBus.emit(event.name, event.data)
  addLog('typed-events', '使用事件创建器发送事件', 'success')
}

// 设置事件监听器
onMounted(() => {
  // 监听各种事件
  const listeners = [
    eventBus.on(EVENTS.TEST_PERFORMANCE, (data) => {
      addLog('listener', `接收到性能测试事件: index=${data.index}`, 'success')
    }),
    
    systemEventBus.on('system:startup', (data) => {
      addLog('listener', `系统启动: version=${data.version}`, 'success')
    }),
    
    windowEventBus.on('window:focus', (data) => {
      addLog('listener', `窗口获得焦点: ${data.windowId}`, 'success')
    }),
    
    appEventBus.on('app:theme-change', (data) => {
      addLog('listener', `主题变更: ${data.theme}`, 'success')
    }),
    
    userEventBus.on('user:action', (data) => {
      addLog('listener', `用户操作: ${data.action} on ${data.target}`, 'success')
    })
  ]
  
  // 清理函数
  onUnmounted(() => {
    listeners.forEach(id => {
      if (typeof id === 'string') {
        eventBus.off(id)
      }
    })
  })
})
</script>

<style scoped>
.enhanced-event-system-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #007acc;
  padding-bottom: 10px;
}

button {
  margin: 5px;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background: #007acc;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background: #005a9e;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  padding: 10px;
  margin-bottom: 10px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.timestamp {
  color: #666;
  min-width: 80px;
}

.event {
  color: #007acc;
  min-width: 150px;
  font-weight: bold;
}

.message {
  flex: 1;
}

.log-item.info .message {
  color: #333;
}

.log-item.success .message {
  color: #28a745;
}

.log-item.warning .message {
  color: #ffc107;
}

.log-item.error .message {
  color: #dc3545;
}
</style>