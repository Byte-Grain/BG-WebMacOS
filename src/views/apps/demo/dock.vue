<template>
  <div class="demo">
    <div class="title">
      我是一个常驻Dock上的App，<br />关闭后也一直在Dock上，<br />你可以通过配置
      keepInDock 来修饰我
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
  key: 'demo_dock',
  title: '常驻 Dock 应用',
  icon: 'icon-MIS_bangongOA',
  iconColor: '#fff',
  iconBgColor: '#022732',
  width: 420,
  height: 350,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  keepInDock: true,
  category: 'utilities',
  description: '演示常驻 Dock 功能的应用',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['dock', 'persistent'],
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>