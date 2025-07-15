<template>
  <div class="task" @click="handleBackgroundClick">
    <div class="task-list">
      <template v-for="item in openApps" :key="item.pid">
        <div v-if="item.key !== 'system_task'" class="task-item" :class="app && app.pid == item.pid ? 'active' : ''"
          @click.stop="selectApp(item)">
          <i class="iconfont" :class="item.icon" :style="{
            backgroundColor: item.iconBgColor,
            color: item.iconColor,
          }"></i>
          <span class="task-name">{{ item.title }}</span>
        </div>
      </template>
    </div>
    <div class="task-ctrl" @click.stop>
      <el-button size="small" type="primary" :disabled="!app.pid" @click="closeApp">强制退出</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .task {
    display: flex;
    flex-direction: column;
    height: 350px;
    width: 100%;
    color: #333;
    text-shadow: none;
    font-weight: 300;
    overflow: hidden;
    margin: 10px 20px;

    .task-list {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
      overflow-y: auto;

      .task-item {
        padding: 8px 16px;
        display: flex;
        margin: 2px 5px;
        flex-direction: row;
        font-size: 14px;
        cursor: pointer;
        border-radius: 5px;
        align-items: center;

        .task-name {
          flex-grow: 1;
          text-overflow: ellipsis;
          word-break: keep-all;
          overflow: hidden;
        }

        .iconfont {
          background: red;
          color: white;
          border-radius: 10px;
          width: 30px;
          height: 30px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 10px;
        }
      }

      .task-item:hover {
        background: rgb(75, 158, 251);
        color: white;
      }

      .active {
        background: rgb(75, 158, 251);
        color: white;
      }
    }

    .task-ctrl {
      justify-content: flex-end;
      align-items: center;
      display: flex;
      padding: 0px 10px;
      margin-top: 10px;
    }
  }
</style>
<script setup lang="ts">
  import { reactive, onMounted, onUnmounted } from 'vue'
  import { useAppManager } from '@/composables'
  
  const emit = defineEmits(['api'])
  const { openApps } = useAppManager()
  let app = reactive({})
  
  const selectApp = (item) => {
    Object.assign(app, item);
  }
  
  const closeApp = () => {
    if (app.pid) {
      emit("api", {
        event: "closeApp",
        pid: app.pid,
      });
    }
  }
  
  // 处理背景点击事件
  const handleBackgroundClick = (event) => {
    // 如果点击的是背景区域（不是任务项或控制按钮），则关闭控制台
    if (event.target.classList.contains('task')) {
      closeTaskManager()
    }
  }
  
  // 关闭控制台
  const closeTaskManager = () => {
    emit("api", {
      event: "windowClose"
    });
  }
  
  // 键盘事件处理
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeTaskManager()
    }
  }
  
  onMounted(() => {
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeydown)
  })
  
  onUnmounted(() => {
    // 移除键盘事件监听
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'system_task',
  title: 'Activity Monitor',
  icon: '📊',
  iconColor: '#fff',
  iconBgColor: '#34C759',
  width: 600,
  height: 400,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  hideInDesktop: false,
  category: 'system',
  description: '活动监视器',
  version: '1.0.0',
  author: 'System',
  tags: ['system', 'monitor', 'task'],
  system: true,
  essential: false,
  singleton: true
}
</script>