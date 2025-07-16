/**
 * 应用商店服务
 * 负责应用的发现、下载、安装和管理
 */

import { AppPackageManager } from './appPackageManager'
import { 
  StoreAppInfo, 
  AppSearchResult, 
  AppCategoryInfo,
  AppManifest,
  InstallResult,
  UpdateResult,
  InstalledAppInfo
} from '@/types/app-package'

export interface AppStoreConfig {
  // 应用商店 API 基础 URL
  apiBaseUrl: string
  
  // CDN 基础 URL
  cdnBaseUrl: string
  
  // 认证令牌
  authToken?: string
  
  // 缓存配置
  cache: {
    enabled: boolean
    ttl: number // 缓存时间（毫秒）
  }
  
  // 下载配置
  download: {
    timeout: number
    retries: number
    chunkSize: number
  }
}

export interface AppStoreAPI {
  // 获取应用列表
  getApps(params?: {
    category?: string
    search?: string
    page?: number
    limit?: number
    sort?: 'name' | 'downloads' | 'rating' | 'updated'
    order?: 'asc' | 'desc'
  }): Promise<{
    apps: StoreAppInfo[]
    total: number
    page: number
    limit: number
  }>
  
  // 获取应用详情
  getApp(appId: string): Promise<StoreAppInfo>
  
  // 搜索应用
  searchApps(query: string, options?: {
    category?: string
    limit?: number
  }): Promise<AppSearchResult[]>
  
  // 获取分类列表
  getCategories(): Promise<AppCategoryInfo[]>
  
  // 获取热门应用
  getFeaturedApps(limit?: number): Promise<StoreAppInfo[]>
  
  // 获取推荐应用
  getRecommendedApps(limit?: number): Promise<StoreAppInfo[]>
  
  // 获取应用更新
  getAppUpdates(installedApps: string[]): Promise<{
    appId: string
    currentVersion: string
    latestVersion: string
    updateInfo: any
  }[]>
  
  // 下载应用包
  downloadApp(appId: string, version?: string, onProgress?: (progress: number) => void): Promise<Blob>
  
  // 获取应用评论
  getAppReviews(appId: string, page?: number, limit?: number): Promise<{
    reviews: any[]
    total: number
    averageRating: number
  }>
  
  // 提交应用评论
  submitReview(appId: string, rating: number, comment: string): Promise<void>
  
  // 报告应用问题
  reportApp(appId: string, reason: string, description: string): Promise<void>
}

export class AppStoreService implements AppStoreAPI {
  private config: AppStoreConfig
  private packageManager: AppPackageManager
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  
  constructor(config: AppStoreConfig, packageManager: AppPackageManager) {
    this.config = config
    this.packageManager = packageManager
  }
  
