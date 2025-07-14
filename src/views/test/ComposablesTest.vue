<template>
  <div class="composables-test">
    <div class="test-header">
      <h2>组合式函数测试页面</h2>
      <p>测试事件系统、键盘快捷键和通知系统</p>
    </div>

    <div class="test-sections">
      <!-- 事件系统测试 -->
      <div class="test-section">
        <h3>事件系统测试</h3>
        <div class="test-controls">
          <button @click="testEventEmit">触发自定义事件</button>
          <button @click="testGlobalEvent">触发全局事件</button>
          <p>事件计数: {{ eventCount }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  useEventBus, 
  useKeyboard, 
  useNotification, 
  useSystem,
  useUtils,
  EVENTS 
} from '@/composables'

// 组合式函数
const { on, off, emit } = useEventBus()
const { registerShortcut, unregisterShortcut, isShortcutRegistered } = useKeyboard()
const { success, error, warning, info, show: notify, closeAll } = useNotification()
const { getSystemInfo, getNetworkStatus } = useSystem()
const systemInfo = ref(getSystemInfo())
const isOnline = ref(getNetworkStatus().online)
const { device } = useUtils()

// 响应式数据
const eventCount = ref(0)
const shortcutRegistered = ref(false)
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
  emit(EVENTS.SYSTEM_READY, { source: 'test-page' })
}

const handleTestEvent = (data: any) => {
  eventCount.value++
  success(`接收到事件: ${data.message}`)
}

const handleSystemReady = (data: any) => {
  info(`系统就绪事件触发，来源: ${data.source}`)
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

// 生命周期
onMounted(() => {
  // 注册事件监听器
  on('test-event', handleTestEvent)
  on(EVENTS.SYSTEM_READY, handleSystemReady)
  
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

.test-controls button {
  padding: 8px 16px;
  background: rgba(0, 122, 255, 0.8);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.test-controls button:hover {
  background: rgba(0, 122, 255, 1);
  transform: translateY(-1px);
}

.test-controls p {
  margin: 5px 0;
  font-size: 14px;
  opacity: 0.9;
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

@media (max-width: 768px) {
  .composables-test {
    padding: 15px;
  }
  
  .test-sections {
    grid-template-columns: 1fr;
  }
}
</style>