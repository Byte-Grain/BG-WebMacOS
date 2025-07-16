<template>
  <div class="composables-test">
    <div class="test-header">
      <h2>组合式函数测试页面</h2>
      <p>测试事件系统、键盘快捷键和通知系统</p>
    </div>

    <div class="test-sections">
      <!-- 事件系统测试 -->
      <div class="test-section">
        <h3>🎯 事件系统测试</h3>
        <div class="test-controls">
          <button @click="testEventEmit" class="btn btn-primary">发送自定义事件</button>
          <button @click="testGlobalEvent" class="btn btn-secondary">发送全局事件</button>
          <button @click="testBusinessEvent" class="btn btn-success">发送业务事件</button>
          <button @click="testErrorEvent" class="btn btn-warning">发送错误事件</button>
          <p>事件计数: {{ eventCount }}</p>
        </div>
      </div>

      <!-- 错误监控测试 -->
       <div class="test-section">
         <h3>🚨 错误监控测试</h3>
         <div class="test-controls">
           <button @click="testCaptureError" class="btn btn-danger">记录错误</button>
           <button @click="testCaptureException" class="btn btn-danger">记录异常</button>
           <button @click="testNetworkError" class="btn btn-warning">模拟网络错误</button>
           <button @click="showErrorStats" class="btn btn-info">显示错误统计</button>
           <button @click="showRecentErrors" class="btn btn-info">显示最近错误</button>
           <div class="test-info" v-if="errorMonitor">
             <p>错误监控状态: {{ errorMonitor.isEnabled() ? '已启用' : '已禁用' }}</p>
             <p>自动上报: {{ errorMonitor.config.autoReport ? '开启' : '关闭' }}</p>
           </div>
         </div>
       </div>

       <!-- 性能监控测试 -->
       <div class="test-section">
         <h3>📊 性能监控测试</h3>
         <div class="test-controls">
           <button @click="showPerformanceMetrics" class="btn btn-info">显示性能指标</button>
           <button @click="showPerformanceHealth" class="btn btn-success">健康检查</button>
           <button @click="showPerformanceReport" class="btn btn-secondary">性能报告</button>
           <button @click="simulatePerformanceIssue" class="btn btn-warning">模拟性能问题</button>
           <button @click="triggerPerformanceEvent" class="btn btn-danger">触发性能事件</button>
           <div class="test-info" v-if="performanceMonitor">
             <p>性能监控状态: {{ performanceMonitor.isMonitoring ? '运行中' : '已停止' }}</p>
             <p>监控间隔: {{ performanceMonitor.config.interval }}ms</p>
             <p>当前FPS: {{ performanceMonitor.currentMetrics.fps }}</p>
             <p>内存使用: {{ performanceMonitor.currentMetrics.memoryUsage.percentage.toFixed(1) }}%</p>
           </div>
         </div>
       </div>

      <!-- 键盘快捷键测试 -->
      <div class="test-section">
        <h3>键盘快捷键测试</h3>
        <div class="test-controls">
          <button @click="registerTestShortcut">注册测试快捷键 (Ctrl+T)</button>
          <button @click="unregisterTestShortcut">注销测试快捷键</button>
          <p>按下 Ctrl+T 测试快捷键</p>
          <p>快捷键状态: {{ shortcutRegistered ? '已注册' : '未注册' }}</p>
        </div>
      </div>

      <!-- 通知系统测试 -->
      <div class="test-section">
        <h3>通知系统测试</h3>
        <div class="test-controls">
          <button @click="showSuccessNotification">成功通知</button>
          <button @click="showErrorNotification">错误通知</button>
          <button @click="showWarningNotification">警告通知</button>
          <button @click="showInfoNotification">信息通知</button>
          <button @click="showCustomNotification">自定义通知</button>
          <button @click="clearAllNotifications">清除所有通知</button>
        </div>
      </div>

      <!-- 事件调试面板 -->
      <div class="test-section debug-panel-section">
        <h3>🔍 事件调试面板</h3>
        <div class="test-controls">
          <button @click="toggleDebugPanel" :class="['btn', showDebugPanel ? 'btn-warning' : 'btn-primary']">
            {{ showDebugPanel ? '隐藏调试面板' : '显示调试面板' }}
          </button>
          <p>实时监控事件系统状态、性能指标和调试信息</p>
        </div>
      </div>

      <!-- 系统信息测试 -->
      <div class="test-section">
        <h3>系统信息</h3>
        <div class="system-info">
          <p>在线状态: {{ isOnline ? '在线' : '离线' }}</p>
          <p>设备类型: {{ deviceInfo.type }}</p>
          <p>操作系统: {{ deviceInfo.os }}</p>
          <p>浏览器: {{ deviceInfo.browser }}</p>
          <p>屏幕尺寸: {{ systemInfo.screen.width }}x{{ systemInfo.screen.height }}</p>
        </div>
      </div>
    </div>

    <!-- 事件调试面板 -->
    <div v-if="showDebugPanel" class="debug-panel-overlay">
      <div class="debug-panel-container">
        <div class="debug-panel-header">
          <h3>事件系统调试面板</h3>
          <button @click="toggleDebugPanel" class="close-btn">×</button>
        </div>
        <EventDebugPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  useCore,
  useErrorMonitor,
  captureError,
  captureException,
  getCurrentPerformanceMetrics,
  checkPerformanceHealth,
  EVENTS 
} from '@/composables'
import EventDebugPanel from '@/components/business/EventDebugPanel.vue'

