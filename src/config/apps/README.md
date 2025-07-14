# WebMacOS 应用配置系统

## 概述

WebMacOS 应用配置系统支持两种配置方式：
1. **TypeScript 配置**：传统的 TypeScript 文件配置方式
2. **JSON 配置**：新的 JSON 文件配置方式（推荐）

## JSON 配置系统

### 特性

- ✅ **类型安全**：完整的 JSON Schema 验证
- ✅ **热重载**：支持配置文件的动态重新加载
- ✅ **向后兼容**：自动回退到 TypeScript 配置
- ✅ **可视化管理**：内置配置管理器界面
- ✅ **导入导出**：支持配置文件的导入和导出
- ✅ **验证机制**：实时配置验证和错误提示

### 文件结构

```
src/config/apps/
├── apps.json                 # 主配置文件
├── app-config.schema.json    # JSON Schema 验证文件
├── json-config-loader.ts     # JSON 配置加载器
├── app-registry.ts           # 应用注册表（已集成 JSON 支持）
└── README.md                 # 本文档
```

### 配置文件格式

#### apps.json 结构

```json
{
  "$schema": "./app-config.schema.json",
  "version": "2.0.0",
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "description": "WebMacOS 应用配置文件",
  "system": {
    "app_key": {
      "key": "app_key",
      "system": true,
      "essential": false,
      "singleton": true,
      "component": "ComponentName",
      "title": "应用标题",
      "icon": "🎯",
      "iconColor": "#fff",
      "iconBgColor": "#007AFF",
      "width": 800,
      "height": 600,
      "category": "system",
      "description": "应用描述",
      "version": "1.0.0",
      "author": "作者",
      "permissions": ["system"]
    }
  },
  "demo": {
    // 演示应用配置
  },
  "user": {
    // 用户应用配置
  },
  "defaults": {
    // 默认配置值
  }
}
```

### 应用类型

#### 1. 系统应用 (SystemAppConfig)

```json
{
  "key": "system_example",
  "system": true,
  "essential": false,
  "singleton": true,
  "component": "SystemExample",
  "title": "系统示例",
  "icon": "⚙️",
  "category": "system"
}
```

**特有属性：**
- `system`: 必须为 `true`
- `essential`: 是否为必需应用
- `singleton`: 是否为单例应用

#### 2. 演示应用 (DemoAppConfig)

```json
{
  "key": "demo_example",
  "demo": true,
  "featured": true,
  "component": "DemoExample",
  "title": "演示示例",
  "icon": "🎮",
  "category": "entertainment"
}
```

**特有属性：**
- `demo`: 必须为 `true`
- `featured`: 是否为特色应用

#### 3. 外部链接应用

```json
{
  "key": "external_example",
  "outLink": true,
  "title": "外部链接",
  "icon": "🔗",
  "url": "https://example.com",
  "target": "_blank"
}
```

#### 4. 内嵌网页应用

```json
{
  "key": "web_example",
  "innerLink": true,
  "title": "内嵌网页",
  "icon": "🌐",
  "url": "https://example.com",
  "sandbox": true,
  "allowScripts": false
}
```

### 配置属性说明

#### 基础属性

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `key` | string | ✅ | 唯一应用标识符 |
| `title` | string | ✅ | 应用显示名称 |
| `icon` | string | ✅ | 应用图标（CSS类或emoji） |
| `component` | string | ⚠️ | Vue组件名称（本地组件必需） |
| `description` | string | ❌ | 应用描述 |
| `version` | string | ❌ | 应用版本 |
| `author` | string | ❌ | 应用作者 |
| `category` | string | ❌ | 应用分类 |

#### 窗口属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `width` | number/string | 800 | 窗口宽度 |
| `height` | number/string | 600 | 窗口高度 |
| `minWidth` | number | 100 | 最小宽度 |
| `minHeight` | number | 100 | 最小高度 |
| `maxWidth` | number | - | 最大宽度 |
| `maxHeight` | number | - | 最大高度 |
| `x` | number | - | 初始X位置 |
| `y` | number | - | 初始Y位置 |

#### 行为属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `resizable` | boolean | true | 是否可调整大小 |
| `draggable` | boolean | true | 是否可拖拽 |
| `closable` | boolean | true | 是否可关闭 |
| `minimizable` | boolean | true | 是否可最小化 |
| `maximizable` | boolean | true | 是否可最大化 |
| `hideInDesktop` | boolean | false | 是否在桌面隐藏 |
| `keepInDock` | boolean | false | 是否保持在Dock |

#### 样式属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `iconColor` | string | 图标颜色 |
| `iconBgColor` | string | 图标背景色 |
| `backgroundColor` | string | 窗口背景色 |
| `opacity` | number | 窗口透明度 (0-1) |
| `shadow` | boolean | 是否显示阴影 |

#### 权限和标签

