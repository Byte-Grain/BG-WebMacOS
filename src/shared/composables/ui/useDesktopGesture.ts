import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEventBus, EVENTS } from '../../../core/event-system/useEventBus'

// 手势配置接口
export interface GestureConfig {
  enableSwipeUp?: boolean
  enableSwipeDown?: boolean
  enableSwipeLeft?: boolean
  enableSwipeRight?: boolean
  enableDrag?: boolean
  enableTwoFingerGestures?: boolean // 是否启用双指手势
  enableMouseWheel?: boolean // 是否启用鼠标滚轮
  allowWheelInApps?: boolean // 是否允许在应用内使用滚轮
  threshold?: number // 手势触发阈值（像素）
  preventDefault?: boolean // 是否阻止默认行为
}

// 触摸点信息
interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

// 手势方向
export type GestureDirection = 'up' | 'down' | 'left' | 'right' | 'none'

// 手势事件数据
export interface GestureEventData {
  direction: GestureDirection
  distance: number
  velocity: number
  startPoint: TouchPoint
  endPoint: TouchPoint
  duration: number
}

// 手势方向常量
export const GESTURE_DIRECTIONS = {
  UP: 'up' as const,
  DOWN: 'down' as const,
  LEFT: 'left' as const,
  RIGHT: 'right' as const,
  NONE: 'none' as const
} as const

/**
 * 桌面手势控制组合式函数
 * 用于禁用桌面区域的手势操作，包括双指手势和鼠标滚轮
 */
