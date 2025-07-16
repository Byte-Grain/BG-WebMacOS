<template>
  <div class="desktop-status-bar">
    <TopBar />
    <div class="space"></div>
    <div class="status">
      <VolumeControl :volume="props.volume || 50" :isVisible="isVolumnShow" @toggle="handleVolumeToggle"
        @change="handleVolumeChange" />
      <DateTimeWidget :timeString="timeString" :isCalendarVisible="isCalendarShow" :currentDate="nowDate"
        @toggle="handleCalendarToggle" @dateChange="handleDateChange" />
      <NotificationWidget :isVisible="isWidgetShow" @toggle="handleWidgetToggle" />
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useSystem, useUtils } from '@/shared/composables'
import { usePerformance } from '@/shared/composables'
  import VolumeControl from './widgets/VolumeControl.vue'
  import DateTimeWidget from './widgets/DateTimeWidget.vue'
  import NotificationWidget from './widgets/NotificationWidget.vue'
  import TopBar from '@platform/menubar/TopBar.vue';

  const props = defineProps({
    hideAllController: {
      type: Function,
      required: true
    },
    volume: {
      type: Number,
      default: 50
    }
  })

  const emit = defineEmits(['volumeChange'])

  // 使用组合式函数
  const { volume, setVolume } = useSystem()
  const { date, storage } = useUtils()
  const { throttle } = usePerformance('DesktopStatusBar')

  // 响应式数据
  const isCalendarShow = ref(false)
  const nowDate = ref(new Date())
  const volumnDelayTimer = ref(null)
  const volumn = ref(volume.value)
  const isVolumnShow = ref(false)
  const timeString = ref('')
  const isWidgetShow = ref(false)
  const timeUpdateTimer = ref(null)

  // 监听器
  watch(volumn, (newValue) => {
    setVolume(newValue)
    emit('volumeChange', newValue)
    clearTimeout(volumnDelayTimer.value)
    volumnDelayTimer.value = setTimeout(() => {
      isVolumnShow.value = false
    }, 3000)
  })

  // 同步音量值
  watch(volume, (newValue) => {
    volumn.value = newValue
  })

  // 方法
  const handleCalendarToggle = () => {
    isCalendarShow.value = !isCalendarShow.value
  }

  const handleDateChange = (date) => {
    nowDate.value = date
  }

  // 优化：使用节流和防抖优化音量控制
  const handleVolumeToggle = throttle(() => {
    isVolumnShow.value = !isVolumnShow.value
    if (isVolumnShow.value) {
      clearTimeout(volumnDelayTimer.value)
      volumnDelayTimer.value = setTimeout(() => {
        isVolumnShow.value = false
      }, 3000)
    }
  }, 100)

  const handleVolumeChange = (value) => {
    volumn.value = value
  }

  const handleWidgetToggle = () => {
    isWidgetShow.value = !isWidgetShow.value
  }

  // 优化：使用requestAnimationFrame和缓存优化时间更新
  const startTimer = () => {
    let lastTimeString = ''
    
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      const newTimeString = `${month}-${day} ${hours}:${minutes}`
      
      if (newTimeString !== lastTimeString) {
        timeString.value = newTimeString
        lastTimeString = newTimeString
      }
    }

    // 立即更新一次
    updateTime()

    // 使用更精确的定时器，每30秒检查一次
    timeUpdateTimer.value = setInterval(updateTime, 30000)
  }

  // 生命周期 - 优化：延迟初始化非关键功能
  onMounted(async () => {
    // 立即初始化时间显示
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    timeString.value = `${month}-${day} ${hours}:${minutes}`
    
    // 在下一个事件循环中启动定时器
    await nextTick()
    startTimer()
  })

  // 清理定时器
  onUnmounted(() => {
    if (timeUpdateTimer.value) {
      clearInterval(timeUpdateTimer.value)
    }
    if (volumnDelayTimer.value) {
      clearTimeout(volumnDelayTimer.value)
    }
  })
</script>

<style scoped lang="scss">
  .desktop-status-bar {
    height: 28px;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: row;
    font-size: 14px;
    align-items: center;
    justify-content: center;
    padding: 0px 5px;
    z-index: 100;

    .space {
      flex-grow: 1;
    }

    .status {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  }
</style>
