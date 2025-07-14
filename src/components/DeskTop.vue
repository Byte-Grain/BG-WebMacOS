<template>
  <div class="desktop">
    <!-- Top Bar with Menu and Status -->
    <TopBar 
      @lock-screen="lockScreen"
      @shutdown="shutdown"
      @logout="logout"
      @open-test-page="openTestPage"
    />
    
    <!-- Desktop Area -->
    <DesktopArea 
      ref="desktopAreaRef"
      @lock-screen="lockScreen"
      @hide-all-controllers="hideAllControllers"
    />
    
    <!-- Dock -->
    <Dock />
  </div>
</template>
<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  import Dock from './layout/Dock.vue'
  import TopBar from './layout/TopBar.vue'
  import DesktopArea from './layout/DesktopArea.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useAppManager } from '@/composables/useAppManager'

  // 组合式函数
  const router = useRouter()
  const store = useStore()
  const { logout } = useAuth()
  const { openAppByKey } = useAppManager()

  // 桌面区域引用
  const desktopAreaRef = ref(null)

  // 核心方法
  const lockScreen = () => {
    router.push('/lock')
  }

  const shutdown = () => {
    // 关机逻辑
    store.dispatch('system/shutdown')
  }

  const hideAllControllers = () => {
    // 隐藏所有控制器
    store.dispatch('ui/hideAllControllers')
  }

  const openTestPage = () => {
     openAppByKey('composables_test')
   }

   // 生命周期
   onMounted(() => {
     // 初始化桌面
     console.log('Desktop mounted')
   })
</script>

<style scoped>
.desktop {
  width: 100vw;
  height: 100vh;
  background-image: url('@/assets/images/wallpaper.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
</style>
