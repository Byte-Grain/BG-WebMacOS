// 组合式函数统一导出
export { useAppManager } from './useAppManager'
export { useTheme } from './useTheme'
export { useSystem } from './useSystem'
export { useUtils } from './useUtils'
export { useEventBus, eventBus, EVENTS } from './useEventBus'
export { useKeyboard, globalKeyboard } from './useKeyboard'
export { useNotification, globalNotification, notify } from './useNotification'
export type { EventCallback, EventListener, EventName } from './useEventBus'
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
export function useCore() {
  return {
    ...useAppManager(),
    ...useTheme(),
    ...useSystem(),
    ...useUtils(),
    ...useEventBus(),
    ...useKeyboard(),
    ...useNotification(),
  }
}