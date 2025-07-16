# BG-WebMacOS 项目架构规划

## 项目概述

BG-WebMacOS 是一个基于 Vue 3 的 Web 版 macOS 界面框架，旨在为开发者提供一个可扩展的应用开发平台。开发者可以通过应用（App）的形式将功能模块注入到框架中，最终形成一个集成多种应用的产品集合。

## 核心特性

- 🖥️ **macOS 风格界面**：完整还原 macOS 的视觉体验
- 📱 **应用生态系统**：支持系统应用、演示应用和自定义应用
- 🔧 **动态应用加载**：支持静态配置和动态发现两种应用注册方式
- 🎨 **主题系统**：支持多主题切换
- 🌐 **国际化支持**：内置中英文语言切换
- ⚡ **现代化技术栈**：Vue 3 + TypeScript + Vite

## 技术架构

### 前端技术栈

- **框架**: Vue 3.5.17 + TypeScript 5.8.3
- **构建工具**: Vite 7.0.4
- **状态管理**: Vuex 4.1.0
- **UI 组件库**: Element Plus 2.10.4
- **路由**: Vue Router 4.5.1
- **国际化**: Vue I18n 11.1.9
- **包管理**: PNPM 9.15.2

### 核心模块

1. **应用注册系统** (`src/config/apps/`)
   - 增强的应用注册表 (EnhancedAppRegistry)
   - 静态应用配置 (system-apps.ts, custom-apps.ts)
   - 动态应用发现 (AppDiscovery)

2. **组件系统** (`src/components/`)
   - 布局组件 (Desktop, Launchpad, Dock)
   - 通用组件 (Background, Loading, Notification)
   - 应用组件 (各类应用的具体实现)

3. **状态管理** (`src/store/`)
   - 应用状态管理
   - 用户登录状态
   - 系统设置

4. **组合式函数** (`src/composables/`)
   - 应用管理 (useAppManager)
   - 事件系统 (useEventBus)
   - 主题管理 (useTheme)
   - 系统功能 (useSystem)

5. **服务层** (`src/services/`)
   - 应用服务 (AppService)
   - 应用包管理 (AppPackageManager)
   - 应用商店服务 (AppStoreService)

## 目录结构规划

### 当前目录结构分析

```
src/
├── MacOS.vue                 # 主入口组件
├── main.ts                   # 应用入口文件
├── app/                      # 应用配置目录
│   ├── config/              # 应用级配置
│   ├── router/              # 路由配置
│   └── store/               # 状态管理
├── applications/             # 用户自定义应用目录
├── components/               # 组件目录
│   ├── App.vue
│   ├── Login.vue
│   ├── apps/                # 应用相关组件
│   ├── business/            # 业务组件
│   ├── common/              # 通用组件
│   ├── layout/              # 布局组件
│   └── store/               # 组件级状态
├── composables/              # 组合式函数
├── config/                   # 配置文件
│   ├── apps/                # 应用配置
│   ├── system/              # 系统配置
│   ├── env.config.ts        # 环境配置
│   └── theme.config.ts      # 主题配置
├── features/                 # 功能模块
│   ├── apps/                # 应用功能
│   ├── desktop/             # 桌面功能
│   ├── system/              # 系统功能
│   └── ui/                  # UI功能
├── services/                 # 服务层
├── shared/                   # 共享资源
│   ├── components/          # 共享组件
│   ├── composables/         # 共享组合式函数
│   ├── constants/           # 共享常量
│   ├── services/            # 共享服务
│   ├── types/               # 共享类型
│   └── utils/               # 共享工具
├── views/                    # 页面视图
│   ├── apps/                # 应用页面
│   │   ├── system/          # 系统应用
│   │   ├── demo/            # 演示应用
│   │   └── custom/          # 自定义应用
│   ├── desktop/             # 桌面页面
│   ├── login/               # 登录页面
│   └── test/                # 测试页面
└── utils/                    # 工具函数
```

### 优化后的目录结构

基于项目的发展需求和最佳实践，建议进行以下目录结构优化：

