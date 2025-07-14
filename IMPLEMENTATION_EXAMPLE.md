# 第三方应用开发实现示例

本文档展示如何基于新架构开发一个第三方应用，以一个简单的计算器应用为例。

## 1. 应用包结构

```
calculator-app/
├── app.manifest.json           # 应用清单
├── src/
│   ├── Calculator.vue          # 主组件
│   ├── components/
│   │   ├── Display.vue         # 显示屏组件
│   │   └── Keypad.vue          # 键盘组件
│   ├── utils/
│   │   └── calculator.ts       # 计算逻辑
│   └── styles/
│       └── calculator.scss     # 样式文件
├── public/
│   └── calculator-icon.svg     # 应用图标
├── scripts/
│   ├── install.js              # 安装脚本
│   └── uninstall.js            # 卸载脚本
└── README.md
```

## 2. 应用清单文件

```json
{
  "name": "Calculator",
  "key": "third_party_calculator",
  "version": "1.0.0",
  "description": "一个功能完整的科学计算器应用",
  "author": "Third Party Developer",
  "homepage": "https://github.com/developer/calculator-app",
  "repository": "https://github.com/developer/calculator-app.git",
  
  "type": "component",
  "entry": "src/Calculator.vue",
  "icon": "public/calculator-icon.svg",
  "category": "utilities",
  "tags": ["calculator", "math", "utility"],
  
  "window": {
    "width": 320,
    "height": 480,
    "minWidth": 280,
    "minHeight": 400,
    "resizable": true,
    "maximizable": false,
    "minimizable": true,
    "closable": true
  },
  
  "permissions": [
    "storage"
  ],
  
  "dependencies": {
    "framework": ">=1.0.0",
    "apis": ["storage", "notification"]
  },
  
  "lifecycle": {
    "install": "scripts/install.js",
    "uninstall": "scripts/uninstall.js"
  }
}
```

## 3. 主组件实现

```vue
<!-- src/Calculator.vue -->
<template>
  <div class="calculator">
    <Display :value="displayValue" :history="history" />
    <Keypad @input="handleInput" @operation="handleOperation" @calculate="calculate" @clear="clear" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Display from './components/Display.vue'
import Keypad from './components/Keypad.vue'
import { Calculator as CalcEngine } from './utils/calculator'
import { useAppSDK } from '@bg-webmacos/sdk'

// 使用应用 SDK
const sdk = useAppSDK()

// 响应式数据
const displayValue = ref('0')
const history = ref<string[]>([])
const calculator = new CalcEngine()

// 组件挂载时的初始化
onMounted(async () => {
  // 从本地存储恢复历史记录
  try {
    const savedHistory = await sdk.storage.get('calculator_history')
    if (savedHistory) {
      history.value = savedHistory
    }
  } catch (error) {
    console.warn('Failed to load calculator history:', error)
  }
  
  // 设置窗口标题
  sdk.window.setTitle('计算器')
})

// 组件卸载时保存数据
onUnmounted(async () => {
  try {
    await sdk.storage.set('calculator_history', history.value)
  } catch (error) {
    console.warn('Failed to save calculator history:', error)
  }
})

// 处理数字输入
const handleInput = (value: string) => {
  if (displayValue.value === '0' || calculator.shouldResetDisplay) {
    displayValue.value = value
    calculator.shouldResetDisplay = false
  } else {
    displayValue.value += value
  }
}

// 处理运算符
const handleOperation = (operation: string) => {
  calculator.setOperation(operation, parseFloat(displayValue.value))
  displayValue.value = calculator.getDisplayValue()
}

// 执行计算
const calculate = () => {
  const result = calculator.calculate(parseFloat(displayValue.value))
  displayValue.value = result.toString()
  
  // 添加到历史记录
  const expression = calculator.getLastExpression()
  if (expression) {
    history.value.unshift(`${expression} = ${result}`)
    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value = history.value.slice(0, 50)
    }
  }
  
  // 显示通知（如果有权限）
  if (sdk.system.hasPermission('notification')) {
    sdk.system.showNotification({
      title: '计算完成',
      body: `结果: ${result}`,
      duration: 2000
    })
  }
}

// 清除
const clear = () => {
  displayValue.value = '0'
  calculator.clear()
}
</script>

<style scoped lang="scss">
.calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}
</style>
```

## 4. 显示屏组件

```vue
<!-- src/components/Display.vue -->
<template>
  <div class="display">
    <div class="history" v-if="showHistory">
      <div v-for="(item, index) in history.slice(0, 3)" :key="index" class="history-item">
        {{ item }}
      </div>
    </div>
    <div class="current-value">
      {{ formattedValue }}
    </div>
    <button class="history-toggle" @click="toggleHistory">
      <i class="icon-history"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  value: string
  history: string[]
}

const props = defineProps<Props>()
const showHistory = ref(false)

// 格式化显示值
const formattedValue = computed(() => {
  const num = parseFloat(props.value)
  if (isNaN(num)) return props.value
  
  // 大数字使用科学计数法
  if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6)
  }
  
  // 添加千分位分隔符
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 10 })
})

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}
</script>

<style scoped lang="scss">
.display {
  position: relative;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  
  .history {
    position: absolute;
    top: 10px;
    left: 20px;
    right: 50px;
    opacity: 0.7;
    font-size: 12px;
    
    .history-item {
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .current-value {
    font-size: 36px;
    font-weight: 300;
    text-align: right;
    word-break: break-all;
    line-height: 1.2;
  }
  
  .history-toggle {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: white;
    opacity: 0.7;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    
    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
```

