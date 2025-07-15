<template>
  <div class="event-system-example">
    <div class="header">
      <h2>事件系统中期优化示例</h2>
      <div class="status-indicators">
        <div class="status-item" :class="{ healthy: systemStatus.isHealthy }">
          <span class="indicator"></span>
          系统状态: {{ systemStatus.isHealthy ? '健康' : '异常' }}
        </div>
        <div class="status-item">
          <span class="indicator"></span>
          运行时间: {{ formatUptime(systemStatus.uptime) }}
        </div>
        <div class="status-item">
          <span class="indicator"></span>
          事件总数: {{ systemStatus.eventCount }}
        </div>
        <div class="status-item" :class="{ error: systemStatus.errorCount > 0 }">
          <span class="indicator"></span>
          错误数: {{ systemStatus.errorCount }}
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 事件触发区域 -->
      <div class="section">
        <h3>事件触发测试</h3>
        <div class="event-triggers">
          <button @click="triggerUserLogin" class="btn primary">
            触发用户登录事件
          </button>
          <button @click="triggerAppStartup" class="btn primary">
            触发应用启动事件
          </button>
          <button @click="triggerDataSync" class="btn primary">
            触发数据同步事件
          </button>
          <button @click="triggerErrorEvent" class="btn danger">
            触发错误事件
          </button>
          <button @click="triggerPerformanceTest" class="btn warning">
            性能压力测试
          </button>
        </div>
      </div>

      <!-- 实时监控 -->
      <div class="section">
        <h3>实时监控</h3>
        <div class="monitoring-grid">
          <div class="metric-card">
            <h4>平均响应时间</h4>
            <div class="metric-value">{{ systemStatus.averageResponseTime.toFixed(2) }}ms</div>
          </div>
          <div class="metric-card">
            <h4>内存使用</h4>
            <div class="metric-value">{{ formatMemory(systemStatus.memoryUsage) }}</div>
          </div>
          <div class="metric-card">
            <h4>吞吐量</h4>
            <div class="metric-value">{{ performanceMetrics.throughput }}/s</div>
          </div>
          <div class="metric-card">
            <h4>错误率</h4>
            <div class="metric-value" :class="{ error: performanceMetrics.errorRate > 5 }">
              {{ performanceMetrics.errorRate.toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 告警信息 -->
      <div class="section" v-if="activeAlerts.length > 0">
        <h3>活跃告警 ({{ activeAlerts.length }})</h3>
        <div class="alerts-list">
          <div 
            v-for="alert in activeAlerts" 
            :key="alert.id" 
            class="alert-item" 
            :class="alert.level"
          >
            <div class="alert-header">
              <span class="alert-title">{{ alert.title }}</span>
              <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
              <button @click="resolveAlert(alert.id)" class="btn-resolve">解决</button>
            </div>
            <div class="alert-message">{{ alert.message }}</div>
          </div>
        </div>
      </div>

      <!-- 事件流可视化 -->
      <div class="section">
        <h3>事件流可视化</h3>
        <div class="event-flows">
          <div v-if="eventFlows.length === 0" class="no-flows">
            暂无活跃的事件流
          </div>
          <div v-else>
            <div 
              v-for="flow in eventFlows" 
              :key="flow.id" 
              class="flow-item"
            >
              <div class="flow-header">
                <span class="flow-name">{{ flow.name }}</span>
                <span class="flow-status" :class="flow.status">{{ flow.status }}</span>
                <span class="flow-duration">
                  {{ flow.duration ? flow.duration.toFixed(2) + 'ms' : '进行中...' }}
                </span>
              </div>
              <div class="flow-children" v-if="flow.children.length > 0">
                <div 
                  v-for="child in flow.children" 
                  :key="child.id" 
                  class="flow-child" 
                  :class="child.status"
                >
                  <span class="child-type">{{ child.type }}</span>
                  <span class="child-name">{{ child.name }}</span>
                  <span class="child-duration">
                    {{ child.duration ? child.duration.toFixed(2) + 'ms' : '...' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 调试日志 -->
      <div class="section">
        <h3>调试日志</h3>
        <div class="debug-controls">
          <select v-model="debugFilter.level" @change="updateDebugFilter">
            <option value="">所有级别</option>
            <option value="verbose">Verbose</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          <input 
            v-model="debugFilter.searchText" 
            @input="updateDebugFilter"
            placeholder="搜索事件名称或消息..."
            class="search-input"
          >
          <button @click="clearDebugLogs" class="btn secondary">清空日志</button>
          <button @click="exportDebugLogs" class="btn secondary">导出日志</button>
        </div>
        <div class="debug-logs">
          <div 
            v-for="record in recentDebugRecords" 
            :key="record.id" 
            class="log-item" 
            :class="record.level"
          >
            <div class="log-header">
              <span class="log-time">{{ formatTime(record.timestamp) }}</span>
              <span class="log-level">{{ record.level.toUpperCase() }}</span>
              <span class="log-type">{{ record.type }}</span>
              <span class="log-event">{{ record.eventName }}</span>
            </div>
            <div class="log-message">{{ record.message }}</div>
            <div v-if="record.duration" class="log-duration">
              执行时间: {{ record.duration.toFixed(2) }}ms
            </div>
          </div>
        </div>
      </div>

      <!-- 性能报告 -->
      <div class="section">
        <h3>性能报告</h3>
        <div class="performance-report">
          <button @click="generateReport" class="btn primary">生成报告</button>
          <div v-if="performanceReport" class="report-content">
            <div class="report-summary">
              <div class="summary-item">
                <label>报告周期:</label>
                <span>{{ formatTime(performanceReport.period.start) }} - {{ formatTime(performanceReport.period.end) }}</span>
              </div>
              <div class="summary-item">
                <label>总事件数:</label>
                <span>{{ performanceReport.totalEvents }}</span>
              </div>
              <div class="summary-item">
                <label>成功率:</label>
                <span>{{ ((performanceReport.successfulEvents / performanceReport.totalEvents) * 100).toFixed(2) }}%</span>
              </div>
              <div class="summary-item">
                <label>平均响应时间:</label>
                <span>{{ performanceReport.averageEventTime.toFixed(2) }}ms</span>
              </div>
              <div class="summary-item">
                <label>P95响应时间:</label>
                <span>{{ performanceReport.p95EventTime.toFixed(2) }}ms</span>
              </div>
              <div class="summary-item">
                <label>吞吐量:</label>
                <span>{{ performanceReport.throughput.toFixed(2) }} events/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useEnterpriseEventManager } from '@/composables'
import type { PerformanceReport, Alert } from '@/composables/useEnterpriseEventManager'
import type { DebugRecord, DebugFilter } from '@/composables/useEventDebugger'

// 事件管理器
const eventManager = useEnterpriseEventManager({
  enableMiddleware: true,
  enableRouting: true,
  enableLifecycle: true,
  enableDebugging: true,
  
  middlewareConfig: {
    enableLogging: true,
    enableValidation: true,
    enablePerformanceMonitoring: true,
    enableSecurity: true,
    enableErrorHandling: true,
    enableCaching: false,
    enableRateLimit: false,
    customMiddlewares: []
  },
  
  performanceConfig: {
    enableMetrics: true,
    alertThresholds: {
      maxEventTime: 1000,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxErrorRate: 5 // 5%
    }
  },
  
  debugConfig: {
    enabled: true,
    level: 'info',
    maxRecords: 1000,
    trackPerformance: true,
    visualizeFlow: true,
    realTimeMonitoring: true
  }
})

// 响应式数据
const systemStatus = eventManager.systemStatus
const activeAlerts = eventManager.activeAlerts
const performanceMetrics = eventManager.debugger.performanceMetrics
const performanceReport = ref<PerformanceReport | null>(null)

// 调试相关
const debugFilter = ref<Partial<DebugFilter>>({
  level: '',
  searchText: ''
})

// 计算属性
const recentDebugRecords = computed(() => {
  return eventManager.debugger.filteredRecords.value.slice(0, 50)
})

const eventFlows = computed(() => {
  return eventManager.debugger.getEventFlowData().slice(0, 10)
})

// 设置路由
function setupRoutes() {
  // 用户相关事件路由
  eventManager.router.registerRoute('user:*', {
    pattern: 'user:*',
    strategy: 'all',
    targets: [
      {
        id: 'user-handler',
        handler: async (eventName, eventData) => {
          console.log(`处理用户事件: ${eventName}`, eventData)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
          return { success: true, handler: 'user-handler' }
        },
        weight: 1,
        enabled: true
      },
      {
        id: 'audit-handler',
        handler: async (eventName, eventData) => {
          console.log(`审计日志: ${eventName}`, eventData)
          await new Promise(resolve => setTimeout(resolve, 30))
          return { logged: true, handler: 'audit-handler' }
        },
        weight: 1,
        enabled: true
      }
    ]
  })
  
  // 应用相关事件路由
  eventManager.router.registerRoute('app:*', {
    pattern: 'app:*',
    strategy: 'first',
    targets: [
      {
        id: 'app-handler',
        handler: async (eventName, eventData) => {
          console.log(`处理应用事件: ${eventName}`, eventData)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
          return { success: true, handler: 'app-handler' }
        },
        weight: 1,
        enabled: true
      }
    ]
  })
  
  // 数据同步事件路由
  eventManager.router.registerRoute('data:*', {
    pattern: 'data:*',
    strategy: 'weighted',
    targets: [
      {
        id: 'primary-sync',
        handler: async (eventName, eventData) => {
          console.log(`主同步服务: ${eventName}`, eventData)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100))
          return { synced: true, handler: 'primary-sync' }
        },
        weight: 3,
        enabled: true
      },
      {
        id: 'backup-sync',
        handler: async (eventName, eventData) => {
          console.log(`备份同步服务: ${eventName}`, eventData)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 150))
          return { synced: true, handler: 'backup-sync' }
        },
        weight: 1,
        enabled: true
      }
    ]
  })
}

