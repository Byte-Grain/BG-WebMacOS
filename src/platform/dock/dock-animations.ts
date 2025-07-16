import type {
  DockItem,
  DockAnimationOptions
} from './types'

/**
 * Dock动画管理器
 * 负责管理Dock项目的各种动画效果
 */
export class DockAnimations {
  private animationQueue: Map<string, Animation[]> = new Map()
  private defaultDuration = 300
  private defaultEasing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

  /**
   * 播放项目添加动画
   */
  async playItemAddAnimation(element: HTMLElement, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'scale' as const,
      duration: options?.duration || this.defaultDuration,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'scale(0) translateY(20px)',
          opacity: '0'
        },
        {
          transform: 'scale(1.1) translateY(-5px)',
          opacity: '1',
          offset: 0.7
        },
        {
          transform: 'scale(1) translateY(0)',
          opacity: '1'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目移除动画
   */
  async playItemRemoveAnimation(element: HTMLElement, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'scale' as const,
      duration: options?.duration || this.defaultDuration,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'scale(1) translateY(0)',
          opacity: '1'
        },
        {
          transform: 'scale(1.1) translateY(-10px)',
          opacity: '0.8',
          offset: 0.3
        },
        {
          transform: 'scale(0) translateY(20px)',
          opacity: '0'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目弹跳动画
   */
  async playItemBounceAnimation(element: HTMLElement, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'bounce' as const,
      duration: options?.duration || 600,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      delay: options?.delay || 0,
      repeat: options?.repeat || 1
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-20px) scale(1.1)', offset: 0.3 },
        { transform: 'translateY(-10px) scale(1.05)', offset: 0.5 },
        { transform: 'translateY(-15px) scale(1.08)', offset: 0.7 },
        { transform: 'translateY(0) scale(1)' }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        iterations: config.repeat,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目发光动画
   */
  async playItemGlowAnimation(element: HTMLElement, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'glow' as const,
      duration: options?.duration || 1000,
      easing: 'ease-in-out',
      delay: options?.delay || 0,
      repeat: options?.repeat || 3
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          boxShadow: '0 0 0 rgba(0, 122, 255, 0)',
          filter: 'brightness(1)'
        },
        {
          boxShadow: '0 0 20px rgba(0, 122, 255, 0.8)',
          filter: 'brightness(1.2)',
          offset: 0.5
        },
        {
          boxShadow: '0 0 0 rgba(0, 122, 255, 0)',
          filter: 'brightness(1)'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        iterations: config.repeat,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目悬停动画
   */
  async playItemHoverAnimation(element: HTMLElement, isEntering: boolean, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'scale' as const,
      duration: options?.duration || 200,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    const targetScale = isEntering ? '1.2' : '1'
    const targetTranslateY = isEntering ? '-5px' : '0'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: `scale(${isEntering ? '1' : '1.2'}) translateY(${isEntering ? '0' : '-5px'})`
        },
        {
          transform: `scale(${targetScale}) translateY(${targetTranslateY})`
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目拖拽开始动画
   */
  async playItemDragStartAnimation(element: HTMLElement, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'scale' as const,
      duration: options?.duration || 150,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'scale(1) rotate(0deg)',
          opacity: '1',
          zIndex: '1'
        },
        {
          transform: 'scale(1.1) rotate(2deg)',
          opacity: '0.8',
          zIndex: '1000'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目拖拽结束动画
   */
  async playItemDragEndAnimation(element: HTMLElement, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'scale' as const,
      duration: options?.duration || 200,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'scale(1.1) rotate(2deg)',
          opacity: '0.8',
          zIndex: '1000'
        },
        {
          transform: 'scale(1) rotate(0deg)',
          opacity: '1',
          zIndex: '1'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放Dock显示动画
   */
  async playDockShowAnimation(element: HTMLElement, position: 'bottom' | 'left' | 'right' | 'top', options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || 300,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    const transforms = {
      bottom: ['translateY(100%)', 'translateY(0)'],
      top: ['translateY(-100%)', 'translateY(0)'],
      left: ['translateX(-100%)', 'translateX(0)'],
      right: ['translateX(100%)', 'translateX(0)']
    }

    const [fromTransform, toTransform] = transforms[position]

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: fromTransform,
          opacity: '0'
        },
        {
          transform: toTransform,
          opacity: '1'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放Dock隐藏动画
   */
  async playDockHideAnimation(element: HTMLElement, position: 'bottom' | 'left' | 'right' | 'top', options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || 300,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    const transforms = {
      bottom: ['translateY(0)', 'translateY(100%)'],
      top: ['translateY(0)', 'translateY(-100%)'],
      left: ['translateX(0)', 'translateX(-100%)'],
      right: ['translateX(0)', 'translateX(100%)']
    }

    const [fromTransform, toTransform] = transforms[position]

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: fromTransform,
          opacity: '1'
        },
        {
          transform: toTransform,
          opacity: '0'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放项目移动动画
   */
  async playItemMoveAnimation(element: HTMLElement, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || 300,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: `translate(${fromPosition.x}px, ${fromPosition.y}px)`
        },
        {
          transform: `translate(${toPosition.x}px, ${toPosition.y}px)`
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        fill: 'forwards'
      })

      animation.onfinish = () => resolve()
      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放放大镜效果动画
   */
  async playMagnificationAnimation(elements: HTMLElement[], hoverIndex: number, magnificationSize: number, options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 200,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    const promises = elements.map((element, index) => {
      const distance = Math.abs(index - hoverIndex)
      let scale = 1

      if (distance === 0) {
        scale = magnificationSize
      } else if (distance === 1) {
        scale = 1 + (magnificationSize - 1) * 0.5
      } else if (distance === 2) {
        scale = 1 + (magnificationSize - 1) * 0.25
      }

      return new Promise<void>((resolve) => {
        const animation = element.animate([
          {
            transform: element.style.transform || 'scale(1)'
          },
          {
            transform: `scale(${scale})`
          }
        ], {
          duration: config.duration,
          easing: config.easing,
          delay: config.delay,
          fill: 'forwards'
        })

        animation.onfinish = () => resolve()
        this.addToQueue(element.id, animation)
      })
    })

    await Promise.all(promises)
  }

  /**
   * 重置放大镜效果
   */
  async resetMagnificationAnimation(elements: HTMLElement[], options?: Partial<DockAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 200,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    const promises = elements.map(element => {
      return new Promise<void>((resolve) => {
        const animation = element.animate([
          {
            transform: element.style.transform || 'scale(1)'
          },
          {
            transform: 'scale(1)'
          }
        ], {
          duration: config.duration,
          easing: config.easing,
          delay: config.delay,
          fill: 'forwards'
        })

        animation.onfinish = () => resolve()
        this.addToQueue(element.id, animation)
      })
    })

    await Promise.all(promises)
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
    this.animationQueue.forEach((animations) => {
      animations.forEach(animation => {
        animation.cancel()
      })
    })
    this.animationQueue.clear()
  }

  /**
   * 检查元素是否有正在运行的动画
   */
  hasRunningAnimations(elementId: string): boolean {
    const animations = this.animationQueue.get(elementId)
    return animations ? animations.some(animation => animation.playState === 'running') : false
  }

  /**
   * 添加动画到队列
   */
  private addToQueue(elementId: string, animation: Animation): void {
    if (!this.animationQueue.has(elementId)) {
      this.animationQueue.set(elementId, [])
    }

    const animations = this.animationQueue.get(elementId)!
    animations.push(animation)

    // 清理完成的动画
    animation.onfinish = () => {
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
   * 更新默认配置
   */
  updateDefaults(duration?: number, easing?: string): void {
    if (duration !== undefined) {
      this.defaultDuration = duration
    }
    if (easing !== undefined) {
      this.defaultEasing = easing
    }
  }

  /**
   * 获取默认配置
   */
  getDefaults(): { duration: number; easing: string } {
    return {
      duration: this.defaultDuration,
      easing: this.defaultEasing
    }
  }

  /**
   * 销毁动画管理器
   */
  destroy(): void {
    this.stopAllAnimations()
  }
}

// 导出单例实例
export const dockAnimations = new DockAnimations()