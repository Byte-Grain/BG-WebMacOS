<template>
  <div class="store"></div>
</template>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'system_store',
  title: 'App Store',
  icon: '🛍️',
  iconColor: '#fff',
  iconBgColor: '#007AFF',
  width: 1000,
  height: 700,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  keepInDock: true,
  category: 'system',
  description: '应用商店',
  version: '1.0.0',
  author: 'System',
  tags: ['store', 'apps', 'download'],
  permissions: ['network'],
  system: true,
  essential: false,
  singleton: true
}
</script>
