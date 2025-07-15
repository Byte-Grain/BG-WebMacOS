<template>
  <div class="desktop-taskbar">
    <!-- 左侧应用图标区域 -->
    <div class="taskbar-apps">
      <TaskbarAppIcon
        v-for="app in visibleApps"
        :key="app.key"
        :app="app"
        @click="$emit('toggleApp', app.key)"
      />
    </div>
    
    <!-- 右侧垃圾桶 -->
    <div class="taskbar-trash">
      <i 
        class="iconfont icon-lajitong" 
        @click="$emit('openTrash')"
      ></i>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TaskbarAppIcon from './widgets/TaskbarAppIcon.vue'

const props = defineProps({
  openApps: {
    type: Array,
    required: true
  }
})

defineEmits(['toggleApp', 'openTrash'])

// 过滤出可见的打开应用
const visibleApps = computed(() => {
  return props.openApps.filter(app => app && !app.outLink)
})
</script>

<style scoped lang="scss">
.desktop-taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  /* 优化：启用硬件加速 */
  transform: translateZ(0);
  will-change: transform;

  .taskbar-apps {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .taskbar-trash {
    .iconfont {
      font-size: 32px;
      cursor: pointer;
      padding: 10px;
      border-radius: 10px;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
}
</style>