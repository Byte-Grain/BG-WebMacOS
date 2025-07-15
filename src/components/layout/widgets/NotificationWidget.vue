<template>
  <div class="notification-widget">
    <i 
      class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-25" 
      @click="$emit('toggle')"
    ></i>
    <transition-group name="fade-widget">
      <div v-show="isVisible" key="widget-container" class="widget-container">
        <!-- 这里可以添加具体的通知内容 -->
        <div class="widget-placeholder">
          <p>通知中心</p>
          <p>暂无新通知</p>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])
</script>

<style scoped lang="scss">
.notification-widget {
  cursor: pointer;
  padding: 0px 10px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;

  .iconfont {
    font-size: 20px;
  }

  .widget-container {
    position: fixed;
    top: 40px;
    right: 20px;
    width: 300px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    z-index: 1000;
  }

  .widget-placeholder {
    color: #333;
    text-align: center;
    
    p {
      margin: 10px 0;
      
      &:first-child {
        font-weight: bold;
        font-size: 16px;
      }
      
      &:last-child {
        color: #666;
        font-size: 14px;
      }
    }
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.fade-widget-enter-active,
.fade-widget-leave-active {
  transition: all 0.3s ease;
}

.fade-widget-enter-from,
.fade-widget-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>