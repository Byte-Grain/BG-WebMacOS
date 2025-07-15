# 动态应用注册方案

## 概述

本方案旨在实现一个自动化的应用注册系统，使开发者在新增应用时只需要添加对应的 Vue 文件和配置，无需手动导入组件或修改注册代码。系统将根据文件结构和配置自动发现、导入和注册应用。

## 现状分析

### 当前架构优势
- 清晰的应用分类（system/demo）
- 完善的配置管理系统
- 统一的组件加载机制
- 良好的类型定义

### 存在问题
- 每次新增应用需要手动在 `App.vue` 中添加组件导入
- 组件映射对象需要手动维护
- 配置文件与组件文件分离，容易出现不一致
- 缺乏自动发现机制

## 解决方案

### 1. 动态组件加载器

创建一个动态组件加载器，能够根据应用配置自动导入对应的 Vue 组件。

#### 核心特性
- 基于文件路径的自动组件发现
- 支持多种组件存放位置
- 异步组件加载
- 错误处理和降级机制
- 开发环境热重载支持

### 2. 应用配置增强

扩展现有的应用配置，增加组件路径信息，支持多种配置方式。

#### 配置方式
1. **基于约定的路径**：根据应用 key 自动推断组件路径
2. **显式路径配置**：在配置中明确指定组件路径
3. **混合模式**：支持两种方式并存

### 3. 文件结构规范

建立标准的应用文件组织结构，便于自动发现和管理。

```
src/
├── views/
│   └── apps/
│       ├── system/           # 系统应用
│       │   ├── AppStore.vue
│       │   ├── SystemStore.vue
│       │   └── ...
│       ├── demo/             # 演示应用
│       │   ├── camera.vue
│       │   ├── colorfull.vue
│       │   └── ...
│       └── custom/           # 自定义应用（新增）
│           ├── MyApp.vue
│           └── ...
├── config/
│   └── apps/
│       ├── system-apps.ts    # 系统应用配置
│       ├── demo-apps.ts      # 演示应用配置
│       ├── custom-apps.ts    # 自定义应用配置（新增）
│       └── app-registry.ts   # 应用注册表
```

## 技术实现

### 1. 动态组件加载器实现

```typescript
// src/utils/dynamicComponentLoader.ts
import { defineAsyncComponent, AsyncComponentLoader } from 'vue'
import type { AppConfig } from '@/types/app'

/**
 * 动态组件加载器
 */
export class DynamicComponentLoader {
  private componentCache = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()

  /**
   * 根据应用配置加载组件
   */
  loadComponent(app: AppConfig): AsyncComponentLoader {
    const componentKey = app.component || app.key
    
    // 如果已经缓存，直接返回
    if (this.componentCache.has(componentKey)) {
      return () => Promise.resolve(this.componentCache.get(componentKey))
    }

    // 如果正在加载，返回现有的 Promise
    if (this.loadingPromises.has(componentKey)) {
      return () => this.loadingPromises.get(componentKey)!
    }

    // 创建异步组件加载器
    return defineAsyncComponent({
      loader: () => this.createComponentLoader(app),
      loadingComponent: () => import('@/components/common/Loading.vue'),
      errorComponent: () => import('@/components/common/AppError.vue'),
      delay: 200,
      timeout: 10000
    })
  }

  /**
   * 创建组件加载器
   */
  private async createComponentLoader(app: AppConfig) {
    const componentKey = app.component || app.key
    
    try {
      // 尝试多种路径加载组件
      const component = await this.tryLoadFromPaths(app)
      
      // 缓存组件
      this.componentCache.set(componentKey, component)
      
      return component
    } catch (error) {
      console.error(`Failed to load component for app: ${app.key}`, error)
      throw error
    } finally {
      // 清理加载 Promise
      this.loadingPromises.delete(componentKey)
    }
  }

  /**
   * 尝试从多个路径加载组件
   */
  private async tryLoadFromPaths(app: AppConfig) {
    const possiblePaths = this.generatePossiblePaths(app)
    
    for (const path of possiblePaths) {
      try {
        const module = await import(path)
        return module.default || module
      } catch (error) {
        // 继续尝试下一个路径
        continue
      }
    }
    
    throw new Error(`Component not found for app: ${app.key}`)
  }

  /**
   * 生成可能的组件路径
   */
  private generatePossiblePaths(app: AppConfig): string[] {
    const paths: string[] = []
    const componentName = app.component || app.key
    
    // 1. 如果配置中指定了完整路径
    if (app.componentPath) {
      paths.push(app.componentPath)
    }
    
    // 2. 根据应用分类生成路径
    if (app.category) {
      paths.push(`@/views/apps/${app.category}/${componentName}.vue`)
      paths.push(`@/views/apps/${app.category}/${app.key}.vue`)
    }
    
    // 3. 通用路径
    paths.push(`@/views/apps/${componentName}.vue`)
    paths.push(`@/views/apps/${app.key}.vue`)
    
    // 4. 组件目录
    paths.push(`@/components/apps/${componentName}.vue`)
    paths.push(`@/components/apps/${app.key}.vue`)
    
    return paths
  }

  /**
   * 预加载组件
   */
  async preloadComponent(app: AppConfig): Promise<void> {
    try {
      await this.createComponentLoader(app)
    } catch (error) {
      console.warn(`Failed to preload component for app: ${app.key}`, error)
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.componentCache.clear()
    this.loadingPromises.clear()
  }
}

// 导出单例实例
export const dynamicComponentLoader = new DynamicComponentLoader()
```

