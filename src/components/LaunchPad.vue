<template>
  <div class="launchpad" @click="handleBackgroundClick">
    <div class="body">
      <div class="launchpad-app">
        <template v-for="item in deskTopAppList" :key="item.key">
          <div class="app-item" @click="openAppAndClose(item)" v-if="!item.hideInDesktop">
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
    </div>
    <!-- Dock组件现在通过自动导入，无需手动导入 -->
    <Dock></Dock>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
  import tool from '../helper/tool';
  const { proxy } = getCurrentInstance()
  const $store = proxy.$store

  const emit = defineEmits(['launchpad'])

  const deskTopAppList = ref([])

  const launchpad = () => {
    emit('launchpad', $store.state.launchpad)
  }

  // 打开应用并关闭启动台
  const openAppAndClose = (item) => {
    $store.commit('openApp', item)
    closeLaunchpad()
  }

  // 关闭启动台
  const closeLaunchpad = () => {
    emit('launchpad', false)
  }

  // 处理背景点击（点击空白区域关闭）
  const handleBackgroundClick = (event) => {
    // 如果点击的是背景区域（不是应用图标），则关闭启动台
    if (event.target.classList.contains('launchpad') || 
        event.target.classList.contains('body')) {
      closeLaunchpad()
    }
  }

  // 键盘事件处理
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeLaunchpad()
    }
  }

  onMounted(() => {
    deskTopAppList.value = tool.getDeskTopApp()
    $store.commit('getDockAppList')
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    // 移除键盘事件监听
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<style lang="scss" scoped>
  .launchpad {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    z-index: 999;
  }

  .body {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .launchpad-app {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-gap: 20px;
    padding: 20px;
  }

  .app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform-origin: center;

    &:hover {
      transform: scale(1.08) translateY(-2px);
      filter: brightness(1.1);
    }

    &:active {
      transform: scale(0.95);
      transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }

  .icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    i {
      font-size: 32px;
      border-radius: 12px;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
  }

  .app-item:hover .icon {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
    transform: translateY(-1px);
  }

  .app-item:active .icon {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(1px);
  }

  .title {
    color: white;
    font-size: 12px;
    text-align: center;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.3s ease;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .app-item:hover .title {
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
  }
</style>
