/**
 * BG-WebMacOS 应用开发 SDK
 * 为第三方应用提供统一的系统 API 接口
 */

import { AppNotificationConfig, AppShortcutConfig, AppMenuConfig } from '@/types/app-package'
import { useNotification } from '@/composables/useNotification'
import { useTheme } from '@/composables/useTheme'
import { useEventBus } from '@/composables/useEventBus'

// SDK 版本
export const SDK_VERSION = '1.0.0'

// 系统 API 接口
export interface SystemAPI {
  // 获取系统版本
  getVersion(): string
  
  // 获取当前主题
  getTheme(): any
  
  // 设置主题
  setTheme(theme: any): void
  
  // 显示通知
  showNotification(options: AppNotificationConfig): Promise<void>
  
  // 检查权限
  hasPermission(permission: string): boolean
  
  // 请求权限
  requestPermission(permission: string): Promise<boolean>
  
  // 注册全局快捷键
  registerShortcut(shortcut: string, appKey: string): Promise<boolean>
  
  // 注销快捷键
  unregisterShortcut(shortcut: string): Promise<boolean>
  
  // 获取系统信息
  getSystemInfo(): {
    platform: string
    userAgent: string
    language: string
    timezone: string
    screen: {
      width: number
      height: number
      pixelRatio: number
    }
  }
}

// 窗口 API 接口
export interface WindowAPI {
  // 设置窗口标题
  setTitle(title: string): void
  
  // 设置窗口大小
  setSize(width: number, height: number): void
  
  // 设置窗口位置
  setPosition(x: number, y: number): void
  
  // 最小化窗口
  minimize(): void
  
  // 最大化窗口
  maximize(): void
  
  // 恢复窗口
  restore(): void
  
  // 关闭窗口
  close(): void
  
  // 聚焦窗口
  focus(): void
  
  // 设置窗口置顶
  setAlwaysOnTop(alwaysOnTop: boolean): void
  
  // 设置窗口透明度
  setOpacity(opacity: number): void
  
  // 获取窗口状态
  getState(): {
    width: number
    height: number
    x: number
    y: number
    minimized: boolean
    maximized: boolean
    focused: boolean
  }
  
  // 监听窗口事件
  on(event: string, callback: Function): void
  
  // 移除事件监听
  off(event: string, callback?: Function): void
}

// 存储 API 接口
export interface StorageAPI {
  // 获取数据
  get(key: string): Promise<any>
  
  // 设置数据
  set(key: string, value: any): Promise<void>
  
  // 删除数据
  remove(key: string): Promise<void>
  
  // 清空所有数据
  clear(): Promise<void>
  
  // 获取所有键
  keys(): Promise<string[]>
  
  // 检查键是否存在
  has(key: string): Promise<boolean>
  
  // 获取存储大小
  size(): Promise<number>
  
  // 监听存储变化
  watch(key: string, callback: (newValue: any, oldValue: any) => void): () => void
}

// 文件 API 接口
export interface FileAPI {
  // 读取文件
  read(path: string): Promise<string>
  
  // 写入文件
  write(path: string, content: string): Promise<void>
  
  // 检查文件是否存在
  exists(path: string): Promise<boolean>
  
  // 列出目录内容
  list(path: string): Promise<string[]>
  
  // 创建目录
  createDirectory(path: string): Promise<void>
  
  // 删除文件或目录
  remove(path: string): Promise<void>
  
  // 复制文件
  copy(source: string, destination: string): Promise<void>
  
  // 移动文件
  move(source: string, destination: string): Promise<void>
  
  // 获取文件信息
  stat(path: string): Promise<{
    size: number
    isFile: boolean
    isDirectory: boolean
    createdAt: Date
    modifiedAt: Date
  }>
  
  // 选择文件
  selectFile(options?: {
    multiple?: boolean
    accept?: string
    directory?: boolean
  }): Promise<File[]>
  
  // 保存文件
  saveFile(content: Blob, filename?: string): Promise<void>
}

