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

// 便捷的组合导出
export function useCore(options: {
  namespace?: string
  debugMode?: boolean
} = {}) {
  const eventBus = useEventBus({
    namespace: options.namespace || 'core',
    debugMode: options.debugMode || false
  })
  
  return {
    ...useAppManager(),
    ...useTheme(),
    ...useSystem(),
    ...useUtils(),
    ...eventBus,
    ...useKeyboard(),
    ...useNotification(),
  }
}

// 向后兼容的useCore函数
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