<template>
  <div class="composables-test">
    <div class="test-header">
      <h2>组合式函数测试</h2>
      <p>测试和演示 Vue 3 组合式函数功能</p>
    </div>

    <div class="test-sections">


      <!-- 响应式数据测试 -->
      <div class="test-section">
        <h3>响应式数据测试</h3>
        <div class="test-controls">
          <label>
            计数器: 
            <input 
              v-model.number="counter" 
              type="number" 
              class="test-input"
            >
          </label>
          <button @click="incrementCounter" class="test-btn">
            增加
          </button>
          <button @click="resetCounter" class="test-btn">
            重置
          </button>
        </div>
        <div class="test-results">
          <p>当前计数: {{ counter }}</p>
          <p>双倍计数: {{ doubleCounter }}</p>
          <p>计数状态: {{ counterStatus }}</p>
        </div>
      </div>

      <!-- 生命周期测试 -->
      <div class="test-section">
        <h3>生命周期钩子测试</h3>
        <div class="test-results">
          <h4>生命周期日志:</h4>
          <ul class="lifecycle-log">
            <li v-for="(log, index) in lifecycleLogs" :key="index">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-event">{{ log.event }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 监听器测试 -->
      <div class="test-section">
        <h3>监听器测试</h3>
        <div class="test-controls">
          <label>
            监听的值: 
            <input 
              v-model="watchedValue" 
              type="text" 
              class="test-input"
              placeholder="输入任何值"
            >
          </label>
        </div>
        <div class="test-results">
          <h4>监听器日志:</h4>
          <ul class="watch-log">
            <li v-for="(log, index) in watchLogs" :key="index">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-change">{{ log.oldValue }} → {{ log.newValue }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 异步操作测试 -->
      <div class="test-section">
        <h3>异步操作测试</h3>
        <div class="test-controls">
          <button @click="testAsyncOperation" class="test-btn" :disabled="isLoading">
            {{ isLoading ? '加载中...' : '开始异步操作' }}
          </button>
          <button @click="testPromiseChain" class="test-btn">
            测试 Promise 链
          </button>
        </div>
        <div class="test-results">
          <h4>异步操作结果:</h4>
          <pre>{{ asyncResults }}</pre>
        </div>
      </div>

      <!-- 自定义组合式函数测试 -->
      <div class="test-section">
        <h3>自定义 Composables 测试</h3>
        <div class="test-controls">
          <button @click="testMousePosition" class="test-btn">
            {{ isTrackingMouse ? '停止' : '开始' }}鼠标位置追踪
          </button>
          <button @click="testLocalStorage" class="test-btn">
            测试本地存储
          </button>
        </div>
        <div class="test-results">
          <p v-if="isTrackingMouse">
            鼠标位置: X={{ mousePosition.x }}, Y={{ mousePosition.y }}
          </p>
          <p>本地存储测试值: {{ localStorageValue }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// 响应式数据
const counter = ref(0)
const watchedValue = ref('')
const isLoading = ref(false)
const isTrackingMouse = ref(false)
const mousePosition = ref({ x: 0, y: 0 })
const localStorageValue = ref('')

// 测试结果
const asyncResults = ref('')
const lifecycleLogs = ref<Array<{ time: string; event: string }>>([])
const watchLogs = ref<Array<{ time: string; oldValue: any; newValue: any }>>([])

// 计算属性
const doubleCounter = computed(() => counter.value * 2)
const counterStatus = computed(() => {
  if (counter.value === 0) return '零'
  if (counter.value > 0) return '正数'
  return '负数'
})

// 监听器
watch(watchedValue, (newValue, oldValue) => {
  watchLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    oldValue,
    newValue
  })
  // 保持日志数量在合理范围内
  if (watchLogs.value.length > 10) {
    watchLogs.value = watchLogs.value.slice(0, 10)
  }
})

// 生命周期钩子
onMounted(() => {
  addLifecycleLog('组件已挂载')
  
  // 初始化本地存储测试
  const stored = localStorage.getItem('composables-test-value')
  if (stored) {
    localStorageValue.value = stored
  }
})

onUnmounted(() => {
  addLifecycleLog('组件即将卸载')
  stopMouseTracking()
})

