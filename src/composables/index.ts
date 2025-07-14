// 组合式函数统一导出
export { useAppManager } from './useAppManager'
export { useTheme } from './useTheme'
export { useSystem } from './useSystem'
export { useUtils } from './useUtils'

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
  }
}