import { defineAsyncComponent, AsyncComponentLoader } from 'vue'
import type { AppConfig } from '@/types/app.d'

/**
 * 动态组件加载器
 */
export class DynamicComponentLoader {
  private componentCache = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()

  /**
   * 根据应用配置加载组件
   */
  loadComponent(app: AppConfig): AsyncComponentLoader {
    const componentKey = app.component || app.key
    
    // 如果已经缓存，直接返回
    if (this.componentCache.has(componentKey)) {
      return () => Promise.resolve(this.componentCache.get(componentKey))
    }

    // 如果正在加载，返回现有的 Promise
    if (this.loadingPromises.has(componentKey)) {
      return () => this.loadingPromises.get(componentKey)!
    }

    // 创建异步组件加载器
    return defineAsyncComponent({
      loader: () => this.createComponentLoader(app),
      loadingComponent: () => import('@/shared/components/feedback/Loading.vue'),
      errorComponent: () => import('@/shared/components/feedback/AppError.vue'),
      delay: 200,
      timeout: 10000
    })
  }

  /**
   * 创建组件加载器
   */
  private async createComponentLoader(app: AppConfig) {
    const componentKey = app.component || app.key
    
    // 创建加载 Promise
    const loadingPromise = this.tryLoadFromPaths(app)
    this.loadingPromises.set(componentKey, loadingPromise)
    
    try {
      const component = await loadingPromise
      
      // 缓存组件
      this.componentCache.set(componentKey, component)
      
      return component
    } catch (error) {
      console.error(`Failed to load component for app: ${app.key}`, error)
      throw error
    } finally {
      // 清理加载 Promise
      this.loadingPromises.delete(componentKey)
    }
  }

  /**
   * 尝试从多个路径加载组件
   */
  private async tryLoadFromPaths(app: AppConfig) {
    const possiblePaths = this.generatePossiblePaths(app)
    
    for (const path of possiblePaths) {
      try {
        const module = await import(/* @vite-ignore */ path)
        return module.default || module
      } catch (error) {
        // 继续尝试下一个路径
        continue
      }
    }
    
    throw new Error(`Component not found for app: ${app.key}`)
  }

  /**
   * 生成可能的组件路径
   */
  private generatePossiblePaths(app: AppConfig): string[] {
    const paths: string[] = []
    const componentName = app.component || app.key
    
    // 1. 如果配置中指定了完整路径
    if (app.componentPath) {
      paths.push(app.componentPath)
    }
    
    // 2. 根据应用分类生成路径（使用@别名）
    if (app.category) {
      paths.push(`@/views/apps/${app.category}/${componentName}.vue`)
      paths.push(`@/views/apps/${app.category}/${app.key}.vue`)
    }
    
    // 3. 通用路径
    paths.push(`@/views/apps/${componentName}.vue`)
    paths.push(`@/views/apps/${app.key}.vue`)
    
    // 4. 组件目录
    paths.push(`@/components/apps/${componentName}.vue`)
    paths.push(`@/components/apps/${app.key}.vue`)
    
    // 5. 桌面系统应用路径（兼容现有结构）
    if (app.category === 'system') {
      paths.push(`@/views/desktop/system/${componentName}.vue`)
      paths.push(`@/views/desktop/system/${app.key}.vue`)
    }
    
    return paths
  }

  /**
   * 预加载组件
   */
  async preloadComponent(app: AppConfig): Promise<void> {
    try {
      await this.createComponentLoader(app)
    } catch (error) {
      console.warn(`Failed to preload component for app: ${app.key}`, error)
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.componentCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * 获取缓存状态
   */
  getCacheInfo() {
    return {
      cachedComponents: this.componentCache.size,
      loadingComponents: this.loadingPromises.size,
      cacheKeys: Array.from(this.componentCache.keys())
    }
  }
}

// 导出单例实例
export const dynamicComponentLoader = new DynamicComponentLoader()
