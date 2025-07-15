<template>
  <div class="demo">
    <div class="top">
      <i class="iconfont icon-apple1"></i>
      <div class="info">
        <div class="title">{{ demo.title }}</div>
        <div class="desc">{{ demo.desc }}</div>
      </div>
    </div>
    <div class="body">
      <el-button size="small" type="primary" @click="windowMaxSize">窗口最大化</el-button>
      <el-button size="small" type="primary" @click="windowNormalSize">普通窗口</el-button>
      <el-button size="small" type="primary" @click="windowMinSize">窗口最小化</el-button>
      <el-button size="small" type="primary" @click="windowClose">关闭当前窗口</el-button>
      <el-button size="small" type="primary" @click="windowFullSize">窗口全屏</el-button>
      <el-button size="small" type="primary" @click="openApp">打开某app</el-button>
      <el-button size="small" type="primary" @click="closeApp">关闭某app</el-button>
      <el-button size="small" type="primary" @click="setWindowTitle">修改窗口标题</el-button>
      <el-button size="small" type="primary" @click="openAppWithData">带参打开App</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .demo {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    color: #333;
    text-shadow: none;
    font-weight: 300;

    .top {
      display: flex;
      flex-direction: row;
      padding: 20px;

      .info {
        flex-grow: 1;

        .title {
          font-size: 24px;
        }

        .desc {
          font-size: 14px;
          color: #999;
        }
      }

      .iconfont {
        font-size: 48px;
        margin-right: 20px;
      }
    }

    .body {
      padding: 20px;

      button {
        display: inline-block;
        margin: 5px;
      }
    }
  }
</style>
<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'demo_demo',
  title: 'DEMO',
  icon: 'icon-MIS_chanpinshezhi',
  iconColor: '#fff',
  iconBgColor: '#db5048',
  width: 600,
  height: 400,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  keepInDock: true,
  description: '基础功能演示应用',
  version: '1.0.0',
  author: 'Demo Team',
  tags: ['demo', 'showcase'],
  demo: true,
  featured: true
}
</script>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useWindowEvents } from '@/composables/useWindowEvents'

  // 使用窗口事件系统
  const windowEvents = useWindowEvents()

  // 定义事件（保持向后兼容）
  const emit = defineEmits(['api'])

  // 响应式数据
  const demo = ref({
    title: "MacOS WebUI",
    desc: "这是一个示例APP，用于一些交互相关功能的实现",
  })

  // 方法 - 使用新的窗口事件系统
  const windowMaxSize = () => {
    // 使用新的事件系统
    windowEvents.maximizeWindow()
    
    // 保持向后兼容
    emit("api", {
      event: "windowMaxSize",
    })
  }

  const windowNormalSize = () => {
    // 使用新的事件系统
    windowEvents.normalizeWindow()
    
    // 保持向后兼容
    emit("api", {
      event: "windowNormalSize",
    })
  }

  const windowMinSize = () => {
    // 使用新的事件系统
    windowEvents.minimizeWindow()
    
    // 保持向后兼容
    emit("api", {
      event: "windowMinSize",
    })
  }

  const windowFullSize = () => {
    // 使用新的事件系统
    // windowEvents.fullscreenWindow()
    
    // 保持向后兼容
    emit("api", {
      event: "windowFullSize",
    })
  }

  const windowClose = () => {
    // 使用新的事件系统
    windowEvents.closeWindow()
    
    // 保持向后兼容
    emit("api", {
      event: "windowClose",
    })
  }

  const openApp = () => {
    // 使用新的事件系统
    windowEvents.openApp("system_about")
    
    // 保持向后兼容
    emit("api", {
      event: "openApp",
      app: "system_about",
    })
  }

  const closeApp = () => {
    // 使用新的事件系统
    windowEvents.closeApp("system_about")
    
    // 保持向后兼容
    emit("api", {
      event: "closeApp",
      app: "system_about",
    })
  }

  const setWindowTitle = () => {
    const newTitle = new Date().valueOf().toString()
    
    // 使用新的事件系统
    windowEvents.setWindowTitle(newTitle)
    
    // 保持向后兼容
    emit("api", {
      event: "setWindowTitle",
      title: newTitle,
    })
  }

  const openAppWithData = () => {
    // 使用新的事件系统
    windowEvents.openApp("demo_colorfull", "我是传入的参数")
    
    // 保持向后兼容
    emit("api", {
      event: "openApp",
      app: "demo_colorfull",
      data: "我是传入的参数",
    })
  }
</script>