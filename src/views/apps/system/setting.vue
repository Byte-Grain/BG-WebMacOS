<template>
  <div class="setting"></div>
</template>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'system_setting',
  title: 'System Preferences',
  icon: '⚙️',
  iconColor: '#fff',
  iconBgColor: '#8E8E93',
  width: 800,
  height: 600,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  hideInDesktop: false,
  keepInDock: true,
  category: 'system',
  description: '系统偏好设置',
  version: '1.0.0',
  author: 'System',
  tags: ['system', 'preferences', 'settings'],
  system: true,
  essential: true,
  singleton: true
}
</script>

<style scoped lang="scss">
  .setting {
    display: flex;
    flex-direction: column;
    height: 350px;
    width: 100%;
    color: #333;
    text-shadow: none;
    font-weight: 300;
    overflow: hidden;
    margin: 10px 20px;
  }
</style>
