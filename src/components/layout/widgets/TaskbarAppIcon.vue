<template>
  <div 
    class="taskbar-app-icon"
    :class="{ active: app.isOpen }"
    @click="$emit('click')"
  >
    <div class="icon">
      <i 
        :style="{
          backgroundColor: app.iconBgColor,
          color: app.iconColor,
        }" 
        class="iconfont" 
        :class="app.icon"
      ></i>
    </div>
    
    <!-- 活动指示器 -->
    <div v-if="app.isOpen" class="active-indicator"></div>
  </div>
</template>

<script setup>
defineProps({
  app: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])
</script>

<style scoped lang="scss">
.taskbar-app-icon {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  transform: translateZ(0);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateZ(0) translateY(-2px);
  }
  
  &:active {
    transform: translateZ(0) scale(0.95);
  }
  
  &.active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
  }

  .iconfont {
    font-size: 24px;
    border-radius: 8px;
    padding: 6px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .active-indicator {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
  }
}
</style>