### 2. 应用配置类型扩展

```typescript
// src/types/app.d.ts (扩展)
export interface BaseAppConfig {
  key: string
  component?: string          // 组件名称（可选）
  componentPath?: string      // 组件路径（可选）
  title: string
  icon: string
  category: 'system' | 'demo' | 'custom'
  // ... 其他现有属性
}

// 新增：应用发现配置
export interface AppDiscoveryConfig {
  autoScan: boolean           // 是否启用自动扫描
  scanPaths: string[]         // 扫描路径
  excludePatterns: string[]   // 排除模式
  fileExtensions: string[]    // 文件扩展名
}
```

### 3. 自动应用发现器

```typescript
// src/utils/appDiscovery.ts
import type { AppConfig, AppDiscoveryConfig } from '@/types/app'

/**
 * 应用自动发现器
 */
export class AppDiscovery {
  private config: AppDiscoveryConfig

  constructor(config: AppDiscoveryConfig) {
    this.config = config
  }

  /**
   * 扫描并发现应用
   */
  async discoverApps(): Promise<AppConfig[]> {
    if (!this.config.autoScan) {
      return []
    }

    const discoveredApps: AppConfig[] = []

    for (const scanPath of this.config.scanPaths) {
      try {
        const apps = await this.scanPath(scanPath)
        discoveredApps.push(...apps)
      } catch (error) {
        console.warn(`Failed to scan path: ${scanPath}`, error)
      }
    }

    return discoveredApps
  }

  /**
   * 扫描指定路径
   */
  private async scanPath(path: string): Promise<AppConfig[]> {
    // 在开发环境中，可以使用 Vite 的 import.meta.glob
    // 在生产环境中，需要预先生成应用清单
    
    if (import.meta.env.DEV) {
      return this.scanPathDev(path)
    } else {
      return this.scanPathProd(path)
    }
  }

  /**
   * 开发环境扫描
   */
  private async scanPathDev(path: string): Promise<AppConfig[]> {
    const apps: AppConfig[] = []
    
    // 使用 Vite 的 import.meta.glob 动态导入
    const modules = import.meta.glob('/src/views/apps/**/*.vue', {
      eager: false
    })

    for (const [filePath, moduleLoader] of Object.entries(modules)) {
      if (this.shouldIncludeFile(filePath)) {
        try {
          const app = await this.extractAppConfig(filePath, moduleLoader)
          if (app) {
            apps.push(app)
          }
        } catch (error) {
          console.warn(`Failed to extract app config from: ${filePath}`, error)
        }
      }
    }

    return apps
  }

  /**
   * 生产环境扫描
   */
  private async scanPathProd(path: string): Promise<AppConfig[]> {
    // 在生产环境中，从预生成的清单文件加载
    try {
      const manifest = await import('@/generated/app-manifest.json')
      return manifest.apps || []
    } catch (error) {
      console.warn('Failed to load app manifest', error)
      return []
    }
  }

  /**
   * 检查文件是否应该包含
   */
  private shouldIncludeFile(filePath: string): boolean {
    // 检查文件扩展名
    const hasValidExtension = this.config.fileExtensions.some(ext => 
      filePath.endsWith(ext)
    )
    
    if (!hasValidExtension) {
      return false
    }

    // 检查排除模式
    const isExcluded = this.config.excludePatterns.some(pattern => 
      new RegExp(pattern).test(filePath)
    )

    return !isExcluded
  }

  /**
   * 从文件中提取应用配置
   */
  private async extractAppConfig(
    filePath: string, 
    moduleLoader: () => Promise<any>
  ): Promise<AppConfig | null> {
    try {
      const module = await moduleLoader()
      
      // 检查组件是否导出了应用配置
      if (module.default?.appConfig) {
        return {
          ...module.default.appConfig,
          componentPath: filePath
        }
      }

      // 如果没有配置，尝试从文件路径推断
      return this.inferAppConfigFromPath(filePath)
    } catch (error) {
      console.warn(`Failed to load module: ${filePath}`, error)
      return null
    }
  }

  /**
   * 从文件路径推断应用配置
   */
  private inferAppConfigFromPath(filePath: string): AppConfig | null {
    const pathParts = filePath.split('/')
    const fileName = pathParts[pathParts.length - 1].replace('.vue', '')
    const category = pathParts.includes('system') ? 'system' : 
                    pathParts.includes('demo') ? 'demo' : 'custom'

    return {
      key: fileName,
      component: fileName,
      componentPath: filePath,
      title: this.formatTitle(fileName),
      icon: 'default-app-icon',
      category,
      version: '1.0.0',
      author: 'Auto-discovered',
      description: `Auto-discovered app: ${fileName}`,
      permissions: []
    }
  }

  /**
   * 格式化标题
   */
  private formatTitle(fileName: string): string {
    return fileName
      .split(/[-_]/)  // 按连字符或下划线分割
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}
```

