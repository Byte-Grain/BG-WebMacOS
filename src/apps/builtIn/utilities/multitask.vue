<template>
  <div class="demo">
    <div class="title">
      我允许被多次打开，但我无法被固定在Dock上，<br />因为我的 keepInDock 在
      <br />multiTask = true 时将自动失效
    </div>
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
  key: 'demo_multitask',
  title: '多任务应用',
  icon: 'icon-multitask',
  iconColor: '#fff',
  iconBgColor: '#007AFF',
  width: 500,
  height: 300,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  multiTask: true,
  keepInDock: false,
  category: 'utilities',
  description: '演示多任务功能的应用',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['multitask', 'demo'],
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>
