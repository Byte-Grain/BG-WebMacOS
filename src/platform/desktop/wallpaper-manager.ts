import type {
  WallpaperConfig,
  ExtendedWallpaperConfig,
  WallpaperFilterOptions,
  WallpaperMetadata
} from './types'

/**
 * 壁纸管理器
 * 负责管理桌面壁纸的加载、切换、预览和配置
 */
export class WallpaperManager {
  private wallpapers = new Map<string, ExtendedWallpaperConfig>()
  private currentWallpaper: ExtendedWallpaperConfig | null = null
  private preloadedWallpapers = new Map<string, HTMLImageElement | HTMLVideoElement>()
  private scheduleTimer: number | null = null
  private transitionElement: HTMLElement | null = null
  private eventListeners = new Map<string, Set<Function>>()

  constructor() {
    this.initializeEventListeners()
    this.setupTransitionElement()
  }

  /**
   * 初始化壁纸管理器
   */
  async initialize(): Promise<void> {
    // 加载默认壁纸
    await this.loadDefaultWallpapers()
    
    // 设置默认壁纸
    const defaultWallpaper = this.getWallpaperById('default')
    if (defaultWallpaper) {
      await this.setWallpaper(defaultWallpaper.id)
    }
  }

  /**
   * 添加壁纸
   */
  async addWallpaper(config: WallpaperConfig): Promise<ExtendedWallpaperConfig> {
    const extendedConfig: ExtendedWallpaperConfig = {
      ...config,
      favorite: false,
      usageCount: 0,
      lastUsed: 0
    }

    // 获取壁纸元数据
    try {
      extendedConfig.metadata = await this.extractMetadata(config.url, config.type)
      extendedConfig.thumbnail = await this.generateThumbnail(config.url, config.type)
    } catch (error) {
      console.warn('Failed to extract wallpaper metadata:', error)
    }

    this.wallpapers.set(config.id, extendedConfig)
    this.emitEvent('wallpaper-added', { wallpaper: extendedConfig })

    return extendedConfig
  }

