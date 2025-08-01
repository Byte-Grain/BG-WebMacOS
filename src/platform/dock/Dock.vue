<template>
  <div class="footer" v-show="!isHidden">
    <div class="dock">
      <template v-for="item in dockApps" :key="item.key">
        <div class="item" @click="handleAppClick(item)" :class="currentApp?.key === item.key ? 'jump' : ''"
          v-if="item && isAppInDock(item.key)">
          <i :style="{
            backgroundColor: item.iconBgColor,
            color: item.iconColor,
          }" class="iconfont" :class="item.icon"></i>
          <div class="dot" v-if="isAppOpen(item.key)"></div>
          <div class="title">{{ item.title }}</div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useAppManager } from '@/shared/composables'
  import { EVENTS, useEventBus } from '@/core/event-system/useEventBus'

  // 使用组合式函数
  const { 
    currentApp, 
    dockApps, 
    isAppOpen, 
    isAppInDock, 
    handleSpecialApp,
    openApp 
  } = useAppManager()

  const eventBus = useEventBus()
  const isHidden = ref(false)

  const handleAppClick = (item) => {
    handleSpecialApp(item)
  }

  // 监听全屏事件
  let fullscreenListenerId = null

  onMounted(() => {
    // 监听全屏事件
    fullscreenListenerId = eventBus.on(EVENTS.WINDOW_FULLSCREEN, (data) => {
      console.log('Dock received fullscreen event:', data)
      isHidden.value = data.enabled
    })
  })

  onUnmounted(() => {
    if (fullscreenListenerId) {
      eventBus.off(EVENTS.WINDOW_FULLSCREEN, fullscreenListenerId)
    }
  })
</script>

<style scoped lang="scss">
  .footer {
    position: fixed;
    bottom: 10px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99990;
  }

  .dock {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(20px);
    border-radius: 10px;
    display: flex;
    flex-direction: row;
    padding: 2px;
    width: fit-content;

    .item {
      padding: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .iconfont {
        cursor: pointer;
        border-radius: 20px;
        padding: 2px;
        display: inline-block;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        height: 30px;
        width: 30px;
        text-align: center;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s, margin 0.3s;
      }
    }

    .item:hover {
      .iconfont {
        transform: scale(2) translateY(-10px);
        margin: 0px 15px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
      }

      .title {
        position: absolute;
        display: inherit;
        word-break: keep-all;
        background: rgba(0, 0, 0, 0.3);
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 5px 10px;
        font-size: 12px;
        animation: dockTitleAnimation 0.5s ease 1 forwards;
      }
    }

    .dot {
      width: 3px;
      height: 3px;
      background: rgba(0, 0, 0, 0.8);
      position: absolute;
      bottom: 0px;
      border-radius: 5px;
      display: inline-block;
      font-size: 0;
    }

    .title {
      display: none;
    }

    .jump {
      animation: jumpAnimation 0.8s ease 1;
    }
  }
</style>
