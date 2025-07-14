<template>
  <div class="calculator">
    <!-- 显示屏 -->
    <CalculatorDisplay 
      :value="display"
      :expression="expression"
      :history="history"
      :mode="mode"
      @clear-history="clearHistory"
    />

    <!-- 按键区域 -->
    <div class="calculator-keypad">
      <!-- 科学计算器额外按键 -->
      <div v-if="mode === 'scientific'" class="scientific-row">
        <button @click="handleFunction('sin')" class="btn btn-function">sin</button>
        <button @click="handleFunction('cos')" class="btn btn-function">cos</button>
        <button @click="handleFunction('tan')" class="btn btn-function">tan</button>
        <button @click="handleFunction('log')" class="btn btn-function">log</button>
        <button @click="handleFunction('ln')" class="btn btn-function">ln</button>
      </div>

      <div v-if="mode === 'scientific'" class="scientific-row">
        <button @click="handleFunction('sqrt')" class="btn btn-function">√</button>
        <button @click="handleOperator('^')" class="btn btn-function">x^y</button>
        <button @click="handleFunction('factorial')" class="btn btn-function">x!</button>
        <button @click="handleConstant('pi')" class="btn btn-function">π</button>
        <button @click="handleConstant('e')" class="btn btn-function">e</button>
      </div>

      <!-- 内存操作行 -->
      <div class="memory-row">
        <button @click="memoryRecall" class="btn btn-memory" :disabled="memory === 0">MR</button>
        <button @click="memoryClear" class="btn btn-memory" :disabled="memory === 0">MC</button>
        <button @click="memoryAdd" class="btn btn-memory">M+</button>
        <button @click="memorySubtract" class="btn btn-memory">M-</button>
        <button @click="memoryStore" class="btn btn-memory">MS</button>
      </div>

      <!-- 第一行 -->
      <div class="keypad-row">
        <button @click="clearAll" class="btn btn-clear">AC</button>
        <button @click="clearEntry" class="btn btn-clear">CE</button>
        <button @click="backspace" class="btn btn-clear">⌫</button>
        <button @click="handleOperator('/')" class="btn btn-operator">÷</button>
      </div>

      <!-- 第二行 -->
      <div class="keypad-row">
        <button @click="handleNumber('7')" class="btn btn-number">7</button>
        <button @click="handleNumber('8')" class="btn btn-number">8</button>
        <button @click="handleNumber('9')" class="btn btn-number">9</button>
        <button @click="handleOperator('*')" class="btn btn-operator">×</button>
      </div>

      <!-- 第三行 -->
      <div class="keypad-row">
        <button @click="handleNumber('4')" class="btn btn-number">4</button>
        <button @click="handleNumber('5')" class="btn btn-number">5</button>
        <button @click="handleNumber('6')" class="btn btn-number">6</button>
        <button @click="handleOperator('-')" class="btn btn-operator">-</button>
      </div>

      <!-- 第四行 -->
      <div class="keypad-row">
        <button @click="handleNumber('1')" class="btn btn-number">1</button>
        <button @click="handleNumber('2')" class="btn btn-number">2</button>
        <button @click="handleNumber('3')" class="btn btn-number">3</button>
        <button @click="handleOperator('+')" class="btn btn-operator">+</button>
      </div>

      <!-- 第五行 -->
      <div class="keypad-row">
        <button @click="toggleSign" class="btn btn-number">±</button>
        <button @click="handleNumber('0')" class="btn btn-number">0</button>
        <button @click="handleDecimal" class="btn btn-number">.</button>
        <button @click="calculate" class="btn btn-equals">=</button>
      </div>
    </div>

    <!-- 模式切换 -->
    <div class="mode-toggle">
      <button 
        @click="toggleMode" 
        class="btn btn-mode"
        :title="mode === 'standard' ? '切换到科学模式' : '切换到标准模式'"
      >
        {{ mode === 'standard' ? 'SCI' : 'STD' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppSDK } from '@/sdk'
import CalculatorDisplay from './components/CalculatorDisplay.vue'
import { CalculatorEngine } from './utils/calculatorEngine'

// 使用应用 SDK
const sdk = useAppSDK()

// 响应式数据
const display = ref('0')
const expression = ref('')
const history = ref<Array<{ expression: string; result: string }>>([])
const memory = ref(0)
const mode = ref<'standard' | 'scientific'>('standard')
const isNewNumber = ref(true)
const lastOperator = ref('')
const lastOperand = ref('')

// 计算引擎
const calculator = new CalculatorEngine()

// 组件挂载时的初始化
onMounted(async () => {
  // 加载保存的数据
  await loadData()
  
  // 设置键盘监听
  document.addEventListener('keydown', handleKeyboard)
  
  // 设置菜单处理
  setupMenuHandlers()
  
  // 设置快捷键
  setupShortcuts()
})

// 组件卸载时的清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
  saveData()
})

