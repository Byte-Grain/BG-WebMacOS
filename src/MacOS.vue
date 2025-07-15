<template>
  <div class="mac-os" @contextmenu.prevent="onContextShow()">
    <transition name="fade">
      <Background />
    </transition>
    <transition name="fade">
      <Loading v-if="loading || (!systemInitialized && showLogin)" />
    </transition>
    <transition name="fade">
      <Login v-if="systemInitialized && showLogin" @logined="handleLogin" />
    </transition>
    <transition name="fade">
      <Desktop v-if="!showLogin && !loading && !showDebugTest" />
    </transition>
    <transition name="fade">
      <Launchpad v-if="launchpad" />
    </transition>
    <transition name="fade">
      <RegistryTest v-if="showDebugTest" />
    </transition>
  
    <!-- AppWindow 组件暂时移除，等待后续实现 -->
    <!-- <AppWindow v-for="item in openAppList" :key="item.pid" :app="item" /> -->
    
    <!-- 通知组件 -->
    <Notification />
  </div>
</template>

<style scoped lang="scss">
  .mac-os {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
  
  .debug-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    
    .debug-btn {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.9);
        transform: scale(1.05);
      }
    }
  }
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { 
  useCore,
  captureError,
  EVENTS 
} from '@/composables'

// 组件导入
import Background from './components/common/Bg.vue'
import Loading from './components/common/Loading.vue'
import Login from './views/login/Login.vue'
import Desktop from './components/layout/DeskTop.vue'
import Launchpad from './components/layout/LaunchPad.vue'
import Notification from './components/common/Notification.vue'
import RegistryTest from './views/test/RegistryTest.vue'
// AppWindow 组件暂时移除，等待后续实现

const store = useStore()

// 使用核心组合式函数（包含错误监控）
const {
  // 系统相关
  isLoggedIn, isLoading, initializeSystem,
  // 应用管理
  openApps, isLaunchpadOpen, initializeDockApps, openAppByKey,
  // 主题
  applyCurrentTheme, toggleTheme,
  // 事件系统
  emit, on,
  // 键盘
  registerShortcut, COMMON_SHORTCUTS,
  // 通知
  success, info,
} = useCore({
  namespace: 'macos-main',
  debugMode: process.env.NODE_ENV === 'development',
  enableErrorMonitoring: true
})

// 响应式数据
const showDebugTest = ref(false)
// 对于已登录用户，立即标记系统为已初始化状态
const systemInitialized = ref(!store.state.showLogin)

// 计算属性
const showLogin = computed(() => !isLoggedIn.value)
const loading = computed(() => isLoading.value)
const launchpad = computed(() => isLaunchpadOpen.value)

// 注册系统快捷键
const registerSystemShortcuts = () => {
  // Spotlight 搜索 (Cmd/Ctrl + Space)
  registerShortcut(COMMON_SHORTCUTS.SPOTLIGHT, () => {
    openAppByKey('system_launchpad')
    info('启动台已打开', { duration: 2000 })
  })
  
  // 切换主题 (Cmd/Ctrl + Shift + T)
  registerShortcut(
    { key: 't', modifiers: { ctrl: true, shift: true }, description: '切换主题' },
    () => {
      toggleTheme()
      success('主题已切换', { duration: 2000 })
    }
  )
  
  // 关闭当前窗口 (Cmd/Ctrl + W)
  registerShortcut(COMMON_SHORTCUTS.CLOSE_WINDOW, () => {
    // 这里可以添加关闭当前活动窗口的逻辑
    emit(EVENTS.APP_CLOSED, { 
      appKey: 'current', 
      pid: Date.now(), 
      reason: 'keyboard-shortcut',
      source: 'keyboard' 
    })
  })
  
  // 刷新页面 (Cmd/Ctrl + R)
  registerShortcut(COMMON_SHORTCUTS.REFRESH, () => {
    window.location.reload()
  })
}

