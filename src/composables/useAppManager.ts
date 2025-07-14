import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { AppConfig } from '@/types/app'
import { getAppByKey, getDesktopApps, getDockApps } from '@/config/apps/app-registry'
import { APP_KEYS } from '@/constants'

// 应用管理组合式函数
export function useAppManager() {
  const store = useStore()
  
  // 响应式状态
  const currentApp = computed(() => store.state.nowApp)
  const openApps = computed(() => store.state.openAppList)
  const dockApps = computed(() => store.state.dockAppList)
  const isLaunchpadOpen = computed(() => store.state.launchpad)
  
  // 获取桌面应用列表
  const desktopApps = computed(() => getDesktopApps())
  
  // 获取当前应用菜单
  const currentMenu = computed(() => {
    return currentApp.value ? currentApp.value.menu || [] : []
  })
  
  // 检查应用是否已打开
  const isAppOpen = (appKey: string): boolean => {
    return openApps.value.some(app => app.key === appKey)
  }
  
  // 检查应用是否在 Dock 中
  const isAppInDock = (appKey: string): boolean => {
    return dockApps.value.some(app => app.key === appKey)
  }
  
  // 检查应用是否隐藏
  const isAppHidden = (appKey: string): boolean => {
    const app = openApps.value.find(app => app.key === appKey)
    return app ? app.hide || false : false
  }
  
  // 打开应用
  const openApp = (app: AppConfig | string, data?: any): void => {
    console.log("---------------openApp", app);
    if (typeof app === 'string') {
      const appConfig = getAppByKey(app)
      if (appConfig) {
        const appWithData = data ? { ...appConfig, data } : appConfig
        store.commit('openApp', appWithData)
      }
    } else {
      const appWithData = data ? { ...app, data } : app
      store.commit('openApp', appWithData)
    }
  }

  // 带数据打开应用
  const openAppWithData = (app: AppConfig | string, data: any): void => {
    openApp(app, data)
  }

  // 通过键名打开应用
  const openAppByKey = (key: string): void => {
    store.commit('openAppByKey', key)
  }
  
  // 关闭应用
  const closeApp = (app: AppConfig): void => {
    store.commit('closeApp', app)
  }
  
  // 通过 PID 关闭应用
  const closeAppByPid = (pid: number): void => {
    store.commit('closeWithPid', pid)
  }
  
  // 隐藏应用
  const hideApp = (app: AppConfig): void => {
    store.commit('hideApp', app)
  }
  
  // 显示应用
  const showApp = (app: AppConfig): void => {
    const targetApp = openApps.value.find(item => item.pid === app.pid)
    if (targetApp) {
      targetApp.hide = false
      store.state.nowApp = targetApp
    }
  }
  
  // 切换到应用
  const switchToApp = (app: AppConfig): void => {
    if (app.hide) {
      showApp(app)
    } else {
      store.state.nowApp = app
    }
  }
  
  // 最小化当前应用
  const minimizeCurrentApp = (): void => {
    if (currentApp.value) {
      hideApp(currentApp.value)
    }
  }
  
  // 关闭当前应用
  const closeCurrentApp = (): void => {
    if (currentApp.value) {
      closeApp(currentApp.value)
    }
  }
  
  // 切换启动台
  const toggleLaunchpad = (): void => {
    store.commit('launchpad')
  }
  
  // 打开启动台
  const openLaunchpad = (): void => {
    if (!isLaunchpadOpen.value) {
      store.commit('launchpad')
    }
  }
  
  // 关闭启动台
  const closeLaunchpad = (): void => {
    if (isLaunchpadOpen.value) {
      store.commit('launchpad')
    }
  }
  
  // 获取应用实例
  const getAppInstance = (key: string): AppConfig | undefined => {
    return openApps.value.find(app => app.key === key)
  }
  
  // 获取应用配置
  const getAppConfig = (key: string): AppConfig | undefined => {
    return getAppByKey(key)
  }
  
  // 初始化 Dock 应用列表
  const initializeDockApps = (): void => {
    store.commit('getDockAppList')
  }
  
  // 处理特殊应用逻辑
  const handleSpecialApp = (app: AppConfig): void => {
    switch (app.key) {
      case APP_KEYS.SYSTEM_LAUNCHPAD:
        toggleLaunchpad()
        break
      default:
        openApp(app)
        break
    }
  }
  
  // 获取可见的打开应用列表（排除隐藏的应用）
  const visibleOpenApps = computed(() => {
    return openApps.value.filter(app => !app.hide)
  })
  
  // 获取隐藏的应用列表
  const hiddenApps = computed(() => {
    return openApps.value.filter(app => app.hide)
  })
  
  // 检查是否有应用正在运行
  const hasRunningApps = computed(() => {
    return openApps.value.length > 0
  })
  
  // 检查是否有可见的应用
  const hasVisibleApps = computed(() => {
    return visibleOpenApps.value.length > 0
  })
  
  return {
    // 状态
    currentApp,
    openApps,
    dockApps,
    desktopApps,
    currentMenu,
    isLaunchpadOpen,
    visibleOpenApps,
    hiddenApps,
    hasRunningApps,
    hasVisibleApps,
    
    // 检查方法
    isAppOpen,
    isAppInDock,
    isAppHidden,
    
    // 应用操作
    openApp,
    openAppWithData,
    openAppByKey,
    closeApp,
    closeAppByPid,
    hideApp,
    showApp,
    switchToApp,
    minimizeCurrentApp,
    closeCurrentApp,
    
    // 启动台操作
    toggleLaunchpad,
    openLaunchpad,
    closeLaunchpad,
    
    // 工具方法
    getAppInstance,
    getAppConfig,
    initializeDockApps,
    handleSpecialApp,
  }
}