### 4. 增强的应用注册表

```typescript
// src/config/apps/enhanced-app-registry.ts
import { dynamicComponentLoader } from '@/utils/dynamicComponentLoader'
import { AppDiscovery } from '@/utils/appDiscovery'
import type { AppConfig, AppDiscoveryConfig } from '@/types/app'

// 导入现有配置
import { systemApps } from './system-apps'
import { demoApps } from './demo-apps'

/**
 * 增强的应用注册表
 */
class EnhancedAppRegistry {
  private apps = new Map<string, AppConfig>()
  private componentMap = new Map<string, any>()
  private appDiscovery: AppDiscovery
  private initialized = false

  constructor() {
    // 配置应用发现器
    const discoveryConfig: AppDiscoveryConfig = {
      autoScan: import.meta.env.DEV, // 仅在开发环境启用自动扫描
      scanPaths: [
        '/src/views/apps/system',
        '/src/views/apps/demo',
        '/src/views/apps/custom',
        '/src/components/apps'
      ],
      excludePatterns: [
        '.*\.test\.vue$',
        '.*\.spec\.vue$',
        '.*\.story\.vue$'
      ],
      fileExtensions: ['.vue']
    }

    this.appDiscovery = new AppDiscovery(discoveryConfig)
  }

  /**
   * 初始化注册表
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // 1. 注册静态配置的应用
      this.registerStaticApps()

      // 2. 发现并注册动态应用
      await this.discoverAndRegisterApps()

      // 3. 生成组件映射
      this.generateComponentMap()

      this.initialized = true
      console.log(`Initialized app registry with ${this.apps.size} apps`)
    } catch (error) {
      console.error('Failed to initialize app registry:', error)
      throw error
    }
  }

  /**
   * 注册静态配置的应用
   */
  private registerStaticApps(): void {
    const allStaticApps = [...systemApps, ...demoApps]
    
    for (const app of allStaticApps) {
      this.apps.set(app.key, app)
    }
  }

  /**
   * 发现并注册动态应用
   */
  private async discoverAndRegisterApps(): Promise<void> {
    try {
      const discoveredApps = await this.appDiscovery.discoverApps()
      
      for (const app of discoveredApps) {
        // 避免覆盖已存在的静态配置
        if (!this.apps.has(app.key)) {
          this.apps.set(app.key, app)
        }
      }
    } catch (error) {
      console.warn('Failed to discover apps:', error)
    }
  }

  /**
   * 生成组件映射
   */
  private generateComponentMap(): void {
    for (const app of this.apps.values()) {
      const componentKey = app.component || app.key
      
      if (!this.componentMap.has(componentKey)) {
        const component = dynamicComponentLoader.loadComponent(app)
        this.componentMap.set(componentKey, component)
      }
    }
  }

  /**
   * 获取所有应用
   */
  getAllApps(): AppConfig[] {
    return Array.from(this.apps.values())
  }

  /**
   * 根据 key 获取应用
   */
  getAppByKey(key: string): AppConfig | undefined {
    return this.apps.get(key)
  }

  /**
   * 获取组件映射
   */
  getComponentMap(): Record<string, any> {
    const map: Record<string, any> = {}
    
    for (const [key, component] of this.componentMap.entries()) {
      map[key] = component
    }
    
    return map
  }

  /**
   * 动态注册应用
   */
  registerApp(app: AppConfig): void {
    this.apps.set(app.key, app)
    
    // 生成组件映射
    const componentKey = app.component || app.key
    if (!this.componentMap.has(componentKey)) {
      const component = dynamicComponentLoader.loadComponent(app)
      this.componentMap.set(componentKey, component)
    }
  }

  /**
   * 注销应用
   */
  unregisterApp(key: string): boolean {
    const app = this.apps.get(key)
    if (!app) {
      return false
    }

    this.apps.delete(key)
    
    const componentKey = app.component || app.key
    this.componentMap.delete(componentKey)
    
    return true
  }

  /**
   * 重新加载应用注册表
   */
  async reload(): Promise<void> {
    this.apps.clear()
    this.componentMap.clear()
    this.initialized = false
    
    // 清理组件加载器缓存
    dynamicComponentLoader.clearCache()
    
    await this.initialize()
  }
}

// 导出单例实例
export const enhancedAppRegistry = new EnhancedAppRegistry()

// 兼容性导出
export const getAllApps = () => enhancedAppRegistry.getAllApps()
export const getAppByKey = (key: string) => enhancedAppRegistry.getAppByKey(key)
export const registerApp = (app: AppConfig) => enhancedAppRegistry.registerApp(app)
export const unregisterApp = (key: string) => enhancedAppRegistry.unregisterApp(key)
```