| 属性 | 类型 | 描述 |
|------|------|------|
| `permissions` | string[] | 所需权限列表 |
| `tags` | string[] | 应用标签 |
| `dependencies` | string[] | 依赖列表 |

### 权限类型

- `filesystem`: 文件系统访问
- `network`: 网络访问
- `camera`: 摄像头访问
- `microphone`: 麦克风访问
- `location`: 位置信息
- `notifications`: 通知权限
- `clipboard`: 剪贴板访问
- `fullscreen`: 全屏权限
- `storage`: 存储权限
- `system`: 系统权限

### 应用分类

- `system`: 系统应用
- `productivity`: 生产力工具
- `entertainment`: 娱乐应用
- `development`: 开发工具
- `graphics`: 图形设计
- `utilities`: 实用工具
- `games`: 游戏
- `education`: 教育应用
- `business`: 商务应用
- `social`: 社交应用
- `other`: 其他

## 使用方法

### 1. 启用 JSON 配置

在 `app-registry.ts` 中设置：

```typescript
const USE_JSON_CONFIG = true
```

### 2. 编辑配置文件

直接编辑 `apps.json` 文件，IDE 会根据 JSON Schema 提供自动补全和验证。

### 3. 使用配置管理器

1. 启动应用
2. 在桌面找到「配置管理器」应用
3. 双击打开配置管理器
4. 查看、验证、导出配置

### 4. 添加新应用

```json
{
  "my_new_app": {
    "key": "my_new_app",
    "title": "我的新应用",
    "icon": "🚀",
    "component": "MyNewApp",
    "width": 800,
    "height": 600,
    "category": "productivity",
    "description": "这是一个新应用",
    "version": "1.0.0",
    "author": "我"
  }
}
```

### 5. 注册 Vue 组件

在 `App.vue` 中添加组件映射：

```javascript
const MyNewApp = defineAsyncComponent(() => import('@/components/apps/MyNewApp.vue'))

const componentMap = {
  // ... 其他组件
  MyNewApp
}
```

## API 参考

### 配置加载器

```typescript
import { 
  loadAppsFromJson, 
  validateJsonConfig, 
  getConfigStats 
} from '@/config/apps/json-config-loader'

// 加载应用配置
const apps = loadAppsFromJson()

// 验证配置
const isValid = validateJsonConfig()

// 获取统计信息
const stats = getConfigStats()
```

### 应用注册表

```typescript
import { 
  getAllApps,
  getSystemApps,
  getDemoApps,
  getUserApps,
  getAppByKey,
  registerApp,
  unregisterApp,
  updateAppConfig,
  reloadConfig,
  getConfigInfo
} from '@/config/apps/app-registry'

// 获取所有应用
const allApps = getAllApps()

// 根据key获取应用
const app = getAppByKey('my_app')

// 注册新应用
registerApp(appConfig, 'user')

// 重新加载配置
reloadConfig()

// 获取配置信息
const info = getConfigInfo()
```

## 最佳实践

### 1. 配置组织

- 按功能分组应用
- 使用有意义的 key 命名
- 保持配置文件整洁

### 2. 图标使用

- 优先使用 emoji 图标（跨平台兼容）
- CSS 类图标需要确保样式文件已加载
- 保持图标风格一致

### 3. 权限管理

- 只申请必要的权限
- 在应用描述中说明权限用途
- 定期审查权限使用情况

### 4. 版本控制

- 使用语义化版本号
- 记录配置文件的变更历史
- 定期备份配置文件

### 5. 性能优化

- 使用 `hideInDesktop` 隐藏不常用应用
- 合理设置 `singleton` 属性
- 避免过大的默认窗口尺寸

## 故障排除

### 常见问题

1. **应用不显示**
   - 检查 JSON 语法是否正确
   - 验证应用配置是否完整
   - 确认组件是否已注册

2. **配置验证失败**
   - 使用配置管理器检查错误
   - 对照 JSON Schema 检查格式
   - 查看浏览器控制台错误信息

3. **组件加载失败**
   - 确认组件文件路径正确
   - 检查组件是否在 `componentMap` 中注册
   - 验证组件语法是否正确

### 调试技巧

1. 使用配置管理器的验证功能
2. 查看浏览器控制台的错误信息
3. 使用 `getConfigInfo()` 获取配置状态
4. 临时切换到 TypeScript 配置进行对比

## 迁移指南

### 从 TypeScript 配置迁移

1. 使用配置管理器导出当前配置
2. 将导出的 JSON 文件保存为 `apps.json`
3. 设置 `USE_JSON_CONFIG = true`
4. 重启应用并验证配置

### 配置文件升级

当 JSON Schema 更新时：

1. 备份当前配置文件
2. 使用配置管理器验证配置
3. 根据错误提示更新配置
4. 重新验证并测试

## 贡献指南

欢迎为 JSON 配置系统贡献代码：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test
```

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。