<template>
  <div class="demo">
    <iframe :src="app.url"></iframe>
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

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  }
</style>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'demo_web',
  title: 'Web应用',
  icon: 'icon-chrome',
  iconColor: '#fff',
  iconBgColor: '#4285F4',
  width: 800,
  height: 600,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  category: 'utilities',
  description: '用于显示网页内容的应用',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['web', 'iframe'],
  demo: true,
  featured: false,
  permissions: ['network']
}
</script>

<script setup lang="ts">
  // 定义props
  defineProps({
    app: Object,
  })
</script>