// 数字输入处理
function handleNumber(num: string) {
  if (isNewNumber.value) {
    display.value = num
    isNewNumber.value = false
  } else {
    if (display.value === '0') {
      display.value = num
    } else {
      display.value += num
    }
  }
}

// 小数点处理
function handleDecimal() {
  if (isNewNumber.value) {
    display.value = '0.'
    isNewNumber.value = false
  } else if (!display.value.includes('.')) {
    display.value += '.'
  }
}

// 运算符处理
function handleOperator(operator: string) {
  try {
    const currentValue = parseFloat(display.value)
    
    if (expression.value && !isNewNumber.value) {
      calculate()
    }
    
    expression.value = display.value + ' ' + getOperatorSymbol(operator) + ' '
    lastOperator.value = operator
    lastOperand.value = display.value
    isNewNumber.value = true
  } catch (error) {
    showError('运算符错误')
  }
}

// 计算结果
function calculate() {
  try {
    if (!expression.value) {
      // 重复上次运算
      if (lastOperator.value && lastOperand.value) {
        const expr = display.value + ' ' + getOperatorSymbol(lastOperator.value) + ' ' + lastOperand.value
        const result = calculator.evaluate(expr)
        addToHistory(expr, result.toString())
        display.value = result.toString()
      }
      return
    }
    
    const fullExpression = expression.value + display.value
    const result = calculator.evaluate(fullExpression)
    
    addToHistory(fullExpression, result.toString())
    display.value = result.toString()
    expression.value = ''
    isNewNumber.value = true
    
  } catch (error) {
    showError('计算错误')
  }
}

// 函数计算（科学计算器）
function handleFunction(func: string) {
  try {
    const value = parseFloat(display.value)
    let result: number
    
    switch (func) {
      case 'sin':
        result = Math.sin(value * Math.PI / 180)
        break
      case 'cos':
        result = Math.cos(value * Math.PI / 180)
        break
      case 'tan':
        result = Math.tan(value * Math.PI / 180)
        break
      case 'log':
        result = Math.log10(value)
        break
      case 'ln':
        result = Math.log(value)
        break
      case 'sqrt':
        result = Math.sqrt(value)
        break
      case 'factorial':
        result = factorial(value)
        break
      default:
        throw new Error('未知函数')
    }
    
    const expr = `${func}(${value})`
    addToHistory(expr, result.toString())
    display.value = result.toString()
    isNewNumber.value = true
    
  } catch (error) {
    showError('函数计算错误')
  }
}

// 常数处理
function handleConstant(constant: string) {
  let value: number
  
  switch (constant) {
    case 'pi':
      value = Math.PI
      break
    case 'e':
      value = Math.E
      break
    default:
      return
  }
  
  display.value = value.toString()
  isNewNumber.value = true
}

// 内存操作
function memoryRecall() {
  display.value = memory.value.toString()
  isNewNumber.value = true
}

function memoryClear() {
  memory.value = 0
}

function memoryAdd() {
  memory.value += parseFloat(display.value)
}

function memorySubtract() {
  memory.value -= parseFloat(display.value)
}

function memoryStore() {
  memory.value = parseFloat(display.value)
}

// 清除操作
function clearAll() {
  display.value = '0'
  expression.value = ''
  isNewNumber.value = true
  lastOperator.value = ''
  lastOperand.value = ''
}

function clearEntry() {
  display.value = '0'
  isNewNumber.value = true
}

function backspace() {
  if (display.value.length > 1) {
    display.value = display.value.slice(0, -1)
  } else {
    display.value = '0'
    isNewNumber.value = true
  }
}

// 正负号切换
function toggleSign() {
  if (display.value !== '0') {
    if (display.value.startsWith('-')) {
      display.value = display.value.substring(1)
    } else {
      display.value = '-' + display.value
    }
  }
}

// 模式切换
function toggleMode() {
  mode.value = mode.value === 'standard' ? 'scientific' : 'standard'
  saveData()
}

// 历史记录
function addToHistory(expr: string, result: string) {
  history.value.unshift({ expression: expr, result })
  if (history.value.length > 50) {
    history.value = history.value.slice(0, 50)
  }
  saveData()
}

