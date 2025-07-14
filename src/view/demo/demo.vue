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
<script setup>
  import { ref } from 'vue'

  // 定义事件
  const emit = defineEmits(['api'])

  // 响应式数据
  const demo = ref({
    title: "MacOS WebUI",
    desc: "这是一个示例APP，用于一些交互相关功能的实现",
  })

  // 方法
  const windowMaxSize = () => {
    emit("api", {
      event: "windowMaxSize",
    })
  }

  const windowNormalSize = () => {
    emit("api", {
      event: "windowNormalSize",
    })
  }

  const windowMinSize = () => {
    emit("api", {
      event: "windowMinSize",
    })
  }

  const windowFullSize = () => {
    emit("api", {
      event: "windowFullSize",
    })
  }

  const windowClose = () => {
    emit("api", {
      event: "windowClose",
    })
  }

  const openApp = () => {
    emit("api", {
      event: "openApp",
      app: "system_about",
    })
  }

  const closeApp = () => {
    emit("api", {
      event: "closeApp",
      app: "system_about",
    })
  }

  const setWindowTitle = () => {
    emit("api", {
      event: "setWindowTitle",
      title: new Date().valueOf(),
    })
  }

  const openAppWithData = () => {
    emit("api", {
      event: "openApp",
      app: "demo_colorfull",
      data: "我是传入的参数",
    })
  }
</script>