// 网络 API 接口
export interface NetworkAPI {
  // 发送 HTTP 请求
  request(options: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: any
    timeout?: number
  }): Promise<{
    status: number
    headers: Record<string, string>
    data: any
  }>
  
  // GET 请求
  get(url: string, options?: any): Promise<any>
  
  // POST 请求
  post(url: string, data?: any, options?: any): Promise<any>
  
  // PUT 请求
  put(url: string, data?: any, options?: any): Promise<any>
  
  // DELETE 请求
  delete(url: string, options?: any): Promise<any>
  
  // 下载文件
  download(url: string, filename?: string): Promise<void>
  
  // 上传文件
  upload(file: File, url: string, options?: {
    headers?: Record<string, string>
    onProgress?: (progress: number) => void
  }): Promise<any>
  
  // 检查网络连接
  isOnline(): boolean
  
  // 监听网络状态变化
  onNetworkChange(callback: (online: boolean) => void): () => void
}

// 事件 API 接口
export interface EventAPI {
  // 发送事件
  emit(event: string, data?: any): void
  
  // 监听事件
  on(event: string, callback: Function): () => void
  
  // 监听一次事件
  once(event: string, callback: Function): () => void
  
  // 移除事件监听
  off(event: string, callback?: Function): void
  
  // 向其他应用发送消息
  sendMessage(targetApp: string, message: any): void
  
  // 监听来自其他应用的消息
  onMessage(callback: (message: any, fromApp: string) => void): () => void
  
  // 广播消息给所有应用
  broadcast(message: any): void
}

// 媒体 API 接口
export interface MediaAPI {
  // 获取摄像头
  getCamera(constraints?: MediaStreamConstraints): Promise<MediaStream>
  
  // 获取麦克风
  getMicrophone(constraints?: MediaStreamConstraints): Promise<MediaStream>
  
  // 获取屏幕共享
  getScreenShare(): Promise<MediaStream>
  
  // 停止媒体流
  stopStream(stream: MediaStream): void
  
  // 拍照
  takePhoto(stream: MediaStream): Promise<Blob>
  
  // 录制视频
  recordVideo(stream: MediaStream, duration?: number): Promise<Blob>
  
  // 录制音频
  recordAudio(stream: MediaStream, duration?: number): Promise<Blob>
}

// 剪贴板 API 接口
export interface ClipboardAPI {
  // 读取文本
  readText(): Promise<string>
  
  // 写入文本
  writeText(text: string): Promise<void>
  
  // 读取图片
  readImage(): Promise<Blob | null>
  
  // 写入图片
  writeImage(image: Blob): Promise<void>
  
  // 读取文件
  readFiles(): Promise<File[]>
  
  // 写入文件
  writeFiles(files: File[]): Promise<void>
}

// 主 SDK 接口
export interface AppSDK {
  system: SystemAPI
  window: WindowAPI
  storage: StorageAPI
  file: FileAPI
  network: NetworkAPI
  event: EventAPI
  media: MediaAPI
  clipboard: ClipboardAPI
}

// SDK 实现类
class BGWebMacOSSDK implements AppSDK {
  private appKey: string
  private permissions: string[]
  
  constructor(appKey: string, permissions: string[] = []) {
    this.appKey = appKey
    this.permissions = permissions
  }
  
