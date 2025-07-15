# BG-WebMacOS 应用开发指南

本指南将帮助第三方开发者为 BG-WebMacOS 平台开发和部署应用程序。

## 📋 目录

1. [概述](#概述)
2. [开发环境准备](#开发环境准备)
3. [应用架构](#应用架构)
4. [应用清单](#应用清单)
5. [核心 API](#核心-api)
6. [组件开发](#组件开发)
7. [生命周期管理](#生命周期管理)
8. [权限系统](#权限系统)
9. [数据存储](#数据存储)
10. [应用打包](#应用打包)
11. [应用商店发布](#应用商店发布)
12. [最佳实践](#最佳实践)
13. [示例应用](#示例应用)
14. [常见问题](#常见问题)

## 🎯 概述

BG-WebMacOS 是一个基于 Web 技术的桌面操作系统模拟器，支持第三方应用的开发和部署。开发者可以使用 Vue.js、React 或原生 JavaScript 开发应用，并通过应用商店或手动安装的方式部署到系统中。

### 核心特性

- **框架无关**：支持 Vue.js、React、原生 JavaScript 等
- **沙箱隔离**：应用运行在独立的沙箱环境中
- **权限管理**：细粒度的权限控制系统
- **生命周期**：完整的应用生命周期管理
- **API 丰富**：提供系统级 API 和工具函数
- **热更新**：支持应用的热更新和版本管理

### 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **UI 组件**：Element Plus
- **包管理**：npm/yarn/pnpm

## 🛠️ 开发环境准备

### 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- Git >= 2.0.0
- 现代浏览器（Chrome 90+、Firefox 88+、Safari 14+）

### 开发工具推荐

- **IDE**：VS Code、WebStorm
- **插件**：Vue Language Features (Volar)、TypeScript Hero
- **调试**：Vue DevTools、Chrome DevTools
- **版本控制**：Git、GitHub Desktop

### 项目初始化

```bash
# 创建新应用项目
mkdir my-bg-app
cd my-bg-app

# 初始化 package.json
npm init -y

# 安装依赖
npm install vue@^3.3.0
npm install -D @vitejs/plugin-vue vite typescript

# 创建基础文件结构
mkdir src assets scripts
touch src/App.vue app.manifest.json
```

## 🏗️ 应用架构

### 文件结构

```
my-app/
├── src/                    # 源代码目录
│   ├── App.vue            # 主组件（必需）
│   ├── components/        # 子组件
│   ├── utils/            # 工具函数
│   ├── stores/           # 状态管理
│   └── types/            # 类型定义
├── assets/               # 静态资源
│   ├── icon.svg          # 应用图标（必需）
│   ├── screenshots/      # 应用截图
│   └── images/          # 其他图片
├── scripts/              # 生命周期脚本
│   ├── install.js        # 安装脚本
│   ├── uninstall.js      # 卸载脚本
│   └── update.js         # 更新脚本
├── app.manifest.json     # 应用清单（必需）
├── package.json          # 项目配置
├── README.md            # 说明文档
└── LICENSE              # 许可证
```

### 核心概念

#### 1. 应用容器
每个应用运行在独立的容器中，拥有自己的：
- 窗口实例
- 状态管理
- 事件系统
- 存储空间

#### 2. 沙箱隔离
应用之间通过沙箱机制隔离：
- 独立的 JavaScript 执行环境
- 受限的 DOM 访问权限
- 安全的 API 调用机制

#### 3. 通信机制
应用与系统的通信方式：
- SDK API 调用
- 事件监听和触发
- 消息传递机制

## 📄 应用清单

`app.manifest.json` 是应用的配置文件，定义了应用的基本信息、权限、依赖等。

### 基础结构

```json
{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "displayName": "My Awesome App",
  "description": "An awesome application for BG-WebMacOS",
  "author": {
    "name": "Developer Name",
    "email": "developer@example.com",
    "url": "https://example.com"
  },
  "main": "src/App.vue",
  "icon": "assets/icon.svg",
  "category": "utilities",
  "tags": ["productivity", "tools"],
  "window": {
    "width": 800,
    "height": 600,
    "minWidth": 400,
    "minHeight": 300,
    "resizable": true,
    "maximizable": true,
    "minimizable": true
  },
  "permissions": [
    "storage",
    "clipboard",
    "notifications"
  ],
  "dependencies": {
    "vue": "^3.3.0"
  },
  "engine": {
    "bgWebMacOS": ">=1.0.0",
    "node": ">=16.0.0"
  },
  "lifecycle": {
    "install": "scripts/install.js",
    "uninstall": "scripts/uninstall.js",
    "update": "scripts/update.js"
  }
}
```

### 字段说明

#### 基本信息
- `name`：应用唯一标识符（必需）
- `version`：应用版本号（必需）
- `displayName`：显示名称
- `description`：应用描述
- `author`：作者信息
- `main`：主入口文件（必需）
- `icon`：应用图标路径（必需）

#### 分类和标签
- `category`：应用分类（utilities、games、productivity、entertainment、education、developer-tools）
- `tags`：应用标签数组

#### 窗口配置
- `window.width/height`：默认窗口尺寸
- `window.minWidth/minHeight`：最小窗口尺寸
- `window.maxWidth/maxHeight`：最大窗口尺寸
- `window.resizable`：是否可调整大小
- `window.maximizable`：是否可最大化
- `window.minimizable`：是否可最小化

#### 权限系统
- `storage`：本地存储权限
- `clipboard`：剪贴板权限
- `notifications`：通知权限
- `filesystem`：文件系统权限
- `network`：网络访问权限
- `camera`：摄像头权限
- `microphone`：麦克风权限

## 🔧 核心 API

### App SDK

应用可以通过 SDK 访问系统功能：

```typescript
import { useAppSDK } from '@/sdk'

const sdk = useAppSDK()

// 系统 API
const systemInfo = await sdk.system.getInfo()
await sdk.system.showNotification({
  title: 'Hello',
  message: 'World',
  type: 'success'
})

// 窗口 API
const window = sdk.window
window.setTitle('New Title')
window.setSize(800, 600)
window.center()
window.minimize()
window.maximize()
window.close()

// 存储 API
const storage = sdk.storage
await storage.setItem('key', 'value')
const value = await storage.getItem('key')
await storage.removeItem('key')
await storage.clear()

// 剪贴板 API
const clipboard = sdk.clipboard
await clipboard.writeText('Hello World')
const text = await clipboard.readText()

// 文件系统 API（需要权限）
const fs = sdk.filesystem
const files = await fs.readDirectory('/path')
const content = await fs.readFile('/path/file.txt')
await fs.writeFile('/path/file.txt', 'content')

// 网络 API（需要权限）
const http = sdk.http
const response = await http.get('https://api.example.com/data')
const result = await http.post('https://api.example.com/submit', data)
```

### 事件系统

```typescript
// 监听系统事件
sdk.events.on('window:resize', (event) => {
  console.log('Window resized:', event.width, event.height)
})

sdk.events.on('app:focus', () => {
  console.log('App gained focus')
})

sdk.events.on('app:blur', () => {
  console.log('App lost focus')
})

// 触发自定义事件
sdk.events.emit('custom:event', { data: 'value' })

// 移除事件监听
sdk.events.off('window:resize', handler)
```

### 生命周期钩子

```typescript
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    // 应用启动时
    onMounted(async () => {
      await sdk.system.showNotification({
        title: 'App Started',
        message: 'Welcome to My App!'
      })
    })
    
    // 应用关闭时
    onUnmounted(async () => {
      // 保存数据
      await sdk.storage.setItem('lastSession', Date.now())
    })
    
    return {}
  }
}
```

## 🧩 组件开发

### Vue 3 组件示例

```vue
<template>
  <div class="my-app">
    <header class="app-header">
      <h1>{{ title }}</h1>
      <button @click="toggleTheme">切换主题</button>
    </header>
    
    <main class="app-content">
      <div class="feature-list">
        <div 
          v-for="feature in features" 
          :key="feature.id"
          class="feature-item"
          @click="selectFeature(feature)"
        >
          <icon :name="feature.icon" />
          <span>{{ feature.name }}</span>
        </div>
      </div>
      
      <div class="content-area">
        <component 
          :is="currentComponent" 
          :data="currentData"
          @update="handleUpdate"
        />
      </div>
    </main>
    
    <footer class="app-footer">
      <span>{{ status }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppSDK } from '@/sdk'
import Icon from './components/Icon.vue'

// 类型定义
interface Feature {
  id: string
  name: string
  icon: string
  component: string
}

// 响应式数据
const sdk = useAppSDK()
const title = ref('My Awesome App')
const isDarkTheme = ref(false)
const features = ref<Feature[]>([])
const selectedFeature = ref<Feature | null>(null)
const status = ref('Ready')

// 计算属性
const currentComponent = computed(() => {
  return selectedFeature.value?.component || 'DefaultView'
})

const currentData = computed(() => {
  return selectedFeature.value || {}
})

// 方法
const toggleTheme = async () => {
  isDarkTheme.value = !isDarkTheme.value
  await sdk.storage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
  
  // 应用主题
  document.documentElement.setAttribute(
    'data-theme', 
    isDarkTheme.value ? 'dark' : 'light'
  )
}

const selectFeature = (feature: Feature) => {
  selectedFeature.value = feature
  status.value = `Selected: ${feature.name}`
}

const handleUpdate = (data: any) => {
  console.log('Data updated:', data)
  status.value = 'Data updated'
}

// 生命周期
onMounted(async () => {
  // 加载保存的主题
  const savedTheme = await sdk.storage.getItem('theme')
  isDarkTheme.value = savedTheme === 'dark'
  
  // 加载功能列表
  features.value = [
    { id: '1', name: '功能一', icon: 'feature1', component: 'Feature1' },
    { id: '2', name: '功能二', icon: 'feature2', component: 'Feature2' },
    { id: '3', name: '功能三', icon: 'feature3', component: 'Feature3' }
  ]
  
  // 设置窗口标题
  sdk.window.setTitle(title.value)
  
  status.value = 'App loaded successfully'
})
</script>

<style scoped>
.my-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.feature-list {
  width: 200px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.feature-item:hover {
  background: var(--bg-hover);
}

.content-area {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.app-footer {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 主题变量 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-hover: #e5e5e5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #d1d5db;
}

[data-theme="dark"] {
  --bg-primary: #1f2937;
  --bg-secondary: #374151;
  --bg-hover: #4b5563;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #4b5563;
}
</style>
```

### React 组件示例

```jsx
import React, { useState, useEffect } from 'react'
import { useAppSDK } from '@/sdk'

function MyApp() {
  const sdk = useAppSDK()
  const [title, setTitle] = useState('My React App')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const initApp = async () => {
      try {
        // 设置窗口标题
        sdk.window.setTitle(title)
        
        // 加载数据
        const savedData = await sdk.storage.getItem('app-data')
        if (savedData) {
          setData(JSON.parse(savedData))
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setLoading(false)
      }
    }
    
    initApp()
  }, [])
  
  const saveData = async (newData) => {
    setData(newData)
    await sdk.storage.setItem('app-data', JSON.stringify(newData))
  }
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  return (
    <div className="app">
      <header>
        <h1>{title}</h1>
      </header>
      <main>
        {/* 应用内容 */}
      </main>
    </div>
  )
}

export default MyApp
```

## 🔄 生命周期管理

### 安装脚本 (install.js)

```javascript
// scripts/install.js
const { AppInstaller } = require('@bg-webmacos/installer')

class MyAppInstaller extends AppInstaller {
  async onInstall() {
    console.log('Installing My App...')
    
    // 创建应用数据目录
    await this.createDirectory('data')
    await this.createDirectory('cache')
    await this.createDirectory('logs')
    
    // 初始化配置文件
    const defaultConfig = {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      notifications: true
    }
    
    await this.writeFile('data/config.json', JSON.stringify(defaultConfig, null, 2))
    
    // 设置默认权限
    await this.requestPermissions([
      'storage',
      'clipboard',
      'notifications'
    ])
    
    // 注册快捷键
    await this.registerShortcut('Ctrl+Alt+M', 'open-my-app')
    
    // 创建桌面快捷方式
    await this.createDesktopShortcut({
      name: 'My App',
      icon: 'assets/icon.svg',
      description: 'Launch My Awesome App'
    })
    
    console.log('My App installed successfully!')
    
    // 显示安装完成通知
    await this.showNotification({
      title: 'Installation Complete',
      message: 'My App has been installed successfully!',
      type: 'success'
    })
  }
  
  async onPostInstall() {
    // 安装后的额外操作
    console.log('Post-install tasks...')
    
    // 检查依赖
    await this.checkDependencies()
    
    // 初始化数据库
    await this.initializeDatabase()
  }
  
  async checkDependencies() {
    const requiredApps = ['system-calculator', 'system-notepad']
    
    for (const app of requiredApps) {
      const isInstalled = await this.isAppInstalled(app)
      if (!isInstalled) {
        console.warn(`Recommended app not found: ${app}`)
      }
    }
  }
  
  async initializeDatabase() {
    // 初始化本地数据库
    const db = await this.openDatabase('my-app-db', 1)
    
    // 创建表结构
    await db.createTable('users', {
      id: 'INTEGER PRIMARY KEY',
      name: 'TEXT NOT NULL',
      email: 'TEXT UNIQUE',
      created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
    })
    
    await db.createTable('settings', {
      key: 'TEXT PRIMARY KEY',
      value: 'TEXT',
      updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
    })
  }
}

module.exports = MyAppInstaller
```

### 卸载脚本 (uninstall.js)

```javascript
// scripts/uninstall.js
const { AppUninstaller } = require('@bg-webmacos/installer')

class MyAppUninstaller extends AppUninstaller {
  async onUninstall() {
    console.log('Uninstalling My App...')
    
    // 询问用户是否保留数据
    const keepData = await this.confirm({
      title: 'Uninstall My App',
      message: 'Do you want to keep your app data?',
      buttons: ['Keep Data', 'Remove All', 'Cancel']
    })
    
    if (keepData === 'Cancel') {
      throw new Error('Uninstall cancelled by user')
    }
    
    // 备份用户数据（如果选择保留）
    if (keepData === 'Keep Data') {
      await this.backupUserData()
    }
    
    // 注销快捷键
    await this.unregisterShortcut('Ctrl+Alt+M')
    
    // 移除桌面快捷方式
    await this.removeDesktopShortcut('My App')
    
    // 清理应用数据（如果选择删除）
    if (keepData === 'Remove All') {
      await this.removeDirectory('data')
      await this.removeDirectory('cache')
      await this.removeDirectory('logs')
    } else {
      // 只清理缓存和日志
      await this.removeDirectory('cache')
      await this.removeDirectory('logs')
    }
    
    // 清理注册表项
    await this.cleanupRegistry()
    
    console.log('My App uninstalled successfully!')
    
    // 显示卸载完成通知
    await this.showNotification({
      title: 'Uninstall Complete',
      message: 'My App has been uninstalled.',
      type: 'info'
    })
  }
  
  async backupUserData() {
    const backupPath = `backups/my-app-${Date.now()}`
    await this.createDirectory(backupPath)
    
    // 备份配置文件
    await this.copyFile('data/config.json', `${backupPath}/config.json`)
    
    // 备份数据库
    await this.copyFile('data/database.db', `${backupPath}/database.db`)
    
    console.log(`User data backed up to: ${backupPath}`)
  }
  
  async cleanupRegistry() {
    // 清理系统注册表中的应用信息
    await this.removeRegistryKey('apps/my-app')
    await this.removeRegistryKey('shortcuts/my-app')
    await this.removeRegistryKey('permissions/my-app')
  }
}

module.exports = MyAppUninstaller
```

### 更新脚本 (update.js)

```javascript
// scripts/update.js
const { AppUpdater } = require('@bg-webmacos/installer')

class MyAppUpdater extends AppUpdater {
  async onUpdate(fromVersion, toVersion) {
    console.log(`Updating My App from ${fromVersion} to ${toVersion}...`)
    
    // 备份当前数据
    await this.backupCurrentData()
    
    // 执行版本特定的更新逻辑
    if (this.isVersionLessThan(fromVersion, '1.1.0')) {
      await this.updateTo110()
    }
    
    if (this.isVersionLessThan(fromVersion, '1.2.0')) {
      await this.updateTo120()
    }
    
    if (this.isVersionLessThan(fromVersion, '2.0.0')) {
      await this.updateTo200()
    }
    
    // 更新配置文件
    await this.updateConfig()
    
    // 迁移数据
    await this.migrateData(fromVersion, toVersion)
    
    console.log('Update completed successfully!')
    
    // 显示更新完成通知
    await this.showNotification({
      title: 'Update Complete',
      message: `My App has been updated to version ${toVersion}`,
      type: 'success'
    })
  }
  
  async updateTo110() {
    console.log('Applying updates for version 1.1.0...')
    
    // 添加新的配置选项
    const config = await this.readJsonFile('data/config.json')
    config.newFeature = true
    config.enhancedUI = 'enabled'
    await this.writeJsonFile('data/config.json', config)
    
    // 创建新的数据目录
    await this.createDirectory('data/plugins')
  }
  
  async updateTo120() {
    console.log('Applying updates for version 1.2.0...')
    
    // 数据库架构更新
    const db = await this.openDatabase('my-app-db', 2)
    await db.addColumn('users', 'avatar', 'TEXT')
    await db.addColumn('users', 'preferences', 'TEXT')
  }
  
  async updateTo200() {
    console.log('Applying updates for version 2.0.0...')
    
    // 重大版本更新 - 重构数据结构
    await this.migrateToNewDataStructure()
    
    // 更新权限
    await this.requestPermissions(['filesystem', 'network'])
  }
  
  async migrateData(fromVersion, toVersion) {
    console.log('Migrating user data...')
    
    // 读取旧数据
    const oldData = await this.readJsonFile('data/user-data.json')
    
    // 转换数据格式
    const newData = this.transformDataStructure(oldData, fromVersion, toVersion)
    
    // 保存新数据
    await this.writeJsonFile('data/user-data.json', newData)
  }
  
  transformDataStructure(data, fromVersion, toVersion) {
    // 根据版本差异转换数据结构
    let transformed = { ...data }
    
    if (this.isVersionLessThan(fromVersion, '2.0.0')) {
      // 1.x -> 2.0 的数据转换
      transformed = {
        version: toVersion,
        user: {
          profile: data.userProfile || {},
          settings: data.userSettings || {},
          preferences: data.preferences || {}
        },
        app: {
          data: data.appData || {},
          cache: data.cache || {},
          history: data.history || []
        }
      }
    }
    
    return transformed
  }
}

module.exports = MyAppUpdater
```

## 🔐 权限系统

### 权限类型

```typescript
// 权限定义
interface Permission {
  name: string
  description: string
  required: boolean
  dangerous: boolean
}

const PERMISSIONS: Record<string, Permission> = {
  storage: {
    name: 'storage',
    description: '访问本地存储',
    required: false,
    dangerous: false
  },
  clipboard: {
    name: 'clipboard',
    description: '访问剪贴板',
    required: false,
    dangerous: false
  },
  notifications: {
    name: 'notifications',
    description: '显示系统通知',
    required: false,
    dangerous: false
  },
  filesystem: {
    name: 'filesystem',
    description: '访问文件系统',
    required: false,
    dangerous: true
  },
  network: {
    name: 'network',
    description: '访问网络',
    required: false,
    dangerous: true
  },
  camera: {
    name: 'camera',
    description: '访问摄像头',
    required: false,
    dangerous: true
  },
  microphone: {
    name: 'microphone',
    description: '访问麦克风',
    required: false,
    dangerous: true
  }
}
```

### 权限请求

```typescript
// 在应用中请求权限
const requestPermissions = async () => {
  try {
    const permissions = await sdk.permissions.request([
      'storage',
      'clipboard',
      'notifications'
    ])
    
    console.log('Granted permissions:', permissions.granted)
    console.log('Denied permissions:', permissions.denied)
    
    if (permissions.denied.length > 0) {
      // 处理被拒绝的权限
      await handleDeniedPermissions(permissions.denied)
    }
  } catch (error) {
    console.error('Permission request failed:', error)
  }
}

const handleDeniedPermissions = async (deniedPermissions: string[]) => {
  for (const permission of deniedPermissions) {
    switch (permission) {
      case 'storage':
        // 禁用需要存储的功能
        disableStorageFeatures()
        break
      case 'clipboard':
        // 禁用剪贴板功能
        disableClipboardFeatures()
        break
      case 'notifications':
        // 使用应用内通知替代
        useInAppNotifications()
        break
    }
  }
}
```

### 权限检查

```typescript
// 检查权限状态
const checkPermissions = async () => {
  const hasStorage = await sdk.permissions.check('storage')
  const hasClipboard = await sdk.permissions.check('clipboard')
  
  if (hasStorage) {
    // 启用存储功能
    enableStorageFeatures()
  }
  
  if (hasClipboard) {
    // 启用剪贴板功能
    enableClipboardFeatures()
  }
}
```

## 💾 数据存储

### 本地存储

```typescript
// 基础存储操作
const storage = sdk.storage

// 存储数据
await storage.setItem('user-preferences', {
  theme: 'dark',
  language: 'zh-CN',
  autoSave: true
})

// 读取数据
const preferences = await storage.getItem('user-preferences')

// 删除数据
await storage.removeItem('user-preferences')

// 清空所有数据
await storage.clear()

// 获取所有键
const keys = await storage.keys()

// 获取存储大小
const size = await storage.size()
```

### 数据库存储

```typescript
// 使用 IndexedDB
const db = await sdk.database.open('my-app-db', 1, {
  upgrade(db, oldVersion, newVersion) {
    // 创建对象存储
    const userStore = db.createObjectStore('users', { keyPath: 'id' })
    userStore.createIndex('email', 'email', { unique: true })
    
    const settingsStore = db.createObjectStore('settings', { keyPath: 'key' })
  }
})

// 添加数据
const transaction = db.transaction(['users'], 'readwrite')
const userStore = transaction.objectStore('users')
await userStore.add({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
})

// 查询数据
const user = await userStore.get(1)
const userByEmail = await userStore.index('email').get('john@example.com')

// 更新数据
await userStore.put({
  id: 1,
  name: 'John Smith',
  email: 'john@example.com',
  updatedAt: new Date()
})

// 删除数据
await userStore.delete(1)
```

### 文件存储

```typescript
// 文件系统操作（需要 filesystem 权限）
const fs = sdk.filesystem

// 读取文件
const content = await fs.readFile('/app-data/config.json')
const config = JSON.parse(content)

// 写入文件
const newConfig = { ...config, updated: true }
await fs.writeFile('/app-data/config.json', JSON.stringify(newConfig, null, 2))

// 创建目录
await fs.createDirectory('/app-data/cache')

// 列出目录内容
const files = await fs.readDirectory('/app-data')

// 删除文件
await fs.deleteFile('/app-data/temp.txt')

// 删除目录
await fs.deleteDirectory('/app-data/cache')

// 检查文件是否存在
const exists = await fs.exists('/app-data/config.json')

// 获取文件信息
const stats = await fs.stat('/app-data/config.json')
console.log('File size:', stats.size)
console.log('Modified:', stats.mtime)
```

## 📦 应用打包

### 构建配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/App.vue'),
      name: 'MyApp',
      fileName: 'my-app',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

### 打包脚本

```javascript
// scripts/build.js
const { build } = require('vite')
const { createHash } = require('crypto')
const fs = require('fs-extra')
const path = require('path')
const archiver = require('archiver')

class AppBuilder {
  constructor() {
    this.buildDir = 'dist'
    this.packageDir = 'packages'
  }
  
  async build() {
    console.log('Building application...')
    
    // 清理构建目录
    await fs.emptyDir(this.buildDir)
    
    // 执行 Vite 构建
    await build()
    
    // 复制资源文件
    await this.copyAssets()
    
    // 生成清单文件
    await this.generateManifest()
    
    // 创建应用包
    await this.createPackage()
    
    console.log('Build completed successfully!')
  }
  
  async copyAssets() {
    console.log('Copying assets...')
    
    // 复制图标和截图
    await fs.copy('assets', path.join(this.buildDir, 'assets'))
    
    // 复制脚本文件
    await fs.copy('scripts', path.join(this.buildDir, 'scripts'))
    
    // 复制清单文件
    await fs.copy('app.manifest.json', path.join(this.buildDir, 'app.manifest.json'))
    
    // 复制说明文档
    await fs.copy('README.md', path.join(this.buildDir, 'README.md'))
    await fs.copy('LICENSE', path.join(this.buildDir, 'LICENSE'))
  }
  
  async generateManifest() {
    console.log('Generating build manifest...')
    
    const manifest = {
      buildTime: new Date().toISOString(),
      buildVersion: process.env.BUILD_VERSION || '1.0.0',
      files: await this.getFileHashes(),
      size: await this.calculateTotalSize()
    }
    
    await fs.writeJson(
      path.join(this.buildDir, 'build.manifest.json'),
      manifest,
      { spaces: 2 }
    )
  }
  
  async getFileHashes() {
    const files = {}
    const fileList = await this.getAllFiles(this.buildDir)
    
    for (const file of fileList) {
      const content = await fs.readFile(file)
      const hash = createHash('sha256').update(content).digest('hex')
      const relativePath = path.relative(this.buildDir, file)
      files[relativePath] = hash
    }
    
    return files
  }
  
  async getAllFiles(dir) {
    const files = []
    const items = await fs.readdir(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = await fs.stat(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath))
      } else {
        files.push(fullPath)
      }
    }
    
    return files
  }
  
  async calculateTotalSize() {
    const files = await this.getAllFiles(this.buildDir)
    let totalSize = 0
    
    for (const file of files) {
      const stat = await fs.stat(file)
      totalSize += stat.size
    }
    
    return totalSize
  }
  
  async createPackage() {
    console.log('Creating application package...')
    
    await fs.ensureDir(this.packageDir)
    
    const packageName = `my-app-${process.env.BUILD_VERSION || '1.0.0'}.bgapp`
    const packagePath = path.join(this.packageDir, packageName)
    
    const output = fs.createWriteStream(packagePath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`Package created: ${packagePath} (${archive.pointer()} bytes)`)
        resolve(packagePath)
      })
      
      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(this.buildDir, false)
      archive.finalize()
    })
  }
}

// 执行构建
if (require.main === module) {
  const builder = new AppBuilder()
  builder.build().catch(console.error)
}

module.exports = AppBuilder
```

### 发布脚本

```bash
#!/bin/bash
# scripts/publish.sh

set -e

echo "Publishing My App..."

# 检查环境变量
if [ -z "$APP_STORE_TOKEN" ]; then
  echo "Error: APP_STORE_TOKEN is required"
  exit 1
fi

# 构建应用
echo "Building application..."
npm run build

# 运行测试
echo "Running tests..."
npm test

# 创建应用包
echo "Creating package..."
node scripts/build.js

# 上传到应用商店
echo "Uploading to app store..."
curl -X POST \
  -H "Authorization: Bearer $APP_STORE_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "package=@packages/my-app-1.0.0.bgapp" \
  -F "manifest=@dist/app.manifest.json" \
  https://store.bg-webmacos.com/api/apps/upload

echo "Publish completed!"
```

## 🏪 应用商店发布

### 应用商店 API

```typescript
// 应用商店客户端
class AppStoreClient {
  constructor(private apiKey: string) {}
  
  async uploadApp(packagePath: string, manifest: any) {
    const formData = new FormData()
    formData.append('package', fs.createReadStream(packagePath))
    formData.append('manifest', JSON.stringify(manifest))
    
    const response = await fetch('https://store.bg-webmacos.com/api/apps/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async updateApp(appId: string, packagePath: string) {
    const formData = new FormData()
    formData.append('package', fs.createReadStream(packagePath))
    
    const response = await fetch(`https://store.bg-webmacos.com/api/apps/${appId}/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    })
    
    return response.json()
  }
  
  async getAppStatus(appId: string) {
    const response = await fetch(`https://store.bg-webmacos.com/api/apps/${appId}/status`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })
    
    return response.json()
  }
}
```

### 发布流程

1. **开发者注册**
   - 在应用商店注册开发者账号
   - 获取 API 密钥
   - 完善开发者信息

2. **应用提交**
   - 上传应用包文件
   - 填写应用信息
   - 提供应用截图
   - 设置价格和分发策略

3. **审核流程**
   - 自动安全扫描
   - 功能测试
   - 人工审核
   - 审核结果通知

4. **发布上线**
   - 审核通过后自动上线
   - 用户可以搜索和安装
   - 开发者可以查看下载统计

## 🎯 最佳实践

### 性能优化

1. **代码分割**
```typescript
// 使用动态导入进行代码分割
const LazyComponent = defineAsyncComponent(() => import('./components/HeavyComponent.vue'))

// 路由级别的代码分割
const routes = [
  {
    path: '/feature',
    component: () => import('./views/FeatureView.vue')
  }
]
```

2. **资源优化**
```typescript
// 图片懒加载
const useImageLazyLoad = () => {
  const imageRef = ref<HTMLImageElement>()
  
  onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src!
          observer.unobserve(img)
        }
      })
    })
    
    if (imageRef.value) {
      observer.observe(imageRef.value)
    }
  })
  
  return { imageRef }
}
```

3. **内存管理**
```typescript
// 清理定时器和事件监听
onUnmounted(() => {
  // 清理定时器
  if (timer) {
    clearInterval(timer)
  }
  
  // 移除事件监听
  sdk.events.off('window:resize', handleResize)
  
  // 清理 WebSocket 连接
  if (websocket) {
    websocket.close()
  }
})
```

### 错误处理

```typescript
// 全局错误处理
const app = createApp(App)

app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
  
  // 发送错误报告
  sdk.system.reportError({
    error: error.message,
    stack: error.stack,
    component: instance?.$options.name,
    info
  })
}

// 异步错误处理
const handleAsyncOperation = async () => {
  try {
    const result = await riskyOperation()
    return result
  } catch (error) {
    console.error('Async operation failed:', error)
    
    // 显示用户友好的错误信息
    await sdk.system.showNotification({
      title: 'Operation Failed',
      message: 'Please try again later',
      type: 'error'
    })
    
    throw error
  }
}
```

### 安全最佳实践

```typescript
// 输入验证
const validateInput = (input: string): boolean => {
  // 防止 XSS 攻击
  const sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '')
  
  // 长度限制
  if (sanitized.length > 1000) {
    return false
  }
  
  // 特殊字符检查
  const dangerousChars = /[<>"'&]/
  if (dangerousChars.test(sanitized)) {
    return false
  }
  
  return true
}

// 安全的数据存储
const secureStorage = {
  async setItem(key: string, value: any) {
    // 加密敏感数据
    const encrypted = await sdk.crypto.encrypt(JSON.stringify(value))
    await sdk.storage.setItem(key, encrypted)
  },
  
  async getItem(key: string) {
    const encrypted = await sdk.storage.getItem(key)
    if (!encrypted) return null
    
    // 解密数据
    const decrypted = await sdk.crypto.decrypt(encrypted)
    return JSON.parse(decrypted)
  }
}
```

### 用户体验

```typescript
// 加载状态管理
const useLoading = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const execute = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    loading.value = true
    error.value = null
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return null
    } finally {
      loading.value = false
    }
  }
  
  return { loading, error, execute }
}

