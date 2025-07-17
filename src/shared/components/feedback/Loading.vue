<template>
  <div class="loading" @click="fullScreen">
    <div class="logo"><i class="iconfont icon-apple-fill"></i></div>
    <div class="progress" :class="{ 'show': showProgress }">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .loading {
    background-color: #000;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    margin-top: -100px;
    z-index: 99999;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;

    .logo {
      .iconfont {
        font-size: 120px;
        animation: pulse 2s ease-in-out infinite;
      }
    }

    .progress {
      margin-top: 50px;
      width: 0;
      background-color: rgba(255, 255, 255, 0.1);
      height: 6px;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      transition: width 0.5s ease-out;

      &.show {
        width: 300px;
      }

      .progress-bar {
        width: 0;
        border-radius: 20px;
        background-color: rgba(255, 255, 255, 0.8);
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        transition: width 0.3s ease-out;
      }
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }
</style>
<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'

  const emit = defineEmits(['loaded'])

  const progress = ref(0)
  const showProgress = ref(false)
  let progressTimer: number | null = null

  const fullScreen = () => {
    const docElm = document.documentElement
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen()
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen()
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen()
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen()
    }
  }

  const updateProgress = () => {
    // 使用平滑的进度增长，避免随机性
    // 调整增量以适应2秒的加载时间 (2000ms / 50ms间隔 = 40次更新，100/40 = 2.5)
    const increment = 2.5
    progress.value = Math.min(progress.value + increment, 100)
    
    if (progress.value >= 100) {
      progress.value = 100
      // 完成后稍作停留，然后隐藏进度条
      setTimeout(() => {
        showProgress.value = false
        setTimeout(() => emit('loaded'), 300)
      }, 500)
    } else {
      progressTimer = window.setTimeout(updateProgress, 50) // 更平滑的更新间隔
    }
  }

  onMounted(() => {
    // 减少初始延迟，让加载更快开始
    setTimeout(() => {
      showProgress.value = true
      updateProgress()
    }, 500)
  })

  onUnmounted(() => {
    if (progressTimer) {
      clearTimeout(progressTimer)
    }
  })
</script>