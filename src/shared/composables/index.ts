// 导入组合式函数
import { useAppManager } from './core/useAppManager'
import { useTheme } from './ui/useTheme'
import { useSystem } from './core/useSystem'
import { useUtils } from './utils/useUtils'
import { useKeyboard } from './ui/useKeyboard'
import { useNotification } from './ui/useNotification'
import { useEventBus } from '@core/event-system/useEventBus'
import { useErrorMonitor } from './utils/useErrorMonitor'
import { usePerformanceMonitor } from './utils/usePerformanceMonitor'
import { usePerformance } from './utils/usePerformance'
import { useEnterpriseEventManager } from '@core/event-system/useEnterpriseEventManager'
import { useDesktopGesture, GESTURE_DIRECTIONS, DEFAULT_GESTURE_CONFIG } from './ui/useDesktopGesture'
import { useAppWindowEvents } from '@core/event-system/useAppWindowEvents'

// 组合式函数统一导出
export { useAppManager } from './core/useAppManager'
export { useTheme } from './ui/useTheme'
export { useSystem } from './core/useSystem'
export { useUtils } from './utils/useUtils'
export { 
  useEventBus, 
  eventBus, 
  EVENTS, 
  EVENT_NAMESPACES 
} from '@core/event-system/useEventBus'
export { useKeyboard, globalKeyboard } from './ui/useKeyboard'
export { useNotification, globalNotification, notify } from './ui/useNotification'
export { useDesktopGesture, GESTURE_DIRECTIONS, DEFAULT_GESTURE_CONFIG } from './ui/useDesktopGesture'

// 事件系统中期优化组件
export { useEventMiddleware } from '@core/event-system/useEventMiddleware'
export { useBuiltInMiddlewares } from '@core/event-system/useBuiltInMiddlewares'
export { useEventRouter } from '@core/event-system/useEventRouter'
export { useEventLifecycle } from '@core/event-system/useEventLifecycle'
export { useEventDebugger } from '@core/event-system/useEventDebugger'
export { useEnterpriseEventManager } from '@core/event-system/useEnterpriseEventManager'
export { useAppWindowEvents } from '@core/event-system/useAppWindowEvents'

// 错误监控导出
export {
  useErrorMonitor,
  getGlobalErrorMonitor,
  captureError,
  captureException,
} from './utils/useErrorMonitor'

// 性能监控导出
export {
  usePerformanceMonitor,
  getGlobalPerformanceMonitor,
  getCurrentPerformanceMetrics,
  checkPerformanceHealth,
} from './utils/usePerformanceMonitor'

// 性能优化工具导出
export {
  usePerformance,
  useVirtualScroll
} from './utils/usePerformance'

// 事件系统类型导出
export type { 
  EventCallback, 
  EventListener, 
  EventName, 
  EventData,
  EventDataMap,
  EventStats,
  EventFilter
} from '@core/event-system/useEventBus'

// 错误监控类型导出
export type {
  ErrorInfo,
  PerformanceMetric,
  ErrorMonitorConfig,
  ErrorType,
  ErrorSeverity,
} from './utils/useErrorMonitor'

// 性能监控类型导出
export type {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceMonitorConfig,
} from './utils/usePerformanceMonitor'

// 其他类型导出
export type { ModifierKeys, ShortcutConfig, ShortcutHandler } from './ui/useKeyboard'
export type { NotificationType, NotificationPosition, NotificationConfig, NotificationAction, NotificationInstance } from './ui/useNotification'
export type { GestureConfig, GestureEventData, GestureDirection } from './ui/useDesktopGesture'

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
} from '@shared/constants'

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
