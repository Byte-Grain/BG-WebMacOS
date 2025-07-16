import type { WindowAnimationOptions } from './types'

/**
 * 窗口动画管理器
 * 负责处理窗口的各种动画效果
 */
export class WindowAnimations {
  private config: {
    enabled: boolean
    duration: number
  }
  private animationQueue = new Map<string, Promise<void>>()

  constructor(config: { enabled: boolean; duration: number }) {
    this.config = config
  }

  /**
   * 播放窗口打开动画
   */
  async playOpenAnimation(windowId: string, options: WindowAnimationOptions): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    // 如果已有动画在进行，等待完成
    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      ...options,
      keyframes: this.getOpenKeyframes(options.type, options.direction)
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口关闭动画
   */
  async playCloseAnimation(windowId: string, options: WindowAnimationOptions): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      ...options,
      keyframes: this.getCloseKeyframes(options.type, options.direction)
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口最小化动画
   */
  async playMinimizeAnimation(windowId: string, options: WindowAnimationOptions): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      ...options,
      keyframes: this.getMinimizeKeyframes(options.type, options.direction)
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口恢复动画
   */
  async playRestoreAnimation(windowId: string, options: WindowAnimationOptions): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      ...options,
      keyframes: this.getRestoreKeyframes(options.type, options.direction)
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口最大化动画
   */
  async playMaximizeAnimation(windowId: string, options: WindowAnimationOptions): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      ...options,
      keyframes: this.getMaximizeKeyframes(options.type)
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口移动动画
   */
  async playMoveAnimation(
    windowId: string, 
    fromPosition: { x: number; y: number }, 
    toPosition: { x: number; y: number },
    options: Partial<WindowAnimationOptions> = {}
  ): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      duration: options.duration || 300,
      easing: options.easing || 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      keyframes: [
        { transform: `translate(${fromPosition.x}px, ${fromPosition.y}px)` },
        { transform: `translate(${toPosition.x}px, ${toPosition.y}px)` }
      ]
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口调整大小动画
   */
  async playResizeAnimation(
    windowId: string,
    fromSize: { width: number; height: number },
    toSize: { width: number; height: number },
    options: Partial<WindowAnimationOptions> = {}
  ): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      duration: options.duration || 300,
      easing: options.easing || 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      keyframes: [
        { width: `${fromSize.width}px`, height: `${fromSize.height}px` },
        { width: `${toSize.width}px`, height: `${toSize.height}px` }
      ]
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口抖动动画
   */
  async playShakeAnimation(windowId: string, options: Partial<WindowAnimationOptions> = {}): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      duration: options.duration || 500,
      easing: 'ease-in-out',
      keyframes: [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' }
      ]
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 播放窗口闪烁动画
   */
  async playFlashAnimation(windowId: string, options: Partial<WindowAnimationOptions> = {}): Promise<void> {
    if (!this.config.enabled) return

    const element = this.getWindowElement(windowId)
    if (!element) return

    await this.waitForAnimation(windowId)

    const animationPromise = this.createAnimation(element, {
      duration: options.duration || 600,
      easing: 'ease-in-out',
      keyframes: [
        { opacity: '1' },
        { opacity: '0.3' },
        { opacity: '1' },
        { opacity: '0.3' },
        { opacity: '1' }
      ]
    })

    this.animationQueue.set(windowId, animationPromise)
    await animationPromise
    this.animationQueue.delete(windowId)
  }

  /**
   * 停止窗口动画
   */
  async stopAnimation(windowId: string): Promise<void> {
    const element = this.getWindowElement(windowId)
    if (!element) return

    // 取消所有动画
    const animations = element.getAnimations()
    animations.forEach(animation => animation.cancel())

    // 清理动画队列
    this.animationQueue.delete(windowId)
  }

  /**
   * 停止所有动画
   */
  async stopAllAnimations(): Promise<void> {
    const windowIds = Array.from(this.animationQueue.keys())
    await Promise.all(windowIds.map(id => this.stopAnimation(id)))
  }

  /**
   * 检查窗口是否正在播放动画
   */
  isAnimating(windowId: string): boolean {
    return this.animationQueue.has(windowId)
  }

