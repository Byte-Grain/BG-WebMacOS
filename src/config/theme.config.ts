import { THEMES } from '@/constants'

// 主题配置接口
export interface ThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: {
      primary: string
      secondary: string
      disabled: string
    }
    border: string
    shadow: string
    overlay: string
  }
  effects: {
    blur: string
    opacity: {
      light: number
      medium: number
      heavy: number
    }
  }
}

// 亮色主题配置
export const lightTheme: ThemeConfig = {
  name: THEMES.LIGHT,
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: 'rgba(255, 255, 255, 0.8)',
    surface: 'rgba(255, 255, 255, 0.9)',
    text: {
      primary: '#000000',
      secondary: '#666666',
      disabled: '#999999',
    },
    border: 'rgba(0, 0, 0, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  effects: {
    blur: 'blur(20px)',
    opacity: {
      light: 0.1,
      medium: 0.3,
      heavy: 0.6,
    },
  },
}

// 暗色主题配置
export const darkTheme: ThemeConfig = {
  name: THEMES.DARK,
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: 'rgba(28, 28, 30, 0.8)',
    surface: 'rgba(44, 44, 46, 0.9)',
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      disabled: '#8E8E93',
    },
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  effects: {
    blur: 'blur(20px)',
    opacity: {
      light: 0.1,
      medium: 0.3,
      heavy: 0.6,
    },
  },
}

// 主题映射
export const themes = {
  [THEMES.LIGHT]: lightTheme,
  [THEMES.DARK]: darkTheme,
} as const

// 默认主题
export const defaultTheme = lightTheme

// CSS 变量生成函数
export const generateCSSVariables = (theme: ThemeConfig): Record<string, string> => {
  return {
    '--theme-name': theme.name,
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-disabled': theme.colors.text.disabled,
    '--color-border': theme.colors.border,
    '--color-shadow': theme.colors.shadow,
    '--color-overlay': theme.colors.overlay,
    '--effect-blur': theme.effects.blur,
    '--opacity-light': theme.effects.opacity.light.toString(),
    '--opacity-medium': theme.effects.opacity.medium.toString(),
    '--opacity-heavy': theme.effects.opacity.heavy.toString(),
  }
}

// 应用主题到 DOM
export const applyTheme = (themeName: string): void => {
  const theme = themes[themeName as keyof typeof themes] || defaultTheme
  const variables = generateCSSVariables(theme)
  
  const root = document.documentElement
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  // 添加主题类名
  root.className = root.className.replace(/theme-\w+/g, '')
  root.classList.add(`theme-${theme.name}`)
}

// 获取系统主题偏好
export const getSystemTheme = (): string => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT
  }
  return THEMES.LIGHT
}

// 主题工具函数
export const themeUtils = {
  getTheme: (name: string) => themes[name as keyof typeof themes] || defaultTheme,
  getAllThemes: () => Object.values(themes),
  getThemeNames: () => Object.keys(themes),
  isValidTheme: (name: string) => name in themes,
}

export default {
  themes,
  defaultTheme,
  lightTheme,
  darkTheme,
  generateCSSVariables,
  applyTheme,
  getSystemTheme,
  themeUtils,
}
