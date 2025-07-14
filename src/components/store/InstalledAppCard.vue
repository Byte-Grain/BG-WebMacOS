<template>
  <div class="installed-app-card">
    <div class="app-icon">
      <img :src="app.manifest.icon" :alt="app.manifest.name" @error="handleImageError">
      <div v-if="hasUpdate" class="update-badge">
        <i class="fas fa-arrow-up"></i>
      </div>
    </div>
    
    <div class="app-info">
      <h3 class="app-name">{{ app.manifest.name }}</h3>
      <p class="app-author">{{ app.manifest.author }}</p>
      <p class="app-description">{{ app.manifest.description }}</p>
      
      <div class="app-meta">
        <div class="version-info">
          <span class="current-version">
            <i class="fas fa-tag"></i>
            v{{ app.manifest.version }}
          </span>
          <span v-if="hasUpdate" class="new-version">
            → v{{ updateInfo?.latestVersion }}
          </span>
        </div>
        
        <div class="install-info">
          <span class="install-date">
            <i class="fas fa-calendar"></i>
            {{ formatDate(app.installedAt) }}
          </span>
          <span class="app-size">
            <i class="fas fa-hdd"></i>
            {{ formatSize(app.size) }}
          </span>
        </div>
      </div>
      
      <div class="app-status">
        <span :class="['status-badge', app.status]">
          <i :class="getStatusIcon(app.status)"></i>
          {{ getStatusText(app.status) }}
        </span>
        
        <div class="app-permissions" v-if="app.manifest.permissions && app.manifest.permissions.length > 0">
          <span class="permissions-label">权限:</span>
          <span 
            v-for="permission in app.manifest.permissions.slice(0, 3)" 
            :key="permission"
            class="permission-tag"
          >
            {{ getPermissionText(permission) }}
          </span>
          <span v-if="app.manifest.permissions.length > 3" class="more-permissions">
            +{{ app.manifest.permissions.length - 3 }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="app-actions">
      <button class="view-btn" @click="$emit('view', app)">
        <i class="fas fa-eye"></i>
        详情
      </button>
      
      <button 
        v-if="hasUpdate"
        class="update-btn"
        @click="$emit('update', app)"
        :disabled="updating"
      >
        <i :class="['fas', updating ? 'fa-spinner fa-spin' : 'fa-sync-alt']"></i>
        {{ updating ? '更新中...' : '更新' }}
      </button>
      
      <button 
        class="uninstall-btn"
        @click="$emit('uninstall', app)"
        :disabled="app.manifest.essential"
        :title="app.manifest.essential ? '系统应用无法卸载' : '卸载应用'"
      >
        <i class="fas fa-trash"></i>
        卸载
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { InstalledAppInfo } from '@/types/app-package'

interface Props {
  app: InstalledAppInfo
  updateInfo?: {
    latestVersion: string
    updateInfo: any
  }
}

interface Emits {
  (e: 'update', app: InstalledAppInfo): void
  (e: 'uninstall', app: InstalledAppInfo): void
  (e: 'view', app: InstalledAppInfo): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const updating = ref(false)

// 是否有更新
const hasUpdate = computed(() => {
  return props.updateInfo && props.updateInfo.latestVersion !== props.app.manifest.version
})

// 处理图片加载错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/icons/default-app.png'
}

// 格式化日期
function formatDate(date: Date): string {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays <= 7) {
    return `${diffDays} 天前`
  } else if (diffDays <= 30) {
    return `${Math.ceil(diffDays / 7)} 周前`
  } else if (diffDays <= 365) {
    return `${Math.ceil(diffDays / 30)} 月前`
  } else {
    return `${Math.ceil(diffDays / 365)} 年前`
  }
}

// 格式化文件大小
function formatSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

// 获取状态图标
function getStatusIcon(status: string): string {
  switch (status) {
    case 'active':
      return 'fas fa-check-circle'
    case 'inactive':
      return 'fas fa-pause-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    case 'updating':
      return 'fas fa-sync-alt fa-spin'
    default:
      return 'fas fa-question-circle'
  }
}

// 获取状态文本
function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return '正常'
    case 'inactive':
      return '未激活'
    case 'error':
      return '错误'
    case 'updating':
      return '更新中'
    default:
      return '未知'
  }
}

// 获取权限文本
function getPermissionText(permission: string): string {
  const permissionMap: Record<string, string> = {
    'storage': '存储',
    'network': '网络',
    'filesystem': '文件系统',
    'camera': '摄像头',
    'microphone': '麦克风',
    'notifications': '通知',
    'clipboard': '剪贴板',
    'screen': '屏幕共享'
  }
  
  return permissionMap[permission] || permission
}
</script>

<style scoped>
.installed-app-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e5e7;
  transition: all 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.installed-app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.app-icon {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
}

.app-icon img {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.update-badge {
  position: absolute;
  top: -4px;
  right: calc(50% - 36px);
  width: 20px;
  height: 20px;
  background: #ff3b30;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  border: 2px solid white;
}

.app-info {
  flex: 1;
  margin-bottom: 16px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
  line-height: 1.2;
}

.app-author {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.app-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-meta {
  margin-bottom: 12px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.current-version {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
}

.new-version {
  font-size: 12px;
  color: #ff3b30;
  font-weight: 500;
}

.install-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.install-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-status {
  margin-bottom: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
}

.status-badge.active {
  background: #e8f5e8;
  color: #34c759;
}

.status-badge.inactive {
  background: #f0f0f0;
  color: #666;
}

.status-badge.error {
  background: #ffe8e8;
  color: #ff3b30;
}

.status-badge.updating {
  background: #e8f4ff;
  color: #007aff;
}

.app-permissions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.permissions-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.permission-tag {
  padding: 2px 6px;
  background: #e8f4ff;
  color: #007aff;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.more-permissions {
  font-size: 10px;
  color: #666;
  font-style: italic;
}

.app-actions {
  display: flex;
  gap: 8px;
}

.view-btn,
.update-btn,
.uninstall-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.view-btn {
  background: #f0f0f0;
  color: #333;
}

.view-btn:hover {
  background: #e0e0e0;
}

.update-btn {
  background: #ff9500;
  color: white;
}

.update-btn:hover:not(:disabled) {
  background: #e6850e;
}

.uninstall-btn {
  background: #ff3b30;
  color: white;
}

.uninstall-btn:hover:not(:disabled) {
  background: #d70015;
}

.update-btn:disabled,
.uninstall-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.uninstall-btn:disabled {
  background: #ccc;
}
</style>