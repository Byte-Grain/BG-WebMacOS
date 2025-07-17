<template>
  <div class="finder">
    <div class="list-left"></div>
  </div>
</template>

<script setup lang="ts">
  // 这个组件目前没有逻辑，只是一个空的组件
</script>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'system_finder',
  title: 'Finder',
  icon: '📁',
  iconColor: '#fff',
  iconBgColor: '#007AFF',
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
  description: '文件管理器',
  version: '1.0.0',
  author: 'System',
  tags: ['file', 'manager', 'system'],
  system: true,
  essential: true,
  singleton: true,
  menu: [
        {
          key: "finder",
          title: "访达",
          sub: [
            {
              key: "about",
              title: "关于 访达",
            },
            {
              isLine: true,
            },
            {
              key: "setting",
              title: "首选项",
            },
            {
              isLine: true,
            },
            {
              key: "close",
              title: "退出 访达",
            },
          ],
        },
        {
          key: "window",
          title: "窗口",
          sub: [
            {
              key: "min",
              title: "最小化",
            },
            {
              key: "max",
              title: "最大化",
            },
          ],
        },
        {
          key: "help",
          title: "帮助",
          sub: [
            {
              key: "send",
              title: "发送反馈",
            },
          ],
        },
      ]
}
</script>

<style scoped lang="scss">
  .finder {
    --resize: 5px;
    --resize-bg: transparent;
    --resize-main: transparent;
    --resize-bg-main: transparent;
  }

  .finder {
    display: flex;
    flex-direction: column;
    height: 350px;
    width: 100%;
    color: #333;
    text-shadow: none;
    font-weight: 300;
    overflow: hidden;

    .list-left {
      position: absolute;
      top: 40px;
      bottom: 0px;
      width: 200px;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
</style>
