<template>
  <div class="app-error">
    <div class="error-icon">
      <i class="fas fa-exclamation-triangle"></i>
    </div>
    <div class="error-content">
      <h3 class="error-title">应用加载失败</h3>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button class="retry-btn" @click="retry">
          <i class="fas fa-redo"></i>
          重试
        </button>
        <button class="close-btn" @click="close">
          <i class="fas fa-times"></i>
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  error?: Error | string
  appKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  error: '未知错误',
  appKey: ''
})

const emit = defineEmits<{
  retry: []
  close: []
}>()

const errorMessage = ref('')

onMounted(() => {
  if (typeof props.error === 'string') {
    errorMessage.value = props.error
  } else if (props.error instanceof Error) {
    errorMessage.value = props.error.message
  } else {
    errorMessage.value = '应用组件无法加载，请检查组件路径是否正确'
  }
  
  if (props.appKey) {
    errorMessage.value += ` (应用: ${props.appKey})`
  }
})

const retry = () => {
  emit('retry')
}

const close = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
.app-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #333;
  text-align: center;
  
  .error-icon {
    font-size: 4rem;
    color: #ff6b6b;
    margin-bottom: 1.5rem;
    
    i {
      filter: drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3));
    }
  }
  
  .error-content {
    max-width: 400px;
    
    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #2c3e50;
    }
    
    .error-message {
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      color: #7f8c8d;
      word-break: break-word;
    }
    
    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      
      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
      
      .retry-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }
      }
      
      .close-btn {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, #ee82e9 0%, #f3455a 100%);
        }
      }
    }
  }
}

// 暗色主题支持
@media (prefers-color-scheme: dark) {
  .app-error {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: #ecf0f1;
    
    .error-content {
      .error-title {
        color: #ecf0f1;
      }
      
      .error-message {
        color: #bdc3c7;
      }
    }
  }
}
</style>