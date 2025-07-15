<template>
  <div class="demo">
    <div class="title">
      我的标题栏花里胡哨 <br />你可以通过设置 <br />titleBgColor/titleColor
      来修饰我

      <div style="color: red">{{ app && app.data }}</div>
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
  key: 'demo_colorfull',
  title: '花里胡哨',
  icon: 'icon-loading',
  iconColor: '#fff',
  iconBgColor: '#ff4500',
  width: 420,
  height: 310,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  category: 'entertainment',
  description: '演示自定义窗口样式功能',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['colorful', 'custom-style'],
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  // 定义props
  defineProps({
    app: Object,
  })
</script>