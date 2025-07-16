import type {
  TrayItem,
  TrayAnimationOptions
} from './types'

/**
 * 系统托盘动画管理器
 * 负责管理系统托盘和托盘项目的各种动画效果
 */
export class TrayAnimations {
  private animationQueue: Map<string, Animation[]> = new Map()
  private defaultOptions: TrayAnimationOptions

  constructor(defaultOptions?: Partial<TrayAnimationOptions>) {
    this.defaultOptions = {
      duration: 200,
      easing: 'ease-out',
      delay: 0,
      direction: 'in',
      scale: 1,
      opacity: 1,
      ...defaultOptions
    }
  }

  /**
   * 托盘项目添加动画
   */
  animateItemAdd(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(0) translateY(-10px)',
          opacity: 0
        },
        {
          transform: 'scale(1.1) translateY(0)',
          opacity: 1,
          offset: 0.7
        },
        {
          transform: 'scale(1) translateY(0)',
          opacity: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目移除动画
   */
  animateItemRemove(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1) translateY(0)',
          opacity: 1
        },
        {
          transform: 'scale(1.1) translateY(-5px)',
          opacity: 0.8,
          offset: 0.3
        },
        {
          transform: 'scale(0) translateY(-10px)',
          opacity: 0
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目悬停动画
   */
  animateItemHover(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 150, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1)',
          filter: 'brightness(1)'
        },
        {
          transform: 'scale(1.1)',
          filter: 'brightness(1.2)'
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目离开悬停动画
   */
  animateItemLeave(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 150, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1.1)',
          filter: 'brightness(1.2)'
        },
        {
          transform: 'scale(1)',
          filter: 'brightness(1)'
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目点击动画
   */
  animateItemClick(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 100, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1)',
          filter: 'brightness(1)'
        },
        {
          transform: 'scale(0.95)',
          filter: 'brightness(0.8)',
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          filter: 'brightness(1)'
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'ease-in-out',
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目激活动画
   */
  animateItemActivate(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 300, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1)',
          boxShadow: '0 0 0 rgba(0, 122, 255, 0)'
        },
        {
          transform: 'scale(1.05)',
          boxShadow: '0 0 10px rgba(0, 122, 255, 0.5)',
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          boxShadow: '0 0 5px rgba(0, 122, 255, 0.3)'
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目停用动画
   */
  animateItemDeactivate(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 200, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1)',
          boxShadow: '0 0 5px rgba(0, 122, 255, 0.3)',
          filter: 'brightness(1)'
        },
        {
          transform: 'scale(1)',
          boxShadow: '0 0 0 rgba(0, 122, 255, 0)',
          filter: 'brightness(1)'
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目徽章动画
   */
  animateItemBadge(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 400, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(0) rotate(0deg)',
          opacity: 0
        },
        {
          transform: 'scale(1.2) rotate(180deg)',
          opacity: 1,
          offset: 0.6
        },
        {
          transform: 'scale(1) rotate(360deg)',
          opacity: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目脉冲动画
   */
  animateItemPulse(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 1000, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'scale(1)',
          opacity: 1
        },
        {
          transform: 'scale(1.1)',
          opacity: 0.7,
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          opacity: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'ease-in-out',
        delay: opts.delay,
        iterations: Infinity
      })

      this.addToQueue(element.id || 'unknown', animation)
      
      // 脉冲动画通常是无限的，需要手动停止
      setTimeout(() => {
        animation.cancel()
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }, opts.duration * 3) // 运行3个周期后停止
    })
  }

  /**
   * 系统托盘显示动画
   */
  animateTrayShow(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 300, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'translateY(-20px)',
          opacity: 0
        },
        {
          transform: 'translateY(0)',
          opacity: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue('tray-container', animation)
      animation.onfinish = () => {
        this.removeFromQueue('tray-container', animation)
        resolve()
      }
    })
  }

  /**
   * 系统托盘隐藏动画
   */
  animateTrayHide(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 250, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'translateY(0)',
          opacity: 1
        },
        {
          transform: 'translateY(-20px)',
          opacity: 0
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue('tray-container', animation)
      animation.onfinish = () => {
        this.removeFromQueue('tray-container', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目移动动画
   */
  animateItemMove(element: HTMLElement, fromX: number, toX: number, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 300, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: `translateX(${fromX}px)`
        },
        {
          transform: `translateX(${toX}px)`
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 托盘项目加载动画
   */
  animateItemLoading(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 800, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        {
          transform: 'rotate(0deg)',
          opacity: 0.6
        },
        {
          transform: 'rotate(360deg)',
          opacity: 1
        }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'linear',
        delay: opts.delay,
        iterations: Infinity
      })

      this.addToQueue(element.id || 'unknown', animation)
      
      // 加载动画通常需要手动停止
      setTimeout(() => {
        animation.cancel()
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }, opts.duration * 5) // 运行5个周期后停止
    })
  }

  /**
   * 托盘项目错误动画
   */
  animateItemError(element: HTMLElement, options?: Partial<TrayAnimationOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, duration: 500, ...options }
    
    return new Promise((resolve) => {
      const keyframes = [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)', offset: 0.1 },
        { transform: 'translateX(5px)', offset: 0.2 },
        { transform: 'translateX(-5px)', offset: 0.3 },
        { transform: 'translateX(5px)', offset: 0.4 },
        { transform: 'translateX(-3px)', offset: 0.5 },
        { transform: 'translateX(3px)', offset: 0.6 },
        { transform: 'translateX(-2px)', offset: 0.7 },
        { transform: 'translateX(2px)', offset: 0.8 },
        { transform: 'translateX(0)', offset: 1 }
      ]

      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: 'ease-in-out',
        delay: opts.delay,
        fill: 'forwards'
      })

      // 同时添加红色闪烁效果
      const colorKeyframes = [
        { filter: 'hue-rotate(0deg)' },
        { filter: 'hue-rotate(0deg) brightness(1.5)', offset: 0.1 },
        { filter: 'hue-rotate(0deg)', offset: 0.2 },
        { filter: 'hue-rotate(0deg) brightness(1.5)', offset: 0.3 },
        { filter: 'hue-rotate(0deg)' }
      ]

      const colorAnimation = element.animate(colorKeyframes, {
        duration: opts.duration,
        easing: 'ease-in-out',
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      this.addToQueue(element.id || 'unknown', colorAnimation)
      
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        this.removeFromQueue(element.id || 'unknown', colorAnimation)
        resolve()
      }
    })
  }

  /**
   * 停止元素的所有动画
   */
  stopAnimations(elementId: string): void {
    const animations = this.animationQueue.get(elementId)
    if (animations) {
      animations.forEach(animation => {
        animation.cancel()
      })
      this.animationQueue.delete(elementId)
    }
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations(): void {
    this.animationQueue.forEach((animations, elementId) => {
      animations.forEach(animation => {
        animation.cancel()
      })
    })
    this.animationQueue.clear()
  }

  /**
   * 检查元素是否正在动画
   */
  isAnimating(elementId: string): boolean {
    const animations = this.animationQueue.get(elementId)
    return !!(animations && animations.length > 0)
  }

  /**
   * 获取元素的动画数量
   */
  getAnimationCount(elementId: string): number {
    const animations = this.animationQueue.get(elementId)
    return animations ? animations.length : 0
  }

  /**
   * 更新默认动画选项
   */
  updateDefaultOptions(options: Partial<TrayAnimationOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  /**
   * 获取默认动画选项
   */
  getDefaultOptions(): TrayAnimationOptions {
    return { ...this.defaultOptions }
  }

  /**
   * 添加动画到队列
   */
  private addToQueue(elementId: string, animation: Animation): void {
    if (!this.animationQueue.has(elementId)) {
      this.animationQueue.set(elementId, [])
    }
    this.animationQueue.get(elementId)!.push(animation)
  }

  /**
   * 从队列移除动画
   */
  private removeFromQueue(elementId: string, animation: Animation): void {
    const animations = this.animationQueue.get(elementId)
    if (animations) {
      const index = animations.indexOf(animation)
      if (index > -1) {
        animations.splice(index, 1)
      }
      if (animations.length === 0) {
        this.animationQueue.delete(elementId)
      }
    }
  }

  /**
   * 创建自定义动画
   */
  createCustomAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: Partial<TrayAnimationOptions>
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options }
    
    return new Promise((resolve) => {
      const animation = element.animate(keyframes, {
        duration: opts.duration,
        easing: opts.easing,
        delay: opts.delay,
        fill: 'forwards'
      })

      this.addToQueue(element.id || 'unknown', animation)
      animation.onfinish = () => {
        this.removeFromQueue(element.id || 'unknown', animation)
        resolve()
      }
    })
  }

  /**
   * 销毁动画管理器
   */
  destroy(): void {
    this.stopAllAnimations()
  }
}

// 导出单例实例
export const trayAnimations = new TrayAnimations()