### 5. 更新 App.vue 组件

```vue
<!-- src/components/App.vue (更新后) -->
<template>
  <div class="moveBg" @mousemove="mouseMove" @mouseup="mouseUp" @mouseleave.stop="mouseLeave" :style="{
    pointerEvents: isBoxResizing || isBoxMoving ? 'auto' : 'none',
    zIndex: isFullScreen ? 999 : app.isTop ? 98 : 88,
  }">
    <!-- 窗口结构保持不变 -->
    <div class="box" :style="{
      left: nowRect.left + 'px',
      top: nowRect.top + 'px',
      bottom: nowRect.bottom + 'px',
      right: nowRect.right + 'px',
    }" :class="getExtBoxClasses">
      <!-- ... 窗口控制部分 ... -->
      <div class="box-center">
        <div class="box-center-left" @mousedown="resizeMouseDown"></div>
        <div class="box-center-center loader" @mousedown.stop="showThisApp">
          <div class="app-bar" :style="{ backgroundColor: app.titleBgColor }" @mousedown.stop="positionMouseDown"
            v-on:dblclick="appBarDoubleClicked">
            <!-- ... 标题栏 ... -->
          </div>
          <div class="app-body">
            <!-- 使用动态组件加载 -->
            <component 
              :is="getAppComponent(app)" 
              :app="app" 
              @api="appEvent"
              @error="handleComponentError"
            ></component>
          </div>
        </div>
        <div class="box-center-right" @mousedown="resizeMouseDown"></div>
      </div>
      <!-- ... 其他部分 ... -->
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, reactive, watch, onMounted, computed, ref } from 'vue'
import { useAppManager } from '@/composables/useAppManager'
import { enhancedAppRegistry } from '@/config/apps/enhanced-app-registry'

// 使用组合式函数
const { closeApp: closeAppManager, hideApp: hideAppManager, showApp: showAppManager, openApp: openAppManager, openAppWithData, closeAppByPid, openApps } = useAppManager()

// Props
const props = defineProps({
  app: Object
})

// 响应式数据
const appData = reactive({
  title: ''
})

const componentMap = ref({})
const componentError = ref(null)

// 初始化
onMounted(async () => {
  try {
    // 初始化增强的应用注册表
    await enhancedAppRegistry.initialize()
    
    // 获取组件映射
    componentMap.value = enhancedAppRegistry.getComponentMap()
  } catch (error) {
    console.error('Failed to initialize app registry:', error)
  }
})

// 方法
const getAppComponent = (app) => {
  const componentKey = app.component || app.key
  return componentMap.value[componentKey] || null
}

const handleComponentError = (error) => {
  console.error('Component error:', error)
  componentError.value = error
}

// ... 其他现有方法保持不变 ...
</script>
```

