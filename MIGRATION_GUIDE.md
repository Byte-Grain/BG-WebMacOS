# 配置系统迁移指南

本指南将帮助您从旧的配置系统迁移到新的模块化配置架构。

## 概述

新的配置系统采用模块化设计，将配置分为以下几个主要模块：

- **系统配置** (`src/config/system/`) - 系统基础设置、菜单、快捷键、窗口配置
- **应用配置** (`src/config/apps/`) - 应用注册表、系统应用、演示应用
- **主题配置** (`src/config/theme.config.ts`) - 主题样式和颜色配置
- **环境配置** (`src/config/env.config.ts`) - 环境变量和功能开关

## 迁移步骤

### 1. 更新导入语句

**旧的导入方式：**
```typescript
import { AppConfiguration } from '@/config/app.config'
import { getAppByKey, getDesktopApps } from '@/config/app.config'
```

**新的导入方式：**
```typescript
// 统一导入
import { appRegistry, getAppByKey, getDesktopApps } from '@/config'

// 或者分模块导入
import { appRegistry } from '@/config/apps'
import { systemConfig } from '@/config/system'
import { lightTheme, darkTheme } from '@/config/theme.config'
```

### 2. 应用配置迁移

**旧的应用配置结构：**
```typescript
const appConfig: AppConfiguration = {
  defaultApps: ['app1', 'app2'],
  dockApps: ['app1', 'app3'],
  apps: {
    app1: { /* 配置 */ },
    app2: { /* 配置 */ }
  }
}
```

**新的应用配置结构：**
```typescript
// 应用现在分为系统应用和演示应用
import { systemApps } from '@/config/apps/system-apps'
import { demoApps } from '@/config/apps/demo-apps'

// 通过注册表访问
import { appRegistry } from '@/config/apps/app-registry'
```

### 3. 函数调用更新

**旧的函数调用：**
```typescript
// 获取应用
const app = getAppByKey('demo_demo')

// 获取桌面应用
const desktopApps = getDesktopApps()

// 获取 Dock 应用
const dockApps = getDockApps()
```

**新的函数调用（保持兼容）：**
```typescript
// 函数签名保持不变，但现在返回数组而不是对象
const app = getAppByKey('demo_demo')
const desktopApps = getDesktopApps()
const dockApps = getDockApps()

// 新增的功能
const featuredApps = getFeaturedApps()
const systemApps = getSystemApps()
const searchResults = searchApps('github')
```

### 4. 应用配置属性更新

**新增的应用配置属性：**
```typescript
interface BaseAppConfig {
  // 新增属性
  system?: boolean        // 是否为系统应用
  demo?: boolean         // 是否为演示应用
  essential?: boolean    // 是否为必需应用
  singleton?: boolean    // 是否为单例应用
  featured?: boolean     // 是否为特色应用
  
  // 权限系统
  permissions?: AppPermission[]
  dependencies?: string[]
  
  // 增强的窗口配置
  minWidth?: number
  minHeight?: number
  draggable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  alwaysOnTop?: boolean
  modal?: boolean
  transparent?: boolean
  frame?: boolean
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset'
  
  // 外观增强
  backgroundColor?: string
  opacity?: number
  shadow?: boolean
  animation?: boolean
}
```

### 5. 系统配置迁移

**新的系统配置：**
```typescript
import { systemConfig } from '@/config/system'

// 访问系统配置
console.log(systemConfig.version)
console.log(systemConfig.features.multiLanguage)
console.log(systemConfig.limits.maxOpenWindows)
```

**菜单配置：**
```typescript
import { menuConfig } from '@/config/system'

// 访问菜单配置
const appleMenu = menuConfig.apple
const contextMenu = menuConfig.context
```

**快捷键配置：**
```typescript
import { shortcutConfig } from '@/config/system'

// 访问快捷键配置
const globalShortcuts = shortcutConfig.global
const appShortcuts = shortcutConfig.apps
```

### 6. 窗口配置迁移

**新的窗口配置：**
```typescript
import { windowConfig, WINDOW_PRESETS } from '@/config/system'

// 使用预设尺寸
const appConfig = {
  width: WINDOW_PRESETS.LARGE.width,
  height: WINDOW_PRESETS.LARGE.height
}

// 访问窗口配置
const defaultSize = windowConfig.defaultSize
const animations = windowConfig.animations
```

## 兼容性说明

### 保持兼容的功能

- `getAppByKey()` - 函数签名不变
- `getDesktopApps()` - 函数签名不变
- `getDockApps()` - 函数签名不变
- 基本的应用配置属性（key, title, icon, width, height 等）

### 需要更新的功能

- 应用配置现在返回数组而不是对象
- 新的类型定义需要更新 TypeScript 类型
- 一些高级配置选项的位置发生了变化

## 新功能

### 1. 应用搜索
```typescript
import { searchApps } from '@/config'

const results = searchApps('github')
```

### 2. 应用分类
```typescript
import { getAppsByCategory, appCategories } from '@/config'

const systemApps = getAppsByCategory('system')
const categories = appCategories
```

### 3. 权限系统
```typescript
import { appPermissions } from '@/config'

const permissions = appPermissions.filesystem
```

### 4. 配置验证
```typescript
import { validateAppConfig, configUtils } from '@/config'

const isValid = validateAppConfig(appConfig)
const configStatus = configUtils.validateConfig()
```

### 5. 动态应用管理
```typescript
import { registerApp, unregisterApp, updateAppConfig } from '@/config'

// 注册新应用
registerApp(newAppConfig, 'user')

// 注销应用
unregisterApp('app_key', 'user')

// 更新应用配置
updateAppConfig('app_key', { title: 'New Title' })
```

## 迁移检查清单

- [ ] 更新所有配置相关的导入语句
- [ ] 检查应用配置对象的使用方式（对象 → 数组）
- [ ] 更新 TypeScript 类型定义
- [ ] 测试所有应用功能是否正常
- [ ] 验证菜单和快捷键功能
- [ ] 检查主题切换功能
- [ ] 测试窗口管理功能
- [ ] 验证新的搜索和分类功能

## 故障排除

### 常见问题

1. **导入错误**
   - 确保使用正确的导入路径
   - 检查是否有循环依赖

2. **类型错误**
   - 更新 TypeScript 类型定义
   - 检查新的接口定义

3. **应用不显示**
   - 检查应用配置是否正确
   - 验证应用注册表是否包含该应用

4. **功能异常**
   - 检查配置验证结果
   - 查看控制台错误信息

### 获取帮助

如果在迁移过程中遇到问题，请：

1. 查看配置验证结果：`configUtils.validateConfig()`
2. 检查控制台错误信息
3. 参考新的类型定义文件
4. 查看示例应用配置

## 总结

新的配置系统提供了更好的模块化、类型安全和扩展性。虽然需要一些迁移工作，但大部分核心功能保持兼容，迁移过程应该相对平滑。新系统还提供了许多增强功能，如应用搜索、权限管理和动态配置等。