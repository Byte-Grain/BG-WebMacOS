<template>
  <div 
    class="desktop-app-icon" 
    @dblclick="$emit('open')"
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
    <div class="title">{{ app.title }}</div>
  </div>
</template>

<script setup>
defineProps({
  app: {
    type: Object,
    required: true
  }
})

defineEmits(['open'])
</script>

<style scoped lang="scss">
.desktop-app-icon {
  padding: 10px 0px;
  flex-direction: column;
  text-align: center;
  text-shadow: 0px 0px 2px rgb(0 0 0 / 50%);
  cursor: pointer;
  border-radius: 10px;
  border: 2px solid transparent;
  justify-content: center;
  align-items: center;
  width: 80px;
  /* 优化：添加过渡效果和性能优化 */
  transition: border-color 0.2s ease, transform 0.1s ease;
  transform: translateZ(0);
  
  &:hover {
    border: 2px solid rgba(255, 255, 255, 0.5);
    transform: translateZ(0) scale(1.05);
  }
  
  &:active {
    transform: translateZ(0) scale(0.95);
  }

  .icon {
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .iconfont {
    font-size: 28px;
    border-radius: 10px;
    padding: 8px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title {
    font-size: 12px;
    margin-top: 5px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>