  /**
   * 移除壁纸
   */
  removeWallpaper(wallpaperId: string): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId)
    if (!wallpaper) {
      return false
    }

    // 不能删除当前壁纸
    if (this.currentWallpaper?.id === wallpaperId) {
      return false
    }

    this.wallpapers.delete(wallpaperId)
    this.preloadedWallpapers.delete(wallpaperId)
    this.emitEvent('wallpaper-removed', { wallpaper })

    return true
  }

  /**
   * 获取壁纸
   */
  getWallpaperById(wallpaperId: string): ExtendedWallpaperConfig | null {
    return this.wallpapers.get(wallpaperId) || null
  }

  /**
   * 获取所有壁纸
   */
  getAllWallpapers(): ExtendedWallpaperConfig[] {
    return Array.from(this.wallpapers.values())
  }

  /**
   * 获取当前壁纸
   */
  getCurrentWallpaper(): ExtendedWallpaperConfig | null {
    return this.currentWallpaper
  }

  /**
   * 设置壁纸
   */
  async setWallpaper(wallpaperId: string, options: {
    transition?: boolean
    duration?: number
  } = {}): Promise<boolean> {
    const wallpaper = this.wallpapers.get(wallpaperId)
    if (!wallpaper) {
      return false
    }

    const { transition = true, duration = 1000 } = options
    const previousWallpaper = this.currentWallpaper

    try {
      // 预加载壁纸
      await this.preloadWallpaper(wallpaper)

      // 应用壁纸
      if (transition && previousWallpaper) {
        await this.applyWallpaperWithTransition(wallpaper, duration)
      } else {
        await this.applyWallpaper(wallpaper)
      }

      // 更新当前壁纸
      this.currentWallpaper = wallpaper
      wallpaper.lastUsed = Date.now()
      wallpaper.usageCount = (wallpaper.usageCount || 0) + 1

      // 启动定时切换（如果配置了）
      this.setupSchedule(wallpaper)

      this.emitEvent('wallpaper-changed', {
        current: wallpaper,
        previous: previousWallpaper
      })

      return true
    } catch (error) {
      console.error('Failed to set wallpaper:', error)
      this.emitEvent('wallpaper-error', {
        wallpaper,
        error: error.message
      })
      return false
    }
  }

  /**
   * 设置下一张壁纸
   */
  async setNextWallpaper(): Promise<boolean> {
    const wallpapers = this.getAllWallpapers()
    if (wallpapers.length <= 1) {
      return false
    }

    const currentIndex = wallpapers.findIndex(w => w.id === this.currentWallpaper?.id)
    const nextIndex = (currentIndex + 1) % wallpapers.length
    const nextWallpaper = wallpapers[nextIndex]

    return await this.setWallpaper(nextWallpaper.id)
  }

  /**
   * 设置上一张壁纸
   */
  async setPreviousWallpaper(): Promise<boolean> {
    const wallpapers = this.getAllWallpapers()
    if (wallpapers.length <= 1) {
      return false
    }

    const currentIndex = wallpapers.findIndex(w => w.id === this.currentWallpaper?.id)
    const prevIndex = currentIndex <= 0 ? wallpapers.length - 1 : currentIndex - 1
    const prevWallpaper = wallpapers[prevIndex]

    return await this.setWallpaper(prevWallpaper.id)
  }

  /**
   * 设置随机壁纸
   */
  async setRandomWallpaper(): Promise<boolean> {
    const wallpapers = this.getAllWallpapers().filter(w => w.id !== this.currentWallpaper?.id)
    if (wallpapers.length === 0) {
      return false
    }

    const randomIndex = Math.floor(Math.random() * wallpapers.length)
    const randomWallpaper = wallpapers[randomIndex]

    return await this.setWallpaper(randomWallpaper.id)
  }

  /**
   * 更新壁纸配置
   */
  updateWallpaperConfig(wallpaperId: string, updates: Partial<WallpaperConfig>): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId)
    if (!wallpaper) {
      return false
    }

    Object.assign(wallpaper, updates)

    // 如果是当前壁纸，重新应用
    if (this.currentWallpaper?.id === wallpaperId) {
      this.applyWallpaper(wallpaper)
    }

    this.emitEvent('wallpaper-updated', { wallpaper })
    return true
  }

  /**
   * 搜索壁纸
   */
  searchWallpapers(options: WallpaperFilterOptions): ExtendedWallpaperConfig[] {
    const wallpapers = this.getAllWallpapers()

    return wallpapers.filter(wallpaper => {
      if (options.type && wallpaper.type !== options.type) {
        return false
      }
      if (options.name && !wallpaper.name.toLowerCase().includes(options.name.toLowerCase())) {
        return false
      }
      if (options.tags && options.tags.length > 0) {
        const wallpaperTags = wallpaper.metadata?.tags || []
        if (!options.tags.some(tag => wallpaperTags.includes(tag))) {
          return false
        }
      }
      if (options.resolution && wallpaper.metadata) {
        const resolution = `${wallpaper.metadata.width}x${wallpaper.metadata.height}`
        if (resolution !== options.resolution) {
          return false
        }
      }
      if (options.aspectRatio && wallpaper.metadata) {
        const ratio = wallpaper.metadata.width / wallpaper.metadata.height
        const targetRatio = this.parseAspectRatio(options.aspectRatio)
        if (Math.abs(ratio - targetRatio) > 0.1) {
          return false
        }
      }
      return true
    })
  }

  /**
   * 获取收藏的壁纸
   */
  getFavoriteWallpapers(): ExtendedWallpaperConfig[] {
    return this.getAllWallpapers().filter(wallpaper => wallpaper.favorite)
  }

  /**
   * 切换壁纸收藏状态
   */
  toggleFavorite(wallpaperId: string): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId)
    if (!wallpaper) {
      return false
    }

    wallpaper.favorite = !wallpaper.favorite
    this.emitEvent('wallpaper-favorite-changed', { wallpaper })
    return true
  }

  /**
   * 预加载壁纸
   */
  async preloadWallpaper(wallpaper: ExtendedWallpaperConfig): Promise<void> {
    if (this.preloadedWallpapers.has(wallpaper.id)) {
      return
    }

    return new Promise((resolve, reject) => {
      if (wallpaper.type === 'image') {
        const img = new Image()
        img.onload = () => {
          this.preloadedWallpapers.set(wallpaper.id, img)
          resolve()
        }
        img.onerror = () => reject(new Error(`Failed to load image: ${wallpaper.url}`))
        img.src = wallpaper.url
      } else if (wallpaper.type === 'video') {
        const video = document.createElement('video')
        video.onloadeddata = () => {
          this.preloadedWallpapers.set(wallpaper.id, video)
          resolve()
        }
        video.onerror = () => reject(new Error(`Failed to load video: ${wallpaper.url}`))
        video.src = wallpaper.url
        video.load()
      } else {
        resolve() // 对于其他类型，直接解析
      }
    })
  }

  /**
   * 预加载多个壁纸
   */
  async preloadWallpapers(wallpaperIds: string[]): Promise<void> {
    const promises = wallpaperIds.map(id => {
      const wallpaper = this.wallpapers.get(id)
      return wallpaper ? this.preloadWallpaper(wallpaper) : Promise.resolve()
    })

    await Promise.allSettled(promises)
  }

  /**
   * 清理预加载的壁纸
   */
  clearPreloadedWallpapers(): void {
    this.preloadedWallpapers.clear()
  }

  /**
   * 获取壁纸统计信息
   */
  getStats(): {
    total: number
    byType: Record<string, number>
    favorites: number
    mostUsed: ExtendedWallpaperConfig | null
    recentlyUsed: ExtendedWallpaperConfig[]
  } {
    const wallpapers = this.getAllWallpapers()
    const byType: Record<string, number> = {}
    let mostUsed: ExtendedWallpaperConfig | null = null
    let maxUsage = 0

    wallpapers.forEach(wallpaper => {
      byType[wallpaper.type] = (byType[wallpaper.type] || 0) + 1
      
      if ((wallpaper.usageCount || 0) > maxUsage) {
        maxUsage = wallpaper.usageCount || 0
        mostUsed = wallpaper
      }
    })

    const recentlyUsed = wallpapers
      .filter(w => w.lastUsed)
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, 5)

    return {
      total: wallpapers.length,
      byType,
      favorites: wallpapers.filter(w => w.favorite).length,
      mostUsed,
      recentlyUsed
    }
  }

  /**
   * 导出壁纸配置
   */
  exportWallpapers(): ExtendedWallpaperConfig[] {
    return this.getAllWallpapers().map(wallpaper => ({ ...wallpaper }))
  }

  /**
   * 导入壁纸配置
   */
  async importWallpapers(wallpapers: WallpaperConfig[]): Promise<void> {
    for (const wallpaper of wallpapers) {
      await this.addWallpaper(wallpaper)
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 销毁壁纸管理器
   */
  destroy(): void {
    this.clearSchedule()
    this.clearPreloadedWallpapers()
    this.eventListeners.clear()
    this.wallpapers.clear()
    this.currentWallpaper = null
  }

  // 私有方法

  private async loadDefaultWallpapers(): Promise<void> {
    const defaultWallpapers: WallpaperConfig[] = [
      {
        id: 'default',
        name: 'Default Wallpaper',
        url: '/assets/wallpapers/default.jpg',
        type: 'image',
        fit: 'cover',
        position: 'center'
      },
      {
        id: 'dark',
        name: 'Dark Theme',
        url: '/assets/wallpapers/dark.jpg',
        type: 'image',
        fit: 'cover',
        position: 'center'
      },
      {
        id: 'light',
        name: 'Light Theme',
        url: '/assets/wallpapers/light.jpg',
        type: 'image',
        fit: 'cover',
        position: 'center'
      }
    ]

    for (const wallpaper of defaultWallpapers) {
      await this.addWallpaper(wallpaper)
    }
  }

  private initializeEventListeners(): void {
    const events = [
      'wallpaper-added',
      'wallpaper-removed',
      'wallpaper-changed',
      'wallpaper-updated',
      'wallpaper-favorite-changed',
      'wallpaper-error'
    ]

    events.forEach(event => {
      this.eventListeners.set(event, new Set())
    })
  }

  private setupTransitionElement(): void {
    if (typeof document !== 'undefined') {
      this.transitionElement = document.createElement('div')
      this.transitionElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
        transition: opacity 1s ease-in-out;
      `
      document.body.appendChild(this.transitionElement)
    }
  }

  private async applyWallpaper(wallpaper: ExtendedWallpaperConfig): Promise<void> {
    if (typeof document === 'undefined') {
      return
    }

    const body = document.body
    const style = this.generateWallpaperStyle(wallpaper)
    
    Object.assign(body.style, style)
  }

  private async applyWallpaperWithTransition(
    wallpaper: ExtendedWallpaperConfig, 
    duration: number
  ): Promise<void> {
    if (!this.transitionElement) {
      return this.applyWallpaper(wallpaper)
    }

    return new Promise((resolve) => {
      const style = this.generateWallpaperStyle(wallpaper)
      
      // 设置新壁纸到过渡元素
      Object.assign(this.transitionElement!.style, style)
      this.transitionElement!.style.opacity = '0'
      
      // 开始过渡
      requestAnimationFrame(() => {
        this.transitionElement!.style.transitionDuration = `${duration}ms`
        this.transitionElement!.style.opacity = '1'
        
        setTimeout(() => {
          // 将样式应用到body
          Object.assign(document.body.style, style)
          
          // 重置过渡元素
          this.transitionElement!.style.opacity = '0'
          
          setTimeout(() => {
            resolve()
          }, 100)
        }, duration)
      })
    })
  }

  private generateWallpaperStyle(wallpaper: ExtendedWallpaperConfig): Partial<CSSStyleDeclaration> {
    const style: any = {}

    switch (wallpaper.type) {
      case 'image':
        style.backgroundImage = `url(${wallpaper.url})`
        style.backgroundSize = wallpaper.fit
        style.backgroundPosition = wallpaper.position
        style.backgroundRepeat = 'no-repeat'
        break
      
      case 'solid':
        style.backgroundColor = wallpaper.url // URL作为颜色值
        style.backgroundImage = 'none'
        break
      
      case 'video':
        // 视频壁纸需要特殊处理
        style.backgroundImage = 'none'
        break
    }

    // 应用滤镜效果
    const filters = []
    if (wallpaper.opacity !== undefined && wallpaper.opacity !== 1) {
      filters.push(`opacity(${wallpaper.opacity})`)
    }
    if (wallpaper.blur) {
      filters.push(`blur(${wallpaper.blur}px)`)
    }
    if (wallpaper.brightness !== undefined && wallpaper.brightness !== 1) {
      filters.push(`brightness(${wallpaper.brightness})`)
    }
    if (wallpaper.contrast !== undefined && wallpaper.contrast !== 1) {
      filters.push(`contrast(${wallpaper.contrast})`)
    }
    if (wallpaper.saturation !== undefined && wallpaper.saturation !== 1) {
      filters.push(`saturate(${wallpaper.saturation})`)
    }
    if (wallpaper.hue) {
      filters.push(`hue-rotate(${wallpaper.hue}deg)`)
    }

    if (filters.length > 0) {
      style.filter = filters.join(' ')
    }

    return style
  }

  private setupSchedule(wallpaper: ExtendedWallpaperConfig): void {
    this.clearSchedule()

    if (wallpaper.schedule?.enabled && wallpaper.schedule.interval > 0) {
      const intervalMs = wallpaper.schedule.interval * 60 * 1000
      
      this.scheduleTimer = window.setInterval(() => {
        if (wallpaper.schedule?.shuffle) {
          this.setRandomWallpaper()
        } else {
          this.setNextWallpaper()
        }
      }, intervalMs)
    }
  }

  private clearSchedule(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer)
      this.scheduleTimer = null
    }
  }

  private async extractMetadata(url: string, type: string): Promise<WallpaperMetadata> {
    return new Promise((resolve, reject) => {
      if (type === 'image') {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: 0, // 无法获取文件大小
            format: this.getImageFormat(url)
          })
        }
        img.onerror = () => reject(new Error('Failed to load image for metadata'))
        img.src = url
      } else if (type === 'video') {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            size: 0,
            format: this.getVideoFormat(url)
          })
        }
        video.onerror = () => reject(new Error('Failed to load video for metadata'))
        video.src = url
      } else {
        resolve({
          width: 0,
          height: 0,
          size: 0,
          format: 'unknown'
        })
      }
    })
  }

  private async generateThumbnail(url: string, type: string): Promise<string> {
    if (type === 'image') {
      return url // 对于图片，直接使用原图作为缩略图
    }
    
    if (type === 'video') {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        video.onloadeddata = () => {
          canvas.width = 200
          canvas.height = (200 * video.videoHeight) / video.videoWidth
          
          video.currentTime = 1 // 获取第1秒的帧
        }
        
        video.onseeked = () => {
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        
        video.onerror = () => reject(new Error('Failed to generate video thumbnail'))
        video.src = url
      })
    }
    
    return '' // 其他类型返回空字符串
  }

  private getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  private getVideoFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  private parseAspectRatio(ratio: string): number {
    const parts = ratio.split(':')
    if (parts.length === 2) {
      return parseFloat(parts[0]) / parseFloat(parts[1])
    }
    return parseFloat(ratio)
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in wallpaper event listener for ${event}:`, error)
        }
      })
    }
  }
}
