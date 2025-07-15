# BG-WebMacOS Calculator

一个功能完整的科学计算器应用，专为 BG-WebMacOS 平台开发。

## 📱 功能特性

### 🧮 基础计算
- 四则运算（加、减、乘、除）
- 小数点运算
- 正负号切换
- 清除功能（AC/CE）
- 退格删除

### 🔬 科学计算
- 三角函数（sin、cos、tan）
- 对数函数（log、ln）
- 平方根（√）
- 幂运算（x^y）
- 阶乘（x!）
- 数学常数（π、e）

### 💾 内存功能
- MR（内存读取）
- MC（内存清除）
- M+（内存加法）
- M-（内存减法）
- MS（内存存储）

### 📊 历史记录
- 计算历史查看
- 历史记录重用
- 历史记录清除
- 自动保存（最多100条）

### ⌨️ 键盘支持
- 数字键（0-9）
- 运算符键（+、-、*、/）
- 功能键（Enter、Escape、Backspace）
- 快捷键（Ctrl+C 复制结果）

### 🎨 界面特性
- 现代化 UI 设计
- 响应式布局
- 平滑动画效果
- 错误状态提示
- 模式切换（标准/科学）

## 🚀 安装使用

### 系统要求
- BG-WebMacOS >= 1.0.0
- Node.js >= 16.0.0
- Vue.js >= 3.3.0

### 安装方法

#### 方法一：通过应用商店安装
1. 打开 BG-WebMacOS 应用商店
2. 搜索 "Calculator" 或 "计算器"
3. 点击安装按钮
4. 等待安装完成

#### 方法二：手动安装
1. 下载应用包文件（.bgapp）
2. 双击应用包文件
3. 按照安装向导完成安装

#### 方法三：开发者安装
```bash
# 克隆项目
git clone https://github.com/example/bg-webmacos-calculator.git
cd bg-webmacos-calculator

# 安装依赖
npm install

# 运行安装脚本
npm run install-app
```

## 🎯 使用指南

### 基础操作
1. **数字输入**：点击数字按钮或使用键盘输入
2. **运算操作**：点击运算符按钮或使用键盘快捷键
3. **计算结果**：点击等号按钮或按 Enter 键
4. **清除输入**：点击 AC/CE 按钮或按 Escape 键

### 科学模式
1. 点击右上角的 "SCI" 按钮切换到科学模式
2. 使用额外的科学计算功能
3. 点击 "STD" 按钮返回标准模式

### 内存操作
1. **存储数值**：输入数值后点击 MS 按钮
2. **读取数值**：点击 MR 按钮
3. **内存运算**：使用 M+ 和 M- 进行内存加减
4. **清除内存**：点击 MC 按钮

### 历史记录
1. 点击显示屏左上角的历史按钮
2. 查看之前的计算记录
3. 点击历史项目重用计算结果
4. 点击垃圾桶图标清除历史

### 键盘快捷键
- `0-9`：数字输入
- `+`、`-`、`*`、`/`：基础运算
- `Enter` 或 `=`：计算结果
- `Escape`：清除所有
- `Backspace`：退格删除
- `Ctrl+C`：复制结果
- `Ctrl+V`：粘贴数值
- `Ctrl+Alt+C`：打开计算器

## 🛠️ 开发指南

### 项目结构
```
calculator/
├── src/
│   ├── Calculator.vue          # 主组件
│   ├── components/
│   │   └── CalculatorDisplay.vue # 显示屏组件
│   └── utils/
│       └── calculatorEngine.ts   # 计算引擎
├── assets/
│   ├── icon.svg                # 应用图标
│   └── screenshots/            # 应用截图
├── scripts/
│   ├── install.js              # 安装脚本
│   ├── uninstall.js            # 卸载脚本
│   └── post-install.js         # 安装后脚本
├── app.manifest.json           # 应用清单
├── package.json               # 项目配置
└── README.md                  # 说明文档
```

### 开发环境设置
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 构建和打包
```bash
# 构建生产版本
npm run build

# 创建应用包
npm run package

# 预览构建结果
npm run preview
```

### API 使用

#### 计算引擎 API
```typescript
import { CalculatorEngine } from './utils/calculatorEngine'

const engine = new CalculatorEngine()

// 基础计算
const result = engine.evaluate('2 + 3 * 4') // 14

// 科学计算
const sinResult = engine.evaluate('sin(30)') // 0.5

// 验证表达式
const validation = engine.validateExpression('2 + 3')
if (validation.valid) {
  // 表达式有效
}
```

#### 应用 SDK API
```typescript
import { useAppSDK } from '@/sdk'

const sdk = useAppSDK()

// 系统通知
await sdk.system.showNotification({
  title: '计算器',
  message: '计算完成',
  type: 'success'
})

// 剪贴板操作
await sdk.clipboard.writeText(result)

// 本地存储
await sdk.storage.setItem('calculator-data', data)
const data = await sdk.storage.getItem('calculator-data')
```

### 自定义配置

#### 主题配置
```json
{
  "theme": {
    "primary": "#007aff",
    "secondary": "#5ac8fa",
    "background": "#f5f5f5",
    "text": "#333333"
  }
}
```

#### 功能配置
```json
{
  "features": {
    "scientific": true,
    "history": true,
    "memory": true,
    "keyboard": true
  }
}
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行测试并显示覆盖率
npm run test -- --coverage

# 运行测试 UI
npm run test:ui
```

### 测试覆盖
- 单元测试：计算引擎功能
- 组件测试：UI 组件交互
- 集成测试：完整计算流程
- E2E 测试：用户操作场景

## 📦 发布

### 版本管理
```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 发布到应用商店
```bash
# 构建发布版本
npm run build

# 创建应用包
npm run package

# 发布到商店
npm publish
```

## 🐛 问题排查

### 常见问题

**Q: 计算结果不准确**
A: 检查输入表达式格式，确保运算符和操作数正确

**Q: 科学计算功能无法使用**
A: 确认已切换到科学模式，检查角度单位设置

**Q: 历史记录不显示**
A: 检查本地存储权限，确认数据保存功能正常

**Q: 键盘输入无响应**
A: 确认应用窗口处于焦点状态，检查键盘事件监听

### 调试模式
```bash
# 启用调试模式
DEBUG=calculator npm run dev

# 查看详细日志
DEBUG=calculator:* npm run dev
```

## 🤝 贡献指南

### 贡献流程
1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint 和 Prettier 进行代码格式化
- 编写单元测试覆盖新功能
- 更新相关文档

### 提交规范
```
type(scope): description

[optional body]

[optional footer]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [BG-WebMacOS](https://github.com/BG-WebMacOS) - 优秀的 Web 桌面系统
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📞 联系方式

- 作者：Third Party Developer
- 邮箱：developer@example.com
- 项目主页：https://example.com/calculator
- 问题反馈：https://github.com/example/bg-webmacos-calculator/issues

---

**享受使用 BG-WebMacOS Calculator！** 🎉