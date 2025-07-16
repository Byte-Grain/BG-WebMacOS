import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

const messages = {
  zh,
  en
}

// 从本地存储获取保存的语言设置
const savedLanguage = localStorage.getItem('language') || 'zh'
const defaultLocale = ['zh', 'en'].includes(savedLanguage) ? savedLanguage : 'zh'

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale, // 使用保存的语言或默认中文
  fallbackLocale: 'en', // 回退语言
  messages,
  globalInjection: true
})

export default i18n
