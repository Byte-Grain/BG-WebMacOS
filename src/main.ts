import { createApp } from 'vue'
import { createStore, Store } from 'vuex'
import { AppState } from './types/app'

import MacOS from './MacOS.vue'
let macOS = createApp(MacOS)

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

import AppStore from './store/App'
const store: Store<AppState> = createStore(AppStore)
macOS.use(store)

declare global {
    interface Window {
        macOS: typeof macOS
    }
}
window.macOS = macOS
macOS.mount('#app')