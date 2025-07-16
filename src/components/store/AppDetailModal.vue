<template>
  <div class="app-detail-modal" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 应用信息 -->
      <div class="app-header">
        <div class="app-icon">
          <img :src="app.icon" :alt="app.name" @error="handleImageError">
        </div>
        
        <div class="app-basic-info">
          <h1 class="app-name">{{ app.name }}</h1>
          <p class="app-author">{{ app.author }}</p>
          <p class="app-description">{{ app.description }}</p>
          
          <div class="app-meta">
            <div class="rating">
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
              <span class="reviews-count">({{ app.reviews }} 评价)</span>
            </div>
            
            <div class="stats">
              <span class="downloads">
                <i class="fas fa-download"></i>
                {{ formatNumber(app.downloads) }} 下载
              </span>
              <span class="size">
                <i class="fas fa-hdd"></i>
                {{ formatSize(app.size) }}
              </span>
              <span class="version">
                <i class="fas fa-tag"></i>
                v{{ app.version }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="app-actions">
          <button 
            class="install-btn"
            @click="$emit('install', app)"
            :disabled="installing || isInstalled"
          >
            <i :class="['fas', installing ? 'fa-spinner fa-spin' : isInstalled ? 'fa-check' : 'fa-download']"></i>
            {{ installing ? '安装中...' : isInstalled ? '已安装' : '安装' }}
          </button>
        </div>
      </div>

      <!-- 标签 -->
      <div class="app-tags" v-if="app.tags && app.tags.length > 0">
        <span v-for="tag in app.tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>

      <!-- 截图 -->
      <div class="screenshots" v-if="app.screenshots && app.screenshots.length > 0">
        <h3>应用截图</h3>
        <div class="screenshots-grid">
          <div 
            v-for="(screenshot, index) in app.screenshots" 
            :key="index"
            class="screenshot-item"
            @click="openScreenshot(index)"
          >
            <img :src="screenshot" :alt="`截图 ${index + 1}`">
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="app-details">
        <div class="details-section">
          <h3>应用信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">开发者</span>
              <span class="value">{{ app.author }}</span>
            </div>
            <div class="info-item">
              <span class="label">分类</span>
              <span class="value">{{ app.category }}</span>
            </div>
            <div class="info-item">
              <span class="label">版本</span>
              <span class="value">{{ app.version }}</span>
            </div>
            <div class="info-item">
              <span class="label">大小</span>
              <span class="value">{{ formatSize(app.size) }}</span>
            </div>
            <div class="info-item">
              <span class="label">发布时间</span>
              <span class="value">{{ formatDate(app.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">更新时间</span>
              <span class="value">{{ formatDate(app.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 权限信息 -->
        <div class="details-section" v-if="app.permissions && app.permissions.length > 0">
          <h3>权限要求</h3>
          <div class="permissions-list">
            <div 
              v-for="permission in app.permissions" 
              :key="permission"
              class="permission-item"
            >
              <i :class="getPermissionIcon(permission)"></i>
              <div class="permission-info">
                <span class="permission-name">{{ getPermissionName(permission) }}</span>
                <span class="permission-desc">{{ getPermissionDescription(permission) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 更新日志 -->
        <div class="details-section" v-if="app.changelog">
          <h3>更新日志</h3>
          <div class="changelog">
            <div 
              v-for="(change, index) in app.changelog.slice(0, 3)" 
              :key="index"
              class="changelog-item"
            >
              <div class="changelog-version">v{{ change.version }}</div>
              <div class="changelog-date">{{ formatDate(change.date) }}</div>
              <div class="changelog-content">
                <ul>
                  <li v-for="item in change.changes" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评价和评论 -->
      <div class="reviews-section">
        <h3>用户评价</h3>
        <div class="reviews-summary">
          <div class="rating-breakdown">
            <div class="overall-rating">
              <span class="rating-number">{{ app.rating.toFixed(1) }}</span>
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
              <span class="total-reviews">{{ app.reviews }} 个评价</span>
            </div>
            
            <div class="rating-bars">
              <div v-for="i in 5" :key="i" class="rating-bar">
                <span class="star-count">{{ 6 - i }}</span>
                <div class="bar">
                  <div 
                    class="bar-fill"
                    :style="{ width: getRatingPercentage(6 - i) + '%' }"
                  ></div>
                </div>
                <span class="percentage">{{ getRatingPercentage(6 - i) }}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="reviews-list" v-if="reviews.length > 0">
          <div v-for="review in reviews.slice(0, 3)" :key="review.id" class="review-item">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <div class="reviewer-details">
                  <span class="reviewer-name">{{ review.userName }}</span>
                  <div class="review-rating">
                    <i 
                      v-for="i in 5" 
                      :key="i"
                      :class="[
                        'fas fa-star',
                        i <= review.rating ? 'filled' : 'empty'
                      ]"
                    ></i>
                  </div>
                </div>
              </div>
              <span class="review-date">{{ formatDate(review.date) }}</span>
            </div>
            <p class="review-content">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 截图查看器 -->
    <div v-if="showScreenshotViewer" class="screenshot-viewer" @click="closeScreenshot">
      <div class="viewer-content" @click.stop>
        <button class="viewer-close" @click="closeScreenshot">
          <i class="fas fa-times"></i>
        </button>
        <img :src="app.screenshots[currentScreenshot]" :alt="`截图 ${currentScreenshot + 1}`">
        <div class="viewer-nav">
          <button 
            @click="prevScreenshot" 
            :disabled="currentScreenshot === 0"
            class="nav-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="nav-info">{{ currentScreenshot + 1 }} / {{ app.screenshots.length }}</span>
          <button 
            @click="nextScreenshot" 
            :disabled="currentScreenshot === app.screenshots.length - 1"
            class="nav-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { StoreAppInfo } from '@/types/app-package'

interface Props {
  app: StoreAppInfo
}

interface Emits {
  (e: 'close'): void
  (e: 'install', app: StoreAppInfo): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const installing = ref(false)
const isInstalled = ref(false)
const reviews = ref<any[]>([])
const showScreenshotViewer = ref(false)
const currentScreenshot = ref(0)

// 模拟评价数据
const mockReviews = [
  {
    id: 1,
    userName: '用户A',
    rating: 5,
    comment: '非常好用的应用，界面美观，功能强大！',
    date: new Date('2024-01-15')
  },
  {
    id: 2,
    userName: '用户B',
    rating: 4,
    comment: '整体不错，就是有些功能还需要完善。',
    date: new Date('2024-01-10')
  },
  {
    id: 3,
    userName: '用户C',
    rating: 5,
    comment: '强烈推荐！解决了我的很多问题。',
    date: new Date('2024-01-08')
  }
]

onMounted(() => {
  reviews.value = mockReviews
})

// 处理背景点击
function handleBackdropClick() {
  // 可以选择是否允许点击背景关闭
  // $emit('close')
}

// 处理图片错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/icons/default-app.png'
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

// 格式化日期
function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 获取权限图标
function getPermissionIcon(permission: string): string {
  const iconMap: Record<string, string> = {
    'storage': 'fas fa-database',
    'network': 'fas fa-wifi',
    'filesystem': 'fas fa-folder',
    'camera': 'fas fa-camera',
    'microphone': 'fas fa-microphone',
    'notifications': 'fas fa-bell',
    'clipboard': 'fas fa-clipboard',
    'screen': 'fas fa-desktop'
  }
  
  return iconMap[permission] || 'fas fa-shield-alt'
}

// 获取权限名称
function getPermissionName(permission: string): string {
  const nameMap: Record<string, string> = {
    'storage': '本地存储',
    'network': '网络访问',
    'filesystem': '文件系统',
    'camera': '摄像头',
    'microphone': '麦克风',
    'notifications': '通知',
    'clipboard': '剪贴板',
    'screen': '屏幕共享'
  }
  
  return nameMap[permission] || permission
}

// 获取权限描述
function getPermissionDescription(permission: string): string {
  const descMap: Record<string, string> = {
    'storage': '访问本地存储以保存应用数据',
    'network': '访问网络以获取在线内容',
    'filesystem': '读写文件系统中的文件',
    'camera': '访问摄像头进行拍照或录像',
    'microphone': '访问麦克风进行录音',
    'notifications': '显示系统通知',
    'clipboard': '读写剪贴板内容',
    'screen': '共享屏幕内容'
  }
  
  return descMap[permission] || '未知权限'
}

// 获取评分百分比（模拟数据）
function getRatingPercentage(stars: number): number {
  const mockData: Record<number, number> = {
    5: 60,
    4: 25,
    3: 10,
    2: 3,
    1: 2
  }
  
  return mockData[stars] || 0
}

// 打开截图查看器
function openScreenshot(index: number) {
  currentScreenshot.value = index
  showScreenshotViewer.value = true
}

// 关闭截图查看器
function closeScreenshot() {
  showScreenshotViewer.value = false
}

// 上一张截图
function prevScreenshot() {
  if (currentScreenshot.value > 0) {
    currentScreenshot.value--
  }
}

// 下一张截图
function nextScreenshot() {
  if (currentScreenshot.value < props.app.screenshots.length - 1) {
    currentScreenshot.value++
  }
}
</script>

<style scoped>
.app-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 20px 0;
  display: flex;
  justify-content: flex-end;
  z-index: 10;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.app-header {
  padding: 0 20px 20px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.app-icon img {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  object-fit: cover;
}

.app-basic-info {
  flex: 1;
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333;
}

.app-author {
  font-size: 16px;
  color: #666;
  margin-bottom: 12px;
}

.app-description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
}

.app-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stars {
  display: flex;
  gap: 2px;
}

.stars i {
  font-size: 16px;
}

.stars i.filled {
  color: #ffc107;
}

.stars i.empty {
  color: #e0e0e0;
}

.rating-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.reviews-count {
  font-size: 14px;
  color: #666;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.install-btn {
  padding: 12px 24px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
}

.install-btn:hover:not(:disabled) {
  background: #0056b3;
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-tags {
  padding: 0 20px 20px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
}

.screenshots {
  padding: 0 20px 20px;
}

.screenshots h3 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #333;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.screenshot-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.screenshot-item:hover {
  transform: scale(1.02);
}

.screenshot-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.app-details {
  padding: 0 20px 20px;
}

.details-section {
  margin-bottom: 32px;
}

.details-section h3 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item .label {
  font-weight: 500;
  color: #666;
}

.info-item .value {
  color: #333;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.permission-item i {
  font-size: 20px;
  color: #007aff;
  width: 24px;
  text-align: center;
}

.permission-info {
  flex: 1;
}

.permission-name {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.permission-desc {
  font-size: 14px;
  color: #666;
}

.changelog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.changelog-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.changelog-version {
  font-weight: 600;
  color: #007aff;
  margin-bottom: 4px;
}

.changelog-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.changelog-content ul {
  margin: 0;
  padding-left: 20px;
}

.changelog-content li {
  margin-bottom: 4px;
  color: #333;
}

.reviews-section {
  padding: 0 20px 20px;
}

.reviews-section h3 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #333;
}

.reviews-summary {
  margin-bottom: 24px;
}

.rating-breakdown {
  display: flex;
  gap: 40px;
  align-items: center;
}

.overall-rating {
  text-align: center;
}

.rating-number {
  font-size: 48px;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.total-reviews {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
  display: block;
}

.rating-bars {
  flex: 1;
  max-width: 300px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.star-count {
  font-size: 12px;
  color: #666;
  width: 8px;
}

.bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #ffc107;
  transition: width 0.3s;
}

.percentage {
  font-size: 12px;
  color: #666;
  width: 30px;
  text-align: right;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reviewer-avatar {
  width: 32px;
  height: 32px;
  background: #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.reviewer-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-rating i {
  font-size: 12px;
}

.review-date {
  font-size: 12px;
  color: #666;
}

.review-content {
  color: #333;
  line-height: 1.5;
  margin: 0;
}

/* 截图查看器 */
.screenshot-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.viewer-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.viewer-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-content img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.viewer-nav {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-info {
  font-size: 14px;
}
</style>
