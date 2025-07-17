# BG-WebMacOS 事件系统使用指南

本文档详细介绍了 BG-WebMacOS 项目中事件系统的设计、使用方法和最佳实践。

## 📋 目录

- [系统概述](#系统概述)
- [核心组件](#核心组件)
- [快速开始](#快速开始)
- [详细使用指南](#详细使用指南)
- [最佳实践](#最佳实践)
- [性能优化](#性能优化)
- [故障排除](#故障排除)
- [API 参考](#api-参考)
- [更新日志](#更新日志)

## 系统概述

BG-WebMacOS 的事件系统是一个功能强大、类型安全的事件管理解决方案，采用模块化设计，提供了完整的事件生命周期管理。

### 🎯 设计目标

- **类型安全**：完全的 TypeScript 支持，编译时类型检查
- **高性能**：优化的事件分发机制，支持大量并发事件
- **可扩展**：模块化架构，支持自定义中间件和插件
- **易调试**：内置调试工具，完整的事件追踪
- **企业级**：支持复杂的业务场景和大型应用

### 🏗️ 核心功能

BG-WebMacOS 采用了一套完整的企业级事件系统，提供了类型安全、高性能、可扩展的事件管理机制。该系统支持事件总线、中间件、路由、生命周期管理、调试、窗口事件管理等功能。

## 核心架构

### 1. 事件总线 (useEventBus)

事件总线是整个事件系统的核心，提供了事件的注册、触发、监听和管理功能。

#### 基本用法

```typescript
import { useEventBus, EVENTS } from '@/core/event-system/useEventBus'

const { on, emit, off } = useEventBus()

// 监听事件
const listenerId = on(EVENTS.APP_OPEN, (data) => {
  console.log('应用打开:', data.appKey)
})

// 触发事件
emit(EVENTS.APP_OPEN, { appKey: 'calculator' })

// 取消监听
off(EVENTS.APP_OPEN, listenerId)
```

#### 高级功能

```typescript
// 一次性监听
const onceId = once(EVENTS.SYSTEM_READY, (data) => {
  console.log('系统就绪')
})

// 异步事件处理
const result = await emitAsync(EVENTS.USER_LOGIN, {
  username: 'admin',
  timestamp: Date.now()
})

// 批量取消监听
offAll() // 取消当前组件的所有监听器
```

### 2. 事件类型定义

系统提供了完整的类型安全支持，所有事件都有明确的数据结构定义。

#### 内置事件类型

```typescript
// 应用事件
EVENTS.APP_OPEN: { appKey: string; config?: any }
EVENTS.APP_CLOSE: { appKey: string; pid?: number }
EVENTS.APP_FOCUS: { appKey: string; pid: number; previousApp?: string }

// 系统事件
EVENTS.SYSTEM_READY: { bootTime: number; version?: string }
EVENTS.SYSTEM_SHUTDOWN: { reason?: string; forced?: boolean }

// 窗口事件
EVENTS.WINDOW_FULLSCREEN: { enabled: boolean; windowId?: string }
EVENTS.WINDOW_RESIZE: { windowId?: string; width: number; height: number }

// 主题事件
EVENTS.THEME_CHANGED: { theme: string; previous?: string; timestamp: number }

// 用户事件
EVENTS.USER_LOGIN: { username: string; timestamp: number; method?: string }
```

### 3. 事件中间件 (useEventMiddleware)

中间件系统允许在事件处理前后执行自定义逻辑，支持验证、日志、缓存等功能。

#### 注册中间件

```typescript
import { useEventMiddleware } from '@/core/event-system/useEventMiddleware'

const { registerMiddleware } = useEventMiddleware()

// 日志中间件
registerMiddleware(
  {
    name: 'logger',
    type: 'before',
    priority: 100,
    enabled: true
  },
  async (context, next) => {
    console.log(`事件触发: ${context.eventName}`, context.eventData)
    await next()
  }
)

// 验证中间件
registerMiddleware(
  {
    name: 'validator',
    type: 'before',
    priority: 200,
    enabled: true,
    condition: (context) => context.eventName.startsWith('user:')
  },
  async (context, next) => {
    if (!context.eventData.username) {
      throw new Error('用户名不能为空')
    }
    await next()
  }
)
```

### 4. 事件路由 (useEventRouter)

路由系统提供基于模式的事件分发机制，支持多种分发策略。

#### 基本路由配置

```typescript
import { useEventRouter } from '@/core/event-system/useEventRouter'

const { registerRoute, addTarget } = useEventRouter()

// 注册路由
const routeId = registerRoute({
  name: 'app-events',
  pattern: /^app:/,
  priority: 100,
  enabled: true
})

// 添加处理目标
addTarget(routeId, (eventName, eventData) => {
  console.log('应用事件处理:', eventName, eventData)
}, {
  name: 'app-handler',
  priority: 100,
  enabled: true
})
```

### 5. 事件生命周期 (useEventLifecycle)

生命周期管理提供事件状态跟踪、持久化和恢复功能。

#### 生命周期监控

```typescript
import { useEventLifecycle } from '@/core/event-system/useEventLifecycle'

const { createEventRecord, updateEventStatus, getEventRecord } = useEventLifecycle()

// 创建事件记录
const eventId = createEventRecord('user:login', {
  username: 'admin',
  timestamp: Date.now()
}, {
  priority: 100,
  timeout: 5000,
  maxRetries: 3
})

// 更新事件状态
updateEventStatus(eventId, 'processing')

// 获取事件记录
const record = getEventRecord(eventId)
console.log('事件状态:', record.status)
```

### 6. 事件调试 (useEventDebugger)

调试工具提供事件流可视化、性能分析和实时监控功能。

#### 启用调试

```typescript
import { useEventDebugger } from '@/core/event-system/useEventDebugger'

const debugger = useEventDebugger()

// 启用调试
debugger.enable({
  level: 'debug',
  captureStack: true,
  trackPerformance: true,
  visualizeFlow: true
})

// 获取调试信息
const stats = debugger.getEventStatistics()
console.log('事件统计:', stats)

// 导出调试数据
const debugData = debugger.exportDebugData()
```

### 7. 企业级事件管理器 (useEnterpriseEventManager)

企业级管理器整合了所有事件系统组件，提供统一的管理接口。

### 8. 窗口事件管理器 (useWindowEvents)

窗口事件管理器提供统一的窗口操作事件处理，支持窗口状态、位置、大小管理以及应用生命周期事件处理。

#### 基本用法

```typescript
import { useWindowEvents } from '@/core/event-system/useWindowEvents'

const windowEvents = useWindowEvents()

// 监听窗口全屏事件
windowEvents.onFullscreen((data) => {
  console.log('窗口全屏状态变化:', data.enabled)
})

// 触发窗口全屏
windowEvents.toggleFullscreen(true)

// 监听窗口关闭事件
windowEvents.onClose((data) => {
  console.log('窗口关闭:', data.windowId)
})
```

### 9. 应用窗口事件 (useAppWindowEvents)

应用窗口事件为应用组件提供窗口事件能力，自动获取应用上下文信息，提供简化的事件监听和操作接口。

#### 基本用法

```typescript
import { useAppWindowEvents } from '@/core/event-system/useAppWindowEvents'

const appWindowEvents = useAppWindowEvents({
  appKey: 'calculator',
  windowId: 'calc-window-1'
})

// 应用特定的窗口事件
appWindowEvents.onAppFullscreen((enabled) => {
  console.log(`应用 ${appKey} 全屏状态:`, enabled)
})

// 触发应用窗口事件
appWindowEvents.toggleAppFullscreen()

// 监听应用关闭
appWindowEvents.onAppClose(() => {
  console.log('应用即将关闭，执行清理操作')
})
```

#### 完整配置示例

```typescript
import { useEnterpriseEventManager } from '@/core/event-system/useEnterpriseEventManager'

const eventManager = useEnterpriseEventManager({
  enableMiddleware: true,
  enableRouting: true,
  enableLifecycle: true,
  enableDebugging: true,
  
  middlewareConfig: {
    enableLogging: true,
    enableValidation: true,
    enablePerformanceMonitoring: true
  },
  
  routingConfig: {
    defaultStrategy: 'all',
    enableFailover: true,
    maxRetries: 3
  },
  
  debugConfig: {
    enabled: true,
    level: 'info',
    trackPerformance: true
  }
})

// 使用统一接口
eventManager.emit('user:login', { username: 'admin' })
eventManager.on('system:ready', (data) => {
  console.log('系统就绪')
})
```

## 详细使用指南

### 窗口事件系统详细用法

#### useWindowEvents - 全局窗口事件管理

`useWindowEvents` 提供了全局的窗口事件管理功能，支持所有窗口操作的统一处理。

```typescript
import { useWindowEvents } from '@/core/event-system/useWindowEvents'

const windowEvents = useWindowEvents()

// 窗口操作方法
windowEvents.maximizeWindow('calculator', 123) // 最大化指定应用窗口
windowEvents.minimizeWindow('calculator', 123) // 最小化窗口
windowEvents.normalizeWindow('calculator', 123) // 恢复正常大小
windowEvents.fullscreenWindow('calculator', 123) // 全屏
windowEvents.closeWindow('calculator', 123) // 关闭窗口

// 窗口属性设置
windowEvents.setWindowTitle('新标题', 'calculator', 123)
windowEvents.setWindowPosition(100, 200, 'calculator', 123)
windowEvents.setWindowSize(800, 600, 'calculator', 123)

// 焦点管理
windowEvents.focusWindow('calculator', 123)
windowEvents.blurWindow('calculator', 123)

// 应用操作
windowEvents.openApp('calculator', { mode: 'scientific' })
windowEvents.closeApp('calculator', 123)
```

#### useAppWindowEvents - 应用级窗口事件

`useAppWindowEvents` 为应用组件提供了简化的窗口事件处理，自动获取当前应用的上下文信息。

```typescript
import { useAppWindowEvents } from '@/core/event-system/useAppWindowEvents'

// 在应用组件中使用
const {
  window,      // 窗口操作方法
  app,         // 应用操作方法
  on,          // 事件监听方法
  cleanup,     // 清理方法
  getCurrentApp,
  getAppIdentifiers
} = useAppWindowEvents()

// 窗口操作（自动使用当前应用的 appKey 和 pid）
window.maximize()     // 最大化当前应用窗口
window.minimize()     // 最小化
window.normalize()    // 恢复正常
window.fullscreen()   // 全屏
window.close()        // 关闭

// 窗口属性设置
window.setTitle('计算器 - 科学模式')
window.setPosition(100, 200)
window.setSize(800, 600)
window.focus()
window.blur()

// 应用操作
app.openApp('notepad', { file: 'readme.txt' })
app.closeApp('calculator')

// 事件监听
const cleanupStateChange = on.onWindowStateChange((state) => {
  console.log('窗口状态变化:', state) // 'maximized' | 'minimized' | 'normal' | 'fullscreen'
})

const cleanupPositionChange = on.onWindowPositionChange((position) => {
  console.log('窗口位置变化:', position) // { x: number, y: number }
})

const cleanupSizeChange = on.onWindowSizeChange((size) => {
  console.log('窗口大小变化:', size) // { width: number, height: number }
})

const cleanupFocusChange = on.onWindowFocusChange((focused) => {
  console.log('窗口焦点变化:', focused) // boolean
})

const cleanupLifecycle = on.onAppLifecycle({
  onOpen: (data) => {
    console.log('应用打开:', data.appKey, data.config)
  },
  onClose: (data) => {
    console.log('应用关闭:', data.appKey, data.pid, data.reason)
  }
})

// 手动清理（组件卸载时会自动清理）
cleanup()
```

#### 窗口事件类型定义

```typescript
// 窗口事件数据类型
interface WindowEventData {
  // 窗口状态事件
  windowMaxSize: { appKey?: string; pid?: number }
  windowNormalSize: { appKey?: string; pid?: number }
  windowMinSize: { appKey?: string; pid?: number }
  windowFullSize: { appKey?: string; pid?: number }
  windowClose: { appKey?: string; pid?: number }
  
  // 应用操作事件
  openApp: { app: string; data?: any }
  closeApp: { app?: string; pid?: number }
  
  // 窗口属性事件
  setWindowTitle: { title: string; appKey?: string; pid?: number }
  setWindowPosition: { x: number; y: number; appKey?: string; pid?: number }
  setWindowSize: { width: number; height: number; appKey?: string; pid?: number }
  
  // 窗口焦点事件
  focusWindow: { appKey?: string; pid?: number }
  blurWindow: { appKey?: string; pid?: number }
}
```

#### 依赖注入支持

窗口事件管理器支持 Vue 的依赖注入机制，可以在应用级别提供统一的实例：

```typescript
// 在根组件中提供
import { provideWindowEventManager } from '@/core/event-system/useWindowEvents'

// App.vue
setup() {
  const windowEventManager = provideWindowEventManager()
  
  return {
    windowEventManager
  }
}

// 在子组件中注入使用
const windowEvents = useWindowEvents() // 自动获取注入的实例
```

#### 窗口事件与应用事件的映射关系

窗口事件系统将高级的窗口操作转换为底层的应用事件：

```typescript
// 窗口事件 -> 应用事件映射
windowMaxSize -> EVENTS.APP_MAXIMIZE
windowMinSize -> EVENTS.APP_MINIMIZE  
windowFullSize -> EVENTS.WINDOW_FULLSCREEN
windowClose -> EVENTS.APP_CLOSE
setWindowPosition -> EVENTS.APP_MOVE
setWindowSize -> EVENTS.APP_RESIZE
focusWindow -> EVENTS.APP_FOCUS
blurWindow -> EVENTS.WINDOW_BLUR
```

### 事件总线详细用法

#### 基本事件操作

```typescript
import { useEventBus, EVENTS } from '@/core/event-system/useEventBus'

const { on, emit, off, once } = useEventBus()

// 监听事件
const listenerId = on(EVENTS.USER_LOGIN, (data) => {
  console.log('用户登录:', data.username)
})

// 触发事件
emit(EVENTS.USER_LOGIN, {
  username: 'admin',
  timestamp: Date.now()
})

// 一次性监听
once(EVENTS.SYSTEM_READY, (data) => {
  console.log('系统就绪')
})

// 移除监听器
off(EVENTS.USER_LOGIN, listenerId)
```

## 实际应用示例

### 1. 应用窗口事件处理

```typescript
// src/shared/components/App.vue
import { useEventBus, EVENTS } from '@/core/event-system/useEventBus'

const { eventBus } = useEventBus()

// 监听全屏事件
const fullscreenId = eventBus.on(EVENTS.WINDOW_FULLSCREEN, (data) => {
  isFullScreen.value = data.enabled
  console.log(`窗口全屏状态: ${data.enabled}`)
})

// 触发全屏事件
function switchFullScreen() {
  const newFullScreenState = !isFullScreen.value
  isFullScreen.value = newFullScreenState
  
  eventBus.emit(EVENTS.WINDOW_FULLSCREEN, {
    enabled: newFullScreenState,
    windowId: props.app.key
  })
}
```

### 2. Dock 组件响应全屏事件

```typescript
// src/platform/dock/Dock.vue
import { EVENTS, useEventBus } from '@/core/event-system/useEventBus'

const { eventBus } = useEventBus()
const isHidden = ref(false)

onMounted(() => {
  // 监听全屏事件，自动隐藏/显示 Dock
  const fullscreenListenerId = eventBus.on(EVENTS.WINDOW_FULLSCREEN, (data) => {
    isHidden.value = data.enabled
    console.log(`Dock 隐藏状态: ${data.enabled}`)
  })
  
  onUnmounted(() => {
    eventBus.off(EVENTS.WINDOW_FULLSCREEN, fullscreenListenerId)
  })
})
```

### 3. 系统级事件处理

```typescript
// src/MacOS.vue
import { useEventBus, EVENTS } from '@/core/event-system/useEventBus'

const { on, emit } = useEventBus()

// 系统启动
function bootSystem() {
  emit(EVENTS.SYSTEM_READY, {
    bootTime: Date.now(),
    version: '1.0.0'
  })
}

// 监听应用打开事件
on(EVENTS.APP_OPENED, (data) => {
  console.log(`应用 ${data.appKey} 已打开，PID: ${data.pid}`)
})

// 监听主题变化
on(EVENTS.THEME_CHANGED, (data) => {
  console.log(`主题已切换: ${data.previous} -> ${data.theme}`)
})
```

## 最佳实践

### 1. 事件命名规范

- 使用命名空间：`app:open`, `system:ready`, `user:login`
- 动作明确：使用动词描述事件动作
- 状态区分：区分动作事件和状态事件（如 `opening` vs `opened`）

### 2. 类型安全

- 始终使用 TypeScript 类型定义
- 为自定义事件添加类型映射
- 利用编译时类型检查避免运行时错误

### 3. 性能优化

- 及时清理事件监听器，避免内存泄漏
- 使用 `once` 监听一次性事件
- 合理设置事件优先级
- 避免在事件处理器中执行耗时操作

### 4. 错误处理

- 在事件处理器中添加错误捕获
- 使用中间件统一处理错误
- 记录事件处理失败的详细信息

### 5. 调试和监控

- 在开发环境启用事件调试
- 使用性能监控识别瓶颈
- 定期检查事件统计信息

## 常见问题

### Q: 如何避免事件监听器内存泄漏？

A: 使用 `useEventBus` 的自动清理功能，或在组件卸载时手动调用 `offAll()`：

```typescript
const { on, offAll } = useEventBus({ autoCleanup: true })

onUnmounted(() => {
  offAll() // 清理所有监听器
})
```

### Q: 如何处理异步事件？

A: 使用 `emitAsync` 方法：

```typescript
const results = await emitAsync(EVENTS.USER_LOGIN, loginData)
console.log('所有处理器执行完成:', results)
```

### Q: 如何调试事件流？

A: 启用事件调试器：

```typescript
const debugger = useEventDebugger()
debugger.enable({ level: 'debug', visualizeFlow: true })
```

### Q: 如何实现事件的条件监听？

A: 使用中间件的条件功能：

```typescript
registerMiddleware({
  name: 'conditional',
  type: 'before',
  condition: (context) => context.eventData.userId === currentUserId
}, handler)
```

## 废弃代码清理

### 🗑️ 清理策略

为了保持代码库的整洁和性能，建议定期清理废弃的事件相关代码：

#### 1. 废弃事件类型清理

```typescript
// ❌ 废弃的事件类型（已标记为 @deprecated）
EVENTS.OLD_APP_LAUNCH // 使用 EVENTS.APP_OPEN 替代
EVENTS.LEGACY_WINDOW_RESIZE // 使用 EVENTS.WINDOW_RESIZE 替代

// ✅ 推荐的清理方式
// 1. 搜索项目中的废弃事件使用
// 2. 逐步迁移到新的事件类型
// 3. 移除废弃的事件定义
```

#### 2. 无用监听器清理

```typescript
// 使用事件调试器识别无用监听器
const debugger = useEventDebugger()
const unusedListeners = debugger.getUnusedListeners()

// 自动清理长时间未触发的监听器
unusedListeners.forEach(listener => {
  if (listener.lastTriggered < Date.now() - 30 * 24 * 60 * 60 * 1000) {
    console.warn(`清理无用监听器: ${listener.eventName}`)
    off(listener.eventName, listener.id)
  }
})
```

#### 3. 中间件清理

```typescript
// 清理禁用的中间件
const { cleanupDisabledMiddleware } = useEventMiddleware()
cleanupDisabledMiddleware()

// 清理过期的路由规则
const { cleanupExpiredRoutes } = useEventRouter()
cleanupExpiredRoutes()
```

### 📊 清理检查清单

- [ ] 检查并移除 `@deprecated` 标记的事件类型
- [ ] 清理未使用的事件监听器
- [ ] 移除禁用的中间件
- [ ] 清理过期的路由规则
- [ ] 删除无用的事件生命周期记录
- [ ] 清理调试数据和日志

## 总结

BG-WebMacOS 的事件系统提供了完整的企业级事件管理解决方案，支持类型安全、高性能、可扩展的事件处理。通过合理使用事件总线、中间件、路由等功能，可以构建松耦合、易维护的应用架构。

### 🚀 开发建议

建议在开发过程中：
1. 优先使用内置事件类型
2. 遵循事件命名规范
3. 及时清理事件监听器
4. 启用调试和监控功能
5. 编写单元测试验证事件逻辑
6. 定期执行废弃代码清理
7. 监控事件系统性能指标

### 📈 持续改进

- **性能监控**：定期检查事件处理性能
- **代码审查**：确保事件使用符合最佳实践
- **文档更新**：及时更新事件类型和使用说明
- **版本管理**：合理规划事件系统的版本升级

通过这些最佳实践，可以充分发挥事件系统的优势，提高开发效率和代码质量。

## 更新日志

### v2.0.0 - 废弃代码清理 (2024-01-XX)

#### 🗑️ 移除的废弃功能

1. **Legacy 事件总线方法**
   - 移除 `useEventBusLegacy()` 函数
   - 移除 `onLegacy()` 和 `emitLegacy()` 方法
   - 移除 `useCoreLegacy()` 组合式函数

2. **Legacy 应用窗口事件**
   - 移除 `legacyEmit()` 兼容性方法
   - 统一使用新的窗口事件处理机制

3. **Legacy 通知系统**
   - 移除 `convertPlatformToLegacy()` 转换函数
   - 移除 `convertLegacyToPlatform()` 转换函数
   - 直接使用平台通知配置

4. **重复的事件常量定义**
   - 移除 `shared/constants/index.ts` 中的 `BASIC_EVENTS` 和 `EVENTS`
   - 移除 `EventName` 类型导出
   - 统一使用 `@/core/event-system/useEventBus.ts` 中的事件定义

#### ✨ 改进内容

- **类型安全增强**：移除 Legacy 方法后，所有事件操作都具有完整的类型检查
- **性能优化**：减少不必要的类型转换和兼容性代码
- **代码简化**：移除冗余代码，提高代码可读性和维护性
- **文档完善**：更新使用指南，添加废弃代码清理策略

#### 🔄 迁移指南

如果你的代码中使用了以下废弃功能，请按照下面的方式进行迁移：

```typescript
// ❌ 废弃用法
import { useEventBusLegacy } from '@/shared/composables'
const { onLegacy, emitLegacy } = useEventBusLegacy()

// ✅ 新的用法
import { useEventBus, EVENTS } from '@/core/event-system'
const { on, emit } = useEventBus()

// ❌ 废弃的事件常量导入
import { EVENTS } from '@/shared/constants'

// ✅ 新的事件常量导入
import { EVENTS } from '@/core/event-system/useEventBus'
```

#### 📋 检查清单

在升级到 v2.0.0 后，请检查以下内容：

- [ ] 更新所有 `useEventBusLegacy` 的使用
- [ ] 替换 `onLegacy` 和 `emitLegacy` 方法调用
- [ ] 更新事件常量的导入路径
- [ ] 移除对 `legacyEmit` 的调用
- [ ] 验证所有事件监听和触发功能正常

---

*最后更新时间：2024-01-XX*  
*文档版本：v2.0.0*