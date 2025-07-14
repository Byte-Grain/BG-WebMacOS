// Vue API 现在通过自动导入，无需手动导入
// import { createApp } from 'vue'
// import { createStore, Store } from 'vuex'
import { AppState } from './types/app'

import MacOS from './MacOS.vue'
const macOS = createApp(MacOS)

// 国际化配置
import i18n from './i18n'
import { watch } from 'vue'
macOS.use(i18n)

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// 根据当前语言设置 ElementPlus 语言
const getElementLocale = () => i18n.global.locale.value === 'zh' ? zhCn : en

macOS.use(ElementPlus, {
    locale: getElementLocale(),
})

// 监听语言变化，动态更新 ElementPlus 语言
watch(() => i18n.global.locale.value, () => {
  // 重新配置 ElementPlus 语言
  macOS.config.globalProperties.$ELEMENT = {
    locale: getElementLocale()
  }
})

import "@/asset/css/app.css"
import "@/asset/css/animation.css"

import config from './config'
declare module 'vue' {
    interface ComponentCustomProperties {
        config: typeof config
        tool: typeof import('./helper/tool').default
    }
}
macOS.config.globalProperties.config = config

import tool from './helper/tool'
macOS.config.globalProperties.tool = tool

import store from './store/App'
macOS.use(store)

// PWA相关功能暂时移除
// import { registerSW } from 'virtual:pwa-register'
// const updateSW = registerSW({
//   onNeedRefresh() {},
//   onOfflineReady() {},
// })

macOS.mount('#app')