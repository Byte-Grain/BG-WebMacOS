import type {
  NotificationAnimationOptions,
  Notification
} from './types'

/**
 * 通知动画管理器
 * 负责管理通知的各种动画效果
 */
export class NotificationAnimations {
  private animationQueue: Array<{
    id: string
    animation: () => Promise<void>
    priority: number
  }> = []
  private activeAnimations: Map<string, Animation> = new Map()
  private isProcessingQueue = false
  private defaultOptions: NotificationAnimationOptions

  constructor() {
    this.defaultOptions = this.getDefaultAnimationOptions()
  }

  /**
   * 获取默认动画选项
   */
  private getDefaultAnimationOptions(): NotificationAnimationOptions {
    return {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: 0,
      fill: 'forwards'
    }
  }

  /**
   * 显示通知动画
   */
  async show(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, ...options }
    const animationId = `show-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      // 设置初始状态
      element.style.opacity = '0'
      element.style.transform = this.getShowInitialTransform(notification)
      element.style.visibility = 'visible'

      // 创建显示动画
      const keyframes = [
        {
          opacity: 0,
          transform: this.getShowInitialTransform(notification),
          offset: 0
        },
        {
          opacity: 1,
          transform: 'translateX(0) translateY(0) scale(1)',
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        delay: animationOptions.delay,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)

      await animation.finished
      this.activeAnimations.delete(animationId)

      // 设置最终状态
      element.style.opacity = '1'
      element.style.transform = 'translateX(0) translateY(0) scale(1)'
    }, 2)
  }

  /**
   * 隐藏通知动画
   */
  async hide(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, ...options }
    const animationId = `hide-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          opacity: 1,
          transform: 'translateX(0) translateY(0) scale(1)',
          offset: 0
        },
        {
          opacity: 0,
          transform: this.getHideEndTransform(notification),
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        delay: animationOptions.delay,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)

      await animation.finished
      this.activeAnimations.delete(animationId)

      // 隐藏元素
      element.style.visibility = 'hidden'
    }, 2)
  }

  /**
   * 悬停动画
   */
  async hover(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 200, ...options }
    const animationId = `hover-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          transform: 'scale(1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          offset: 0
        },
        {
          transform: 'scale(1.02)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 1)
  }

  /**
   * 取消悬停动画
   */
  async unhover(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 200, ...options }
    const animationId = `unhover-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          transform: 'scale(1.02)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          offset: 0
        },
        {
          transform: 'scale(1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 1)
  }

  /**
   * 点击动画
   */
  async click(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 150, ...options }
    const animationId = `click-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          transform: 'scale(1)',
          offset: 0
        },
        {
          transform: 'scale(0.98)',
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 3)
  }

  /**
   * 摇摆动画（用于错误或警告）
   */
  async shake(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 500, ...options }
    const animationId = `shake-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(-10px)', offset: 0.1 },
        { transform: 'translateX(10px)', offset: 0.2 },
        { transform: 'translateX(-10px)', offset: 0.3 },
        { transform: 'translateX(10px)', offset: 0.4 },
        { transform: 'translateX(-5px)', offset: 0.5 },
        { transform: 'translateX(5px)', offset: 0.6 },
        { transform: 'translateX(-5px)', offset: 0.7 },
        { transform: 'translateX(5px)', offset: 0.8 },
        { transform: 'translateX(0)', offset: 1 }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: 'ease-in-out',
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 2)
  }

  /**
   * 脉冲动画（用于重要通知）
   */
  async pulse(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 1000, ...options }
    const animationId = `pulse-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          transform: 'scale(1)',
          opacity: 1,
          offset: 0
        },
        {
          transform: 'scale(1.05)',
          opacity: 0.8,
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          opacity: 1,
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: 'ease-in-out',
        iterations: 3,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 1)
  }

  /**
   * 弹跳动画
   */
  async bounce(element: HTMLElement, notification: Notification, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 600, ...options }
    const animationId = `bounce-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        { transform: 'translateY(0)', offset: 0 },
        { transform: 'translateY(-20px)', offset: 0.2 },
        { transform: 'translateY(0)', offset: 0.4 },
        { transform: 'translateY(-10px)', offset: 0.6 },
        { transform: 'translateY(0)', offset: 0.8 },
        { transform: 'translateY(-5px)', offset: 0.9 },
        { transform: 'translateY(0)', offset: 1 }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: 'ease-out',
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 2)
  }

  /**
   * 滑入动画
   */
  async slideIn(element: HTMLElement, notification: Notification, direction: 'left' | 'right' | 'top' | 'bottom' = 'right', options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, ...options }
    const animationId = `slideIn-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const initialTransform = this.getSlideTransform(direction, true)
      const finalTransform = 'translateX(0) translateY(0)'

      element.style.transform = initialTransform
      element.style.visibility = 'visible'

      const keyframes = [
        {
          transform: initialTransform,
          opacity: 0,
          offset: 0
        },
        {
          transform: finalTransform,
          opacity: 1,
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        delay: animationOptions.delay,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)

      element.style.transform = finalTransform
      element.style.opacity = '1'
    }, 2)
  }

  /**
   * 滑出动画
   */
  async slideOut(element: HTMLElement, notification: Notification, direction: 'left' | 'right' | 'top' | 'bottom' = 'right', options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, ...options }
    const animationId = `slideOut-${notification.id}`

    return this.queueAnimation(animationId, async () => {
      const initialTransform = 'translateX(0) translateY(0)'
      const finalTransform = this.getSlideTransform(direction, false)

      const keyframes = [
        {
          transform: initialTransform,
          opacity: 1,
          offset: 0
        },
        {
          transform: finalTransform,
          opacity: 0,
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        delay: animationOptions.delay,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)

      element.style.visibility = 'hidden'
    }, 2)
  }

  /**
   * 进度条动画
   */
  async animateProgress(element: HTMLElement, fromPercent: number, toPercent: number, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, ...options }
    const animationId = `progress-${Date.now()}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          width: `${fromPercent}%`,
          offset: 0
        },
        {
          width: `${toPercent}%`,
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: animationOptions.easing,
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)

      element.style.width = `${toPercent}%`
    }, 1)
  }

  /**
   * 徽章动画
   */
  async animateBadge(element: HTMLElement, options?: Partial<NotificationAnimationOptions>): Promise<void> {
    const animationOptions = { ...this.defaultOptions, duration: 400, ...options }
    const animationId = `badge-${Date.now()}`

    return this.queueAnimation(animationId, async () => {
      const keyframes = [
        {
          transform: 'scale(0)',
          opacity: 0,
          offset: 0
        },
        {
          transform: 'scale(1.2)',
          opacity: 1,
          offset: 0.6
        },
        {
          transform: 'scale(1)',
          opacity: 1,
          offset: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: animationOptions.duration,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fill: animationOptions.fill
      })

      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 1)
  }

  /**
   * 获取显示动画的初始变换
   */
  private getShowInitialTransform(notification: Notification): string {
    switch (notification.type) {
      case 'error':
        return 'translateX(100%) scale(0.8)'
      case 'warning':
        return 'translateY(-100%) scale(0.9)'
      case 'success':
        return 'translateX(-100%) scale(0.9)'
      case 'info':
      case 'system':
      default:
        return 'translateX(100%) scale(0.95)'
    }
  }

  /**
   * 获取隐藏动画的结束变换
   */
  private getHideEndTransform(notification: Notification): string {
    switch (notification.type) {
      case 'error':
        return 'translateX(100%) scale(0.8)'
      case 'warning':
        return 'translateY(-100%) scale(0.8)'
      case 'success':
        return 'translateX(-100%) scale(0.8)'
      case 'info':
      case 'system':
      default:
        return 'translateX(100%) scale(0.8)'
    }
  }

  /**
   * 获取滑动变换
   */
  private getSlideTransform(direction: 'left' | 'right' | 'top' | 'bottom', isInitial: boolean): string {
    const distance = isInitial ? '100%' : '100%'
    
    switch (direction) {
      case 'left':
        return `translateX(-${distance})`
      case 'right':
        return `translateX(${distance})`
      case 'top':
        return `translateY(-${distance})`
      case 'bottom':
        return `translateY(${distance})`
      default:
        return `translateX(${distance})`
    }
  }

  /**
   * 队列动画
   */
  private async queueAnimation(id: string, animation: () => Promise<void>, priority: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.animationQueue.push({
        id,
        animation: async () => {
          try {
            await animation()
            resolve()
          } catch (error) {
            reject(error)
          }
        },
        priority
      })

      this.processQueue()
    })
  }

  /**
   * 处理动画队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    // 按优先级排序
    this.animationQueue.sort((a, b) => b.priority - a.priority)

    while (this.animationQueue.length > 0) {
      const item = this.animationQueue.shift()!
      try {
        await item.animation()
      } catch (error) {
        console.error(`Animation error for ${item.id}:`, error)
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * 停止动画
   */
  stopAnimation(id: string): void {
    const animation = this.activeAnimations.get(id)
    if (animation) {
      animation.cancel()
      this.activeAnimations.delete(id)
    }

    // 从队列中移除
    this.animationQueue = this.animationQueue.filter(item => item.id !== id)
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.cancel())
    this.activeAnimations.clear()
    this.animationQueue.length = 0
  }

  /**
   * 检查动画是否正在运行
   */
  isAnimating(id?: string): boolean {
    if (id) {
      return this.activeAnimations.has(id)
    }
    return this.activeAnimations.size > 0 || this.animationQueue.length > 0
  }

  /**
   * 获取活动动画数量
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size
  }

  /**
   * 获取队列中的动画数量
   */
  getQueuedAnimationCount(): number {
    return this.animationQueue.length
  }

  /**
   * 更新默认动画选项
   */
  updateDefaultOptions(options: Partial<NotificationAnimationOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  /**
   * 获取默认动画选项
   */
  getDefaultOptions(): NotificationAnimationOptions {
    return { ...this.defaultOptions }
  }

  /**
   * 创建自定义动画
   */
  async createCustomAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: KeyframeAnimationOptions,
    id?: string
  ): Promise<void> {
    const animationId = id || `custom-${Date.now()}`
    const animationOptions = { ...this.defaultOptions, ...options }

    return this.queueAnimation(animationId, async () => {
      const animation = element.animate(keyframes, animationOptions)
      this.activeAnimations.set(animationId, animation)
      await animation.finished
      this.activeAnimations.delete(animationId)
    }, 1)
  }

  /**
   * 销毁动画管理器
   */
  destroy(): void {
    this.stopAllAnimations()
    this.animationQueue.length = 0
    this.activeAnimations.clear()
  }
}

// 导出单例实例
export const notificationAnimations = new NotificationAnimations()
