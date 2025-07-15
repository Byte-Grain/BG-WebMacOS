<template>
  <div class="demo">
    <div class="title">
      我无法被彻底关闭，只会被隐藏，<br />因为我 hideWhenClose = true ,
      <br />你猜我适合做什么应用？
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
  key: 'demo_unclose',
  title: '无法彻底关闭',
  icon: 'icon-wechat-fill',
  iconColor: '#fff',
  iconBgColor: '#24dc72',
  width: 610,
  height: 430,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  hideWhenClose: true,
  category: 'utilities',
  description: '演示关闭时隐藏而非退出的功能',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['window', 'hide-on-close'],
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>