// 响应式设计
const useResponsive = () => {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)
  
  const updateSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }
  
  onMounted(() => {
    window.addEventListener('resize', updateSize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
  })
  
  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
  const isDesktop = computed(() => windowWidth.value >= 1024)
  
  return {
    windowWidth,
    windowHeight,
    isMobile,
    isTablet,
    isDesktop
  }
}
```

## 📚 示例应用

### 计算器应用
位于 `example-apps/calculator/` 目录，展示了：
- 完整的应用结构
- Vue 3 组合式 API 使用
- 数学计算引擎实现
- 本地数据存储
- 键盘事件处理
- 生命周期脚本

### 文本编辑器应用
```typescript
// 简单的文本编辑器示例
<template>
  <div class="text-editor">
    <div class="toolbar">
      <button @click="newFile">新建</button>
      <button @click="openFile">打开</button>
      <button @click="saveFile">保存</button>
      <button @click="saveAsFile">另存为</button>
    </div>
    
    <textarea 
      v-model="content"
      class="editor-content"
      @input="handleInput"
      @keydown="handleKeydown"
    ></textarea>
    
    <div class="status-bar">
      <span>行: {{ currentLine }}</span>
      <span>列: {{ currentColumn }}</span>
      <span>字符: {{ content.length }}</span>
      <span v-if="isDirty">*</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppSDK } from '@/sdk'