  // 权限检查装饰器
  private requirePermission(permission: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value
      descriptor.value = function (...args: any[]) {
        if (!this.permissions.includes(permission)) {
          throw new Error(`Permission denied: ${permission}`)
        }
        return originalMethod.apply(this, args)
      }
    }
  }
  
  // 系统 API 实现
  system: SystemAPI = {
    getVersion: () => SDK_VERSION,
    
    getTheme: () => {
      const { currentTheme } = useTheme()
      return currentTheme.value
    },
    
    setTheme: (theme: any) => {
      const { setTheme } = useTheme()
      setTheme(theme)
    },
    
    showNotification: async (options: AppNotificationConfig) => {
      if (!this.permissions.includes('notifications')) {
        throw new Error('Permission denied: notifications')
      }
      const { showNotification } = useNotification()
      await showNotification(options)
    },
    
    hasPermission: (permission: string) => {
      return this.permissions.includes(permission)
    },
    
    requestPermission: async (permission: string) => {
      // 实现权限请求逻辑
      return new Promise((resolve) => {
        // 显示权限请求对话框
        const granted = confirm(`应用请求 ${permission} 权限，是否允许？`)
        if (granted) {
          this.permissions.push(permission)
        }
        resolve(granted)
      })
    },
    
    registerShortcut: async (shortcut: string, appKey: string) => {
      // 实现快捷键注册
      console.log(`Registering shortcut ${shortcut} for app ${appKey}`)
      return true
    },
    
    unregisterShortcut: async (shortcut: string) => {
      // 实现快捷键注销
      console.log(`Unregistering shortcut ${shortcut}`)
      return true
    },
    
    getSystemInfo: () => ({
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: devicePixelRatio
      }
    })
  }
  
  // 窗口 API 实现
  window: WindowAPI = {
    setTitle: (title: string) => {
      const { emit } = useEventBus()
      emit('window:setTitle', { appKey: this.appKey, title })
    },
    
    setSize: (width: number, height: number) => {
      const { emit } = useEventBus()
      emit('window:setSize', { appKey: this.appKey, width, height })
    },
    
    setPosition: (x: number, y: number) => {
      const { emit } = useEventBus()
      emit('window:setPosition', { appKey: this.appKey, x, y })
    },
    
    minimize: () => {
      const { emit } = useEventBus()
      emit('window:minimize', { appKey: this.appKey })
    },
    
    maximize: () => {
      const { emit } = useEventBus()
      emit('window:maximize', { appKey: this.appKey })
    },
    
    restore: () => {
      const { emit } = useEventBus()
      emit('window:restore', { appKey: this.appKey })
    },
    
    close: () => {
      const { emit } = useEventBus()
      emit('window:close', { appKey: this.appKey })
    },
    
    focus: () => {
      const { emit } = useEventBus()
      emit('window:focus', { appKey: this.appKey })
    },
    
    setAlwaysOnTop: (alwaysOnTop: boolean) => {
      const { emit } = useEventBus()
      emit('window:setAlwaysOnTop', { appKey: this.appKey, alwaysOnTop })
    },
    
    setOpacity: (opacity: number) => {
      const { emit } = useEventBus()
      emit('window:setOpacity', { appKey: this.appKey, opacity })
    },
    
    getState: () => {
      // 从窗口管理器获取当前窗口状态
      return {
        width: 800,
        height: 600,
        x: 100,
        y: 100,
        minimized: false,
        maximized: false,
        focused: true
      }
    },
    
    on: (event: string, callback: Function) => {
      const { on } = useEventBus()
      on(`window:${event}:${this.appKey}`, callback)
    },
    
    off: (event: string, callback?: Function) => {
      const { off } = useEventBus()
      off(`window:${event}:${this.appKey}`, callback)
    }
  }
  
  // 存储 API 实现
  storage: StorageAPI = {
    get: async (key: string) => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const fullKey = `app:${this.appKey}:${key}`
      const value = localStorage.getItem(fullKey)
      return value ? JSON.parse(value) : null
    },
    
    set: async (key: string, value: any) => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const fullKey = `app:${this.appKey}:${key}`
      localStorage.setItem(fullKey, JSON.stringify(value))
    },
    
    remove: async (key: string) => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const fullKey = `app:${this.appKey}:${key}`
      localStorage.removeItem(fullKey)
    },
    
    clear: async () => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const prefix = `app:${this.appKey}:`
      const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith(prefix))
      keysToRemove.forEach(key => localStorage.removeItem(key))
    },
    
    keys: async () => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const prefix = `app:${this.appKey}:`
      return Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length))
    },
    
    has: async (key: string) => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const fullKey = `app:${this.appKey}:${key}`
      return localStorage.getItem(fullKey) !== null
    },
    
    size: async () => {
      if (!this.permissions.includes('storage')) {
        throw new Error('Permission denied: storage')
      }
      const prefix = `app:${this.appKey}:`
      let size = 0
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          size += localStorage.getItem(key)?.length || 0
        }
      })
      return size
    },
    
    watch: (key: string, callback: (newValue: any, oldValue: any) => void) => {
      // 实现存储监听
      const fullKey = `app:${this.appKey}:${key}`
      let oldValue = localStorage.getItem(fullKey)
      
      const handler = (e: StorageEvent) => {
        if (e.key === fullKey) {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null
          const parsedOldValue = oldValue ? JSON.parse(oldValue) : null
          callback(newValue, parsedOldValue)
          oldValue = e.newValue
        }
      }
      
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
  }
  
  // 文件 API 实现（简化版）
  file: FileAPI = {
    read: async (path: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
      // 实现文件读取逻辑
      throw new Error('File API not implemented in web environment')
    },
    
    write: async (path: string, content: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
      // 实现文件写入逻辑
      throw new Error('File API not implemented in web environment')
    },
    
    exists: async (path: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
      return false
    },
    
    list: async (path: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
      return []
    },
    
    createDirectory: async (path: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
    },
    
    remove: async (path: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
    },
    
    copy: async (source: string, destination: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
    },
    
    move: async (source: string, destination: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
    },
    
    stat: async (path: string) => {
      if (!this.permissions.includes('filesystem')) {
        throw new Error('Permission denied: filesystem')
      }
      throw new Error('File API not implemented in web environment')
    },
    
    selectFile: async (options = {}) => {
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = options.multiple || false
        if (options.accept) input.accept = options.accept
        
        input.onchange = () => {
          const files = Array.from(input.files || [])
          resolve(files)
        }
        
        input.click()
      })
    },
    
    saveFile: async (content: Blob, filename = 'download') => {
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  
  // 网络 API 实现
  network: NetworkAPI = {
    request: async (options) => {
      if (!this.permissions.includes('network')) {
        throw new Error('Permission denied: network')
      }
      
      const response = await fetch(options.url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      })
      
      const data = await response.json()
      
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data
      }
    },
    
    get: async (url: string, options = {}) => {
      const response = await this.network.request({ url, method: 'GET', ...options })
      return response.data
    },
    
    post: async (url: string, data?: any, options = {}) => {
      const response = await this.network.request({ url, method: 'POST', body: data, ...options })
      return response.data
    },
    
    put: async (url: string, data?: any, options = {}) => {
      const response = await this.network.request({ url, method: 'PUT', body: data, ...options })
      return response.data
    },
    
    delete: async (url: string, options = {}) => {
      const response = await this.network.request({ url, method: 'DELETE', ...options })
      return response.data
    },
    
    download: async (url: string, filename?: string) => {
      const response = await fetch(url)
      const blob = await response.blob()
      await this.file.saveFile(blob, filename)
    },
    
    upload: async (file: File, url: string, options = {}) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: options.headers,
        body: formData
      })
      
      return response.json()
    },
    
    isOnline: () => navigator.onLine,
    
    onNetworkChange: (callback: (online: boolean) => void) => {
      const handler = () => callback(navigator.onLine)
      window.addEventListener('online', handler)
      window.addEventListener('offline', handler)
      
      return () => {
        window.removeEventListener('online', handler)
        window.removeEventListener('offline', handler)
      }
    }
  }
  
  // 事件 API 实现
  event: EventAPI = {
    emit: (event: string, data?: any) => {
      const { emit } = useEventBus()
      emit(`app:${this.appKey}:${event}`, data)
    },
    
    on: (event: string, callback: Function) => {
      const { on } = useEventBus()
      return on(`app:${this.appKey}:${event}`, callback)
    },
    
    once: (event: string, callback: Function) => {
      const { once } = useEventBus()
      return once(`app:${this.appKey}:${event}`, callback)
    },
    
    off: (event: string, callback?: Function) => {
      const { off } = useEventBus()
      off(`app:${this.appKey}:${event}`, callback)
    },
    
    sendMessage: (targetApp: string, message: any) => {
      const { emit } = useEventBus()
      emit(`message:${targetApp}`, { from: this.appKey, data: message })
    },
    
    onMessage: (callback: (message: any, fromApp: string) => void) => {
      const { on } = useEventBus()
      return on(`message:${this.appKey}`, (data: any) => {
        callback(data.data, data.from)
      })
    },
    
    broadcast: (message: any) => {
      const { emit } = useEventBus()
      emit('broadcast', { from: this.appKey, data: message })
    }
  }
  
  // 媒体 API 实现
  media: MediaAPI = {
    getCamera: async (constraints = { video: true }) => {
      if (!this.permissions.includes('camera')) {
        throw new Error('Permission denied: camera')
      }
      return navigator.mediaDevices.getUserMedia(constraints)
    },
    
    getMicrophone: async (constraints = { audio: true }) => {
      if (!this.permissions.includes('microphone')) {
        throw new Error('Permission denied: microphone')
      }
      return navigator.mediaDevices.getUserMedia(constraints)
    },
    
    getScreenShare: async () => {
      if (!this.permissions.includes('screen')) {
        throw new Error('Permission denied: screen')
      }
      return (navigator.mediaDevices as any).getDisplayMedia({ video: true })
    },
    
    stopStream: (stream: MediaStream) => {
      stream.getTracks().forEach(track => track.stop())
    },
    
    takePhoto: async (stream: MediaStream) => {
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(video, 0, 0)
          
          canvas.toBlob((blob) => {
            resolve(blob!)
          })
        }
      })
    },
    
    recordVideo: async (stream: MediaStream, duration = 10000) => {
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      return new Promise((resolve) => {
        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          resolve(blob)
        }
        
        recorder.start()
        setTimeout(() => recorder.stop(), duration)
      })
    },
    
    recordAudio: async (stream: MediaStream, duration = 10000) => {
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      return new Promise((resolve) => {
        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          resolve(blob)
        }
        
        recorder.start()
        setTimeout(() => recorder.stop(), duration)
      })
    }
  }
  
  // 剪贴板 API 实现
  clipboard: ClipboardAPI = {
    readText: async () => {
      if (!this.permissions.includes('clipboard')) {
        throw new Error('Permission denied: clipboard')
      }
      return navigator.clipboard.readText()
    },
    
    writeText: async (text: string) => {
      if (!this.permissions.includes('clipboard')) {
        throw new Error('Permission denied: clipboard')
      }
      return navigator.clipboard.writeText(text)
    },
    
    readImage: async () => {
      if (!this.permissions.includes('clipboard')) {
        throw new Error('Permission denied: clipboard')
      }
      const items = await navigator.clipboard.read()
      for (const item of items) {
        if (item.types.includes('image/png')) {
          return item.getType('image/png')
        }
      }
      return null
    },
    
    writeImage: async (image: Blob) => {
      if (!this.permissions.includes('clipboard')) {
        throw new Error('Permission denied: clipboard')
      }
      const item = new ClipboardItem({ 'image/png': image })
      return navigator.clipboard.write([item])
    },
    
    readFiles: async () => {
      if (!this.permissions.includes('clipboard')) {
        throw new Error('Permission denied: clipboard')
      }
      // Web 环境下的文件读取实现
      return []
    },
    
    writeFiles: async (files: File[]) => {
      if (!this.permissions.includes('clipboard')) {
        throw new Error('Permission denied: clipboard')
      }
      // Web 环境下的文件写入实现
    }
  }
}

// 创建 SDK 实例的工厂函数
export function createAppSDK(appKey: string, permissions: string[] = []): AppSDK {
  return new BGWebMacOSSDK(appKey, permissions)
}

// Vue 组合式函数
export function useAppSDK(appKey?: string, permissions?: string[]): AppSDK {
  // 如果没有提供 appKey，尝试从当前组件上下文获取
  const finalAppKey = appKey || 'unknown_app'
  const finalPermissions = permissions || []
  
  return createAppSDK(finalAppKey, finalPermissions)
}

export default {
  createAppSDK,
  useAppSDK,
  SDK_VERSION
}