## 5. 计算引擎

```typescript
// src/utils/calculator.ts
export class Calculator {
  private currentValue: number = 0
  private previousValue: number = 0
  private operation: string | null = null
  private lastExpression: string = ''
  public shouldResetDisplay: boolean = false

  setOperation(op: string, value: number) {
    if (this.operation && !this.shouldResetDisplay) {
      this.calculate(value)
    } else {
      this.previousValue = value
    }
    
    this.operation = op
    this.shouldResetDisplay = true
  }

  calculate(value: number): number {
    this.currentValue = value
    let result: number

    switch (this.operation) {
      case '+':
        result = this.previousValue + this.currentValue
        break
      case '-':
        result = this.previousValue - this.currentValue
        break
      case '×':
        result = this.previousValue * this.currentValue
        break
      case '÷':
        if (this.currentValue === 0) {
          throw new Error('除数不能为零')
        }
        result = this.previousValue / this.currentValue
        break
      case '%':
        result = this.previousValue % this.currentValue
        break
      case '^':
        result = Math.pow(this.previousValue, this.currentValue)
        break
      default:
        result = this.currentValue
    }

    // 记录表达式
    if (this.operation) {
      this.lastExpression = `${this.previousValue} ${this.operation} ${this.currentValue}`
    }

    this.previousValue = result
    this.operation = null
    this.shouldResetDisplay = true

    return result
  }

  clear() {
    this.currentValue = 0
    this.previousValue = 0
    this.operation = null
    this.lastExpression = ''
    this.shouldResetDisplay = false
  }

  getDisplayValue(): string {
    return this.previousValue.toString()
  }

  getLastExpression(): string {
    return this.lastExpression
  }
}
```

## 6. 安装脚本

```javascript
// scripts/install.js
module.exports = async function install(sdk) {
  console.log('Installing Calculator App...')
  
  try {
    // 创建应用数据目录
    await sdk.file.createDirectory('/apps/calculator')
    
    // 初始化配置
    await sdk.storage.set('calculator_config', {
      theme: 'dark',
      precision: 10,
      showHistory: true
    })
    
    // 注册快捷键
    await sdk.system.registerShortcut('Cmd+Shift+C', 'third_party_calculator')
    
    console.log('Calculator App installed successfully!')
    return { success: true }
  } catch (error) {
    console.error('Failed to install Calculator App:', error)
    return { success: false, error: error.message }
  }
}
```

## 7. 卸载脚本

```javascript
// scripts/uninstall.js
module.exports = async function uninstall(sdk) {
  console.log('Uninstalling Calculator App...')
  
  try {
    // 清理应用数据
    await sdk.storage.remove('calculator_history')
    await sdk.storage.remove('calculator_config')
    
    // 删除应用目录
    await sdk.file.removeDirectory('/apps/calculator')
    
    // 注销快捷键
    await sdk.system.unregisterShortcut('Cmd+Shift+C')
    
    console.log('Calculator App uninstalled successfully!')
    return { success: true }
  } catch (error) {
    console.error('Failed to uninstall Calculator App:', error)
    return { success: false, error: error.message }
  }
}
```

## 8. 开发与构建

### 开发环境设置

```bash
# 安装 CLI 工具
npm install -g @bg-webmacos/cli

# 创建新应用
bg-webmacos create calculator-app
cd calculator-app

# 安装依赖
npm install

# 开发模式
npm run dev
```

### 构建与发布

```bash
# 构建应用包
npm run build

# 验证应用包
bg-webmacos validate dist/calculator-app.bgapp

# 发布到应用商店
bg-webmacos publish dist/calculator-app.bgapp
```

## 9. 测试

```typescript
// tests/calculator.test.ts
import { Calculator } from '../src/utils/calculator'

describe('Calculator', () => {
  let calc: Calculator

  beforeEach(() => {
    calc = new Calculator()
  })

  test('should add numbers correctly', () => {
    calc.setOperation('+', 5)
    const result = calc.calculate(3)
    expect(result).toBe(8)
  })

  test('should handle division by zero', () => {
    calc.setOperation('÷', 5)
    expect(() => calc.calculate(0)).toThrow('除数不能为零')
  })

  test('should clear state', () => {
    calc.setOperation('+', 5)
    calc.calculate(3)
    calc.clear()
    expect(calc.getDisplayValue()).toBe('0')
  })
})
```

## 10. 部署与分发

### 应用商店发布

1. **准备发布材料**
   - 应用包文件 (.bgapp)
   - 应用截图
   - 详细描述
   - 版本更新日志

2. **提交审核**
   - 上传到应用商店
   - 等待审核通过
   - 发布到用户

### 直接安装

```typescript
// 用户可以直接安装应用包
const installApp = async (packageFile: File) => {
  const installer = new AppInstallerService()
  const result = await installer.installApp(packageFile)
  
  if (result.success) {
    console.log('应用安装成功!')
  } else {
    console.error('安装失败:', result.error)
  }
}
```

## 总结

这个示例展示了如何基于新架构开发一个完整的第三方应用：

1. **标准化结构**：遵循应用包标准，便于管理和分发
2. **权限控制**：明确声明所需权限，确保安全性
3. **SDK 集成**：使用官方 SDK，简化开发流程
4. **生命周期管理**：完整的安装、运行、卸载流程
5. **测试覆盖**：确保应用质量和稳定性

通过这种方式，第三方开发者可以专注于应用逻辑的实现，而不需要关心底层的系统集成细节，真正实现了框架与应用的隔离。