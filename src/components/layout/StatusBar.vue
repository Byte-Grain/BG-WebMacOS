<template>
  <div class="status-bar">
    <!-- Volume Control -->
    <div class="status-item audio">
      <i class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-39" @click="toggleVolume"></i>
      <transition name="fade">
        <div v-show="isVolumeShow" class="volume-slider">
          <el-slider v-model="volume" :show-tooltip="false" vertical></el-slider>
        </div>
      </transition>
    </div>

    <!-- Date Time -->
    <div class="status-item datetime" @click.self="toggleCalendar">
      {{ timeString }}
      <transition name="fade">
        <div v-if="isCalendarShow" class="calendar-popup">
          <el-calendar v-model="nowDate"></el-calendar>
        </div>
      </transition>
    </div>

    <!-- Notification -->
    <div class="status-item notification">
      <i class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-25" @click="toggleWidget"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useSystem, useUtils } from '@/composables'

// Emits
const emit = defineEmits(['toggleWidget'])

// Composables
const { volume: systemVolume, setVolume } = useSystem()
const { date } = useUtils()

// Reactive data
const isCalendarShow = ref(false)
const nowDate = ref(new Date())
const volumeDelayTimer = ref<NodeJS.Timeout | null>(null)
const volume = ref(systemVolume.value)
const isVolumeShow = ref(false)
const timeString = ref('')
const timeTimer = ref<NodeJS.Timeout | null>(null)

// Computed
const formattedTime = computed(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  return now.toLocaleDateString('zh-CN', options)
})

// Watchers
watch(volume, (newValue) => {
  setVolume(newValue)
  clearTimeout(volumeDelayTimer.value!)
  volumeDelayTimer.value = setTimeout(() => {
    isVolumeShow.value = false
  }, 3000)
})

// Sync system volume
watch(systemVolume, (newValue) => {
  volume.value = newValue
})

// Methods
const updateTime = () => {
  timeString.value = formattedTime.value
}

const toggleCalendar = () => {
  isCalendarShow.value = !isCalendarShow.value
}

const toggleVolume = () => {
  isVolumeShow.value = !isVolumeShow.value
  if (isVolumeShow.value) {
    clearTimeout(volumeDelayTimer.value!)
    volumeDelayTimer.value = setTimeout(() => {
      isVolumeShow.value = false
    }, 3000)
  }
}

const toggleWidget = () => {
  emit('toggleWidget')
}

const hideAllPopups = () => {
  isVolumeShow.value = false
  isCalendarShow.value = false
}

// Lifecycle
onMounted(() => {
  updateTime()
  timeTimer.value = setInterval(updateTime, 1000)
  
  // Listen for clicks outside to hide popups
  document.addEventListener('click', hideAllPopups)
})

onUnmounted(() => {
  if (timeTimer.value) {
    clearInterval(timeTimer.value)
  }
  if (volumeDelayTimer.value) {
    clearTimeout(volumeDelayTimer.value)
  }
  document.removeEventListener('click', hideAllPopups)
})

// Expose methods for parent component
defineExpose({
  hideAllPopups
})
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-item {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.status-item:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.status-item i {
  font-size: 16px;
  color: #333;
}

.datetime {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.volume-slider {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 15px 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

.volume-slider :deep(.el-slider) {
  height: 100px;
}

.calendar-popup {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
}

.calendar-popup :deep(.el-calendar) {
  background: transparent;
  border: none;
}

.calendar-popup :deep(.el-calendar__header) {
  background: rgba(0, 122, 255, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Prevent event bubbling */
.volume-slider,
.calendar-popup {
  pointer-events: auto;
}

.status-item {
  pointer-events: auto;
}
</style>