<template>
  <div class="demo">
    <div class="title">
      我被设置了 hideInDesktop ，
      <br />不会出现在桌面上，如果把keepInDock设置false，<br />我就跟关于那个一样，也不出现在Dock上
    </div>
    <el-button size="small" type="primary" @click="openAbout">看看关于长什么样</el-button>
  </div>
</template>

<style scoped lang="scss">
  .demo {
    display: flex;
    height: 100%;
    width: 100%;
    color: #333;
    text-shadow: none;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .title {
      font-size: 16px;
      text-align: left;
      margin: 10%;
    }
  }
</style>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'demo_hidedesktop',
  title: '不在桌面显示',
  icon: 'icon-shezhi',
  iconColor: '#333',
  iconBgColor: '#d4dbef',
  width: 500,
  height: 300,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  hideInDesktop: true,
  keepInDock: true,
  category: 'utilities',
  description: '演示仅在 Dock 显示的应用',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['dock-only', 'hidden'],
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  // 定义事件
  const emit = defineEmits(['api'])

  // 方法
  const openAbout = () => {
    emit("api", {
      event: "openApp",
      app: "system_about",
    })
  }
</script>