// 使用核心组合式函数
const {
  // 事件系统
  on, off, emit,
  // 键盘
  registerShortcut, unregisterShortcut, isShortcutRegistered,
  // 通知
  success, error, warning, info, show: notify, closeAll,
  // 系统
  getSystemInfo, getNetworkStatus,
  // 工具
  device,
  // 错误监控
  errorMonitor,
  // 性能监控
  performanceMonitor
} = useCore({
  namespace: 'composables-test',
  debugMode: true,
  enableErrorMonitoring: true,
  enablePerformanceMonitoring: true,
  performanceConfig: {
    interval: 3000, // 3秒监控间隔
    thresholds: {
      memoryWarning: 60,
      memoryCritical: 80,
      fpsWarning: 25,
      fpsCritical: 10
    }
  }
})

// 系统信息
const systemInfo = ref(getSystemInfo())
const isOnline = ref(getNetworkStatus().online)

// 响应式数据
const eventCount = ref(0)
const shortcutRegistered = ref(false)
const showDebugPanel = ref(true)
const deviceInfo = ref({
  type: device.isMobile() ? 'Mobile' : device.isTablet() ? 'Tablet' : 'Desktop',
  os: device.getOS(),
  browser: device.getBrowser()
})

// 事件系统测试
const testEventEmit = () => {
  emit('test-event', { message: '这是一个测试事件', timestamp: Date.now() })
}

const testGlobalEvent = () => {
  emit(EVENTS.SYSTEM_READY, { 
    bootTime: 1000,
    version: '1.0.0-test'
  })
}

const testBusinessEvent = () => {
  emit('business:feature-used', {
    feature: 'test-feature',
    metadata: { testId: Date.now() }
  })
}

const testErrorEvent = () => {
  emit('error:app', {
    appKey: 'test-app',
    error: '模拟应用错误',
    severity: 'medium' as const
  })
}

const handleTestEvent = (data: any) => {
  eventCount.value++
  success(`接收到事件: ${data.message}`)
}

const handleSystemReady = (data: any) => {
  info(`系统就绪事件触发，启动时间: ${data.bootTime}ms`)
}

const handleBusinessEvent = (data: any) => {
  info(`业务事件: ${data.feature}，元数据: ${JSON.stringify(data.metadata)}`)
}

const handleErrorEvent = (data: any) => {
  warning(`应用错误事件: ${data.appKey} - ${data.error}`)
}

// 键盘快捷键测试
let testShortcutId = ''

const registerTestShortcut = () => {
  testShortcutId = registerShortcut(
    {
      key: 't',
      modifiers: { ctrl: true },
      description: '测试快捷键'
    },
    () => {
      success('测试快捷键被触发！')
    }
  )
  shortcutRegistered.value = true
}

const unregisterTestShortcut = () => {
  if (testShortcutId) {
    unregisterShortcut(testShortcutId)
    testShortcutId = ''
  }
  shortcutRegistered.value = false
  info('测试快捷键已注销')
}

// 通知系统测试
const showSuccessNotification = () => {
  success('这是一个成功通知！', {
    title: '操作成功',
    duration: 3000
  })
}

const showErrorNotification = () => {
  error('这是一个错误通知！', {
    title: '操作失败',
    duration: 5000
  })
}

const showWarningNotification = () => {
  warning('这是一个警告通知！', {
    title: '注意',
    duration: 4000
  })
}

