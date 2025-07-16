<template>
  <teleport to="body">
    <div class="notification-container">
      <!-- 按位置分组显示通知 -->
      <div 
        v-for="(notifications, position) in notificationsByPosition" 
        :key="position"
        :class="[
          'notification-group',
          `notification-group--${position}`,
          { 'notification-group--empty': notifications.length === 0 }
        ]"
      >
        <transition-group 
          name="notification" 
          tag="div" 
          class="notification-list"
        >
          <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="[
              'notification-item',
              `notification-item--${notification.type}`,
              notification.customClass
            ]"
            @click="handleNotificationClick(notification)"
          >
            <!-- 通知图标 -->
            <div class="notification-icon">
              <img 
                v-if="notification.avatar" 
                :src="notification.avatar" 
                :alt="notification.title"
                class="notification-avatar"
              >
              <i 
                v-else-if="notification.icon" 
                :class="notification.icon"
                class="notification-icon-custom"
              ></i>
              <i 
                v-else
                :class="getDefaultIcon(notification.type)"
                class="notification-icon-default"
              ></i>
            </div>
            
            <!-- 通知内容 -->
            <div class="notification-content">
              <div v-if="notification.title" class="notification-title">
                {{ notification.title }}
              </div>
              <div class="notification-message">
                <div 
                  v-if="notification.html" 
                  v-html="notification.message"
                ></div>
                <template v-else>
                  {{ notification.message }}
                </template>
              </div>
              
              <!-- 操作按钮 -->
              <div v-if="notification.actions && notification.actions.length" class="notification-actions">
                <button
                  v-for="(action, index) in notification.actions"
                  :key="index"
                  :class="[
                    'notification-action',
                    `notification-action--${action.type || 'secondary'}`
                  ]"
                  @click.stop="handleActionClick(action, notification)"
                >
                  {{ action.text }}
                </button>
              </div>
            </div>
            
            <!-- 关闭按钮 -->
            <button
              v-if="notification.showClose"
              class="notification-close"
              @click.stop="closeNotification(notification.id)"
            >
              <i class="iconfont icon-close"></i>
            </button>
            
            <!-- 进度条（用于显示自动关闭倒计时） -->
            <div 
              v-if="notification.duration > 0"
              class="notification-progress"
              :style="{ animationDuration: `${notification.duration}ms` }"
            ></div>
          </div>
        </transition-group>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotification } from '@/composables'
import type { NotificationInstance, NotificationAction } from '@/composables'

// 使用通知系统
const { notifications, notificationsByPosition, close } = useNotification()

// 获取默认图标
const getDefaultIcon = (type: string): string => {
  const iconMap = {
    info: 'iconfont icon-info-circle',
    success: 'iconfont icon-check-circle',
    warning: 'iconfont icon-warning-circle',
    error: 'iconfont icon-close-circle',
  }
  return iconMap[type as keyof typeof iconMap] || iconMap.info
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

// 处理操作按钮点击
const handleActionClick = (action: NotificationAction, notification: NotificationInstance): void => {
  try {
    action.action()
  } catch (error) {
    console.error('Error in notification action handler:', error)
  }
}

// 关闭通知
const closeNotification = (id: string): void => {
  close(id)
}
</script>

<style scoped lang="scss">
.notification-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.notification-group {
  position: absolute;
  pointer-events: none;
  
  &--top-right {
    top: 20px;
    right: 20px;
  }
  
  &--top-left {
    top: 20px;
    left: 20px;
  }
  
  &--top-center {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  &--bottom-right {
    bottom: 20px;
    right: 20px;
  }
  
  &--bottom-left {
    bottom: 20px;
    left: 20px;
  }
  
  &--bottom-center {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  &--center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  &--empty {
    display: none;
  }
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  min-width: 300px;
}

.notification-item {
  position: relative;
  background: var(--notification-bg, rgba(255, 255, 255, 0.95));
  border: 1px solid var(--notification-border, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  &--info {
    border-left: 4px solid var(--primary-blue, #007AFF);
  }
  
  &--success {
    border-left: 4px solid var(--success-green, #34C759);
  }
  
  &--warning {
    border-left: 4px solid var(--warning-orange, #FF9500);
  }
  
  &--error {
    border-left: 4px solid var(--error-red, #FF3B30);
  }
}

.notification-icon {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.notification-icon-custom,
.notification-icon-default {
  font-size: 18px;
  
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

.notification-content {
  margin-left: 40px;
  margin-right: 32px;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 13px;
  color: var(--text-secondary, #86868b);
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.notification-action {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &--primary {
    background: var(--primary-blue, #007AFF);
    color: white;
    
    &:hover {
      background: var(--primary-blue-hover, #0056CC);
    }
  }
  
  &--secondary {
    background: var(--button-secondary-bg, #f2f2f7);
    color: var(--text-primary, #1d1d1f);
    
    &:hover {
      background: var(--button-secondary-hover, #e5e5ea);
    }
  }
  
  &--danger {
    background: var(--error-red, #FF3B30);
    color: white;
    
    &:hover {
      background: var(--error-red-hover, #D70015);
    }
  }
}

.notification-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--button-hover-bg, rgba(0, 0, 0, 0.05));
  }
  
  .iconfont {
    font-size: 12px;
    color: var(--text-tertiary, #c7c7cc);
  }
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--primary-blue, #007AFF);
  animation: notification-progress linear;
  transform-origin: left;
  
  @keyframes notification-progress {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
}

// 动画效果
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .notification-item {
    --notification-bg: rgba(28, 28, 30, 0.95);
    --notification-border: rgba(255, 255, 255, 0.1);
    --text-primary: #f2f2f7;
    --text-secondary: #98989d;
    --text-tertiary: #636366;
    --button-secondary-bg: #2c2c2e;
    --button-secondary-hover: #3a3a3c;
    --button-hover-bg: rgba(255, 255, 255, 0.05);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .notification-group {
    &--top-right,
    &--top-left {
      top: 10px;
      left: 10px;
      right: 10px;
    }
    
    &--bottom-right,
    &--bottom-left {
      bottom: 10px;
      left: 10px;
      right: 10px;
    }
  }
  
  .notification-list {
    max-width: none;
    min-width: auto;
  }
  
  .notification-item {
    margin: 0;
  }
}
</style>