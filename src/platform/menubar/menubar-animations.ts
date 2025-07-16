import type {
  MenuAnimationOptions
} from './types'

/**
 * 菜单栏动画管理器
 * 负责管理菜单栏和菜单的各种动画效果
 */
export class MenuBarAnimations {
  private animationQueue: Map<string, Animation[]> = new Map()
  private defaultDuration = 200
  private defaultEasing = 'ease-out'

  /**
   * 播放菜单打开动画
   */
  async playMenuOpenAnimation(element: HTMLElement, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      type: 'fade' as const,
      duration: options?.duration || this.defaultDuration,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0,
      direction: options?.direction || 'down'
    }

    return new Promise((resolve) => {
      let keyframes: Keyframe[]

      switch (config.type) {
        case 'fade':
          keyframes = [
            {
              opacity: '0',
              transform: 'scale(0.95)'
            },
            {
              opacity: '1',
              transform: 'scale(1)'
            }
          ]
          break
        case 'slide':
          const slideTransform = config.direction === 'down' ? 'translateY(-10px)' : 'translateY(10px)'
          keyframes = [
            {
              opacity: '0',
              transform: slideTransform
            },
            {
              opacity: '1',
              transform: 'translateY(0)'
            }
          ]
          break
        case 'scale':
          keyframes = [
            {
              opacity: '0',
              transform: 'scale(0.8)'
            },
            {
              opacity: '1',
              transform: 'scale(1)'
            }
          ]
          break
        default:
          keyframes = [
            { opacity: '0' },
            { opacity: '1' }
          ]
      }

      const animation = element.animate(keyframes, {
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
   * 播放菜单关闭动画
   */
  async playMenuCloseAnimation(element: HTMLElement, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      type: 'fade' as const,
      duration: options?.duration || this.defaultDuration * 0.75,
      easing: options?.easing || 'ease-in',
      delay: options?.delay || 0,
      direction: options?.direction || 'up'
    }

    return new Promise((resolve) => {
      let keyframes: Keyframe[]

      switch (config.type) {
        case 'fade':
          keyframes = [
            {
              opacity: '1',
              transform: 'scale(1)'
            },
            {
              opacity: '0',
              transform: 'scale(0.95)'
            }
          ]
          break
        case 'slide':
          const slideTransform = config.direction === 'up' ? 'translateY(-10px)' : 'translateY(10px)'
          keyframes = [
            {
              opacity: '1',
              transform: 'translateY(0)'
            },
            {
              opacity: '0',
              transform: slideTransform
            }
          ]
          break
        case 'scale':
          keyframes = [
            {
              opacity: '1',
              transform: 'scale(1)'
            },
            {
              opacity: '0',
              transform: 'scale(0.8)'
            }
          ]
          break
        default:
          keyframes = [
            { opacity: '1' },
            { opacity: '0' }
          ]
      }

      const animation = element.animate(keyframes, {
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
   * 播放菜单项悬停动画
   */
  async playMenuItemHoverAnimation(element: HTMLElement, isEntering: boolean, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 150,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    const targetBackgroundColor = isEntering ? 'var(--menu-hover-color, #007AFF)' : 'transparent'
    const targetTextColor = isEntering ? 'var(--menu-hover-text-color, white)' : 'var(--menu-text-color, black)'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          backgroundColor: isEntering ? 'transparent' : 'var(--menu-hover-color, #007AFF)',
          color: isEntering ? 'var(--menu-text-color, black)' : 'var(--menu-hover-text-color, white)'
        },
        {
          backgroundColor: targetBackgroundColor,
          color: targetTextColor
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
   * 播放菜单项点击动画
   */
  async playMenuItemClickAnimation(element: HTMLElement, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 100,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'scale(1)',
          backgroundColor: 'var(--menu-hover-color, #007AFF)'
        },
        {
          transform: 'scale(0.98)',
          backgroundColor: 'var(--menu-active-color, #005bb5)',
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          backgroundColor: 'var(--menu-hover-color, #007AFF)'
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
   * 播放子菜单打开动画
   */
  async playSubmenuOpenAnimation(element: HTMLElement, direction: 'left' | 'right' = 'right', options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || this.defaultDuration,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    const translateX = direction === 'right' ? '-10px' : '10px'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          opacity: '0',
          transform: `translateX(${translateX}) scale(0.95)`
        },
        {
          opacity: '1',
          transform: 'translateX(0) scale(1)'
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
   * 播放子菜单关闭动画
   */
  async playSubmenuCloseAnimation(element: HTMLElement, direction: 'left' | 'right' = 'right', options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || this.defaultDuration * 0.75,
      easing: options?.easing || 'ease-in',
      delay: options?.delay || 0
    }

    const translateX = direction === 'right' ? '-10px' : '10px'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          opacity: '1',
          transform: 'translateX(0) scale(1)'
        },
        {
          opacity: '0',
          transform: `translateX(${translateX}) scale(0.95)`
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
   * 播放菜单栏显示动画
   */
  async playMenuBarShowAnimation(element: HTMLElement, position: 'top' | 'bottom' = 'top', options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || 300,
      easing: options?.easing || this.defaultEasing,
      delay: options?.delay || 0
    }

    const translateY = position === 'top' ? '-100%' : '100%'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: `translateY(${translateY})`,
          opacity: '0'
        },
        {
          transform: 'translateY(0)',
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
   * 播放菜单栏隐藏动画
   */
  async playMenuBarHideAnimation(element: HTMLElement, position: 'top' | 'bottom' = 'top', options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      type: 'slide' as const,
      duration: options?.duration || 300,
      easing: options?.easing || 'ease-in',
      delay: options?.delay || 0
    }

    const translateY = position === 'top' ? '-100%' : '100%'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'translateY(0)',
          opacity: '1'
        },
        {
          transform: `translateY(${translateY})`,
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
   * 播放菜单项焦点动画
   */
  async playMenuItemFocusAnimation(element: HTMLElement, isFocused: boolean, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 150,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    const targetBoxShadow = isFocused 
      ? 'inset 0 0 0 2px var(--focus-color, #007AFF)'
      : 'none'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          boxShadow: isFocused ? 'none' : 'inset 0 0 0 2px var(--focus-color, #007AFF)'
        },
        {
          boxShadow: targetBoxShadow
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
   * 播放复选框切换动画
   */
  async playCheckboxToggleAnimation(element: HTMLElement, isChecked: boolean, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 200,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          transform: 'scale(1)',
          opacity: isChecked ? '0' : '1'
        },
        {
          transform: 'scale(1.2)',
          opacity: '0.5',
          offset: 0.5
        },
        {
          transform: 'scale(1)',
          opacity: isChecked ? '1' : '0'
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
   * 播放菜单项禁用动画
   */
  async playMenuItemDisableAnimation(element: HTMLElement, isDisabled: boolean, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 200,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    const targetOpacity = isDisabled ? '0.5' : '1'
    const targetFilter = isDisabled ? 'grayscale(1)' : 'grayscale(0)'

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          opacity: isDisabled ? '1' : '0.5',
          filter: isDisabled ? 'grayscale(0)' : 'grayscale(1)'
        },
        {
          opacity: targetOpacity,
          filter: targetFilter
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
   * 播放菜单项加载动画
   */
  async playMenuItemLoadingAnimation(element: HTMLElement, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 1000,
      easing: 'linear',
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%) 0% 0% / 200% 100%'
        },
        {
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%) 100% 0% / 200% 100%'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay,
        iterations: Infinity
      })

      // 手动控制停止
      setTimeout(() => {
        animation.cancel()
        resolve()
      }, config.duration * 3) // 播放3次后停止

      this.addToQueue(element.id, animation)
    })
  }

  /**
   * 播放菜单分隔符动画
   */
  async playSeparatorAnimation(element: HTMLElement, options?: Partial<MenuAnimationOptions>): Promise<void> {
    const config = {
      duration: options?.duration || 300,
      easing: options?.easing || 'ease-out',
      delay: options?.delay || 0
    }

    return new Promise((resolve) => {
      const animation = element.animate([
        {
          width: '0%',
          opacity: '0'
        },
        {
          width: '100%',
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

    animation.oncancel = () => {
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
export const menuBarAnimations = new MenuBarAnimations()