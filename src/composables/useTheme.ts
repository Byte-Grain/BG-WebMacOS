import { ref, computed, watch, onMounted } from 'vue'
import { applyTheme, getSystemTheme, themeUtils } from '@/config/theme.config'
import { THEMES, STORAGE_KEYS } from '@/constants'
import type { Theme } from '@/constants'

// 主题管理组合式函数
export function useTheme() {
  // 当前主题
  const currentTheme = ref<Theme>(THEMES.LIGHT)
  
  // 是否跟随系统主题
  const followSystem = ref<boolean>(false)
  
  // 系统主题
  const systemTheme = ref<Theme>(getSystemTheme() as Theme)
  
  // 实际应用的主题（考虑跟随系统的情况）
  const activeTheme = computed(() => {
    return followSystem.value ? systemTheme.value : currentTheme.value
  })
  
  // 是否为暗色主题
  const isDark = computed(() => activeTheme.value === THEMES.DARK)
  
  // 是否为亮色主题
  const isLight = computed(() => activeTheme.value === THEMES.LIGHT)
  
  // 获取所有可用主题
  const availableThemes = computed(() => themeUtils.getThemeNames())
  
  // 从本地存储加载主题设置
  const loadThemeFromStorage = (): void => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
      const savedFollowSystem = localStorage.getItem(`${STORAGE_KEYS.THEME}_follow_system`)
      
      if (savedTheme && themeUtils.isValidTheme(savedTheme)) {
        currentTheme.value = savedTheme as Theme
      }
      
      if (savedFollowSystem !== null) {
        followSystem.value = JSON.parse(savedFollowSystem)
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error)
    }
  }
  
  // 保存主题设置到本地存储
  const saveThemeToStorage = (): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, currentTheme.value)
      localStorage.setItem(`${STORAGE_KEYS.THEME}_follow_system`, JSON.stringify(followSystem.value))
    } catch (error) {
      console.warn('Failed to save theme to storage:', error)
    }
  }
  
  // 设置主题
  const setTheme = (theme: Theme): void => {
    if (themeUtils.isValidTheme(theme)) {
      currentTheme.value = theme
      followSystem.value = false
      saveThemeToStorage()
    }
  }
  
  // 切换主题
  const toggleTheme = (): void => {
    const newTheme = isDark.value ? THEMES.LIGHT : THEMES.DARK
    setTheme(newTheme)
  }
  
  // 设置跟随系统主题
  const setFollowSystem = (follow: boolean): void => {
    followSystem.value = follow
    saveThemeToStorage()
  }
  
  // 切换跟随系统主题
  const toggleFollowSystem = (): void => {
    setFollowSystem(!followSystem.value)
  }
  
  // 监听系统主题变化
  const watchSystemTheme = (): void => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        systemTheme.value = e.matches ? THEMES.DARK : THEMES.LIGHT
      }
      
      // 现代浏览器
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // 兼容旧版浏览器
        mediaQuery.addListener(handleChange)
      }
      
      // 返回清理函数
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange)
        } else {
          mediaQuery.removeListener(handleChange)
        }
      }
    }
  }
  
  // 获取主题配置
  const getThemeConfig = (themeName?: string) => {
    return themeUtils.getTheme(themeName || activeTheme.value)
  }
  
  // 获取主题颜色
  const getThemeColor = (colorKey: string) => {
    const theme = getThemeConfig()
    // 支持嵌套属性访问，如 'text.primary'
    const keys = colorKey.split('.')
    let value: any = theme.colors
    
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    
    return value
  }
  
  // 应用主题到 DOM
  const applyCurrentTheme = (): void => {
    applyTheme(activeTheme.value)
  }
  
  // 预加载主题
  const preloadTheme = (themeName: Theme): void => {
    // 可以在这里预加载主题相关的资源
    console.log(`Preloading theme: ${themeName}`)
  }
  
  // 获取主题元数据
  const getThemeMetadata = () => {
    return {
      current: currentTheme.value,
      active: activeTheme.value,
      system: systemTheme.value,
      followSystem: followSystem.value,
      isDark: isDark.value,
      isLight: isLight.value,
      available: availableThemes.value,
    }
  }
  
  // 重置主题设置
  const resetTheme = (): void => {
    currentTheme.value = THEMES.LIGHT
    followSystem.value = false
    saveThemeToStorage()
  }
  
  // 监听主题变化并应用
  watch(activeTheme, (newTheme) => {
    applyTheme(newTheme)
  }, { immediate: true })
  
  // 组件挂载时初始化
  onMounted(() => {
    loadThemeFromStorage()
    watchSystemTheme()
    applyCurrentTheme()
  })
  
  return {
    // 状态
    currentTheme: readonly(currentTheme),
    activeTheme,
    systemTheme: readonly(systemTheme),
    followSystem: readonly(followSystem),
    isDark,
    isLight,
    availableThemes,
    
    // 方法
    setTheme,
    toggleTheme,
    setFollowSystem,
    toggleFollowSystem,
    getThemeConfig,
    getThemeColor,
    applyCurrentTheme,
    preloadTheme,
    getThemeMetadata,
    resetTheme,
    
    // 工具方法
    loadThemeFromStorage,
    saveThemeToStorage,
  }
}