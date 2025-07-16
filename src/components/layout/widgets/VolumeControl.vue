<template>
  <div class="volume-control">
    <i 
      class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-39" 
      @click="$emit('toggle')"
    ></i>
    <transition name="fade">
      <el-slider 
        v-show="isVisible" 
        :model-value="volume" 
        @update:model-value="$emit('change', $event)"
        :show-tooltip="false" 
        vertical
      ></el-slider>
    </transition>
  </div>
</template>

<script setup>
defineProps({
  volume: {
    type: Number,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle', 'change'])
</script>

<style scoped lang="scss">
.volume-control {
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

  .el-slider {
    position: absolute;
    top: 40px;
    height: 80px;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
