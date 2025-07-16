import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { STORAGE_KEYS, SYSTEM_STATES } from '@shared/constants'
import type { SystemState } from '@shared/constants'

// 系统状态管理组合式函数
export function useSystem() {
  const store = useStore()
  
  // 系统状态
  const systemState = computed<SystemState>(() => {
    if (store.state.showLogin) return SYSTEM_STATES.LOGIN
    if (store.state.loading) return SYSTEM_STATES.LOADING
    return SYSTEM_STATES.DESKTOP
  })
  
  // 音量控制
  const volume = computed({
    get: () => store.state.volume,
    set: (value: number) => store.commit('setVolumn', value)
  })
  
  // 是否静音
  const isMuted = computed(() => volume.value === 0)
  
  // 登录状态
  const isLoggedIn = computed(() => !store.state.showLogin)
  const isLoading = computed(() => store.state.loading)
  const isDesktop = computed(() => systemState.value === SYSTEM_STATES.DESKTOP)
  
  // 用户信息
  const userInfo = computed(() => store.state.user || {})
  
  // Access Token
  const accessToken = ref<string | null>(null)
  
  // 从本地存储获取 Access Token
  const getAccessToken = (): string | null => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      accessToken.value = token
      return token
    } catch (error) {
      console.warn('Failed to get access token:', error)
      return null
    }
  }
  
  // 保存 Access Token 到本地存储
  const saveAccessToken = (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
      accessToken.value = token
    } catch (error) {
      console.warn('Failed to save access token:', error)
    }
  }
  
  // 清除 Access Token
  const clearAccessToken = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      accessToken.value = null
    } catch (error) {
      console.warn('Failed to clear access token:', error)
    }
  }
  
  // 登录
  const login = (userData?: any): void => {
    store.commit('login', userData)
  }
  
  // 登出
  const logout = (): void => {
    store.commit('logout')
    clearAccessToken()
    // 清除用户名缓存
    try {
      localStorage.removeItem('user_name')
    } catch (error) {
      console.warn('Failed to clear user_name from localStorage:', error)
    }
  }
  
  // 设置加载状态
  const setLoading = (loading: boolean): void => {
    store.commit('setLoading', loading)
  }
  
  // 设置音量
  const setVolume = (value: number): void => {
    const clampedValue = Math.max(0, Math.min(100, value))
    store.commit('setVolumn', clampedValue)
    saveVolumeToStorage(clampedValue)
  }
  
  // 增加音量
  const increaseVolume = (step: number = 10): void => {
    setVolume(volume.value + step)
  }
  
  // 减少音量
  const decreaseVolume = (step: number = 10): void => {
    setVolume(volume.value - step)
  }
  
  // 切换静音
  const toggleMute = (): void => {
    if (isMuted.value) {
      // 如果当前静音，恢复到之前的音量或默认音量
      const savedVolume = getVolumeFromStorage()
      setVolume(savedVolume > 0 ? savedVolume : 50)
    } else {
      // 如果当前有声音，保存当前音量并静音
      saveVolumeToStorage(volume.value)
      setVolume(0)
    }
  }
  
  // 从本地存储获取音量
  const getVolumeFromStorage = (): number => {
    try {
      const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME)
      return savedVolume ? parseInt(savedVolume, 10) : 50
    } catch (error) {
      console.warn('Failed to get volume from storage:', error)
      return 50
    }
  }
  
  // 保存音量到本地存储
  const saveVolumeToStorage = (value: number): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUME, value.toString())
    } catch (error) {
      console.warn('Failed to save volume to storage:', error)
    }
  }
  
  // 初始化音量
  const initializeVolume = (): void => {
    const savedVolume = getVolumeFromStorage()
    store.commit('setVolumn', savedVolume)
  }
  
  // 获取系统信息
  const getSystemInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }
  }
  
  // 检查是否支持某个功能
  const checkFeatureSupport = (feature: string): boolean => {
    switch (feature) {
      case 'localStorage':
        try {
          const test = '__test__'
          localStorage.setItem(test, test)
          localStorage.removeItem(test)
          return true
        } catch {
          return false
        }
      case 'sessionStorage':
        try {
          const test = '__test__'
          sessionStorage.setItem(test, test)
          sessionStorage.removeItem(test)
          return true
        } catch {
          return false
        }
      case 'webGL':
        try {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        } catch {
          return false
        }
      case 'serviceWorker':
        return 'serviceWorker' in navigator
      case 'notification':
        return 'Notification' in window
      case 'geolocation':
        return 'geolocation' in navigator
      default:
        return false
    }
  }
  
  // 获取网络状态
  const getNetworkStatus = () => {
    return {
      online: navigator.onLine,
      connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
    }
  }
  
  // 监听网络状态变化
  const watchNetworkStatus = (callback: (online: boolean) => void) => {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // 返回清理函数
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
  
  // 获取当前时间
  const getCurrentTime = (): string => {
    return new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  // 获取当前日期
  const getCurrentDate = (): string => {
    return new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  
  // 格式化时间
  const formatTime = (date: Date = new Date()): string => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  
  // 格式化日期
  const formatDate = (date: Date = new Date()): string => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }
  
  // 锁屏功能
  const lockScreen = (): void => {
    // 触发锁屏事件，可以通过事件总线或直接操作DOM
    const event = new CustomEvent('system:lockScreen')
    window.dispatchEvent(event)
  }

  // 关机功能
  const shutdown = (): void => {
    // 触发关机事件
    const event = new CustomEvent('system:shutdown')
    window.dispatchEvent(event)
  }

  // 初始化系统设置
  const initializeSystem = (): void => {
    initializeVolume()
    const token = getAccessToken()
    // 如果存在有效的AccessToken，自动登录
    if (token) {
      login()
    }
  }
  
  return {
    // 状态
    systemState,
    volume,
    isMuted,
    isLoggedIn,
    isLoading,
    isDesktop,
    userInfo,
    accessToken: readonly(accessToken),
    
    // 认证方法
    login,
    logout,
    getAccessToken,
    saveAccessToken,
    clearAccessToken,
    
    // 系统控制
    setLoading,
    setVolume,
    increaseVolume,
    decreaseVolume,
    toggleMute,
    lockScreen,
    shutdown,
    
    // 系统信息
    getSystemInfo,
    checkFeatureSupport,
    getNetworkStatus,
    watchNetworkStatus,
    
    // 时间日期
    getCurrentTime,
    getCurrentDate,
    formatTime,
    formatDate,
    
    // 初始化
    initializeSystem,
  }
}