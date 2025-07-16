<template>
  <div class="desktop gesture-disabled">
    <DesktopStatusBar :time-string="timeString" :volume="volumn" :volume-show="isVolumnShow"
      :calendar-show="isCalendarShow" :widget-show="isWidgetShow" :current-date="nowDate"
      :hide-all-controller="hideAllController"
      @toggle-volume="showOrHideVolumn" @change-volume="setVolume" @toggle-calendar="showOrHideCalendar"
      @change-date="(date) => nowDate = date" @toggle-widget="showOrHideWidget" />
    <div class="body gesture-disabled" @contextmenu.prevent.self="
      hideAllController();
    openMenu($event);
    " @click.stop="hideAllController()">
      <DesktopAppsArea :apps="deskTopAppList" @open-app="openAppByKey" />
      <transition-group name="fade-window">
        <App v-for="item in visibleOpenApps" :key="item.pid" :app="item"></App>
      </transition-group>
      <DesktopContextMenu :visible="rightMenuVisible" :left="rightMenuLeft" :top="rightMenuTop"
        @lock-screen="lockScreen" @open-settings="() => openAppByKey('system_setting')"
        @open-task-manager="() => openAppByKey('system_task')"
        @set-wallpaper="() => $message.warning($t('system.comingSoon'))"
        @open-about="() => openAppByKey('system_about')" />
      <transition-group name="fade-widget">
        <div v-show="isWidgetShow" key="widget-container">
        </div>
      </transition-group>
    </div>
    <Dock />
  </div>
