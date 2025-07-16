// 导入组合式函数
import { useAppManager } from '../shared/composables/core/useAppManager'
import { useTheme } from '../shared/composables/ui/useTheme'
import { useSystem } from '../shared/composables/core/useSystem'
import { useUtils } from '../shared/composables/utils/useUtils'
import { useKeyboard } from '../shared/composables/ui/useKeyboard'
import { useNotification } from '../shared/composables/ui/useNotification'
import { useEventBus, useEventBusLegacy } from '../shared/composables/core/useEventBus'
import { useErrorMonitor } from '../shared/composables/utils/useErrorMonitor'
import { usePerformanceMonitor } from '../shared/composables/utils/usePerformanceMonitor'
import { usePerformance } from '../shared/composables/utils/usePerformance'
import { useEnterpriseEventManager } from '../shared/composables/core/useEnterpriseEventManager'
import { useDesktopGesture, GESTURE_DIRECTIONS, DEFAULT_GESTURE_CONFIG } from '../shared/composables/ui/useDesktopGesture'
import { useAppWindowEvents } from '../shared/composables/core/useAppWindowEvents'

// 组合式函数统一导出
export { useAppManager } from '../shared/composables/core/useAppManager'
export { useTheme } from '../shared/composables/ui/useTheme'
export { useSystem } from '../shared/composables/core/useSystem'
export { useUtils } from '../shared/composables/utils/useUtils'
export { 
  useEventBus, 
  useEventBusLegacy, 
  eventBus, 
  EVENTS, 
  EVENT_NAMESPACES 
} from '../shared/composables/core/useEventBus'
export { useKeyboard, globalKeyboard } from '../shared/composables/ui/useKeyboard'
export { useNotification, globalNotification, notify } from '../shared/composables/ui/useNotification'
export { useDesktopGesture, GESTURE_DIRECTIONS, DEFAULT_GESTURE_CONFIG } from '../shared/composables/ui/useDesktopGesture'

// 事件系统中期优化组件
export { useEventMiddleware } from '../shared/composables/core/useEventMiddleware'
export { useBuiltInMiddlewares } from '../shared/composables/core/useBuiltInMiddlewares'
export { useEventRouter } from '../shared/composables/core/useEventRouter'
export { useEventLifecycle } from '../shared/composables/core/useEventLifecycle'
export { useEventDebugger } from '../shared/composables/core/useEventDebugger'
export { useEnterpriseEventManager } from '../shared/composables/core/useEnterpriseEventManager'
export { useAppWindowEvents } from '../shared/composables/core/useAppWindowEvents'

// 错误监控导出
export {
  useErrorMonitor,
  getGlobalErrorMonitor,
  captureError,
  captureException,
} from '../shared/composables/utils/useErrorMonitor'

// 性能监控导出
export {
  usePerformanceMonitor,
  getGlobalPerformanceMonitor,
  getCurrentPerformanceMetrics,
  checkPerformanceHealth,
} from '../shared/composables/utils/usePerformanceMonitor'

// 性能优化工具导出
export {
  usePerformance,
  useVirtualScroll
} from '../shared/composables/utils/usePerformance'

// 事件系统类型导出
export type { 
  EventCallback, 
  EventListener, 
  EventName, 
  EventData,
  EventDataMap,
  EventStats,
  EventFilter
} from '../shared/composables/core/useEventBus'

// 错误监控类型导出
export type {
  ErrorInfo,
  PerformanceMetric,
  ErrorMonitorConfig,
  ErrorType,
  ErrorSeverity,
} from '../shared/composables/utils/useErrorMonitor'

// 性能监控类型导出
export type {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceMonitorConfig,
} from '../shared/composables/utils/usePerformanceMonitor'

// 其他类型导出
export type { ModifierKeys, ShortcutConfig, ShortcutHandler } from '../shared/composables/ui/useKeyboard'
export type { NotificationType, NotificationPosition, NotificationConfig, NotificationAction, NotificationInstance } from '../shared/composables/ui/useNotification'
export type { GestureConfig, GestureEventData, GestureDirection } from '../shared/composables/ui/useDesktopGesture'

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