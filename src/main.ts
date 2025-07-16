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
import { enhancedAppRegistry } from '@core/app-registry/enhanced-app-registry'
// 获取语言设置
const getLanguage = (): string => {
  try {
    return localStorage.getItem('language') || 'zh'
  } catch {
    return 'zh'
  }
}

const app = createApp(App)

// 注入全局配置
app.config.globalProperties.$envConfig = envConfig
app.config.globalProperties.$appRegistry = enhancedAppRegistry

// 异步初始化应用
async function initializeApp() {
  try {
    // 初始化应用注册表
    await enhancedAppRegistry.initialize()
    console.log('✅ App registry initialized successfully')
    
    // 使用插件并挂载应用
    app.use(store)
      .use(ElementPlus, {
        locale: getLanguage() === 'zh' ? zhCn : en,
      })
      .use(i18n)
      .mount('#app')
      
    console.log('✅ Application mounted successfully')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    // 即使初始化失败，也要挂载应用以避免白屏
    app.use(store)
      .use(ElementPlus, {
        locale: getLanguage() === 'zh' ? zhCn : en,
      })
      .use(i18n)
      .mount('#app')
  }
}

// 启动应用
initializeApp()