<template>
  <div class="notification-widget">
    <div class="notification-icon" @click="$emit('toggle')">
      <i class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-25"></i>
      <div v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</div>
    </div>
    <transition name="fade-widget">
      <div v-show="isVisible" class="widget-container">
        <div class="widget-header">
          <h3>通知中心</h3>
          <button v-if="notifications.length > 0" @click="clearAll" class="clear-all-btn">
            清除全部
          </button>
        </div>
        <div class="widget-content">
          <div v-if="notifications.length === 0" class="widget-placeholder">
            <p>暂无新通知</p>
          </div>
          <div v-else class="notification-list">
            <div 
              v-for="notification in recentNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="`notification-item--${notification.type}`"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                <i :class="getNotificationIcon(notification.type)"></i>
              </div>
              <div class="notification-content">
                <div v-if="notification.title" class="notification-title">
                  {{ notification.title }}
                </div>
                <div class="notification-message">
                  {{ notification.message }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
              <button @click.stop="closeNotification(notification.id)" class="close-btn">
                <i class="iconfont icon-close"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotification } from '@/composables'
import type { NotificationInstance } from '@/composables'

defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])

// 使用通知系统
const { notifications, close, closeAll } = useNotification()

// 计算未读通知数量
const unreadCount = computed(() => {
  return notifications.value.length
})

// 获取最近的通知（最多显示5条）
const recentNotifications = computed(() => {
  return notifications.value
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
})

// 获取通知图标
const getNotificationIcon = (type: string): string => {
  const iconMap = {
    info: 'iconfont icon-info-circle',
    success: 'iconfont icon-check-circle',
    warning: 'iconfont icon-warning-circle',
    error: 'iconfont icon-close-circle',
  }
  return iconMap[type as keyof typeof iconMap] || iconMap.info
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return new Date(timestamp).toLocaleDateString()
}

// 处理通知点击
const handleNotificationClick = (notification: NotificationInstance): void => {
  if (notification.onClick) {
    try {
      notification.onClick()
    } catch (error) {
      console.error('Error in notification onClick handler:', error)
    }
  }
}

// 关闭单个通知
const closeNotification = (id: string): void => {
  close(id)
}

// 清除所有通知
const clearAll = (): void => {
  closeAll()
}
</script>

<style scoped lang="scss">
.notification-widget {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .notification-icon {
    position: relative;
    cursor: pointer;
    padding: 0px 10px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    .iconfont {
      font-size: 20px;
      color: var(--text-primary, #1d1d1f);
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .notification-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    background: var(--error-red, #FF3B30);
    color: white;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .widget-container {
    position: fixed;
    top: 40px;
    right: 20px;
    width: 350px;
    max-height: 500px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(20px);
    z-index: 1000;
    overflow: hidden;
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #1d1d1f);
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: var(--primary-blue, #007AFF);
      font-size: 14px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;

      &:hover {
        background: rgba(0, 122, 255, 0.1);
      }
    }
  }

  .widget-content {
    max-height: 400px;
    overflow-y: auto;
  }

  .widget-placeholder {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary, #86868b);
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .notification-list {
    padding: 8px 0;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 20px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-left: 3px solid transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &--info {
      border-left-color: var(--primary-blue, #007AFF);
    }

    &--success {
      border-left-color: var(--success-green, #34C759);
    }

    &--warning {
      border-left-color: var(--warning-orange, #FF9500);
    }

    &--error {
      border-left-color: var(--error-red, #FF3B30);
    }

    .notification-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: center;

      .iconfont {
        font-size: 16px;

        &.icon-info-circle {
          color: var(--primary-blue, #007AFF);
        }

        &.icon-check-circle {
          color: var(--success-green, #34C759);
        }

        &.icon-warning-circle {
          color: var(--warning-orange, #FF9500);
        }

        &.icon-close-circle {
          color: var(--error-red, #FF3B30);
        }
      }
    }

    .notification-content {
      flex: 1;
      min-width: 0;

      .notification-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #1d1d1f);
        margin-bottom: 4px;
        line-height: 1.3;
      }

      .notification-message {
        font-size: 13px;
        color: var(--text-secondary, #86868b);
        line-height: 1.4;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .notification-time {
        font-size: 11px;
        color: var(--text-tertiary, #c7c7cc);
      }
    }

    .close-btn {
      width: 20px;
      height: 20px;
      margin-left: 8px;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
      opacity: 0.6;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        opacity: 1;
      }

      .iconfont {
        font-size: 12px;
        color: var(--text-tertiary, #c7c7cc);
      }
    }
  }
}

.fade-widget-enter-active,
.fade-widget-leave-active {
  transition: all 0.3s ease;
}

.fade-widget-enter-from,
.fade-widget-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .notification-widget {
    .widget-container {
      background: rgba(28, 28, 30, 0.95);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .widget-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);

      h3 {
        color: #f2f2f7;
      }
    }

    .notification-item {
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .notification-content {
        .notification-title {
          color: #f2f2f7;
        }

        .notification-message {
          color: #98989d;
        }

        .notification-time {
          color: #636366;
        }
      }

      .close-btn {
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .iconfont {
          color: #636366;
        }
      }
    }

    .widget-placeholder {
      color: #98989d;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .notification-widget {
    .widget-container {
      right: 10px;
      left: 10px;
      width: auto;
    }
  }
}
</style>
