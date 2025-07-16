<template>
  <div class="event-system-example">
    <div class="header">
      <h2>窗口事件系统示例</h2>
      <p>展示统一的窗口事件系统和增强的事件总线功能</p>
    </div>
    
    <!-- 窗口操作区域 -->
    <div class="section">
      <h3>窗口操作</h3>
      <div class="button-group">
        <el-button size="small" type="primary" @click="windowEvents.window.maximize()">最大化</el-button>
        <el-button size="small" type="primary" @click="windowEvents.window.normalize()">正常大小</el-button>
        <el-button size="small" type="primary" @click="windowEvents.window.minimize()">最小化</el-button>
        <el-button size="small" type="primary" @click="windowEvents.window.fullscreen()">全屏</el-button>
        <el-button size="small" type="danger" @click="windowEvents.window.close()">关闭</el-button>
      </div>
    </div>
    
    <!-- 窗口属性区域 -->
    <div class="section">
      <h3>窗口属性</h3>
      <div class="form-group">
        <el-input 
          v-model="windowTitle" 
          placeholder="输入新的窗口标题"
          style="width: 200px; margin-right: 10px;"
        />
        <el-button size="small" @click="setWindowTitle">设置标题</el-button>
      </div>
      <div class="form-group">
        <el-input-number v-model="windowX" :min="0" :max="1920" style="width: 100px; margin-right: 5px;" />
        <el-input-number v-model="windowY" :min="0" :max="1080" style="width: 100px; margin-right: 10px;" />
        <el-button size="small" @click="setWindowPosition">设置位置</el-button>
      </div>
      <div class="form-group">
        <el-input-number v-model="windowWidth" :min="300" :max="1920" style="width: 100px; margin-right: 5px;" />
        <el-input-number v-model="windowHeight" :min="200" :max="1080" style="width: 100px; margin-right: 10px;" />
        <el-button size="small" @click="setWindowSize">设置大小</el-button>
      </div>
    </div>
    
    <!-- 应用操作区域 -->
    <div class="section">
      <h3>应用操作</h3>
      <div class="button-group">
        <el-button size="small" type="success" @click="openAboutApp">打开关于</el-button>
        <el-button size="small" type="success" @click="openColorfulApp">打开彩色应用</el-button>
        <el-button size="small" type="warning" @click="closeAboutApp">关闭关于</el-button>
      </div>
    </div>
    
    <!-- 事件监听状态 -->
    <div class="section">
      <h3>事件监听状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">窗口状态:</span>
          <span class="value" :class="windowState">{{ windowState }}</span>
        </div>
        <div class="status-item">
          <span class="label">窗口焦点:</span>
          <span class="value" :class="{ focused: windowFocused, blurred: !windowFocused }">
            {{ windowFocused ? '已聚焦' : '未聚焦' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">窗口位置:</span>
          <span class="value">{{ windowPosition.x }}, {{ windowPosition.y }}</span>
        </div>
        <div class="status-item">
          <span class="label">窗口大小:</span>
          <span class="value">{{ windowSize.width }} × {{ windowSize.height }}</span>
        </div>
      </div>
    </div>
    
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
import { useEnterpriseEventManager } from '@/shared/composables'
import { useAppWindowEvents } from '@/shared/composables'
import { EVENTS } from '@/core/event-system/useEventBus'
import type { PerformanceReport, Alert } from '@/shared/composables'
import type { DebugRecord, DebugFilter } from '@/shared/composables'

// 定义props来接收app信息
defineProps<{
  app: {
    key: string
    pid: number
    title?: string
    [key: string]: any
  }
}>()

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

// 窗口事件系统
const windowEvents = useAppWindowEvents()

// 窗口状态数据
const windowTitle = ref('新窗口标题')
const windowX = ref(100)
const windowY = ref(100)
const windowWidth = ref(800)
const windowHeight = ref(600)
const windowState = ref('normal')
const windowFocused = ref(true)
const windowPosition = ref({ x: 0, y: 0 })
const windowSize = ref({ width: 800, height: 600 })

// 响应式数据
const systemStatus = eventManager.systemStatus
const activeAlerts = eventManager.activeAlerts
const performanceMetrics = eventManager.eventDebugger.performanceMetrics
const performanceReport = ref<PerformanceReport | null>(null)

// 调试相关
const debugFilter = ref<Partial<DebugFilter>>({
  level: '',
  searchText: ''
})

// 计算属性
const recentDebugRecords = computed(() => {
  return eventManager.eventDebugger.filteredRecords.value.slice(0, 50)
})

const eventFlows = computed(() => {
  return eventManager.eventDebugger.getEventFlowData().slice(0, 10)
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
    const result = await eventManager.eventBus.emit(EVENTS.USER_LOGIN, {
      username: 'john@example.com',
      timestamp: Date.now(),
      method: 'form'
    })
    console.log('用户登录事件结果:', result)
  } catch (error) {
    console.error('用户登录事件失败:', error)
  }
}

async function triggerAppStartup() {
  try {
    const result = await eventManager.eventBus.emit(EVENTS.APP_STARTUP, {
      timestamp: Date.now(),
      config: {
        version: '1.0.0',
        environment: 'development'
      }
    })
    console.log('应用启动事件结果:', result)
  } catch (error) {
    console.error('应用启动事件失败:', error)
  }
}

async function triggerDataSync() {
  try {
    const result = await eventManager.eventBus.emit(EVENTS.DATA_SYNC, {
      type: 'user-preferences',
      status: 'start',
      data: {
        lastSync: Date.now() - 3600000
      }
    })
    console.log('数据同步事件结果:', result)
  } catch (error) {
    console.error('数据同步事件失败:', error)
  }
}

async function triggerErrorEvent() {
  try {
    await eventManager.eventBus.emit(EVENTS.TEST_ERROR, {
      message: '这是一个测试错误',
      context: 'triggerErrorEvent',
      severity: 'medium'
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
      eventManager.eventBus.emit(EVENTS.TEST_PERFORMANCE, {
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
  eventManager.eventDebugger.filter.value = {
    ...debugFilter.value,
    levels: debugFilter.value.level ? [debugFilter.value.level as any] : undefined
  }
}

function clearDebugLogs() {
  eventManager.eventDebugger.clearRecords()
}

function exportDebugLogs() {
  const data = eventManager.eventDebugger.exportData({
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

// 窗口操作方法
function setWindowTitle() {
  windowEvents.window.setTitle(windowTitle.value)
}

function setWindowPosition() {
  windowEvents.window.setPosition(windowX.value, windowY.value)
}

function setWindowSize() {
  windowEvents.window.setSize(windowWidth.value, windowHeight.value)
}

function openAboutApp() {
  windowEvents.app.open('about')
}

function openColorfulApp() {
  windowEvents.app.open('colorful')
}

function closeAboutApp() {
  windowEvents.app.close('about')
}

// 生命周期
onMounted(() => {
  setupRoutes()
  
  // 注册测试事件处理器
  eventManager.eventBus.on(EVENTS.TEST_ERROR, async () => {
    throw new Error('这是一个测试错误')
  })
  
  eventManager.eventBus.on(EVENTS.TEST_PERFORMANCE, async (data) => {
    // 模拟一些处理时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
    return { processed: true, index: data.index }
  })
  
  // 监听窗口事件
   windowEvents.on.onWindowStateChange((state) => {
     windowState.value = state
   })
   
   windowEvents.on.onWindowFocusChange((focused) => {
     windowFocused.value = focused
   })
   
   windowEvents.on.onWindowPositionChange((position) => {
     windowPosition.value = position
     windowX.value = position.x
     windowY.value = position.y
   })
   
   windowEvents.on.onWindowSizeChange((size) => {
     windowSize.value = size
     windowWidth.value = size.width
     windowHeight.value = size.height
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

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'demo_es',
  title: 'ES',
  icon: 'icon-MIS_bangongOA',
  iconColor: '#fff',
  iconBgColor: '#022732',
  width: 420,
  height: 350,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  keepInDock: true,
  category: 'utilities',
  description: '演示常驻 Dock 功能的应用',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['dock', 'persistent'],
  demo: true,
  featured: false
}
</script>

<style scoped>
.event-system-example {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  margin-bottom: 30px;
}

.header h2 {
  color: #1d1d1f;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.header p {
  color: #86868b;
  font-size: 16px;
  margin: 0;
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
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f5f7;
  border-radius: 12px;
}

.section h3 {
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-item .label {
  font-weight: 500;
  color: #1d1d1f;
}

.status-item .value {
  font-weight: 600;
}

.status-item .value.maximized {
  color: #007aff;
}

.status-item .value.minimized {
  color: #ff9500;
}

.status-item .value.fullscreen {
  color: #34c759;
}

.status-item .value.normal {
  color: #8e8e93;
}

.status-item .value.focused {
  color: #34c759;
}

.status-item .value.blurred {
  color: #8e8e93;
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
