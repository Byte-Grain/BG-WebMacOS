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
export * from './useEventDebugger'
export * from './useEventLifecycle'
export * from './useEventMiddleware'
export * from './useEventRouter'
export * from './useEnterpriseEventManager'
export * from './useAppWindowEvents'
export * from './useWindowEvents'

// 默认导出主要功能
export { useEventBus as default } from './useEventBus'