## 使用指南

### 1. 添加新应用（基于约定）

开发者只需要：

1. 在 `src/views/apps/custom/` 目录下创建 Vue 文件
2. 在组件中导出应用配置（可选）

```vue
<!-- src/views/apps/custom/MyNewApp.vue -->
<template>
  <div class="my-new-app">
    <h1>{{ title }}</h1>
    <p>这是我的新应用</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('我的新应用')

// 导出应用配置（可选）
export const appConfig = {
  key: 'MyNewApp',
  title: '我的新应用',
  icon: '/icons/my-app.png',
  category: 'custom',
  version: '1.0.0',
  author: '开发者',
  description: '这是一个自定义应用',
  permissions: ['storage']
}
</script>
```

### 2. 添加新应用（显式配置）

如果需要更精确的控制，可以在配置文件中明确定义：

```typescript
// src/config/apps/custom-apps.ts
import type { AppConfig } from '@/types/app'

export const customApps: AppConfig[] = [
  {
    key: 'MyAdvancedApp',
    component: 'MyAdvancedApp',
    componentPath: '@/views/apps/custom/MyAdvancedApp.vue',
    title: '高级应用',
    icon: '/icons/advanced-app.png',
    category: 'custom',
    width: 800,
    height: 600,
    resizable: true,
    version: '2.0.0',
    author: '高级开发者',
    description: '这是一个高级自定义应用',
    permissions: ['storage', 'network']
  }
]
```

### 3. 热重载支持

在开发环境中，系统会自动检测新增的 Vue 文件并重新加载应用注册表。

### 4. 生产环境优化

在构建时，系统会生成应用清单文件，确保生产环境的性能。

## 迁移指南

### 从现有系统迁移

1. **保持兼容性**：现有的应用配置和组件导入方式继续有效
2. **逐步迁移**：可以逐个应用迁移到新的动态加载方式
3. **配置更新**：更新应用配置以支持新的特性

### 迁移步骤

1. 安装新的动态加载系统
2. 更新 `App.vue` 以使用新的组件加载机制
3. 逐步移除手动的组件导入
4. 测试所有应用的正常加载

## 性能优化

### 1. 组件缓存
- 已加载的组件会被缓存，避免重复加载
- 支持预加载常用组件

### 2. 懒加载
- 组件按需加载，减少初始包大小
- 支持加载状态和错误处理

### 3. 构建优化
- 生产环境使用预生成的应用清单
- 支持代码分割和 Tree Shaking

## 错误处理

### 1. 组件加载失败
- 显示错误组件
- 提供重试机制
- 记录错误日志

### 2. 配置错误
- 验证应用配置
- 提供默认值
- 警告和降级处理

## 扩展性

### 1. 插件系统
- 支持第三方应用插件
- 动态安装和卸载
- 权限管理

### 2. 主题支持
- 应用级主题配置
- 动态主题切换
- 自定义样式

## 总结

本方案通过引入动态组件加载器、应用自动发现和增强的注册表，实现了以下目标：

1. **简化开发流程**：开发者只需添加 Vue 文件即可
2. **自动化管理**：系统自动发现和注册应用
3. **保持兼容性**：现有应用无需修改
4. **性能优化**：支持懒加载和缓存
5. **错误处理**：完善的错误处理和降级机制
6. **扩展性强**：支持插件和主题系统

该方案为 BG-WebMacOS 项目提供了一个现代化、自动化的应用管理系统，大大提升了开发效率和用户体验。