// 事件触发方法
async function triggerUserLogin() {
  try {
    const result = await eventManager.eventBus.emit('user:login', {
      username: 'john@example.com',
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
    console.log('用户登录事件结果:', result)
  } catch (error) {
    console.error('用户登录事件失败:', error)
  }
}

async function triggerAppStartup() {
  try {
    const result = await eventManager.eventBus.emit('app:startup', {
      version: '1.0.0',
      environment: 'development',
      timestamp: Date.now()
    })
    console.log('应用启动事件结果:', result)
  } catch (error) {
    console.error('应用启动事件失败:', error)
  }
}

async function triggerDataSync() {
  try {
    const result = await eventManager.eventBus.emit('data:sync', {
      type: 'user-preferences',
      lastSync: Date.now() - 3600000,
      timestamp: Date.now()
    })
    console.log('数据同步事件结果:', result)
  } catch (error) {
    console.error('数据同步事件失败:', error)
  }
}

async function triggerErrorEvent() {
  try {
    await eventManager.eventBus.emit('test:error', {
      shouldFail: true,
      timestamp: Date.now()
    })
  } catch (error) {
    console.log('预期的错误事件:', error)
  }
}

async function triggerPerformanceTest() {
  console.log('开始性能压力测试...')
  const promises = []
  
  for (let i = 0; i < 20; i++) {
    promises.push(
      eventManager.eventBus.emit('test:performance', {
        index: i,
        timestamp: Date.now()
      })
    )
  }
  
  try {
    await Promise.all(promises)
    console.log('性能压力测试完成')
  } catch (error) {
    console.error('性能压力测试失败:', error)
  }
}

// 告警处理
function resolveAlert(alertId: string) {
  eventManager.resolveAlert(alertId)
}

// 调试日志管理
function updateDebugFilter() {
  eventManager.debugger.filter.value = {
    ...debugFilter.value,
    levels: debugFilter.value.level ? [debugFilter.value.level as any] : undefined
  }
}

function clearDebugLogs() {
  eventManager.debugger.clearRecords()
}

function exportDebugLogs() {
  const data = eventManager.debugger.exportData({
    format: 'json',
    includeMetadata: true,
    includeStack: true
  })
  
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-logs-${new Date().toISOString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 性能报告
function generateReport() {
  performanceReport.value = eventManager.generatePerformanceReport(3600000) // 1小时
}

// 工具函数
function formatUptime(uptime: number): string {
  const seconds = Math.floor(uptime / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

function formatMemory(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

// 生命周期
onMounted(() => {
  setupRoutes()
  
  // 注册测试事件处理器
  eventManager.eventBus.on('test:error', async () => {
    throw new Error('这是一个测试错误')
  })
  
  eventManager.eventBus.on('test:performance', async (data) => {
    // 模拟一些处理时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
    return { processed: true, index: data.index }
  })
})

onUnmounted(() => {
  eventManager.shutdown()
})

// 监听告警
watch(activeAlerts, (alerts) => {
  alerts.forEach(alert => {
    if (alert.level === 'critical') {
      console.error('关键告警:', alert.message)
    }
  })
}, { deep: true })
</script>

<style scoped>
.event-system-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  margin-bottom: 30px;
}

.header h2 {
  margin: 0 0 15px 0;
  color: #333;
}

.status-indicators {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 14px;
}

.status-item.healthy .indicator {
  background: #4caf50;
}

.status-item.error .indicator {
  background: #f44336;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin: 0 0 15px 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
}

.event-triggers {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn.primary {
  background: #007aff;
  color: white;
}

.btn.primary:hover {
  background: #0056cc;
}

.btn.danger {
  background: #ff3b30;
  color: white;
}

.btn.danger:hover {
  background: #d70015;
}

.btn.warning {
  background: #ff9500;
  color: white;
}

.btn.warning:hover {
  background: #cc7700;
}

.btn.secondary {
  background: #8e8e93;
  color: white;
}

.btn.secondary:hover {
  background: #6d6d70;
}

.monitoring-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.metric-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
}

.metric-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.metric-value.error {
  color: #f44336;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #ccc;
}

.alert-item.info {
  background: #e3f2fd;
  border-left-color: #2196f3;
}

.alert-item.warning {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.alert-item.error {
  background: #ffebee;
  border-left-color: #f44336;
}

.alert-item.critical {
  background: #fce4ec;
  border-left-color: #e91e63;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.alert-title {
  font-weight: bold;
}

.alert-time {
  font-size: 12px;
  color: #666;
}

.btn-resolve {
  padding: 4px 8px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.alert-message {
  font-size: 14px;
  color: #555;
}

.event-flows {
  max-height: 400px;
  overflow-y: auto;
}

.no-flows {
  text-align: center;
  color: #999;
  padding: 20px;
}

.flow-item {
  margin-bottom: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.flow-name {
  font-weight: bold;
}

.flow-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
}

.flow-status.pending {
  background: #fff3cd;
  color: #856404;
}

.flow-status.processing {
  background: #cce5ff;
  color: #004085;
}

.flow-status.completed {
  background: #d4edda;
  color: #155724;
}

.flow-status.failed {
  background: #f8d7da;
  color: #721c24;
}

.flow-children {
  margin-left: 20px;
  border-left: 2px solid #eee;
  padding-left: 15px;
}

.flow-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}

.flow-child.completed {
  color: #28a745;
}

.flow-child.failed {
  color: #dc3545;
}

.child-type {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
}

.debug-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.debug-logs {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
}

.log-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.error {
  background: #fff5f5;
}

.log-item.warn {
  background: #fffbf0;
}

.log-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #666;
}

.log-level {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
}

.log-level {
  background: #e9ecef;
  color: #495057;
}

.log-type {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.log-event {
  font-weight: bold;
  color: #007aff;
}

.log-message {
  font-size: 14px;
  color: #333;
}

.log-duration {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.performance-report {
  margin-top: 15px;
}

.report-content {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item label {
  font-weight: bold;
  color: #495057;
}

.summary-item span {
  color: #333;
}
</style>