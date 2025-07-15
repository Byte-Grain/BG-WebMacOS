<template>
  <div class="calculator-display">
    <!-- 历史记录按钮 -->
    <button 
      v-if="history.length > 0"
      @click="toggleHistory" 
      class="history-toggle"
      :class="{ active: showHistory }"
    >
      <i class="fas fa-history"></i>
    </button>

    <!-- 历史记录面板 -->
    <div v-if="showHistory" class="history-panel">
      <div class="history-header">
        <h4>计算历史</h4>
        <button @click="$emit('clear-history')" class="clear-history-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="history-list">
        <div 
          v-for="(item, index) in history" 
          :key="index"
          class="history-item"
          @click="selectHistoryItem(item)"
        >
          <div class="history-expression">{{ item.expression }}</div>
          <div class="history-result">= {{ item.result }}</div>
        </div>
        <div v-if="history.length === 0" class="history-empty">
          暂无计算历史
        </div>
      </div>
    </div>

    <!-- 主显示区域 -->
    <div class="display-main">
      <!-- 表达式显示 -->
      <div v-if="expression" class="expression-display">
        {{ expression }}
      </div>
      
      <!-- 结果显示 -->
      <div class="result-display">
        <span class="result-value" :class="{ error: isError }">
          {{ formattedValue }}
        </span>
      </div>
      
      <!-- 模式指示器 -->
      <div class="mode-indicator">
        <span class="mode-badge" :class="mode">
          {{ mode === 'scientific' ? 'SCI' : 'STD' }}
        </span>
        <span v-if="hasMemory" class="memory-indicator">M</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue'

interface Props {
  value: string
  expression: string
  history: Array<{ expression: string; result: string }>
  mode: 'standard' | 'scientific'
}

interface Emits {
  (e: 'clear-history'): void
  (e: 'select-history', item: { expression: string; result: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showHistory = ref(false)

// 计算属性
const formattedValue = computed(() => {
  if (props.value === 'Error') {
    return 'Error'
  }
  
  const num = parseFloat(props.value)
  if (isNaN(num)) {
    return props.value
  }
  
  // 格式化数字显示
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
    // 科学计数法
    return num.toExponential(6)
  } else if (Number.isInteger(num)) {
    // 整数
    return num.toLocaleString()
  } else {
    // 小数
    const formatted = num.toFixed(10).replace(/\.?0+$/, '')
    return parseFloat(formatted).toLocaleString()
  }
})

const isError = computed(() => {
  return props.value === 'Error'
})

const hasMemory = computed(() => {
  // 这里应该从父组件传入内存状态，简化处理
  return false
})

// 方法
function toggleHistory() {
  showHistory.value = !showHistory.value
}

function selectHistoryItem(item: { expression: string; result: string }) {
  emit('select-history', item)
  showHistory.value = false
}
</script>

<style scoped>
.calculator-display {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.history-toggle {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.history-toggle:hover,
.history-toggle.active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.history-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 0 0 16px 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.clear-history-btn {
  background: rgba(255, 59, 48, 0.2);
  border: none;
  border-radius: 6px;
  color: #ff3b30;
  padding: 6px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-history-btn:hover {
  background: rgba(255, 59, 48, 0.3);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.history-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.history-item:last-child {
  border-bottom: none;
}

.history-expression {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.history-result {
  font-size: 16px;
  font-weight: 600;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
  font-style: italic;
}

.display-main {
  position: relative;
  z-index: 1;
}

.expression-display {
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 8px;
  text-align: right;
  min-height: 20px;
  word-break: break-all;
}

.result-display {
  text-align: right;
  margin-bottom: 12px;
}

.result-value {
  font-size: 36px;
  font-weight: 300;
  line-height: 1.2;
  word-break: break-all;
  transition: color 0.3s ease;
}

.result-value.error {
  color: #ff3b30;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.mode-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mode-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.mode-badge.scientific {
  background: rgba(90, 200, 250, 0.3);
}

.memory-indicator {
  background: rgba(52, 199, 89, 0.3);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

/* 滚动条样式 */
.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 320px) {
  .calculator-display {
    padding: 16px;
    min-height: 100px;
  }
  
  .result-value {
    font-size: 28px;
  }
  
  .expression-display {
    font-size: 14px;
  }
  
  .history-header h4 {
    font-size: 14px;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .calculator-display {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }
  
  .history-panel {
    background: rgba(0, 0, 0, 0.98);
  }
}
</style>