const showInfoNotification = () => {
  info('这是一个信息通知！', {
    title: '提示',
    duration: 3000
  })
}

const showCustomNotification = () => {
  notify({
    type: 'success',
    title: '自定义通知',
    message: '这是一个带有操作按钮的通知',
    duration: 0, // 不自动关闭
    actions: [
      {
        text: '确认',
        action: () => {
          success('你点击了确认按钮')
        }
      },
      {
        text: '取消',
        action: () => {
          info('你点击了取消按钮')
        }
      }
    ]
  })
}

const clearAllNotifications = () => {
  closeAll()
}

// 错误监控测试
const testCaptureError = () => {
  captureError('这是一个测试错误', {
    component: 'test-component',
    severity: 'low',
    metadata: { testData: 'error-test' }
  })
  info('错误已记录到监控系统')
}

const testCaptureException = () => {
  try {
    throw new Error('这是一个测试异常')
  } catch (err) {
    captureException(err as Error, {
      component: 'test-component',
      severity: 'medium'
    })
    warning('异常已记录到监控系统')
  }
}

const testNetworkError = () => {
  emit('error:network', {
    error: '网络连接超时',
    url: 'https://api.example.com/test',
    status: 408
  })
}

const showErrorStats = () => {
  if (errorMonitor) {
    const stats = errorMonitor.getErrorStats()
    notify({
      type: 'info',
      title: '错误统计',
      message: `总错误数: ${stats.totalErrors}，JavaScript错误: ${stats.errorsByType.javascript}`,
      duration: 5000
    })
  }
}

const showRecentErrors = () => {
  if (errorMonitor) {
    const recentErrors = errorMonitor.getRecentErrors(5)
    console.group('🚨 最近的错误')
    recentErrors.forEach(error => {
      console.log(`[${error.severity}] ${error.message}`, error)
    })
    console.groupEnd()
    info(`已在控制台显示最近 ${recentErrors.length} 个错误`)
  }
}

// 性能监控测试
const showPerformanceMetrics = async () => {
  try {
    const metrics = await getCurrentPerformanceMetrics()
    console.group('📊 当前性能指标')
    console.log('内存使用:', `${metrics.memoryUsage.percentage.toFixed(1)}% (${(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB)`)
    console.log('FPS:', metrics.fps)
    console.log('DOM 节点数:', metrics.domNodes)
    console.log('网络延迟:', `${metrics.networkLatency.toFixed(1)}ms`)
    console.log('渲染时间:', `${metrics.renderTime.toFixed(2)}ms`)
    console.groupEnd()
    
    notify({
      type: 'info',
      title: '性能指标',
      message: `内存: ${metrics.memoryUsage.percentage.toFixed(1)}%, FPS: ${metrics.fps}, DOM: ${metrics.domNodes}`,
      duration: 5000
    })
  } catch (error) {
    console.error('获取性能指标失败:', error)
    warning('获取性能指标失败')
  }
}

const showPerformanceHealth = () => {
  const health = checkPerformanceHealth()
  console.group('🏥 性能健康状态')
  console.log('健康状态:', health.healthy ? '良好' : '存在问题')
  console.log('性能评分:', `${health.score.toFixed(1)}/100`)
  if (health.issues.length > 0) {
    console.log('问题列表:')
    health.issues.forEach(issue => {
      console.log(`  - ${issue.type}: ${issue.level} (${issue.value})`)
    })
  }
  console.groupEnd()
  
  const statusText = health.healthy ? '性能状态良好' : `发现 ${health.issues.length} 个性能问题`
  const notifyType = health.healthy ? 'success' : (health.issues.some(i => i.level === 'critical') ? 'error' : 'warning')
  
  notify({
    type: notifyType,
    title: '性能健康检查',
    message: `${statusText}，评分: ${health.score.toFixed(1)}/100`,
    duration: 5000
  })
}

const showPerformanceReport = () => {
  if (performanceMonitor) {
    const report = performanceMonitor.getPerformanceReport()
    console.group('📈 性能报告')
    console.log('当前指标:', report.current)
    console.log('平均指标:', report.average)
    console.log('状态:', report.status)
    console.log('历史记录:', report.history)
    console.groupEnd()
    
    info('性能报告已输出到控制台')
  }
}

