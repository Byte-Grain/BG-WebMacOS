<template>
  <transition name="fade-menu">
    <div 
      v-show="visible" 
      :style="{ left: left + 'px', top: top + 'px' }"
      class="desktop-context-menu"
    >
      <div @click="$emit('lockScreen')">{{ $t('system.lockScreen') }}...</div>
      <hr />
      <div @click="$emit('openSettings')">{{ $t('system.settings') }}...</div>
      <div @click="$emit('openTaskManager')">{{ $t('system.forceQuit') }}...</div>
      <hr />
      <div @click="$emit('setWallpaper')">{{ $t('system.setWallpaper') }}...</div>
      <div @click="$emit('openAbout')">{{ $t('system.aboutUs') }}</div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  left: {
    type: Number,
    default: 0
  },
  top: {
    type: Number,
    default: 0
  }
})

defineEmits([
  'lockScreen', 
  'openSettings', 
  'openTaskManager', 
  'setWallpaper', 
  'openAbout'
])
</script>

<style scoped lang="scss">
.desktop-context-menu {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  box-shadow: 0px 0px 10px rgb(0 0 0 / 30%);
  color: #333;
  font-size: 14px;
  text-align: left;
  width: 200px;
  overflow: hidden;
  padding: 2px 0px;
  text-shadow: none;
  z-index: 100;

  hr {
    border: none;
    border-top: 1px solid #ddd;
  }

  div {
    cursor: pointer;
    font-size: 13px !important;
    color: #333;
    border-radius: 5px;
    line-height: 2;
    padding: 0px 12px;
    display: flex;
    align-items: center;
    margin: 3px 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background: #4b9efb;
      color: white;
      border-radius: 5px;
    }
  }
}

.fade-menu-enter-active,
.fade-menu-leave-active {
  transition: all 0.2s ease;
}

.fade-menu-enter-from,
.fade-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>