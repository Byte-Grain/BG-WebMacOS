import type { AppConfig } from '@/types/app'
import { simpleApps } from './simple-apps'
import builtIn_system_about from '@/apps/builtIn/system/about/index.vue'
import builtIn_system_composablesTest from '@/apps/builtIn/system/composablesTest/index.vue'
import builtIn_system_finder from '@/apps/builtIn/system/finder/index.vue'
import builtIn_system_task from '@/apps/builtIn/system/task/index.vue'
import builtIn_utilities_EventSystemExample from '@/apps/builtIn/utilities/EventSystemExample/index.vue'
import demo__AppRegistryDebug from '@/apps/demo/AppRegistryDebug/index.vue'
import extensions__MyTestApp from '@/apps/extensions/MyTestApp/index.vue'

/**
 * 应用键值常量
 * 此文件由 auto-generate-apps 插件自动生成，请勿手动修改
 * 扫描目录: src/apps/
 */
export const APP_KEYS = {
  APPKEY_BUILTIN_SYSTEM_ABOUT: 'builtin_system_about',
  APPKEY_BUILTIN_SYSTEM_COMPOSABLESTEST: 'builtin_system_composablestest',
  APPKEY_BUILTIN_SYSTEM_FINDER: 'builtin_system_finder',
  APPKEY_BUILTIN_SYSTEM_TASK: 'builtin_system_task',
  APPKEY_BUILTIN_UTILITIES_EVENTSYSTEMEXAMPLE: 'builtin_utilities_eventsystemexample',
  APPKEY_DEMO__APPREGISTRYDEBUG: 'demo__appregistrydebug',
  APPKEY_EXTENSIONS__MYTESTAPP: 'extensions__mytestapp'
} as const

export type AppKey = typeof APP_KEYS[keyof typeof APP_KEYS]

/**
 * 动态扫描的应用配置
 * 此文件由 auto-generate-apps 插件自动生成，请勿手动修改
 * 扫描目录: src/apps/
 * 要添加新应用，请在指定目录下创建 Vue 文件并导出 appConfig
 */
export const scanApps: AppConfig[] = [
  {
    key: 'builtin_system_about',
    title: '关于本机',
    icon: 'icon-about',
    iconColor: '#fff',
    iconBgColor: '#23282d',
    width: 400,
    height: 250,
    resizable: false,
    draggable: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    hideInDesktop: true,
    category: 'builtIn',
    description: '显示系统信息和版本详情',
    version: '1.0.0',
    author: 'System',
    system: true,
    essential: false,
    singleton: true,
    _id: '29cab3126f21472bf8f990d57ff54ab0',
    group: 'system',
    component: builtIn_system_about
  },
  {
    key: 'builtin_system_composablestest',
    title: 'Composables Test',
    icon: '🧪',
    iconColor: '#fff',
    iconBgColor: '#4CAF50',
    width: 800,
    height: 600,
    resizable: true,
    draggable: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    hideInDesktop: false,
    category: 'builtIn',
    description: '测试和演示组合式函数功能',
    version: '1.0.0',
    author: 'Developer',
    tags: ["test","composables","vue"],
    system: true,
    essential: false,
    singleton: false,
    _id: '3762252243abd5fad49457a4907d0e7b',
    group: 'system',
    component: builtIn_system_composablesTest
  },
  {
    key: 'builtin_system_finder',
    title: 'Finder',
    icon: '📁',
    iconColor: '#fff',
    iconBgColor: '#007AFF',
    width: 800,
    height: 600,
    resizable: true,
    draggable: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    hideInDesktop: false,
    keepInDock: true,
    category: 'builtIn',
    description: '文件管理器',
    version: '1.0.0',
    author: 'System',
    tags: ["file","manager","system"],
    system: true,
    essential: true,
    singleton: true,
    menu: [{"key":"finder","title":"访达","sub":[{"key":"about","title":"关于 访达"},{"isLine":true},{"key":"setting","title":"首选项"},{"isLine":true},{"key":"close","title":"退出 访达"}]},{"key":"window","title":"窗口","sub":[{"key":"min","title":"最小化"},{"key":"max","title":"最大化"}]},{"key":"help","title":"帮助","sub":[{"key":"send","title":"发送反馈"}]}],
    _id: '52849bcf065bb72646127e5a1e22a018',
    group: 'system',
    component: builtIn_system_finder
  },
  {
    key: 'builtin_system_task',
    title: 'Activity Monitor',
    icon: '📊',
    iconColor: '#fff',
    iconBgColor: '#34C759',
    width: 600,
    height: 400,
    resizable: true,
    draggable: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    hideInDesktop: false,
    category: 'builtIn',
    description: '活动监视器',
    version: '1.0.0',
    author: 'System',
    tags: ["system","monitor","task"],
    system: true,
    essential: false,
    singleton: true,
    _id: 'd0d240d5e08c3b10d4f91eae8defd75e',
    group: 'system',
    component: builtIn_system_task
  },
  {
    key: 'builtin_utilities_eventsystemexample',
    title: 'ES',
    icon: 'icon-MIS_bangongOA',
    iconColor: '#fff',
    iconBgColor: '#022732',
    width: 420,
    height: 350,
    resizable: true,
    draggable: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    keepInDock: true,
    category: 'builtIn',
    description: '演示常驻 Dock 功能的应用',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ["dock","persistent"],
    demo: true,
    featured: false,
    _id: '058e255307e1bf6789a79b25a3436af0',
    group: 'utilities',
    component: builtIn_utilities_EventSystemExample
  },
  {
    key: 'demo__appregistrydebug',
    title: '应用注册表调试',
    icon: 'icon-bug',
    iconBgColor: '#FF6B6B',
    iconColor: '#FFFFFF',
    width: 600,
    height: 700,
    category: 'demo',
    tags: ["debug","registry","development"],
    version: '1.0.0',
    description: '用于调试应用注册表状态的工具',
    _id: 'd4f0f9142e26867208983320a9694e90',
    group: '',
    component: demo__AppRegistryDebug
  },
  {
    key: 'extensions__mytestapp',
    title: '我的测试应用',
    icon: 'icon-loading',
    iconColor: '#667eea',
    iconBgColor: 'rgba(102, 126, 234, 0.1)',
    width: 900,
    height: 700,
    minWidth: 320,
    minHeight: 240,
    resizable: true,
    draggable: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    alwaysOnTop: false,
    modal: false,
    transparent: false,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    opacity: 1,
    shadow: true,
    animation: true,
    keepInDock: true,
    hideInDesktop: false,
    hideWhenClose: false,
    autoFocus: true,
    category: 'extensions',
    tags: [],
    version: '1.0.0',
    author: '动态加载系统',
    description: '这是一个用于测试动态加载功能的示例应用',
    permissions: ["storage"],
    dependencies: [],
    _id: '554e5a58b6424d85cca2fd9637320cc3',
    group: '',
    component: extensions__MyTestApp
  }
]

/**
 * 所有应用配置（合并动态扫描和手动配置）
 */
export const Apps: AppConfig[] = [...scanApps, ...simpleApps]