const simulatePerformanceIssue = () => {
  // 模拟性能问题：创建大量 DOM 元素
  const container = document.createElement('div')
  container.style.display = 'none'
  document.body.appendChild(container)
  
  for (let i = 0; i < 1000; i++) {
    const element = document.createElement('div')
    element.textContent = `Performance test element ${i}`
    container.appendChild(element)
  }
  
  warning('已创建1000个隐藏DOM元素来模拟性能问题')
  
  // 5秒后清理
  setTimeout(() => {
    document.body.removeChild(container)
    success('性能测试元素已清理')
  }, 5000)
}

const triggerPerformanceEvent = () => {
  emit('PERFORMANCE_SLOW', {
    component: 'test-component',
    duration: 2500,
    threshold: 1000,
    timestamp: Date.now()
  })
  
  emit('PERFORMANCE_MEMORY_WARNING', {
    usage: 85.5,
    threshold: 80,
    available: 2048,
    timestamp: Date.now()
  })
}

// 调试面板控制
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value
  if (showDebugPanel.value) {
    success('事件调试面板已打开')
  } else {
    info('事件调试面板已关闭')
  }
}

// 生命周期
onMounted(() => {
  // 注册事件监听器
  on('test-event', handleTestEvent)
  on(EVENTS.SYSTEM_READY, handleSystemReady)
  on('business:feature-used', handleBusinessEvent)
  on('error:app', handleErrorEvent)
  
  // 检查快捷键状态
  shortcutRegistered.value = isShortcutRegistered({
    key: 't',
    modifiers: { ctrl: true }
  })
})

onUnmounted(() => {
  // 清理事件监听器
  off('test-event', handleTestEvent)
  off(EVENTS.SYSTEM_READY, handleSystemReady)
  off('business:feature-used', handleBusinessEvent)
  off('error:app', handleErrorEvent)
  
  // 清理快捷键
  if (shortcutRegistered.value && testShortcutId) {
    unregisterShortcut(testShortcutId)
  }
})
</script>

<style scoped>
.composables-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: white;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.test-header p {
  margin: 0;
  opacity: 0.8;
}

.test-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.test-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.test-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #fff;
}

.test-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.test-controls button,
.btn {
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary {
  background: rgba(0, 122, 255, 0.8);
}

.btn-primary:hover {
  background: rgba(0, 122, 255, 1);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(108, 117, 125, 0.8);
}

.btn-secondary:hover {
  background: rgba(108, 117, 125, 1);
  transform: translateY(-1px);
}

.btn-success {
  background: rgba(40, 167, 69, 0.8);
}

.btn-success:hover {
  background: rgba(40, 167, 69, 1);
  transform: translateY(-1px);
}

.btn-warning {
  background: rgba(255, 193, 7, 0.8);
  color: #212529;
}

.btn-warning:hover {
  background: rgba(255, 193, 7, 1);
  transform: translateY(-1px);
}

.btn-danger {
  background: rgba(220, 53, 69, 0.8);
}

.btn-danger:hover {
  background: rgba(220, 53, 69, 1);
  transform: translateY(-1px);
}

.btn-info {
  background: rgba(23, 162, 184, 0.8);
}

.btn-info:hover {
  background: rgba(23, 162, 184, 1);
  transform: translateY(-1px);
}

.test-controls button:disabled,
.btn:disabled {
  background: rgba(108, 117, 125, 0.5);
  cursor: not-allowed;
  opacity: 0.6;
}

.test-controls p {
  margin: 5px 0;
  font-size: 14px;
  opacity: 0.9;
}

.test-info {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 14px;
  border-left: 4px solid rgba(0, 122, 255, 0.8);
}

.test-info p {
  margin: 5px 0;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.system-info p {
  margin: 0;
  font-size: 14px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border-left: 3px solid rgba(0, 122, 255, 0.8);
}

/* 调试面板样式 */
.debug-panel-section {
  border: 2px solid rgba(0, 122, 255, 0.3);
  background: rgba(0, 122, 255, 0.05);
}

.debug-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.debug-panel-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  width: 90vw;
  height: 80vh;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.debug-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 122, 255, 0.1);
  border-bottom: 1px solid rgba(0, 122, 255, 0.2);
}

.debug-panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: rgba(220, 53, 69, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(220, 53, 69, 1);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .composables-test {
    padding: 15px;
  }
  
  .test-sections {
    grid-template-columns: 1fr;
  }
  
  .debug-panel-overlay {
    padding: 10px;
  }
  
  .debug-panel-container {
    width: 95vw;
    height: 85vh;
  }
  
  .debug-panel-header {
    padding: 12px 16px;
  }
  
  .debug-panel-header h3 {
    font-size: 16px;
  }
}
</style>
