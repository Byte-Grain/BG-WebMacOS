<template>
  <div class="app-card">
    <div class="app-icon">
      <img :src="app.icon" :alt="app.name" @error="handleImageError">
    </div>
    
    <div class="app-info">
      <h3 class="app-name">{{ app.name }}</h3>
      <p class="app-author">{{ app.author }}</p>
      <p class="app-description">{{ app.description }}</p>
      
      <div class="app-meta">
        <div class="app-rating">
          <div class="stars">
            <i 
              v-for="i in 5" 
              :key="i"
              :class="[
                'fas fa-star',
                i <= Math.round(app.rating) ? 'filled' : 'empty'
              ]"
            ></i>
          </div>
          <span class="rating-text">{{ app.rating.toFixed(1) }}</span>
          <span class="reviews-count">({{ app.reviews }})</span>
        </div>
        
        <div class="app-stats">
          <span class="downloads">
            <i class="fas fa-download"></i>
            {{ formatNumber(app.downloads) }}
          </span>
          <span class="size">
            <i class="fas fa-hdd"></i>
            {{ formatSize(app.size) }}
          </span>
        </div>
      </div>
      
      <div class="app-tags" v-if="app.tags && app.tags.length > 0">
        <span 
          v-for="tag in app.tags.slice(0, 3)" 
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>
    
    <div class="app-actions">
      <button class="view-btn" @click="$emit('view', app)">
        <i class="fas fa-eye"></i>
        查看
      </button>
      
      <button 
        class="install-btn"
        @click="$emit('install', app)"
        :disabled="installing"
      >
        <i :class="['fas', installing ? 'fa-spinner fa-spin' : 'fa-download']"></i>
        {{ installing ? '安装中...' : '安装' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { StoreAppInfo } from '@/types/app-package'

interface Props {
  app: StoreAppInfo
}

interface Emits {
  (e: 'install', app: StoreAppInfo): void
  (e: 'view', app: StoreAppInfo): void
}

defineProps<Props>()
defineEmits<Emits>()

const installing = ref(false)

// 处理图片加载错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/icons/default-app.png' // 默认应用图标
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化文件大小
function formatSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}
</script>

<style scoped>
.app-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e5e7;
  transition: all 0.2s;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.app-icon {
  text-align: center;
  margin-bottom: 16px;
}

.app-icon img {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
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

.app-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.stars i {
  font-size: 12px;
}

.stars i.filled {
  color: #ffc107;
}

.stars i.empty {
  color: #e0e0e0;
}

.rating-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.reviews-count {
  font-size: 12px;
  color: #666;
}

.app-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.app-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 11px;
  color: #666;
}

.app-actions {
  display: flex;
  gap: 8px;
}

.view-btn,
.install-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.view-btn {
  background: #f0f0f0;
  color: #333;
}

.view-btn:hover {
  background: #e0e0e0;
}

.install-btn {
  background: #007aff;
  color: white;
}

.install-btn:hover:not(:disabled) {
  background: #0056b3;
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>