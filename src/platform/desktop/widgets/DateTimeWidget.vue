<template>
  <div class="datetime-widget" @click.self="$emit('toggle')">
    {{ timeString }}
    <transition name="fade">
      <el-calendar 
        v-if="isCalendarVisible" 
        :model-value="currentDate" 
        @update:model-value="$emit('dateChange', $event)"
      ></el-calendar>
    </transition>
  </div>
</template>

<script setup>
defineProps({
  timeString: {
    type: String,
    required: true
  },
  isCalendarVisible: {
    type: Boolean,
    default: false
  },
  currentDate: {
    type: Date,
    required: true
  }
})

defineEmits(['toggle', 'dateChange'])
</script>

<style scoped lang="scss">
.datetime-widget {
  cursor: pointer;
  padding: 0px 10px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;

  .el-calendar {
    color: #333;
    background: rgba(255, 255, 255, 0.98);
    position: fixed;
    top: 40px;
    right: 20px;
    width: 500px;
    border-radius: 10px;
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