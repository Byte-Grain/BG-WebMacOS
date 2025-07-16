// 事件系统统一导出

// 重新导出所有事件系统相关功能
export {
  // 核心类
  EventBus,
  EnhancedEventBus,
  NamespaceEventBus,
  NamespacedEventManager,
  EventFactory,
  
  // 中间件和验证器
  LoggingMiddleware,
  PerformanceMiddleware,
  ErrorHandlingMiddleware,
  BaseDataValidator,
  WindowEventValidator,
  
  // 实例
  eventBus,
  enhancedEventBus,
  namespaceManager,
  systemEventBus,
  windowEventBus,
  appEventBus,
  userEventBus,
  themeEventBus,
  networkEventBus,
  notificationEventBus,
  
  // 常量
  EVENT_NAMESPACES,
  EVENTS,
  
  // 函数
  useEventBus,
  
  // 类型
  type EventCallback,
  type EventListener,
  type EventStats,
  type EventFilter,
  type TypedEvent,
  type TypedEventListener,
  type EventCreator,
  type TypeSafeEventBus,
  type EventValidator,
  type EventMiddleware,
  type ValidatedEventBus,
  type EventDataMap,
  type EventName,
  type EventData
} from './useEventBus'
export * from './useEventBus'
export * from './useEventDebugger'
export * from './useEventLifecycle'
export * from './useEventMiddleware'
export * from './useEventRouter'
export * from './useEnterpriseEventManager'
export * from './useAppWindowEvents'
export * from './useWindowEvents'
export * from './eventConstants'
export * from './eventTypes'
export * from './AppEventManager'
export * from './AppLifecycleManager'
export * from './useAppEvent'
export { getAppEventPermissionManager, type AppEventPermissionManager } from './AppEventPermissionManager'
export { getAppEventMonitor, type AppEventMonitor } from './AppEventMonitor'
export { getAppEventConfig, type AppEventConfigManager, type AppEventSystemConfig, DEFAULT_APP_EVENT_CONFIG, CONFIG_PRESETS } from './AppEventConfig'
export { AppEventUtils, EventNameUtils, PermissionUtils, EventDataUtils, PerformanceUtils, DebugUtils, ValidationUtils } from './AppEventUtils'

// 默认导出主要功能
export { useEventBus as default } from './useEventBus'