// 设置事件监听
const setupEventListeners = () => {
  // 监听应用打开事件
  on(EVENTS.APP_OPENED, (data) => {
    console.log('应用已打开:', data)
    // 触发业务事件
    emit('business:feature-used', {
      feature: 'app-open',
      metadata: { appKey: data.appKey, pid: data.pid }
    })
  })
  
  // 监听应用错误事件
  on('error:app', (data) => {
    captureError(`应用错误: ${data.error}`, {
      component: 'app-manager',
      severity: data.severity || 'medium',
      metadata: { appKey: data.appKey }
    })
  })
  
  // 监听主题变化事件
  on(EVENTS.THEME_CHANGED, (data) => {
    console.log('主题已变化:', data)
    emit('business:feature-used', {
      feature: 'theme-change',
      metadata: { theme: data.theme, previous: data.previous }
    })
  })
  
  // 监听系统就绪事件
  on(EVENTS.SYSTEM_READY, (data) => {
    success('系统初始化完成', { duration: 3000 })
    emit('business:engagement', {
      type: 'system-ready',
      duration: data?.bootTime || 0,
      metadata: { version: data?.version }
    })
  })
  
  // 监听系统错误事件
  on(EVENTS.SYSTEM_ERROR, (data) => {
    captureError(`系统错误: ${data.error}`, {
      component: data.component || 'system',
      severity: data.recoverable ? 'medium' : 'high',
      metadata: { recoverable: data.recoverable }
    })
  })
  
  // 监听网络错误事件
  on('error:network', (data) => {
    captureError(`网络错误: ${data.error}`, {
      component: 'network',
      severity: 'medium',
      metadata: { url: data.url, status: data.status }
    })
  })
  
  // 监听系统锁屏事件
  window.addEventListener('system:lockScreen', () => {
    try {
      store.commit('logout')
      info('系统已锁屏', { duration: 2000 })
      emit(EVENTS.SYSTEM_SLEEP, { trigger: 'user' })
    } catch (error) {
      captureError('锁屏操作失败', {
        component: 'system-lock',
        severity: 'medium',
        metadata: { error: String(error) }
      })
    }
  })
  
  // 监听系统关机事件
  window.addEventListener('system:shutdown', () => {
    try {
      store.commit('logout')
      info('系统正在关机...', { duration: 2000 })
      emit(EVENTS.SYSTEM_SHUTDOWN, { reason: 'user-request' })
      
      setTimeout(() => {
        window.close() || (window.location.href = 'about:blank')
      }, 2000)
    } catch (error) {
      captureError('关机操作失败', {
        component: 'system-shutdown',
        severity: 'high',
        metadata: { error: String(error) }
      })
    }
  })
}

// 生命周期
onMounted(async () => {
  try {
    const startTime = Date.now()
    
    // 初始化系统
    await initializeSystem()
    
    // 初始化应用
    await initializeDockApps()
    
    // 应用主题
    await applyCurrentTheme()
    
    // 注册系统快捷键
    registerSystemShortcuts()
    
    // 设置事件监听
    setupEventListeners()
    
    // 标记系统初始化完成
    systemInitialized.value = true
    
    const bootTime = Date.now() - startTime
    
    // 触发系统就绪事件
    setTimeout(() => {
      emit(EVENTS.SYSTEM_READY, {
        bootTime,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
      })
    }, 1000)
    
  } catch (error) {
    captureError('系统初始化失败', {
      component: 'macos-main',
      severity: 'critical',
      metadata: { error: String(error) }
    })
    
    // 显示错误通知
    info('系统初始化遇到问题，部分功能可能不可用', { duration: 5000 })
  }
})

const handleLogin = async () => {
  try {
    // 处理登录成功事件
    store.commit('login')
    
    // 初始化Dock应用列表
    await initializeDockApps()
    
    const loginData = {
      username: 'user', // 这里可以从实际登录数据获取
      timestamp: Date.now(),
      method: 'password',
      ip: 'localhost'
    }
    
    emit(EVENTS.USER_LOGIN, loginData)
    success('登录成功', { duration: 2000 })
    
    // 记录业务事件
    emit('business:conversion', {
      action: 'user-login',
      metadata: { method: loginData.method }
    })
    
  } catch (error) {
    captureError('登录处理失败', {
      component: 'login-handler',
      severity: 'high',
      metadata: { error: String(error) }
    })
  }
}

const onContextShow = () => {
  console.log("onContextShow");
}
</script>