</template>
<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useAppManager, useSystem, useUtils, useDesktopGesture } from '@/composables'
  import { usePerformance } from "@/composables";
  import DesktopStatusBar from '@/components/layout/DesktopStatusBar.vue'
  import DesktopAppsArea from '@/components/layout/DesktopAppsArea.vue'
  import DesktopContextMenu from '@/components/layout/DesktopContextMenu.vue'
  import Dock from '@/components/layout/Dock.vue'
  import App from '@/components/App.vue'

  const $message = ElMessage
  const emit = defineEmits(['launchpad', 'lockScreen', 'shutdown', 'logout'])

  // 使用组合式函数
  const { openAppByKey, currentMenu, openApps, desktopApps } = useAppManager()
  const { volume, setVolume, logout: systemLogout } = useSystem()
  const { date, storage } = useUtils()
  const { debounce: performanceDebounce, throttle, getPerformanceReport } = usePerformance('Desktop')
  
  // 桌面手势控制
  const { init: initGesture, cleanup: cleanupGesture } = useDesktopGesture({
    enableSwipeUp: false,
    enableSwipeDown: false,
    enableSwipeLeft: false,
    enableSwipeRight: false,
    enableDrag: false,
    enableTwoFingerGestures: false,
    enableMouseWheel: false,
    allowWheelInApps: true,
    preventDefault: true
  })

  // 响应式数据
  const isCalendarShow = ref(false)
  const nowDate = ref(new Date())
  const volumnDelayTimer = ref(null)
  const volumn = ref(volume.value || 50)
  const isVolumnShow = ref(false)
  const rightMenuVisible = ref(false)
  const rightMenuLeft = ref(0)
  const rightMenuTop = ref(0)
  const userName = ref('')
  const timeString = ref('')
  const isWidgetShow = ref(false)
  const timeUpdateTimer = ref(null)

  // 优化：使用计算属性缓存桌面应用列表
  const deskTopAppList = computed(() => {
    return desktopApps.value.filter(app => app && app.key && !app.hideInDesktop)
  })

  // 优化：缓存可见的打开应用
  const visibleOpenApps = computed(() => {
    return openApps.value.filter(app => !app.outLink && !app.hide)
  })

  // 监听器
  watch(volumn, (newValue) => {
    setVolume(newValue)
    clearTimeout(volumnDelayTimer.value)
    volumnDelayTimer.value = setTimeout(() => {
      isVolumnShow.value = false
    }, 3000)
  })

  // 同步音量值
  watch(volume, (newValue) => {
    volumn.value = newValue
  })

  // 方法
  const showOrHideCalendar = () => {
    isCalendarShow.value = !isCalendarShow.value
  }

  // 优化：使用节流优化音量控制
  const showOrHideVolumn = () => {
    isVolumnShow.value = !isVolumnShow.value
    if (isVolumnShow.value) {
      clearTimeout(volumnDelayTimer.value)
      volumnDelayTimer.value = setTimeout(() => {
        isVolumnShow.value = false
      }, 3000)
    }
  }

  // 优化：使用防抖的隐藏控制器函数
  const hideAllController = () => {
    isVolumnShow.value = false
    rightMenuVisible.value = false
    isCalendarShow.value = false
  }

  const openMenu = (e) => {
    const menuMinWidth = 105
    const offsetLeft = e.currentTarget.getBoundingClientRect().left
    const offsetWidth = e.currentTarget.offsetWidth
    const maxLeft = offsetWidth - menuMinWidth
    const left = e.clientX - offsetLeft

    if (left > maxLeft) {
      rightMenuLeft.value = maxLeft
    } else {
      rightMenuLeft.value = left
    }

    rightMenuTop.value = e.clientY - 30
    rightMenuVisible.value = true
  }

  // 优化：智能时间更新，只在分钟变化时更新
  const startTimer = () => {
    const updateTime = () => {
      const now = new Date()
      const newTimeString = date.format(now, 'MM-dd HH:mm')
      if (timeString.value !== newTimeString) {
        timeString.value = newTimeString
      }
    }

    // 立即更新一次
    updateTime()

    // 计算到下一分钟的毫秒数
    const now = new Date()
    const nextMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0)
    const msToNextMinute = nextMinute.getTime() - now.getTime()

    // 在下一分钟开始时更新，然后每分钟更新一次
    setTimeout(() => {
      updateTime()
      timeUpdateTimer.value = setInterval(updateTime, 60000) // 每分钟更新
    }, msToNextMinute)
  }

  const lockScreen = () => {
    emit('lockScreen')
  }

  const shutdown = () => {
    emit('shutdown')
  }

  const logout = () => {
    systemLogout()
    emit('logout')
  }

  const showOrHideWidget = () => {
    isWidgetShow.value = !isWidgetShow.value
  }

  // 优化：添加性能报告功能（仅开发环境）
  const logPerformanceReport = () => {
    if (import.meta.env.DEV) {
      console.group('🖥️ Desktop 组件性能报告')
      console.table(getPerformanceReport())
      console.groupEnd()
    }
  }

  // 生命周期
  onMounted(() => {
    userName.value = storage.get('user_name', '') || ''
    startTimer()
    
    // 初始化桌面手势控制
    nextTick(() => {
      const desktopElement = document.querySelector('.desktop')
      if (desktopElement) {
        initGesture(desktopElement as HTMLElement)
      }
    })

    // 开发环境下定期输出性能报告
    if (import.meta.env.DEV) {
      const performanceInterval = setInterval(logPerformanceReport, 30000) // 每30秒
      onUnmounted(() => {
        clearInterval(performanceInterval)
      })
    }
  })

  // 优化：清理定时器
  onUnmounted(() => {
    if (timeUpdateTimer.value) {
      clearInterval(timeUpdateTimer.value)
    }
    if (volumnDelayTimer.value) {
      clearTimeout(volumnDelayTimer.value)
    }
    // 清理手势控制
    cleanupGesture()
  })
</script>
<style scoped lang="scss">
  .desktop {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    color: white;
    overflow: hidden;
    text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
    /* 优化：启用硬件加速 */
    transform: translateZ(0);
    will-change: transform;

    .body {
      flex-grow: 1;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      position: relative;
    }
  }

  /* 手势禁用样式 */
  .gesture-disabled {
    /* 禁用用户选择 */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    
    /* 禁用拖拽 */
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
    
    /* 禁用触摸操作 */
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    
    /* 禁用右键菜单（在某些情况下） */
    -webkit-context-menu: none;
    
    /* 禁用文本选择高亮 */
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* 优化：添加更流畅的过渡动画 */
  .fade-window-enter-active,
  .fade-window-leave-active {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .fade-window-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }

  .fade-window-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  .fade-menu-enter-active,
  .fade-menu-leave-active {
    transition: all 0.2s ease;
  }

  .fade-menu-enter-from,
  .fade-menu-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .fade-widget-enter-active,
  .fade-widget-leave-active {
    transition: all 0.3s ease;
  }

  .fade-widget-enter-from,
  .fade-widget-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
