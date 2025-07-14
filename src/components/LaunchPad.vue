<template>
  <div class="launchpad">
    <div class="body">
      <div class="launchpad-app">
        <template v-for="item in deskTopAppList" :key="item.key">
          <div class="app-item" v-on:dblclick="$store.commit('openApp', item)" v-if="!item.hideInDesktop">
            <div class="icon">
              <i :style="{
                backgroundColor: item.iconBgColor,
                color: item.iconColor,
              }" class="iconfont" :class="item.icon"></i>
            </div>
            <div class="title">{{ item.title }}</div>
          </div>
        </template>
      </div>
    </div>
    <!-- Dock组件现在通过自动导入，无需手动导入 -->
    <Dock></Dock>
  </div>
</template>

<script setup>
  import tool from '../helper/tool';
  const { proxy } = getCurrentInstance()
  const $store = proxy.$store

  const emit = defineEmits(['launchpad'])

  const deskTopAppList = ref([])

  const launchpad = () => {
    emit('launchpad', $store.state.launchpad)
  }

  onMounted(() => {
    deskTopAppList.value = tool.getDeskTopApp()
    $store.commit('getDockAppList')
  })
</script>

<style lang="scss" scoped>
  .launchpad {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    z-index: 999;
  }

  .body {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .launchpad-app {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-gap: 20px;
    padding: 20px;
  }

  .app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  .icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;

    i {
      font-size: 32px;
      border-radius: 12px;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .title {
    color: white;
    font-size: 12px;
    text-align: center;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
