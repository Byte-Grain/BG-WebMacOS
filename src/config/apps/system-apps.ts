import { SystemAppConfig } from './types'
import { WINDOW_PRESETS } from '../system/window.config'

// 系统应用配置
const systemAppsConfig: Record<string, SystemAppConfig> = {
  // 关于本站
  system_about: {
    key: 'system_about',
    system: true,
    essential: false,
    singleton: true,
    component: 'about',
    title: '关于本机',
    icon: 'icon-about',
    iconColor: '#fff',
    iconBgColor: '#23282d',
    width: WINDOW_PRESETS.SMALL.width,
    height: 250,
    resizable: false,
    hideInDesktop: true,
    category: 'system',
    description: '显示系统信息和版本详情',
    version: '1.0.0',
    author: 'System',
  },

  // 访达
  system_finder: {
    key: 'system_finder',
    system: true,
    essential: true,
    singleton: false,
    component: 'finder',
    title: '访达',
    icon: 'icon-finder',
    iconColor: '#fff',
    iconBgColor: '#db5048',
    width: WINDOW_PRESETS.LARGE.width,
    height: WINDOW_PRESETS.LARGE.height,
    keepInDock: true,
    category: 'system',
    description: '文件管理器，用于浏览和管理文件',
    version: '1.0.0',
    author: 'System',
    permissions: ['filesystem'],
  },

  // 启动台
  system_launchpad: {
    key: 'system_launchpad',
    system: true,
    essential: true,
    singleton: true,
    component: 'LaunchPad',
    componentPath: '/src/components/layout/LaunchPad.vue',
    title: '启动台',
    icon: 'icon-shezhi',
    iconColor: '#333',
    iconBgColor: '#d4dbef',
    width: 500,
    height: 300,
    hideInDesktop: true,
    keepInDock: true,
    category: 'system',
    description: '应用程序启动器',
    version: '1.0.0',
    author: 'System',
  },

  // 系统偏好设置
  system_setting: {
    key: 'system_setting',
    system: true,
    essential: true,
    singleton: true,
    component: 'setting',
    title: '系统偏好设置',
    icon: 'icon-setting',
    iconColor: '#fff',
    iconBgColor: '#23282d',
    width: WINDOW_PRESETS.LARGE.width,
    height: WINDOW_PRESETS.LARGE.height,
    resizable: false,
    keepInDock: true,
    category: 'system',
    description: '系统设置和配置',
    version: '1.0.0',
    author: 'System',
    permissions: ['system', 'storage'],
  },

  // 应用商店
  system_store: {
    key: 'system_store',
    system: true,
    essential: false,
    singleton: true,
    component: 'AppStore',
    title: 'App Store',
    icon: 'icon-store',
    iconColor: '#fff',
    iconBgColor: '#23282d',
    width: WINDOW_PRESETS.LARGE.width,
    height: WINDOW_PRESETS.LARGE.height,
    resizable: false,
    keepInDock: true,
    category: 'system',
    description: '应用程序商店',
    version: '1.0.0',
    author: 'System',
    permissions: ['network'],
  },

  // 强制退出
  system_task: {
    key: 'system_task',
    system: true,
    essential: false,
    singleton: true,
    component: 'task',
    title: '活动监视器',
    icon: 'icon-task',
    iconColor: '#fff',
    iconBgColor: '#ff6b6b',
    width: WINDOW_PRESETS.MEDIUM.width,
    height: 400,
    resizable: false,
    hideInDesktop: true,
    category: 'system',
    description: '强制退出应用程序',
    version: '1.0.0',
    author: 'System',
    permissions: ['system'],
  },

  // 组合式函数测试
  composables_test: {
    key: 'composables_test',
    system: true,
    essential: false,
    singleton: false,
    component: 'ComposablesTest',
    title: 'Composables Test',
    icon: '🧪',
    iconColor: '#fff',
    iconBgColor: '#4CAF50',
    width: WINDOW_PRESETS.LARGE.width,
    height: WINDOW_PRESETS.LARGE.height,
    hideInDesktop: false,
    category: 'development',
    description: '测试和演示组合式函数功能',
    version: '1.0.0',
    author: 'Developer',
    tags: ['test', 'composables', 'vue'],
  },
}

// 导出数组格式供增强应用注册表使用
export const systemApps = Object.values(systemAppsConfig)

// 导出对象格式保持向后兼容
export const systemAppsMap = systemAppsConfig

export default systemApps