export function useDesktopGesture(initialConfig?: GestureConfig) {
  const { emit } = useEventBus()
  
  // 默认配置
  const defaultConfig: Required<GestureConfig> = {
    enableSwipeUp: false,
    enableSwipeDown: false,
    enableSwipeLeft: false,
    enableSwipeRight: false,
    enableDrag: false,
    enableTwoFingerGestures: false,
    enableMouseWheel: false,
    allowWheelInApps: true,
    threshold: 50,
    preventDefault: true
  }
  
  // 手势配置
  const gestureConfig = ref<Required<GestureConfig>>({ ...defaultConfig, ...initialConfig })
  
  // 触摸状态
  const startTouch = ref<TouchPoint | null>(null)
  const currentTouch = ref<TouchPoint | null>(null)
  const isGestureActive = ref(false)
  
  // 鼠标状态
  const isMouseDown = ref(false)
  const mouseStartPoint = ref<TouchPoint | null>(null)
  
  // 绑定的元素
  const boundElements = ref<Set<HTMLElement>>(new Set())
  
  // 计算属性：是否启用手势
  const isGestureEnabled = computed(() => {
    return gestureConfig.value.enableSwipeUp ||
           gestureConfig.value.enableSwipeDown ||
           gestureConfig.value.enableSwipeLeft ||
           gestureConfig.value.enableSwipeRight ||
           gestureConfig.value.enableDrag
  })
  
  // 更新配置
  const updateConfig = (newConfig: Partial<GestureConfig>) => {
    gestureConfig.value = { ...gestureConfig.value, ...newConfig }
  }
  
  // 禁用所有手势
  const disableAllGestures = () => {
    updateConfig({
      enableSwipeUp: false,
      enableSwipeDown: false,
      enableSwipeLeft: false,
      enableSwipeRight: false,
      enableDrag: false,
      enableTwoFingerGestures: false,
      enableMouseWheel: false
    })
    
    // 发送手势禁用事件
    emit(EVENTS.DESKTOP_GESTURE_DISABLED, {
      reason: 'all_gestures_disabled_by_system',
      timestamp: Date.now()
    })
  }
  
  // 启用所有手势
  const enableAllGestures = () => {
    updateConfig({
      enableSwipeUp: true,
      enableSwipeDown: true,
      enableSwipeLeft: true,
      enableSwipeRight: true,
      enableDrag: true,
      enableTwoFingerGestures: true,
      enableMouseWheel: true
    })
  }
  
  // 获取触摸点信息
  const getTouchPoint = (touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  })
  
  // 计算手势方向
  const calculateDirection = (start: TouchPoint, end: TouchPoint): GestureDirection => {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const threshold = gestureConfig.value.threshold
    
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return 'none'
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }
  
  // 计算距离
  const calculateDistance = (start: TouchPoint, end: TouchPoint): number => {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }
  
  // 计算速度
  const calculateVelocity = (start: TouchPoint, end: TouchPoint): number => {
    const distance = calculateDistance(start, end)
    const duration = end.timestamp - start.timestamp
    return duration > 0 ? distance / duration : 0
  }
  
  // 检查手势是否被禁用
  const isGestureDisabled = (direction: GestureDirection): boolean => {
    switch (direction) {
      case 'up': return !gestureConfig.value.enableSwipeUp
      case 'down': return !gestureConfig.value.enableSwipeDown
      case 'left': return !gestureConfig.value.enableSwipeLeft
      case 'right': return !gestureConfig.value.enableSwipeRight
      default: return false
    }
  }
  
  // 检查是否在应用内部
  const isInAppArea = (target: HTMLElement): boolean => {
    return !!(target.closest('.app-body') || 
             target.closest('.box-center-center') || 
             target.closest('.app-window') || 
             target.closest('[data-app-content]') || 
             target.closest('.app-content') || 
             target.closest('.window-content') ||
             target.closest('.app') ||
             target.closest('[data-app]'))
  }
  
  // 触摸开始事件处理
  const handleTouchStart = (event: TouchEvent) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 检查是否为双指手势
    if (event.touches.length === 2) {
      // 如果在应用内部，阻止事件传播到桌面
      if (inApp) {
        event.stopPropagation()
        return // 阻止双指手势传播到桌面，但允许应用内正常处理
      }
      
      // 只在桌面区域禁用双指手势
      if (!gestureConfig.value.enableTwoFingerGestures && gestureConfig.value.preventDefault) {
        event.preventDefault()
        emit(EVENTS.DESKTOP_GESTURE_DISABLED, {
          reason: 'two_finger_gesture_disabled_on_desktop',
          timestamp: Date.now()
        })
      }
      return
    }
    
    if (event.touches.length === 1) {
      startTouch.value = getTouchPoint(event.touches[0])
      currentTouch.value = startTouch.value
      isGestureActive.value = true
      
      // 如果在应用内部，允许拖拽
      if (inApp) {
        return
      }
      
      // 只在桌面区域禁用拖拽
      if (!gestureConfig.value.enableDrag && gestureConfig.value.preventDefault) {
        event.preventDefault()
      }
    }
  }
  
  // 检查触摸滚动边界
  const checkTouchScrollBoundary = (target: HTMLElement, deltaY: number): boolean => {
    const scrollableParent = findScrollableParent(target)
    
    if (scrollableParent) {
      const direction = deltaY > 0 ? 'down' : 'up'
      const { scrollTop, scrollHeight, clientHeight } = scrollableParent
      
      // 只有在真正到达边界且移动量较大时才返回false
      if (!canScroll(scrollableParent, direction) && Math.abs(deltaY) > 10) {
        const atTopBoundary = direction === 'up' && scrollTop <= 0
        const atBottomBoundary = direction === 'down' && scrollTop >= scrollHeight - clientHeight
        
        return !(atTopBoundary || atBottomBoundary)
      }
      
      return true
    }
    
    return true
  }
  
  // 触摸移动事件处理
  const handleTouchMove = (event: TouchEvent) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 检查双指手势
    if (event.touches.length === 2) {
      // 如果在应用内部，完全阻止双指手势传播到桌面
      if (inApp) {
        // 计算双指移动的垂直方向
        if (startTouch.value && currentTouch.value) {
          const touch1 = getTouchPoint(event.touches[0])
          const touch2 = getTouchPoint(event.touches[1])
          const centerY = (touch1.y + touch2.y) / 2
          const prevCenterY = (startTouch.value.y + (currentTouch.value.y || startTouch.value.y)) / 2
          const deltaY = centerY - prevCenterY
          
          // 如果是垂直滚动且到达边界，阻止过度滚动
          if (Math.abs(deltaY) > 5 && !checkTouchScrollBoundary(target, deltaY)) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
        }
        // 在应用内部时，阻止事件冒泡到桌面，但允许应用内正常滚动
        event.stopPropagation()
        return
      }
      
      // 只在桌面区域禁用双指手势
      if (!gestureConfig.value.enableTwoFingerGestures && gestureConfig.value.preventDefault) {
        event.preventDefault()
      }
      return
    }
    
    if (!isGestureActive.value || !startTouch.value || event.touches.length !== 1) {
      return
    }
    
    currentTouch.value = getTouchPoint(event.touches[0])
    
    // 如果在应用内部，检查单指滚动边界
    if (inApp) {
      const deltaY = currentTouch.value.y - startTouch.value.y
      
      // 如果是垂直滚动且到达边界，阻止过度滚动
      if (Math.abs(deltaY) > 10 && !checkTouchScrollBoundary(target, -deltaY)) {
        event.preventDefault()
        return
      }
      
      return // 允许应用内拖拽
    }
    
    // 只在桌面区域禁用拖拽
    if (!gestureConfig.value.enableDrag && gestureConfig.value.preventDefault) {
      event.preventDefault()
    }
    
    // 实时检查手势方向
    const direction = calculateDirection(startTouch.value, currentTouch.value)
    if (direction !== 'none' && isGestureDisabled(direction)) {
      // 如果手势被禁用，阻止默认行为
      if (gestureConfig.value.preventDefault) {
        event.preventDefault()
      }
    }
  }
  
  // 触摸结束事件处理
  const handleTouchEnd = (event: TouchEvent) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 如果在应用内部且是双指手势结束，阻止事件传播
    if (inApp && event.changedTouches.length >= 1) {
      // 检查是否是双指手势的结束
      const remainingTouches = event.touches.length
      if (remainingTouches <= 1) {
        event.stopPropagation()
      }
    }
    
    if (!isGestureActive.value || !startTouch.value || !currentTouch.value) {
      return
    }
    
    const endTouch = currentTouch.value
    const direction = calculateDirection(startTouch.value, endTouch)
    const distance = calculateDistance(startTouch.value, endTouch)
    const velocity = calculateVelocity(startTouch.value, endTouch)
    const duration = endTouch.timestamp - startTouch.value.timestamp
    
    // 创建手势事件数据
    const gestureData: GestureEventData = {
      direction,
      distance,
      velocity,
      startPoint: startTouch.value,
      endPoint: endTouch,
      duration
    }
    
    // 发送通用手势事件
    emit(EVENTS.DESKTOP_GESTURE, gestureData)
    
    // 发送特定方向的手势事件
    if (direction !== 'none') {
      switch (direction) {
        case 'up':
          emit(EVENTS.DESKTOP_SWIPE_UP, gestureData)
          break
        case 'down':
          emit(EVENTS.DESKTOP_SWIPE_DOWN, gestureData)
          break
        case 'left':
          emit(EVENTS.DESKTOP_SWIPE_LEFT, gestureData)
          break
        case 'right':
          emit(EVENTS.DESKTOP_SWIPE_RIGHT, gestureData)
          break
      }
      
      // 如果手势被禁用，阻止默认行为
      if (isGestureDisabled(direction) && gestureConfig.value.preventDefault) {
        event.preventDefault()
      }
    }
    
    // 重置状态
    startTouch.value = null
    currentTouch.value = null
    isGestureActive.value = false
  }
  
  // 鼠标按下事件处理
  const handleMouseDown = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    isMouseDown.value = true
    mouseStartPoint.value = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    }
    
    // 如果在应用内部，允许拖拽
    if (inApp) {
      return
    }
    
    // 只在桌面区域禁用拖拽
    if (!gestureConfig.value.enableDrag && gestureConfig.value.preventDefault) {
      if (target.classList.contains('desktop') || target.classList.contains('body')) {
        event.preventDefault()
      }
    }
  }
  
  // 鼠标移动事件处理
  const handleMouseMove = (event: MouseEvent) => {
    if (!isMouseDown.value || !mouseStartPoint.value) {
      return
    }
    
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 如果在应用内部，允许拖拽
    if (inApp) {
      return
    }
    
    // 只在桌面区域禁用拖拽
    if (!gestureConfig.value.enableDrag && gestureConfig.value.preventDefault) {
      if (target.classList.contains('desktop') || target.classList.contains('body')) {
        event.preventDefault()
      }
    }
  }
  
  // 右键菜单事件处理
  const handleContextMenu = (event: MouseEvent) => {
    // 可以根据需要禁用右键菜单
    if (gestureConfig.value.preventDefault) {
      const target = event.target as HTMLElement
      if (target.classList.contains('desktop') || target.classList.contains('body')) {
        // 这里可以选择是否阻止右键菜单
        // event.preventDefault()
      }
    }
  }
  
  // 阻止选择
  const handleSelectStart = (event: Event) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 如果在应用内部，允许文本选择
    if (inApp) {
      return
    }
    
    // 只在桌面区域禁用文本选择
    if (gestureConfig.value.preventDefault) {
      if (target.classList.contains('desktop') || target.classList.contains('body')) {
        event.preventDefault()
      }
    }
  }
  
  // 检查元素是否可以滚动
  const canScroll = (element: HTMLElement, direction: 'up' | 'down'): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element
    
    if (direction === 'up') {
      return scrollTop > 5 // 增加一些容差，避免过于严格的边界检查
    } else {
      return scrollTop < scrollHeight - clientHeight - 5 // 增加一些容差
    }
  }
  
  // 查找可滚动的父元素
  const findScrollableParent = (element: HTMLElement): HTMLElement | null => {
    let parent = element.parentElement
    
    while (parent) {
      const style = window.getComputedStyle(parent)
      const overflowY = style.overflowY
      
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const { scrollHeight, clientHeight } = parent
        if (scrollHeight > clientHeight) {
          return parent
        }
      }
      
      parent = parent.parentElement
    }
    
    return null
  }
  
  // 鼠标滚轮事件处理
  const handleWheel = (event: WheelEvent) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 如果在应用内部，检查边界滚动
    if (inApp) {
      const scrollableParent = findScrollableParent(target)
      
      if (scrollableParent) {
        const direction = event.deltaY > 0 ? 'down' : 'up'
        const { scrollTop, scrollHeight, clientHeight } = scrollableParent
        
        // 更精确的边界检查，只在真正到达边界且滚动量较大时才阻止
        if (!canScroll(scrollableParent, direction) && Math.abs(event.deltaY) > 10) {
          // 检查是否已经完全到达边界
          const atTopBoundary = direction === 'up' && scrollTop <= 0
          const atBottomBoundary = direction === 'down' && scrollTop >= scrollHeight - clientHeight
          
          if (atTopBoundary || atBottomBoundary) {
            event.preventDefault()
            return
          }
        }
      } else {
        // 如果在应用内部但没有可滚动的父元素，阻止事件传播到桌面
        event.stopPropagation()
        event.preventDefault()
        return
      }
      
      // 在应用内部时，阻止事件传播到桌面，但允许应用内正常滚动
      event.stopPropagation()
      return
    }
    
    // 只在桌面区域禁用滚轮
    if (!gestureConfig.value.enableMouseWheel) {
      if (gestureConfig.value.preventDefault) {
        event.preventDefault()
        emit(EVENTS.DESKTOP_GESTURE_DISABLED, {
          reason: 'mouse_wheel_disabled_on_desktop',
          timestamp: Date.now()
        })
      }
    }
  }
  
  // 阻止拖拽
  const handleDragStart = (event: DragEvent) => {
    const target = event.target as HTMLElement
    const inApp = isInAppArea(target)
    
    // 如果在应用内部，允许拖拽
    if (inApp) {
      return
    }
    
    // 只在桌面区域禁用拖拽
    if (!gestureConfig.value.enableDrag && gestureConfig.value.preventDefault) {
      if (target.classList.contains('desktop') || target.classList.contains('body')) {
        event.preventDefault()
        // 发送拖拽禁用事件
        emit(EVENTS.DESKTOP_DRAG_DISABLED, {
          element: target.className,
          timestamp: Date.now()
        })
      }
    }
  }
  
  // 绑定事件监听器
  const bindEventListeners = (element: HTMLElement) => {
    // 触摸事件
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // 鼠标事件
    element.addEventListener('mousedown', handleMouseDown, { passive: false })
    element.addEventListener('mousemove', handleMouseMove, { passive: false })
    element.addEventListener('contextmenu', handleContextMenu, { passive: false })
    element.addEventListener('wheel', handleWheel, { passive: false })
    
    // 阻止选择和拖拽
    element.addEventListener('selectstart', handleSelectStart, { passive: false })
    element.addEventListener('dragstart', handleDragStart, { passive: false })
  }
  
  // 解绑事件监听器
  const unbindEventListeners = (element: HTMLElement) => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('mousedown', handleMouseDown)
    element.removeEventListener('mousemove', handleMouseMove)
    element.removeEventListener('contextmenu', handleContextMenu)
    element.removeEventListener('wheel', handleWheel)
    element.removeEventListener('selectstart', handleSelectStart)
    element.removeEventListener('dragstart', handleDragStart)
  }
  
  // 绑定到元素
  const bindToElement = (element: HTMLElement) => {
    if (boundElements.value.has(element)) {
      return
    }
    
    bindEventListeners(element)
    boundElements.value.add(element)
  }
  
  // 从元素解绑
  const unbindFromElement = (element: HTMLElement) => {
    if (!boundElements.value.has(element)) {
      return
    }
    
    unbindEventListeners(element)
    boundElements.value.delete(element)
  }
  
  // 初始化
  const init = (element?: HTMLElement) => {
    if (element) {
      bindToElement(element)
    } else {
      // 默认绑定到 body
      const body = document.body
      if (body) {
        bindToElement(body)
      }
    }
  }
  
  // 清理
  const cleanup = () => {
    boundElements.value.forEach(element => {
      unbindEventListeners(element)
    })
    boundElements.value.clear()
    
    // 重置状态
    startTouch.value = null
    currentTouch.value = null
    isGestureActive.value = false
    isMouseDown.value = false
    mouseStartPoint.value = null
  }
  
  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    // 状态
    gestureConfig: readonly(gestureConfig),
    isGestureEnabled,
    isGestureActive: readonly(isGestureActive),
    
    // 方法
    updateConfig,
    disableAllGestures,
    enableAllGestures,
    bindToElement,
    unbindFromElement,
    init,
    cleanup,
    
    // 工具方法
    calculateDirection,
    calculateDistance,
    calculateVelocity,
    isGestureDisabled
  }
}

// 导出默认配置
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  enableSwipeUp: false,
  enableSwipeDown: false,
  enableSwipeLeft: false,
  enableSwipeRight: false,
  enableDrag: false,
  enableTwoFingerGestures: false,
  enableMouseWheel: false,
  allowWheelInApps: true,
  threshold: 50,
  preventDefault: true
}

