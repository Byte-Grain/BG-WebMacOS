<template>
  <div class="loading" @click="fullScreen">
    <div class="logo"><i class="iconfont icon-apple-fill"></i></div>
    <div class="progress" :style="{ width: showProgress ? '300px' : 0 }">
      <div :style="{ width: progress + '%' }"></div>
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

    .logo {
      .iconfont {
        font-size: 120px;
      }
    }

    .progress {
      margin-top: 50px;
      width: 200px;
      background-color: rgba(255, 255, 255, 0.1);
      height: 6px;
      border-radius: 20px;
      overflow: hidden;
      position: relative;

      div {
        width: 20%;
        border-radius: 20px;
        background-color: rgba(255, 255, 255, 0.2);
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
      }
    }
  }
</style>
<script setup>
  import { ref, onMounted } from 'vue'

  const emit = defineEmits(['loaded'])

  const progress = ref(0)
  const showProgress = ref(false)

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
    progress.value += parseInt(Math.random() * 2)
    if (progress.value >= 100) {
      progress.value = 100
      showProgress.value = false
      setTimeout(() => emit('loaded'), 1000)
    } else {
      requestAnimationFrame(updateProgress)
    }
  }

  onMounted(() => {
    setTimeout(() => {
      showProgress.value = true
      updateProgress()
    }, 1000)
  })
</script>