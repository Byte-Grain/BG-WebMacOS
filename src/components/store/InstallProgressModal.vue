<template>
  <div class="install-progress-modal">
    <div class="modal-content">
      <!-- 应用信息 -->
      <div class="app-info">
        <div class="app-icon">
          <img :src="app.icon" :alt="app.name" @error="handleImageError">
        </div>
        <div class="app-details">
          <h3 class="app-name">{{ app.name }}</h3>
          <p class="app-author">{{ app.author }}</p>
        </div>
      </div>

      <!-- 进度信息 -->
      <div class="progress-info">
        <div class="status-text">{{ status }}</div>
        
        <!-- 进度条 -->
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>

      <!-- 状态图标 -->
      <div class="status-icon">
        <i 
          v-if="isInstalling"
          class="fas fa-spinner fa-spin"
        ></i>
        <i 
          v-else-if="isSuccess"
          class="fas fa-check-circle success"
        ></i>
        <i 
          v-else-if="isError"
          class="fas fa-exclamation-circle error"
        ></i>
      </div>

      <!-- 详细步骤 -->
      <div class="install-steps">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          :class="['step-item', getStepStatus(index)]"
        >
          <div class="step-icon">
            <i 
              v-if="getStepStatus(index) === 'completed'"
              class="fas fa-check"
            ></i>
            <i 
              v-else-if="getStepStatus(index) === 'active'"
              class="fas fa-spinner fa-spin"
            ></i>
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <span class="step-text">{{ step.text }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button 
          v-if="!isInstalling"
          class="close-btn"
          @click="$emit('close')"
        >
          {{ isSuccess ? '完成' : '关闭' }}
        </button>
        
        <button 
          v-if="isError"
          class="retry-btn"
          @click="$emit('retry')"
        >
          重试
        </button>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { StoreAppInfo } from '@/types/app-package'

interface Props {
  app: StoreAppInfo
  progress: number
  status: string
  error?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'retry'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const errorMessage = ref('')

// 安装步骤
const steps = ref([
  { text: '验证应用包', threshold: 10 },
  { text: '检查依赖', threshold: 20 },
  { text: '下载资源', threshold: 60 },
  { text: '安装应用', threshold: 90 },
  { text: '配置应用', threshold: 100 }
])

// 计算状态
const isInstalling = computed(() => {
  return props.progress < 100 && !props.status.includes('失败') && !props.status.includes('错误')
})

const isSuccess = computed(() => {
  return props.progress === 100 && (props.status.includes('完成') || props.status.includes('成功'))
})

const isError = computed(() => {
  return props.status.includes('失败') || props.status.includes('错误') || !!props.error
})

// 监听错误
watch(() => props.error, (newError) => {
  if (newError) {
    errorMessage.value = newError
  }
})

// 获取步骤状态
function getStepStatus(index: number): string {
  const step = steps.value[index]
  
  if (props.progress >= step.threshold) {
    return 'completed'
  } else if (index === getCurrentStepIndex()) {
    return 'active'
  } else {
    return 'pending'
  }
}

// 获取当前步骤索引
function getCurrentStepIndex(): number {
  for (let i = 0; i < steps.value.length; i++) {
    if (props.progress < steps.value[i].threshold) {
      return i
    }
  }
  return steps.value.length - 1
}

// 处理图片错误
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/icons/default-app.png'
}
</script>

<style scoped>
.install-progress-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  text-align: left;
}

.app-icon img {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.app-details {
  flex: 1;
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.app-author {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.progress-info {
  margin-bottom: 24px;
}

.status-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007aff, #5ac8fa);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.status-icon {
  margin-bottom: 24px;
}

.status-icon i {
  font-size: 48px;
}

.status-icon .fa-spinner {
  color: #007aff;
}

.status-icon .success {
  color: #34c759;
}

.status-icon .error {
  color: #ff3b30;
}

.install-steps {
  text-align: left;
  margin-bottom: 24px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  transition: all 0.3s;
}

.step-item.pending {
  opacity: 0.5;
}

.step-item.active {
  opacity: 1;
  color: #007aff;
}

.step-item.completed {
  opacity: 1;
  color: #34c759;
}

.step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-item.pending .step-icon {
  background: #f0f0f0;
  color: #666;
}

.step-item.active .step-icon {
  background: #e8f4ff;
  color: #007aff;
}

.step-item.completed .step-icon {
  background: #e8f5e8;
  color: #34c759;
}

.step-number {
  font-size: 10px;
}

.step-text {
  font-size: 14px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.close-btn,
.retry-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.close-btn {
  background: #f0f0f0;
  color: #333;
}

.close-btn:hover {
  background: #e0e0e0;
}

.retry-btn {
  background: #007aff;
  color: white;
}

.retry-btn:hover {
  background: #0056b3;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #ffe8e8;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  color: #d32f2f;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.error-message i {
  color: #ff3b30;
  flex-shrink: 0;
}

/* 动画效果 */
.modal-content {
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 成功状态的特殊效果 */
.step-item.completed .step-icon {
  animation: checkmark 0.5s ease-in-out;
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-content {
    margin: 20px;
    padding: 24px;
  }
  
  .app-info {
    flex-direction: column;
    text-align: center;
  }
  
  .app-details {
    text-align: center;
  }
}
</style>