const sdk = useAppSDK()
const content = ref('')
const currentFile = ref<string | null>(null)
const isDirty = ref(false)
const cursorPosition = ref(0)

const currentLine = computed(() => {
  const lines = content.value.substring(0, cursorPosition.value).split('\n')
  return lines.length
})

const currentColumn = computed(() => {
  const lines = content.value.substring(0, cursorPosition.value).split('\n')
  return lines[lines.length - 1].length + 1
})

const newFile = () => {
  if (isDirty.value) {
    // 询问是否保存当前文件
    confirmSave(() => {
      content.value = ''
      currentFile.value = null
      isDirty.value = false
    })
  } else {
    content.value = ''
    currentFile.value = null
    isDirty.value = false
  }
}

const openFile = async () => {
  try {
    const file = await sdk.filesystem.openFileDialog({
      filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }]
    })
    
    if (file) {
      const fileContent = await sdk.filesystem.readFile(file.path)
      content.value = fileContent
      currentFile.value = file.path
      isDirty.value = false
      
      sdk.window.setTitle(`Text Editor - ${file.name}`)
    }
  } catch (error) {
    console.error('Failed to open file:', error)
  }
}

const saveFile = async () => {
  if (currentFile.value) {
    await sdk.filesystem.writeFile(currentFile.value, content.value)
    isDirty.value = false
  } else {
    await saveAsFile()
  }
}