  /**
   * 等待窗口动画完成
   */
  async waitForAnimation(windowId: string): Promise<void> {
    const animation = this.animationQueue.get(windowId)
    if (animation) {
      await animation
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<{ enabled: boolean; duration: number }>): void {
    this.config = { ...this.config, ...config }
  }

  // 私有方法

  private getWindowElement(windowId: string): Element | null {
    return document.querySelector(`[data-window-id="${windowId}"]`)
  }

  private async createAnimation(
    element: Element, 
    options: {
      keyframes: Keyframe[]
      duration: number
      easing: string
      delay?: number
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const animation = element.animate(options.keyframes, {
          duration: options.duration,
          easing: options.easing,
          delay: options.delay || 0,
          fill: 'forwards'
        })

        animation.addEventListener('finish', () => resolve())
        animation.addEventListener('cancel', () => resolve())
        animation.addEventListener('error', (error) => reject(error))
      } catch (error) {
        reject(error)
      }
    })
  }

  private getOpenKeyframes(type: string, direction?: string): Keyframe[] {
    switch (type) {
      case 'fade':
        return [
          { opacity: '0' },
          { opacity: '1' }
        ]
      
      case 'scale':
        return [
          { transform: 'scale(0.8)', opacity: '0' },
          { transform: 'scale(1)', opacity: '1' }
        ]
      
      case 'slide':
        const slideDirection = direction || 'up'
        const slideTransforms = {
          up: 'translateY(20px)',
          down: 'translateY(-20px)',
          left: 'translateX(20px)',
          right: 'translateX(-20px)'
        }
        return [
          { transform: slideTransforms[slideDirection as keyof typeof slideTransforms], opacity: '0' },
          { transform: 'translateX(0) translateY(0)', opacity: '1' }
        ]
      
      case 'bounce':
        return [
          { transform: 'scale(0.3)', opacity: '0' },
          { transform: 'scale(1.05)', opacity: '0.8' },
          { transform: 'scale(0.9)', opacity: '0.9' },
          { transform: 'scale(1)', opacity: '1' }
        ]
      
      case 'flip':
        return [
          { transform: 'rotateY(-90deg)', opacity: '0' },
          { transform: 'rotateY(0deg)', opacity: '1' }
        ]
      
      default:
        return [
          { opacity: '0' },
          { opacity: '1' }
        ]
    }
  }

  private getCloseKeyframes(type: string, direction?: string): Keyframe[] {
    switch (type) {
      case 'fade':
        return [
          { opacity: '1' },
          { opacity: '0' }
        ]
      
      case 'scale':
        return [
          { transform: 'scale(1)', opacity: '1' },
          { transform: 'scale(0.8)', opacity: '0' }
        ]
      
      case 'slide':
        const slideDirection = direction || 'down'
        const slideTransforms = {
          up: 'translateY(-20px)',
          down: 'translateY(20px)',
          left: 'translateX(-20px)',
          right: 'translateX(20px)'
        }
        return [
          { transform: 'translateX(0) translateY(0)', opacity: '1' },
          { transform: slideTransforms[slideDirection as keyof typeof slideTransforms], opacity: '0' }
        ]
      
      case 'bounce':
        return [
          { transform: 'scale(1)', opacity: '1' },
          { transform: 'scale(1.05)', opacity: '0.8' },
          { transform: 'scale(0.3)', opacity: '0' }
        ]
      
      case 'flip':
        return [
          { transform: 'rotateY(0deg)', opacity: '1' },
          { transform: 'rotateY(90deg)', opacity: '0' }
        ]
      
      default:
        return [
          { opacity: '1' },
          { opacity: '0' }
        ]
    }
  }

  private getMinimizeKeyframes(type: string, direction?: string): Keyframe[] {
    switch (type) {
      case 'slide':
        const slideDirection = direction || 'down'
        const transforms = {
          up: 'translateY(-100vh) scale(0.1)',
          down: 'translateY(100vh) scale(0.1)',
          left: 'translateX(-100vw) scale(0.1)',
          right: 'translateX(100vw) scale(0.1)'
        }
        return [
          { transform: 'scale(1)', opacity: '1' },
          { transform: transforms[slideDirection as keyof typeof transforms], opacity: '0' }
        ]
      
      case 'scale':
        return [
          { transform: 'scale(1)', opacity: '1' },
          { transform: 'scale(0.1)', opacity: '0' }
        ]
      
      default:
        return [
          { transform: 'scale(1)', opacity: '1' },
          { transform: 'translateY(100vh) scale(0.1)', opacity: '0' }
        ]
    }
  }

  private getRestoreKeyframes(type: string, direction?: string): Keyframe[] {
    switch (type) {
      case 'slide':
        const slideDirection = direction || 'up'
        const transforms = {
          up: 'translateY(100vh) scale(0.1)',
          down: 'translateY(-100vh) scale(0.1)',
          left: 'translateX(100vw) scale(0.1)',
          right: 'translateX(-100vw) scale(0.1)'
        }
        return [
          { transform: transforms[slideDirection as keyof typeof transforms], opacity: '0' },
          { transform: 'scale(1)', opacity: '1' }
        ]
      
      case 'scale':
        return [
          { transform: 'scale(0.1)', opacity: '0' },
          { transform: 'scale(1)', opacity: '1' }
        ]
      
      default:
        return [
          { transform: 'translateY(100vh) scale(0.1)', opacity: '0' },
          { transform: 'scale(1)', opacity: '1' }
        ]
    }
  }

  private getMaximizeKeyframes(type: string): Keyframe[] {
    switch (type) {
      case 'scale':
        return [
          { transform: 'scale(1)' },
          { transform: 'scale(1.02)' },
          { transform: 'scale(1)' }
        ]
      
      case 'fade':
        return [
          { opacity: '1' },
          { opacity: '0.8' },
          { opacity: '1' }
        ]
      
      default:
        return [
          { transform: 'scale(1)' },
          { transform: 'scale(1.01)' },
          { transform: 'scale(1)' }
        ]
    }
  }
}