function clearHistory() {
  history.value = []
  saveData()
}

// 工具函数
function getOperatorSymbol(operator: string): string {
  const symbols: Record<string, string> = {
    '+': '+',
    '-': '-',
    '*': '×',
    '/': '÷',
    '^': '^'
  }
  return symbols[operator] || operator
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('阶乘只能计算非负整数')
  }
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

function showError(message: string) {
  display.value = 'Error'
  sdk.system.showNotification({
    title: '计算器错误',
    message,
    type: 'error'
  })
  isNewNumber.value = true
}

// 键盘事件处理
function handleKeyboard(event: KeyboardEvent) {
  event.preventDefault()
  
  const key = event.key
  
  if (/[0-9]/.test(key)) {
    handleNumber(key)
  } else if (key === '.') {
    handleDecimal()
  } else if (['+', '-', '*', '/'].includes(key)) {
    handleOperator(key)
  } else if (key === 'Enter' || key === '=') {
    calculate()
  } else if (key === 'Escape') {
    clearAll()
  } else if (key === 'Backspace') {
    backspace()
  }
}

// 菜单处理
function setupMenuHandlers() {
  // 这里可以设置菜单事件处理
  // sdk.menu.on('copy', copyResult)
  // sdk.menu.on('paste', pasteValue)
  // sdk.menu.on('clearHistory', clearHistory)
  // sdk.menu.on('setMode', (mode) => { mode.value = mode })
}

// 快捷键设置
function setupShortcuts() {
  // 这里可以设置快捷键
  // sdk.shortcuts.register('Ctrl+C', copyResult)
  // sdk.shortcuts.register('Escape', clearAll)
}

// 复制结果
async function copyResult() {
  try {
    await sdk.clipboard.writeText(display.value)
    sdk.system.showNotification({
      title: '计算器',
      message: '结果已复制到剪贴板',
      type: 'success'
    })
  } catch (error) {
    showError('复制失败')
  }
}

// 数据持久化
async function saveData() {
  try {
    const data = {
      history: history.value,
      memory: memory.value,
      mode: mode.value
    }
    await sdk.storage.setItem('calculator-data', data)
  } catch (error) {
    console.error('保存数据失败:', error)
  }
}

async function loadData() {
  try {
    const data = await sdk.storage.getItem('calculator-data')
    if (data) {
      history.value = data.history || []
      memory.value = data.memory || 0
      mode.value = data.mode || 'standard'
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}
</script>

<style scoped>
.calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

.calculator-keypad {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scientific-row,
.memory-row,
.keypad-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.keypad-row {
  grid-template-columns: repeat(4, 1fr);
}

.btn {
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-number {
  background: #ffffff;
  color: #333333;
}

.btn-number:hover {
  background: #f8f9fa;
}

.btn-operator {
  background: #007aff;
  color: white;
}

.btn-operator:hover {
  background: #0056b3;
}

.btn-equals {
  background: #ff9500;
  color: white;
}

.btn-equals:hover {
  background: #e6850e;
}

.btn-clear {
  background: #ff3b30;
  color: white;
}

.btn-clear:hover {
  background: #d70015;
}

.btn-function {
  background: #5ac8fa;
  color: white;
  font-size: 14px;
}

.btn-function:hover {
  background: #32ade6;
}

.btn-memory {
  background: #34c759;
  color: white;
  font-size: 14px;
}

.btn-memory:hover:not(:disabled) {
  background: #248a3d;
}

.btn-memory:disabled {
  background: #8e8e93;
  cursor: not-allowed;
  transform: none;
}

.mode-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.btn-mode {
  background: rgba(255, 255, 255, 0.9);
  color: #007aff;
  border: 1px solid #007aff;
  font-size: 12px;
  min-height: 32px;
  padding: 0 12px;
  backdrop-filter: blur(10px);
}

.btn-mode:hover {
  background: #007aff;
  color: white;
}

/* 响应式设计 */
@media (max-width: 320px) {
  .calculator-keypad {
    padding: 12px;
  }
  
  .btn {
    min-height: 40px;
    font-size: 16px;
  }
  
  .btn-function,
  .btn-memory {
    font-size: 12px;
  }
}

/* 科学模式下的布局调整 */
.calculator[data-mode="scientific"] .calculator-keypad {
  gap: 6px;
}

.calculator[data-mode="scientific"] .btn {
  min-height: 40px;
  font-size: 16px;
}
</style>