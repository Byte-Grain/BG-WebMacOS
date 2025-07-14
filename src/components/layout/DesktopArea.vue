<template>
  <div class="desktop-area" @contextmenu.prevent.self="openContextMenu($event)" @click.stop="hideAllControllers()">
    <!-- Desktop Applications -->
    <div class="desktop-apps">
      <template v-for="item in desktopAppList" :key="item.key">
        <div class="app-item" v-if="!item.hideInDesktop" @dblclick="openAppByKey(item.key)">
          <div class="icon">
            <i :style="{
              backgroundColor: item.iconBgColor,
              color: item.iconColor,
            }" class="iconfont" :class="item.icon"></i>
          </div>
          <div class="title">{{ item.title }}</div>
        </div>
      </template>
    </div>

    <!-- Open Application Windows -->
    <transition-group name="fade-window">
      <template v-for="item in openApps" :key="item.pid">
        <App v-if="!item.outLink" v-show="!item.hide" :app="item" :key="item.pid"></App>
      </template>
    </transition-group>

    <!-- Context Menu -->
    <ContextMenu v-show="contextMenuVisible" :x="contextMenuX" :y="contextMenuY" @close="hideContextMenu"
      @lock-screen="$emit('lockScreen')" @open-settings="openAppByKey('system_setting')"
      @open-task-manager="openAppByKey('system_task')" @open-about="openAppByKey('system_about')" />

    <!-- Test Page Overlay -->
    <div v-show="isTestPageShow" class="test-page-overlay" @click.self="closeTestPage">
      <div class="test-page-container">
        <div class="test-page-header">
          <h3>组合式函数测试</h3>
          <button class="close-btn" @click="closeTestPage">×</button>
        </div>
        <ComposablesTest />
      </div>
    </div>

    <!-- Widget Container -->
    <transition-group name="fade-widget">
      <div v-show="isWidgetShow" key="widget-container" class="widget-container">
        <Widget @close="hideWidget" />
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useAppManager } from '@/composables'
  import { getDesktopApps } from '@/config/app.config'
  import App from '../App.vue'
  import Widget from '../common/Widget.vue'
  import ContextMenu from './ContextMenu.vue'
  import ComposablesTest from '@/views/test/ComposablesTest.vue'

  // Emits
  const emit = defineEmits(['lockScreen'])

  // Composables
  const { openAppByKey, openApps } = useAppManager()

  // Reactive data
  const contextMenuVisible = ref(false)
  const contextMenuX = ref(0)
  const contextMenuY = ref(0)
  const isWidgetShow = ref(false)
  const isTestPageShow = ref(false)

  // Computed
  const desktopAppList = computed(() => getDesktopApps())

  // Methods
  const hideAllControllers = () => {
    hideContextMenu()
    // Emit event to parent to hide other controllers
    emit('hideAllControllers')
  }

  const openContextMenu = (e: MouseEvent) => {
    const menuMinWidth = 200
    const offsetLeft = e.currentTarget?.getBoundingClientRect().left || 0
    const offsetWidth = (e.currentTarget as HTMLElement)?.offsetWidth || 0
    const maxLeft = offsetWidth - menuMinWidth
    const left = e.clientX - offsetLeft

    if (left > maxLeft) {
      contextMenuX.value = maxLeft
    } else {
      contextMenuX.value = left
    }

    contextMenuY.value = e.clientY - 30
    contextMenuVisible.value = true
  }

  const hideContextMenu = () => {
    contextMenuVisible.value = false
  }

  const showWidget = () => {
    isWidgetShow.value = true
  }

  const hideWidget = () => {
    isWidgetShow.value = false
  }

  const toggleWidget = () => {
    isWidgetShow.value = !isWidgetShow.value
  }

  const openTestPage = () => {
    isTestPageShow.value = true
  }

  const closeTestPage = () => {
    isTestPageShow.value = false
  }

  // Expose methods for parent component
  defineExpose({
    hideAllControllers,
    toggleWidget,
    openTestPage
  })
</script>

<style scoped>
  .desktop-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: transparent;
  }

  .desktop-apps {
    position: absolute;
    top: 20px;
    left: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, 80px);
    gap: 20px;
    z-index: 1;
  }

  .app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
    user-select: none;
  }

  .app-item:hover {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .app-item .icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    margin-bottom: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  .app-item .icon i {
    font-size: 32px;
  }

  .app-item .title {
    font-size: 12px;
    color: white;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Test Page Overlay */
  .test-page-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .test-page-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .test-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 122, 255, 0.1);
  }

  .test-page-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(255, 0, 0, 0.1);
    color: #ff0000;
  }

  /* Widget Container */
  .widget-container {
    position: fixed;
    top: 30px;
    right: 20px;
    z-index: 1500;
  }

  /* Window Transitions */
  .fade-window-enter-active,
  .fade-window-leave-active {
    transition: all 0.3s ease;
  }

  .fade-window-enter-from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }

  .fade-window-leave-to {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }

  /* Widget Transitions */
  .fade-widget-enter-active,
  .fade-widget-leave-active {
    transition: all 0.3s ease;
  }

  .fade-widget-enter-from,
  .fade-widget-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
</style>