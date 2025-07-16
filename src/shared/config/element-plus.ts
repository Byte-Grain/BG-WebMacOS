// Element Plus 全局配置
import type { ConfigProviderProps } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// 获取语言设置
const getLanguage = (): string => {
  try {
    return localStorage.getItem('language') || 'zh'
  } catch {
    return 'zh'
  }
}

// Element Plus 全局配置
export const elementPlusConfig: ConfigProviderProps = {
  locale: getLanguage() === 'zh' ? zhCn : en,
  size: 'default',
  zIndex: 2000,
  namespace: 'el',
}

// 动态更新语言配置
export const updateElementPlusLocale = (language: string) => {
  elementPlusConfig.locale = language === 'zh' ? zhCn : en
}

// 导出语言包供其他地方使用
export { zhCn, en }