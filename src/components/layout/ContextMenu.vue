<template>
  <div 
    class="context-menu" 
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <div class="menu-item" @click="handleLockScreen">
      <i class="iconfont icon-lock"></i>
      <span>{{ $t('system.lockScreen') }}...</span>
    </div>
    
    <div class="menu-divider"></div>
    
    <div class="menu-item" @click="handleOpenSettings">
      <i class="iconfont icon-setting"></i>
      <span>{{ $t('system.settings') }}...</span>
    </div>
    
    <div class="menu-item" @click="handleOpenTaskManager">
      <i class="iconfont icon-task"></i>
      <span>{{ $t('system.forceQuit') }}...</span>
    </div>
    
    <div class="menu-divider"></div>
    
    <div class="menu-item" @click="handleSetWallpaper">
      <i class="iconfont icon-image"></i>
      <span>{{ $t('system.setWallpaper') }}...</span>
    </div>
    
    <div class="menu-item" @click="handleOpenAbout">
      <i class="iconfont icon-info"></i>
      <span>{{ $t('system.aboutUs') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  x: number
  y: number
}

defineProps<Props>()

// Emits
const emit = defineEmits([
  'close',
  'lockScreen',
  'openSettings',
  'openTaskManager',
  'openAbout'
])

// Composables
const { t } = useI18n()
const $message = ElMessage

// Methods
const handleLockScreen = () => {
  emit('lockScreen')
  emit('close')
}

const handleOpenSettings = () => {
  emit('openSettings')
  emit('close')
}

const handleOpenTaskManager = () => {
  emit('openTaskManager')
  emit('close')
}

const handleSetWallpaper = () => {
  $message.warning(t('system.comingSoon'))
  emit('close')
}

const handleOpenAbout = () => {
  emit('openAbout')
  emit('close')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 200px;
  z-index: 2000;
  user-select: none;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: #333;
}

.menu-item:hover {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.menu-item i {
  margin-right: 12px;
  font-size: 16px;
  width: 16px;
  text-align: center;
}

.menu-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

/* Animation */
.context-menu {
  animation: contextMenuShow 0.2s ease-out;
}

@keyframes contextMenuShow {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>