const saveAsFile = async () => {
  try {
    const file = await sdk.filesystem.saveFileDialog({
      defaultName: 'untitled.txt',
      filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }]
    })
    
    if (file) {
      await sdk.filesystem.writeFile(file.path, content.value)
      currentFile.value = file.path
      isDirty.value = false
      
      sdk.window.setTitle(`Text Editor - ${file.name}`)
    }
  } catch (error) {
    console.error('Failed to save file:', error)
  }
}

const handleInput = (event: Event) => {
  isDirty.value = true
  cursorPosition.value = (event.target as HTMLTextAreaElement).selectionStart
}

const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+S 保存
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    saveFile()
  }
  
  // Ctrl+N 新建
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault()
    newFile()
  }
  
  // Ctrl+O 打开
  if (event.ctrlKey && event.key === 'o') {
    event.preventDefault()
    openFile()
  }
}

const confirmSave = (callback: () => void) => {
  sdk.system.showDialog({
    title: '保存文件',
    message: '当前文件已修改，是否保存？',
    buttons: ['保存', '不保存', '取消']
  }).then(result => {
    if (result === '保存') {
      saveFile().then(callback)
    } else if (result === '不保存') {
      callback()
    }
    // 取消则不执行任何操作
  })
}

onMounted(() => {
  sdk.window.setTitle('Text Editor')
})
</script>
```

## ❓ 常见问题

### Q: 如何调试应用？
A: 使用浏览器开发者工具，启用 Vue DevTools，查看控制台日志。

### Q: 应用如何与系统通信？
A: 通过 App SDK 提供的 API 接口进行通信。

### Q: 如何处理应用权限？
A: 在应用清单中声明所需权限，在运行时通过 SDK 请求权限。

### Q: 应用数据如何持久化？
A: 使用 SDK 提供的存储 API，支持键值存储、数据库存储和文件存储。

### Q: 如何实现应用间通信？
A: 通过系统事件总线或共享存储实现应用间数据交换。

### Q: 应用如何处理多语言？
A: 使用 Vue I18n 或类似的国际化库，配合系统语言设置。

### Q: 如何优化应用性能？
A: 使用代码分割、懒加载、虚拟滚动等技术，避免内存泄漏。

### Q: 应用更新如何处理？
A: 通过应用商店自动更新，或实现自定义更新检查机制。

### Q: 如何测试应用？
A: 使用 Vitest 进行单元测试，Cypress 进行 E2E 测试。

### Q: 应用如何处理错误？
A: 实现全局错误处理，记录错误日志，向用户显示友好提示。

### Q: 如何发布应用到商店？
A: 构建应用包，通过开发者控制台上传，等待审核通过。

### Q: 应用如何获得更多曝光？
A: 优化应用描述和关键词，提供高质量截图，积极响应用户反馈。

---

## 📞 技术支持

- **官方文档**: https://docs.bg-webmacos.com
- **开发者论坛**: https://forum.bg-webmacos.com
- **GitHub 仓库**: https://github.com/BG-WebMacOS
- **技术支持**: support@bg-webmacos.com
- **开发者 QQ 群**: 123456789

## 🎉 结语

恭喜你完成了 BG-WebMacOS 应用开发指南的学习！现在你已经具备了开发高质量应用的知识和技能。

记住以下几个关键点：
- 始终关注用户体验
- 遵循安全最佳实践
- 保持代码简洁和可维护
- 积极参与社区交流
- 持续学习新技术

祝你在 BG-WebMacOS 平台上开发出优秀的应用！🚀

---

*本指南会持续更新，请关注最新版本。*