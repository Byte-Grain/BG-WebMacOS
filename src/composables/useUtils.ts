import { ref, computed } from 'vue'
import { STORAGE_KEYS, DELAYS, HTTP_STATUS } from '@/constants'
import { getAppByKey } from '@/config/apps'
import type { AppConfig } from '@/types/app'

// 工具函数组合式函数
export function useUtils() {
  
  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }
  
  // 节流函数
  const throttle = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, wait)
      }
    }
  }
  
  // 延迟执行
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // 生成唯一 ID
  const generateId = (prefix: string = 'id'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // 生成 PID
  const generatePid = (): number => {
    return Date.now() + Math.floor(Math.random() * 1000)
  }
  
  // 深拷贝
  const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
    if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
    if (typeof obj === 'object') {
      const clonedObj = {} as T
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key])
        }
      }
      return clonedObj
    }
    return obj
  }
  
  // 检查对象是否为空
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim().length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  
  // 截断文本
  const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - suffix.length) + suffix
  }
  
  // 首字母大写
  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
  
  // 驼峰转短横线
  const camelToKebab = (str: string): string => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  }
  
  // 短横线转驼峰
  const kebabToCamel = (str: string): string => {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  // 本地存储工具
  const storage = {
    // 获取
    get: <T = any>(key: string, defaultValue?: T): T | null => {
      try {
        const item = localStorage.getItem(key)
        if (item === null) return defaultValue || null
        return JSON.parse(item)
      } catch (error) {
        console.warn(`Failed to get item from localStorage: ${key}`, error)
        return defaultValue || null
      }
    },
    
    // 设置
    set: (key: string, value: any): boolean => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch (error) {
        console.warn(`Failed to set item to localStorage: ${key}`, error)
        return false
      }
    },
    
    // 删除
    remove: (key: string): boolean => {
      try {
        localStorage.removeItem(key)
        return true
      } catch (error) {
        console.warn(`Failed to remove item from localStorage: ${key}`, error)
        return false
      }
    },
    
    // 清空
    clear: (): boolean => {
      try {
        localStorage.clear()
        return true
      } catch (error) {
        console.warn('Failed to clear localStorage', error)
        return false
      }
    },
    
    // 检查是否存在
    has: (key: string): boolean => {
      return localStorage.getItem(key) !== null
    },
  }
  
  // 会话存储工具
  const sessionStorage = {
    get: <T = any>(key: string, defaultValue?: T): T | null => {
      try {
        const item = window.sessionStorage.getItem(key)
        if (item === null) return defaultValue || null
        return JSON.parse(item)
      } catch (error) {
        console.warn(`Failed to get item from sessionStorage: ${key}`, error)
        return defaultValue || null
      }
    },
    
    set: (key: string, value: any): boolean => {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value))
        return true
      } catch (error) {
        console.warn(`Failed to set item to sessionStorage: ${key}`, error)
        return false
      }
    },
    
    remove: (key: string): boolean => {
      try {
        window.sessionStorage.removeItem(key)
        return true
      } catch (error) {
        console.warn(`Failed to remove item from sessionStorage: ${key}`, error)
        return false
      }
    },
    
    clear: (): boolean => {
      try {
        window.sessionStorage.clear()
        return true
      } catch (error) {
        console.warn('Failed to clear sessionStorage', error)
        return false
      }
    },
    
    has: (key: string): boolean => {
      return window.sessionStorage.getItem(key) !== null
    },
  }
  
  // URL 工具
  const url = {
    // 获取查询参数
    getQuery: (name: string): string | null => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get(name)
    },
    
    // 获取所有查询参数
    getAllQueries: (): Record<string, string> => {
      const urlParams = new URLSearchParams(window.location.search)
      const params: Record<string, string> = {}
      urlParams.forEach((value, key) => {
        params[key] = value
      })
      return params
    },
    
    // 构建查询字符串
    buildQuery: (params: Record<string, any>): string => {
      const urlParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, String(value))
        }
      })
      return urlParams.toString()
    },
  }
  
  // 日期工具
  const date = {
    // 格式化日期
    format: (date: Date = new Date(), format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
    },
    
    // 相对时间
    relative: (date: Date): string => {
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) return `${days}天前`
      if (hours > 0) return `${hours}小时前`
      if (minutes > 0) return `${minutes}分钟前`
      return '刚刚'
    },
    
    // 是否是今天
    isToday: (date: Date): boolean => {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    },
  }
  
  // 验证工具
  const validate = {
    // 邮箱验证
    email: (email: string): boolean => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return regex.test(email)
    },
    
    // 手机号验证
    phone: (phone: string): boolean => {
      const regex = /^1[3-9]\d{9}$/
      return regex.test(phone)
    },
    
    // URL 验证
    url: (url: string): boolean => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    
    // 身份证验证
    idCard: (idCard: string): boolean => {
      const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
      return regex.test(idCard)
    },
  }
  
  // 设备检测
  const device = {
    // 是否是移动设备
    isMobile: (): boolean => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },
    
    // 是否是平板
    isTablet: (): boolean => {
      return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)
    },
    
    // 是否是桌面设备
    isDesktop: (): boolean => {
      return !device.isMobile() && !device.isTablet()
    },
    
    // 获取操作系统
    getOS: (): string => {
      const userAgent = navigator.userAgent
      if (userAgent.indexOf('Win') !== -1) return 'Windows'
      if (userAgent.indexOf('Mac') !== -1) return 'macOS'
      if (userAgent.indexOf('Linux') !== -1) return 'Linux'
      if (userAgent.indexOf('Android') !== -1) return 'Android'
      if (userAgent.indexOf('iOS') !== -1) return 'iOS'
      return 'Unknown'
    },
    
    // 获取浏览器
    getBrowser: (): string => {
      const userAgent = navigator.userAgent
      if (userAgent.indexOf('Chrome') !== -1) return 'Chrome'
      if (userAgent.indexOf('Firefox') !== -1) return 'Firefox'
      if (userAgent.indexOf('Safari') !== -1) return 'Safari'
      if (userAgent.indexOf('Edge') !== -1) return 'Edge'
      if (userAgent.indexOf('Opera') !== -1) return 'Opera'
      return 'Unknown'
    },
  }
  
  // Token 管理工具
  const token = {
    // 获取访问令牌
    getAccessToken: (): string => {
      return storage.get(STORAGE_KEYS.ACCESS_TOKEN, '') || ''
    },
    
    // 保存访问令牌
    saveAccessToken: (accessToken: string): boolean => {
      return storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    },
    
    // 移除访问令牌
    removeAccessToken: (): boolean => {
      return storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    },
    
    // 检查是否有访问令牌
    hasAccessToken: (): boolean => {
      return storage.has(STORAGE_KEYS.ACCESS_TOKEN)
    },
  }

  return {
    // 函数工具
    debounce,
    throttle,
    delay,
    
    // ID 生成
    generateId,
    generatePid,
    
    // 对象工具
    deepClone,
    isEmpty,
    
    // 字符串工具
    formatFileSize,
    formatNumber,
    truncateText,
    capitalize,
    camelToKebab,
    kebabToCamel,
    
    // 存储工具
    storage,
    sessionStorage,
    
    // URL 工具
    url,
    
    // 日期工具
    date,
    
    // 验证工具
    validate,
    
    // 设备检测
    device,
    
    // Token 管理
    token,
  }
}