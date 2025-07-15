<template>
  <div class="demo">
    <div class="title">
      我无法拖动大小,也无法绿灯改变大小,也无法双击改变大小,<br />为我设置修饰
      disableResize = true 即可
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
  key: 'demo_unresize',
  title: '固定尺寸应用',
  icon: 'icon-smallscreen_fill',
  iconColor: '#fff',
  iconBgColor: '#1573fa',
  width: 600,
  height: 400,
  resizable: false,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  category: 'utilities',
  description: '演示固定窗口尺寸功能',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['window', 'fixed-size'],
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>