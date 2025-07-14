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
import { useSystem, useAppManager, useTheme } from '@/composables'

// 组件导入
import Background from './components/common/Bg.vue'
import Loading from './components/common/Loading.vue'
import Login from './views/login/Login.vue'
import Desktop from './components/layout/DeskTop.vue'
import Launchpad from './components/layout/LaunchPad.vue'
// AppWindow 组件暂时移除，等待后续实现

const store = useStore()

// 使用组合式函数
const { systemState, isLoggedIn, isLoading, initializeSystem } = useSystem()
const { openApps, isLaunchpadOpen, initializeDockApps } = useAppManager()
const { applyCurrentTheme } = useTheme()

// 计算属性
const showLogin = computed(() => !isLoggedIn.value)
const loading = computed(() => isLoading.value)
const launchpad = computed(() => isLaunchpadOpen.value)
const openAppList = computed(() => openApps.value)

// 生命周期
onMounted(() => {
  // 初始化系统
  initializeSystem()
  // 初始化应用
  initializeDockApps()
  // 应用主题
  applyCurrentTheme()
})

const handleLogin = () => {
  // 处理登录成功事件
  store.commit('login')
}

const onContextShow = () => {
  console.log("onContextShow");
}
</script>