  // 缓存管理
  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`
  }
  
  private getFromCache<T>(key: string): T | null {
    if (!this.config.cache.enabled) return null
    
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const now = Date.now()
    if (now - cached.timestamp > this.config.cache.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }
  
  private setCache(key: string, data: any): void {
    if (!this.config.cache.enabled) return
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  // HTTP 请求封装
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiBaseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  // 获取应用列表
  async getApps(params: {
    category?: string
    search?: string
    page?: number
    limit?: number
    sort?: 'name' | 'downloads' | 'rating' | 'updated'
    order?: 'asc' | 'desc'
  } = {}): Promise<{
    apps: StoreAppInfo[]
    total: number
    page: number
    limit: number
  }> {
    const cacheKey = this.getCacheKey('getApps', params)
    const cached = this.getFromCache<any>(cacheKey)
    if (cached) return cached
    
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value))
      }
    })
    
    const endpoint = `/apps?${queryParams.toString()}`
    const result = await this.request<any>(endpoint)
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 获取应用详情
  async getApp(appId: string): Promise<StoreAppInfo> {
    const cacheKey = this.getCacheKey('getApp', { appId })
    const cached = this.getFromCache<StoreAppInfo>(cacheKey)
    if (cached) return cached
    
    const result = await this.request<StoreAppInfo>(`/apps/${appId}`)
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 搜索应用
  async searchApps(query: string, options: {
    category?: string
    limit?: number
  } = {}): Promise<AppSearchResult[]> {
    const params = { query, ...options }
    const cacheKey = this.getCacheKey('searchApps', params)
    const cached = this.getFromCache<AppSearchResult[]>(cacheKey)
    if (cached) return cached
    
    const queryParams = new URLSearchParams()
    queryParams.append('q', query)
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value))
      }
    })
    
    const endpoint = `/apps/search?${queryParams.toString()}`
    const result = await this.request<AppSearchResult[]>(endpoint)
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 获取分类列表
  async getCategories(): Promise<AppCategoryInfo[]> {
    const cacheKey = this.getCacheKey('getCategories', {})
    const cached = this.getFromCache<AppCategoryInfo[]>(cacheKey)
    if (cached) return cached
    
    const result = await this.request<AppCategoryInfo[]>('/categories')
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 获取热门应用
  async getFeaturedApps(limit = 10): Promise<StoreAppInfo[]> {
    const cacheKey = this.getCacheKey('getFeaturedApps', { limit })
    const cached = this.getFromCache<StoreAppInfo[]>(cacheKey)
    if (cached) return cached
    
    const result = await this.request<StoreAppInfo[]>(`/apps/featured?limit=${limit}`)
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 获取推荐应用
  async getRecommendedApps(limit = 10): Promise<StoreAppInfo[]> {
    const cacheKey = this.getCacheKey('getRecommendedApps', { limit })
    const cached = this.getFromCache<StoreAppInfo[]>(cacheKey)
    if (cached) return cached
    
    const result = await this.request<StoreAppInfo[]>(`/apps/recommended?limit=${limit}`)
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 获取应用更新
  async getAppUpdates(installedApps: string[]): Promise<{
    appId: string
    currentVersion: string
    latestVersion: string
    updateInfo: any
  }[]> {
    if (installedApps.length === 0) return []
    
    const result = await this.request<any[]>('/apps/updates', {
      method: 'POST',
      body: JSON.stringify({ apps: installedApps })
    })
    
    return result
  }
  
  // 下载应用包
  async downloadApp(
    appId: string, 
    version?: string, 
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const app = await this.getApp(appId)
    const downloadUrl = version 
      ? `${this.config.cdnBaseUrl}/apps/${appId}/${version}/${appId}.zip`
      : `${this.config.cdnBaseUrl}/apps/${appId}/latest/${appId}.zip`
    
    const response = await fetch(downloadUrl)
    
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`)
    }
    
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    
    if (!response.body) {
      throw new Error('响应体为空')
    }
    
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      chunks.push(value)
      received += value.length
      
      if (onProgress && total > 0) {
        onProgress((received / total) * 100)
      }
    }
    
    return new Blob(chunks)
  }
  
  // 获取应用评论
  async getAppReviews(appId: string, page = 1, limit = 20): Promise<{
    reviews: any[]
    total: number
    averageRating: number
  }> {
    const params = { appId, page, limit }
    const cacheKey = this.getCacheKey('getAppReviews', params)
    const cached = this.getFromCache<any>(cacheKey)
    if (cached) return cached
    
    const result = await this.request<any>(`/apps/${appId}/reviews?page=${page}&limit=${limit}`)
    
    this.setCache(cacheKey, result)
    return result
  }
  
  // 提交应用评论
  async submitReview(appId: string, rating: number, comment: string): Promise<void> {
    await this.request(`/apps/${appId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    })
    
    // 清除相关缓存
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes('getAppReviews') && key.includes(appId)
    )
    keysToDelete.forEach(key => this.cache.delete(key))
  }
  
  // 报告应用问题
  async reportApp(appId: string, reason: string, description: string): Promise<void> {
    await this.request(`/apps/${appId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description })
    })
  }
  
  // 安装应用
  async installApp(
    appId: string, 
    version?: string,
    onProgress?: (progress: number) => void
  ): Promise<InstallResult> {
    try {
      // 1. 下载应用包
      onProgress?.(10)
      const appBlob = await this.downloadApp(appId, version, (downloadProgress) => {
        onProgress?.(10 + downloadProgress * 0.6) // 下载占 60%
      })
      
      // 2. 安装应用
      onProgress?.(70)
      const result = await this.packageManager.installFromBlob(appBlob, {
        onProgress: (installProgress) => {
          onProgress?.(70 + installProgress * 0.3) // 安装占 30%
        }
      })
      
      onProgress?.(100)
      return result
    } catch (error) {
      throw new Error(`安装应用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 更新应用
  async updateApp(
    appKey: string,
    onProgress?: (progress: number) => void
  ): Promise<UpdateResult> {
    try {
      const installedApp = await this.packageManager.getInstalledApp(appKey)
      if (!installedApp) {
        throw new Error('应用未安装')
      }
      
      // 获取最新版本信息
      const storeApp = await this.getApp(installedApp.manifest.id)
      
      if (installedApp.manifest.version === storeApp.version) {
        return {
          success: true,
          appKey,
          oldVersion: installedApp.manifest.version,
          newVersion: storeApp.version,
          message: '应用已是最新版本'
        }
      }
      
      // 下载并安装新版本
      onProgress?.(10)
      const appBlob = await this.downloadApp(storeApp.id, storeApp.version, (downloadProgress) => {
        onProgress?.(10 + downloadProgress * 0.6)
      })
      
      onProgress?.(70)
      const result = await this.packageManager.updateFromBlob(appKey, appBlob, {
        onProgress: (updateProgress) => {
          onProgress?.(70 + updateProgress * 0.3)
        }
      })
      
      onProgress?.(100)
      return result
    } catch (error) {
      throw new Error(`更新应用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 卸载应用
  async uninstallApp(appKey: string): Promise<void> {
    await this.packageManager.uninstall(appKey)
  }
  
  // 获取已安装应用列表
  async getInstalledApps(): Promise<InstalledAppInfo[]> {
    return this.packageManager.getInstalledApps()
  }
  
  // 检查应用更新
  async checkForUpdates(): Promise<{
    appKey: string
    currentVersion: string
    latestVersion: string
    updateInfo: any
  }[]> {
    const installedApps = await this.getInstalledApps()
    const appIds = installedApps.map(app => app.manifest.id)
    
    if (appIds.length === 0) return []
    
    const updates = await this.getAppUpdates(appIds)
    
    return updates.map(update => {
      const installedApp = installedApps.find(app => app.manifest.id === update.appId)
      return {
        ...update,
        appKey: installedApp?.appKey || update.appId
      }
    })
  }
  
  // 批量更新应用
  async updateAllApps(onProgress?: (appKey: string, progress: number) => void): Promise<{
    success: string[]
    failed: { appKey: string; error: string }[]
  }> {
    const updates = await this.checkForUpdates()
    const results = {
      success: [] as string[],
      failed: [] as { appKey: string; error: string }[]
    }
    
    for (const update of updates) {
      try {
        await this.updateApp(update.appKey, (progress) => {
          onProgress?.(update.appKey, progress)
        })
        results.success.push(update.appKey)
      } catch (error) {
        results.failed.push({
          appKey: update.appKey,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }
    
    return results
  }
  
  // 清除缓存
  clearCache(): void {
    this.cache.clear()
  }
  
  // 获取缓存统计
  getCacheStats(): {
    size: number
    keys: string[]
    totalMemory: number
  } {
    const keys = Array.from(this.cache.keys())
    const totalMemory = keys.reduce((total, key) => {
      const cached = this.cache.get(key)
      return total + (cached ? JSON.stringify(cached.data).length : 0)
    }, 0)
    
    return {
      size: this.cache.size,
      keys,
      totalMemory
    }
  }
}

// 默认配置
export const defaultAppStoreConfig: AppStoreConfig = {
  apiBaseUrl: 'https://api.bg-webmacos.com',
  cdnBaseUrl: 'https://cdn.bg-webmacos.com',
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 分钟
  },
  download: {
    timeout: 30000,
    retries: 3,
    chunkSize: 1024 * 1024 // 1MB
  }
}

// 创建应用商店服务实例
export function createAppStoreService(
  config: Partial<AppStoreConfig> = {},
  packageManager?: AppPackageManager
): AppStoreService {
  const finalConfig = { ...defaultAppStoreConfig, ...config }
  const finalPackageManager = packageManager || new AppPackageManager()
  
  return new AppStoreService(finalConfig, finalPackageManager)
}

export default AppStoreService
