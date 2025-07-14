import { createApp } from 'vue'
import App from './MacOS.vue'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import i18n from './i18n'
import { envConfig } from './config/env.config'
import { appConfig } from './config/app.config'
import { useUtils } from './composables/useUtils'

// 获取语言设置
const { storage } = useUtils()
const getLanguage = (): string => {
  return storage.get('language', 'zh') || 'zh'
}

const app = createApp(App)

// 注入全局配置
app.config.globalProperties.$envConfig = envConfig
app.config.globalProperties.$appConfig = appConfig

// 使用插件
app.use(store)
  .use(ElementPlus, {
    locale: getLanguage() === 'zh' ? zhCn : en,
  })
  .use(i18n)
  .mount('#app')