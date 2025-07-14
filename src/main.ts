// Vue API 现在通过自动导入，无需手动导入
// import { createApp } from 'vue'
// import { createStore, Store } from 'vuex'
import { AppState } from './types/app'

import MacOS from './MacOS.vue'
const macOS = createApp(MacOS)

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

macOS.use(ElementPlus, {
    locale: zhCn,
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