```
src/
├── main.ts                   # 应用入口
├── MacOS.vue                 # 主组件
├── app/                      # 应用核心
│   ├── config/              # 应用配置
│   ├── plugins/             # 应用插件
│   ├── router/              # 路由配置
│   └── store/               # 全局状态
├── core/                     # 核心系统 (新增)
│   ├── app-registry/        # 应用注册系统
│   ├── component-loader/    # 组件加载器
│   ├── event-system/        # 事件系统
│   ├── plugin-system/       # 插件系统
│   └── security/            # 安全模块
├── platform/                # 平台层 (重构)
│   ├── desktop/             # 桌面环境
│   ├── dock/                # Dock 系统
│   ├── launchpad/           # 启动台
│   ├── menubar/             # 菜单栏
│   ├── notification/        # 通知系统
│   └── window-manager/      # 窗口管理
├── applications/             # 应用目录 (扩展)
│   ├── built-in/            # 内置应用
│   │   ├── system/          # 系统应用
│   │   └── utilities/       # 实用工具
│   ├── third-party/         # 第三方应用
│   ├── user-custom/         # 用户自定义应用
│   └── marketplace/         # 应用市场应用
├── shared/                   # 共享资源 (保持)
│   ├── components/          # 共享组件
│   ├── composables/         # 共享组合式函数
│   ├── constants/           # 常量定义
│   ├── services/            # 共享服务
│   ├── types/               # 类型定义
│   └── utils/               # 工具函数
├── features/                 # 功能模块 (保持)
│   ├── auth/                # 认证功能
│   ├── settings/            # 设置功能
│   ├── themes/              # 主题功能
│   └── i18n/                # 国际化功能
├── api/                      # API 层 (新增)
│   ├── client/              # API 客户端
│   ├── endpoints/           # 端点定义
│   ├── interceptors/        # 拦截器
│   └── types/               # API 类型
└── assets/                   # 静态资源
    ├── fonts/               # 字体文件
    ├── icons/               # 图标资源
    ├── images/              # 图片资源
    └── styles/              # 样式文件
```

## 数据迁移计划

### 第一阶段：核心系统重构

1. **应用注册系统迁移**
   - 将 `src/config/apps/` 迁移到 `src/core/app-registry/`
   - 优化应用配置结构
   - 增强类型定义

2. **组件加载器优化**
   - 将 `src/utils/dynamicComponentLoader.ts` 迁移到 `src/core/component-loader/`
   - 增加缓存机制
   - 支持懒加载

3. **事件系统重构**
   - 将事件相关的组合式函数迁移到 `src/core/event-system/`
   - 统一事件管理
   - 增加事件调试功能

### 第二阶段：平台层重构

1. **桌面环境模块化**
   - 将桌面相关组件迁移到 `src/platform/desktop/`
   - 分离桌面逻辑和UI

2. **窗口管理系统**
   - 创建 `src/platform/window-manager/`
   - 实现窗口生命周期管理
   - 支持多窗口操作

3. **Dock 和 Launchpad 重构**
   - 独立模块化 Dock 和 Launchpad
   - 支持自定义配置

### 第三阶段：应用生态扩展

1. **应用分类管理**
   - 重新组织 `src/applications/` 目录
   - 按应用类型分类
   - 支持应用市场

2. **插件系统**
   - 创建 `src/core/plugin-system/`
   - 支持第三方插件
   - 插件生命周期管理

3. **API 层建设**
   - 创建 `src/api/` 目录
   - 统一 API 管理
   - 支持后端集成

## 实施建议

### 迁移原则

1. **渐进式迁移**：分阶段进行，确保系统稳定性
2. **向后兼容**：保持现有 API 的兼容性
3. **类型安全**：强化 TypeScript 类型定义
4. **性能优化**：优化组件加载和渲染性能
5. **可测试性**：增加单元测试和集成测试

### 开发规范

1. **命名规范**
   - 文件名使用 kebab-case
   - 组件名使用 PascalCase
   - 函数名使用 camelCase

2. **代码组织**
   - 每个模块包含 index.ts 作为入口
   - 类型定义统一放在 types 目录
   - 工具函数放在 utils 目录

3. **文档要求**
   - 每个模块需要 README.md
   - 重要函数需要 JSDoc 注释
   - API 变更需要更新文档

## 后续发展规划

1. **应用市场**：建设应用发布和分发平台
2. **云端同步**：支持用户数据和设置云端同步
3. **移动端适配**：支持移动设备访问
4. **性能监控**：集成性能监控和错误追踪
5. **安全加固**：增强应用安全和权限管理

这个架构规划为项目的长期发展提供了清晰的路线图，确保项目能够持续演进并满足不断增长的需求。