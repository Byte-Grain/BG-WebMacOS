// 导入组合式函数
import { useAppManager } from './useAppManager'
import { useTheme } from './useTheme'
import { useSystem } from './useSystem'
import { useUtils } from './useUtils'
import { useKeyboard } from './useKeyboard'
import { useNotification } from './useNotification'
import { useEventBus, useEventBusLegacy } from './useEventBus'
import { useErrorMonitor } from './useErrorMonitor'
import { usePerformanceMonitor } from './usePerformanceMonitor'
import { usePerformance } from './usePerformance'
import { useEnterpriseEventManager } from './useEnterpriseEventManager'

// 组合式函数统一导出
export { useAppManager } from './useAppManager'
export { useTheme } from './useTheme'
export { useSystem } from './useSystem'
export { useUtils } from './useUtils'
export { 
  useEventBus, 
  useEventBusLegacy, 
  eventBus, 
  EVENTS, 
  EVENT_NAMESPACES 
} from './useEventBus'
export { useKeyboard, globalKeyboard } from './useKeyboard'
export { useNotification, globalNotification, notify } from './useNotification'

// 事件系统中期优化组件
export { useEventMiddleware } from './useEventMiddleware'
export { useBuiltInMiddlewares } from './useBuiltInMiddlewares'
export { useEventRouter } from './useEventRouter'
export { useEventLifecycle } from './useEventLifecycle'
export { useEventDebugger } from './useEventDebugger'
export { useEnterpriseEventManager } from './useEnterpriseEventManager'

// 错误监控导出
export {
  useErrorMonitor,
  getGlobalErrorMonitor,
  captureError,
  captureException,
} from './useErrorMonitor'

// 性能监控导出
export {
  usePerformanceMonitor,
  getGlobalPerformanceMonitor,
  getCurrentPerformanceMetrics,
  checkPerformanceHealth,
} from './usePerformanceMonitor'

// 性能优化工具导出
export {
  usePerformance,
  useVirtualScroll
} from './usePerformance'

// 事件系统类型导出
export type { 
  EventCallback, 
  EventListener, 
  EventName, 
  EventData,
  EventDataMap,
  EventStats,
  EventFilter
} from './useEventBus'

// 错误监控类型导出
export type {
  ErrorInfo,
  PerformanceMetric,
  ErrorMonitorConfig,
  ErrorType,
  ErrorSeverity,
} from './useErrorMonitor'

// 性能监控类型导出
export type {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceMonitorConfig,
} from './usePerformanceMonitor'

// 其他类型导出
export type { ModifierKeys, ShortcutConfig, ShortcutHandler } from './useKeyboard'
export type { NotificationType, NotificationPosition, NotificationConfig, NotificationAction, NotificationInstance } from './useNotification'

// 类型导出
export type {
  AppConfig,
  AppMenu,
  AppState,
  AppMutations,
} from '@/types/app'

export type {
  Theme,
  SystemState,
} from '@/constants'

// 核心组合式函数集合
export function useCore(options: {
  namespace?: string
  debugMode?: boolean
  enableErrorMonitoring?: boolean
  enablePerformanceMonitoring?: boolean
  performanceConfig?: Partial<PerformanceMonitorConfig>
} = {}) {
  const { 
    enableErrorMonitoring = true, 
    enablePerformanceMonitoring = false,
    performanceConfig = {},
    ...eventBusOptions 
  } = options
  
  const appManager = useAppManager()
  const theme = useTheme()
  const system = useSystem()
  const utils = useUtils()
  const eventBus = useEventBus({
    namespace: eventBusOptions.namespace || 'core',
    debugMode: eventBusOptions.debugMode || false
  })
  const keyboard = useKeyboard()
  const notification = useNotification()
  
  // 可选的错误监控
  const errorMonitor = enableErrorMonitoring ? useErrorMonitor({
    enabled: true,
    autoReport: true,
    enablePerformanceMonitoring: true,
    enableNetworkMonitoring: true
  }) : null
  
  // 可选的性能监控
  const performanceMonitor = enablePerformanceMonitoring ? usePerformanceMonitor({
    enabled: true,
    autoReport: true,
    ...performanceConfig
  }) : null
  
  return {
    ...appManager,
    ...theme,
    ...system,
    ...utils,
    ...eventBus,
    ...keyboard,
    ...notification,
    ...(errorMonitor && { errorMonitor }),
    ...(performanceMonitor && { performanceMonitor })
  }
}

// 向后兼容的核心函数
export function useCoreLegacy() {
  return {
    ...useAppManager(),
    ...useTheme(),
    ...useSystem(),
    ...useUtils(),
    ...useEventBusLegacy(),
    ...useKeyboard(),
    ...useNotification(),
  }
}