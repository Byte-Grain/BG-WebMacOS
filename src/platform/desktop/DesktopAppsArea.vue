<template>
  <div class="desktop-apps-area">
    <DesktopAppIcon
      v-for="app in appList" 
      :key="app.key"
      :app="app"
      @open="$emit('openApp', app.key)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DesktopAppIcon from './widgets/DesktopAppIcon.vue'

const props = defineProps({
  apps: {
    type: Array,
    required: true
  }
})

defineEmits(['openApp'])

// 过滤出桌面显示的应用
const appList = computed(() => {
  return props.apps.filter(app => app && app.key && !app.hideInDesktop)
})
</script>

<style scoped lang="scss">
.desktop-apps-area {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  padding: 20px;
  flex-wrap: wrap-reverse;
  /* 优化：启用硬件加速和优化渲染 */
  transform: translateZ(0);
  contain: layout style paint;
}
</style>
