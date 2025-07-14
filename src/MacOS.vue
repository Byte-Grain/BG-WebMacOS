<template>
  <div class="mac-os" @contextmenu.prevent="onContextShow()">
    <transition name="fade">
      <Background />
    </transition>
    <transition name="fade">
      <Loading v-if="loading" />
    </transition>
    <transition name="fade">
      <Login v-if="showLogin" @logined="handleLogin" />
    </transition>
    <transition name="fade">
      <Desktop v-if="!showLogin && !loading" />
    </transition>
    <transition name="fade">
      <Launchpad v-if="launchpad" />
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
</style>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { 
  useSystem, 
  useAppManager, 
  useTheme, 
  useEventBus, 
  useKeyboard, 
  useNotification,
  EVENTS 
} from '@/composables'

// 组件导入
import Background from './components/common/Bg.vue'
import Loading from './components/common/Loading.vue'
import Login from './views/login/Login.vue'
import Desktop from './components/layout/DeskTop.vue'
import Launchpad from './components/layout/LaunchPad.vue'
import Notification from './components/common/Notification.vue'
// AppWindow 组件暂时移除，等待后续实现

const store = useStore()

// 使用组合式函数
const { systemState, isLoggedIn, isLoading, initializeSystem } = useSystem()
const { openApps, isLaunchpadOpen, initializeDockApps, openAppByKey } = useAppManager()
const { applyCurrentTheme, toggleTheme } = useTheme()
const { emit, on } = useEventBus()
const { registerShortcut, COMMON_SHORTCUTS } = useKeyboard()
const { success, info } = useNotification()

// 计算属性
const showLogin = computed(() => !isLoggedIn.value)
const loading = computed(() => isLoading.value)
const launchpad = computed(() => isLaunchpadOpen.value)
const openAppList = computed(() => openApps.value)

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
    emit(EVENTS.APP_CLOSED, { source: 'keyboard' })
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
  })
  
  // 监听主题变化事件
  on(EVENTS.THEME_CHANGED, (data) => {
    console.log('主题已变化:', data)
  })
  
  // 监听系统就绪事件
  on(EVENTS.SYSTEM_READY, () => {
    success('系统初始化完成', { duration: 3000 })
  })
}

// 生命周期
onMounted(() => {
  // 初始化系统
  initializeSystem()
  // 初始化应用
  initializeDockApps()
  // 应用主题
  applyCurrentTheme()
  // 注册系统快捷键
  registerSystemShortcuts()
  // 设置事件监听
  setupEventListeners()
  
  // 触发系统就绪事件
  setTimeout(() => {
    emit(EVENTS.SYSTEM_READY)
  }, 1000)
})

const handleLogin = () => {
  // 处理登录成功事件
  store.commit('login')
  emit(EVENTS.USER_LOGIN, { timestamp: Date.now() })
  success('登录成功', { duration: 2000 })
}

const onContextShow = () => {
  console.log("onContextShow");
}
</script>
