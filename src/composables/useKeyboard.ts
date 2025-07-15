import { ref, onMounted, onUnmounted } from 'vue'
import { useEventBus, EVENTS } from './useEventBus'

// 键盘修饰键
export interface ModifierKeys {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean // Command 键 (macOS) 或 Windows 键
}

// 快捷键配置
export interface ShortcutConfig {
  key: string
  modifiers?: ModifierKeys
  description?: string
  preventDefault?: boolean
  stopPropagation?: boolean
}

// 快捷键处理函数
export type ShortcutHandler = (event: KeyboardEvent) => void

// 快捷键注册项
interface ShortcutRegistration {
  id: string
  config: ShortcutConfig
  handler: ShortcutHandler
}

// 键盘管理组合式函数
export function useKeyboard() {
  const { emit } = useEventBus()
  
  // 已注册的快捷键
  const shortcuts = ref<Map<string, ShortcutRegistration>>(new Map())
  
  // 当前按下的键
  const pressedKeys = ref<Set<string>>(new Set())
  
  // 修饰键状态
  const modifierState = ref<ModifierKeys>({
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  })

  // 生成快捷键唯一标识
  const generateShortcutId = (config: ShortcutConfig): string => {
    const modifiers = []
    if (config.modifiers?.ctrl) modifiers.push('ctrl')
    if (config.modifiers?.alt) modifiers.push('alt')
    if (config.modifiers?.shift) modifiers.push('shift')
    if (config.modifiers?.meta) modifiers.push('meta')
    
    const key = config.key ? config.key.toLowerCase() : ''
    return `${modifiers.join('+')}${modifiers.length ? '+' : ''}${key}`
  }

  // 检查快捷键是否匹配
  const isShortcutMatch = (event: KeyboardEvent, config: ShortcutConfig): boolean => {
    // 检查主键
    if (!event.key || event.key.toLowerCase() !== config.key.toLowerCase()) {
      return false
    }

    // 检查修饰键
    const modifiers = config.modifiers || {}
    return (
      !!event.ctrlKey === !!modifiers.ctrl &&
      !!event.altKey === !!modifiers.alt &&
      !!event.shiftKey === !!modifiers.shift &&
      !!event.metaKey === !!modifiers.meta
    )
  }

  // 键盘按下事件处理
  const handleKeyDown = (event: KeyboardEvent): void => {
    // 更新按键状态
    if (event.key && event.key !== null) {
      pressedKeys.value.add(event.key.toLowerCase())
    }
    
    // 更新修饰键状态
    modifierState.value = {
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    }

    // 检查是否匹配已注册的快捷键
    for (const [, registration] of shortcuts.value) {
      if (isShortcutMatch(event, registration.config)) {
        // 阻止默认行为
        if (registration.config.preventDefault !== false) {
          event.preventDefault()
        }
        
        // 阻止事件冒泡
        if (registration.config.stopPropagation) {
          event.stopPropagation()
        }

        // 执行处理函数
        try {
          registration.handler(event)
          
          // 触发全局快捷键事件
          emit(EVENTS.KEYBOARD_SHORTCUT, {
            key: registration.config.key,
            modifiers: Object.keys(registration.config.modifiers || {}).filter(key => registration.config.modifiers?.[key as keyof ModifierKeys]),
            action: registration.config.description || 'unknown',
            timestamp: Date.now()
          })
        } catch (error) {
          console.error(`Error executing shortcut handler for '${registration.id}':`, error)
        }
        
        break // 只执行第一个匹配的快捷键
      }
    }
  }

  // 键盘释放事件处理
  const handleKeyUp = (event: KeyboardEvent): void => {
    // 更新按键状态
    if (event.key && event.key !== null) {
      pressedKeys.value.delete(event.key.toLowerCase())
    }
    
    // 更新修饰键状态
    modifierState.value = {
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    }
  }

  // 注册快捷键
  const registerShortcut = (
    config: ShortcutConfig,
    handler: ShortcutHandler
  ): string => {
    const id = generateShortcutId(config)
    
    // 检查是否已存在相同的快捷键
    if (shortcuts.value.has(id)) {
      console.warn(`Shortcut '${id}' is already registered. Overwriting...`)
    }
    
    shortcuts.value.set(id, {
      id,
      config,
      handler,
    })
    
    return id
  }

  // 注销快捷键
  const unregisterShortcut = (id: string): boolean => {
    return shortcuts.value.delete(id)
  }

  // 注销所有快捷键
  const unregisterAllShortcuts = (): void => {
    shortcuts.value.clear()
  }

  // 检查快捷键是否已注册
  const isShortcutRegistered = (config: ShortcutConfig): boolean => {
    const id = generateShortcutId(config)
    return shortcuts.value.has(id)
  }

  // 获取所有已注册的快捷键
  const getRegisteredShortcuts = (): ShortcutRegistration[] => {
    return Array.from(shortcuts.value.values())
  }

  // 检查某个键是否正在被按下
  const isKeyPressed = (key: string): boolean => {
    if (!key) return false
    return pressedKeys.value.has(key.toLowerCase())
  }

  // 检查修饰键组合是否正在被按下
  const areModifiersPressed = (modifiers: ModifierKeys): boolean => {
    return (
      !!modifierState.value.ctrl === !!modifiers.ctrl &&
      !!modifierState.value.alt === !!modifiers.alt &&
      !!modifierState.value.shift === !!modifiers.shift &&
      !!modifierState.value.meta === !!modifiers.meta
    )
  }

  // 格式化快捷键显示文本
  const formatShortcut = (config: ShortcutConfig): string => {
    const parts: string[] = []
    
    if (config.modifiers?.meta) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Win')
    }
    if (config.modifiers?.ctrl) {
      parts.push(navigator.platform.includes('Mac') ? '⌃' : 'Ctrl')
    }
    if (config.modifiers?.alt) {
      parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt')
    }
    if (config.modifiers?.shift) {
      parts.push(navigator.platform.includes('Mac') ? '⇧' : 'Shift')
    }
    
    if (config.key) {
      parts.push(config.key.toUpperCase())
    }
    
    return parts.join(navigator.platform.includes('Mac') ? '' : '+')
  }

  // 预定义的常用快捷键配置
  const COMMON_SHORTCUTS = {
    // 系统快捷键
    ESCAPE: { key: 'Escape', description: '取消/关闭' },
    ENTER: { key: 'Enter', description: '确认' },
    SPACE: { key: ' ', description: '空格' },
    
    // 导航快捷键
    ARROW_UP: { key: 'ArrowUp', description: '向上' },
    ARROW_DOWN: { key: 'ArrowDown', description: '向下' },
    ARROW_LEFT: { key: 'ArrowLeft', description: '向左' },
    ARROW_RIGHT: { key: 'ArrowRight', description: '向右' },
    
    // 编辑快捷键
    COPY: { key: 'c', modifiers: { ctrl: true }, description: '复制' },
    PASTE: { key: 'v', modifiers: { ctrl: true }, description: '粘贴' },
    CUT: { key: 'x', modifiers: { ctrl: true }, description: '剪切' },
    UNDO: { key: 'z', modifiers: { ctrl: true }, description: '撤销' },
    REDO: { key: 'y', modifiers: { ctrl: true }, description: '重做' },
    SELECT_ALL: { key: 'a', modifiers: { ctrl: true }, description: '全选' },
    
    // 应用快捷键
    NEW_WINDOW: { key: 'n', modifiers: { ctrl: true }, description: '新窗口' },
    CLOSE_WINDOW: { key: 'w', modifiers: { ctrl: true }, description: '关闭窗口' },
    REFRESH: { key: 'r', modifiers: { ctrl: true }, description: '刷新' },
    FIND: { key: 'f', modifiers: { ctrl: true }, description: '查找' },
    
    // macOS 风格快捷键
    SPOTLIGHT: { key: ' ', modifiers: { meta: true }, description: 'Spotlight 搜索' },
    MISSION_CONTROL: { key: 'F3', description: 'Mission Control' },
    LAUNCHPAD: { key: 'F4', description: 'Launchpad' },
  } as const

  // 初始化键盘事件监听
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)
  })

  // 清理事件监听
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('keyup', handleKeyUp, true)
    unregisterAllShortcuts()
  })

  return {
    // 状态
    pressedKeys: readonly(pressedKeys),
    modifierState: readonly(modifierState),
    
    // 快捷键管理
    registerShortcut,
    unregisterShortcut,
    unregisterAllShortcuts,
    isShortcutRegistered,
    getRegisteredShortcuts,
    
    // 状态检查
    isKeyPressed,
    areModifiersPressed,
    
    // 工具函数
    formatShortcut,
    
    // 常用快捷键配置
    COMMON_SHORTCUTS,
  }
}

// 全局键盘快捷键管理器（单例）
class GlobalKeyboardManager {
  private static instance: GlobalKeyboardManager | null = null
  private keyboardComposable: ReturnType<typeof useKeyboard> | null = null
  
  static getInstance(): GlobalKeyboardManager {
    if (!GlobalKeyboardManager.instance) {
      GlobalKeyboardManager.instance = new GlobalKeyboardManager()
    }
    return GlobalKeyboardManager.instance
  }
  
  initialize() {
    if (!this.keyboardComposable) {
      this.keyboardComposable = useKeyboard()
    }
    return this.keyboardComposable
  }
  
  getKeyboard() {
    return this.keyboardComposable
  }
}

// 导出全局键盘管理器
export const globalKeyboard = GlobalKeyboardManager.getInstance()