// 方法
function addLifecycleLog(event: string) {
  lifecycleLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    event
  })
  // 保持日志数量在合理范围内
  if (lifecycleLogs.value.length > 10) {
    lifecycleLogs.value = lifecycleLogs.value.slice(0, 10)
  }
}

function incrementCounter() {
  counter.value++
}

function resetCounter() {
  counter.value = 0
}



// 异步操作测试
async function testAsyncOperation() {
  isLoading.value = true
  asyncResults.value = '开始异步操作...'
  
  try {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    asyncResults.value = JSON.stringify({
      message: '异步操作完成',
      timestamp: new Date().toISOString(),
      duration: '2秒'
    }, null, 2)
  } catch (error) {
    asyncResults.value = `异步操作失败: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

async function testPromiseChain() {
  asyncResults.value = '开始 Promise 链测试...'
  
  try {
    const result = await Promise.resolve(1)
      .then(x => x + 1)
      .then(x => x * 2)
      .then(x => ({ value: x, message: 'Promise 链执行成功' }))
    
    asyncResults.value = JSON.stringify(result, null, 2)
  } catch (error) {
    asyncResults.value = `Promise 链测试失败: ${error.message}`
  }
}

// 鼠标位置追踪
function testMousePosition() {
  if (isTrackingMouse.value) {
    stopMouseTracking()
  } else {
    startMouseTracking()
  }
}

function startMouseTracking() {
  isTrackingMouse.value = true
  document.addEventListener('mousemove', updateMousePosition)
}

function stopMouseTracking() {
  isTrackingMouse.value = false
  document.removeEventListener('mousemove', updateMousePosition)
}

function updateMousePosition(event: MouseEvent) {
  mousePosition.value = {
    x: event.clientX,
    y: event.clientY
  }
}

// 本地存储测试
function testLocalStorage() {
  const testValue = `测试值 - ${new Date().toLocaleTimeString()}`
  localStorage.setItem('composables-test-value', testValue)
  localStorageValue.value = testValue
}
</script>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'composables_test',
  title: 'Composables Test',
  icon: '🧪',
  iconColor: '#fff',
  iconBgColor: '#4CAF50',
  width: 800,
  height: 600,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  hideInDesktop: false,
  category: 'development',
  description: '测试和演示组合式函数功能',
  version: '1.0.0',
  author: 'Developer',
  tags: ['test', 'composables', 'vue'],
  system: true,
  essential: false,
  singleton: false
}
</script>

<style scoped>
.composables-test {
  padding: 20px;
  max-height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.test-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.test-header p {
  color: #666;
  margin: 0;
}

.test-sections {
  display: grid;
  gap: 24px;
}

.test-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.test-section h3 {
  color: #495057;
  margin-bottom: 16px;
  font-size: 18px;
}

.test-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.test-btn {
  padding: 8px 16px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #0056b3;
}

.test-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.test-input {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.test-results {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #dee2e6;
}

.test-results h4 {
  color: #495057;
  margin-bottom: 12px;
  font-size: 16px;
}

.test-results pre {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.test-results p {
  margin: 8px 0;
  color: #495057;
}

.lifecycle-log,
.watch-log {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.lifecycle-log li,
.watch-log li {
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-time {
  color: #6c757d;
  font-family: monospace;
  font-size: 11px;
}

.log-event,
.log-change {
  color: #495057;
  font-weight: 500;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .composables-test {
    padding: 16px;
  }
  
  .test-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .test-btn {
    width: 100%;
  }
  
  label {
    flex-direction: column;
    align-items: stretch;
  }
}

/* 滚动条样式 */
.composables-test::-webkit-scrollbar,
.lifecycle-log::-webkit-scrollbar,
.watch-log::-webkit-scrollbar {
  width: 6px;
}

.composables-test::-webkit-scrollbar-track,
.lifecycle-log::-webkit-scrollbar-track,
.watch-log::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.composables-test::-webkit-scrollbar-thumb,
.lifecycle-log::-webkit-scrollbar-thumb,
.watch-log::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.composables-test::-webkit-scrollbar-thumb:hover,
.lifecycle-log::-webkit-scrollbar-thumb:hover,
.watch-log::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
