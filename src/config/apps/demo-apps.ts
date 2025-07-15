import { DemoAppConfig } from './types'
import { WINDOW_PRESETS } from '../system/window.config'

// 演示应用配置
const demoAppsConfig: Record<string, DemoAppConfig> = {
  // 基础演示
  demo_demo: {
    key: 'demo_demo',
    demo: true,
    featured: true,
    component: 'demo',
    title: 'DEMO',
    icon: 'icon-MIS_chanpinshezhi',
    iconColor: '#fff',
    iconBgColor: '#db5048',
    width: 600,
    height: 400,
    keepInDock: true,
    category: 'entertainment',
    description: '基础功能演示应用',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ['demo', 'showcase'],
  },

  // GitHub 仓库
  demo_github: {
    key: 'demo_github',
    demo: true,
    featured: true,
    outLink: true,
    title: 'GitHub 仓库',
    icon: 'icon-github',
    iconColor: 'rgb(36,41,46)',
    iconBgColor: '#eee',
    url: 'https://github.com/HammCn/MacOS-Web-UI',
    target: '_blank',
    keepInDock: true,
    category: 'development',
    description: '项目 GitHub 仓库',
    version: '1.0.0',
    author: 'GitHub',
  },

  // Gitee 仓库
  demo_gitee: {
    key: 'demo_gitee',
    demo: true,
    featured: true,
    outLink: true,
    title: 'Gitee 仓库',
    icon: 'icon-gitee',
    iconColor: '#fff',
    iconBgColor: 'rgb(199,29,35)',
    url: 'https://gitee.com/hamm/mac-ui',
    target: '_blank',
    keepInDock: true,
    category: 'development',
    description: '项目 Gitee 仓库',
    version: '1.0.0',
    author: 'Gitee',
  },

  // 抖音去水印
  demo_dy: {
    key: 'demo_dy',
    demo: true,
    featured: false,
    component: 'web',
    title: '抖音去水印',
    icon: 'icon-video_fill',
    iconColor: '#fff',
    iconBgColor: 'rgb(33,179,81)',
    width: 600,
    height: 600,
    innerLink: true,
    url: 'https://dy.hamm.cn/',
    category: 'utilities',
    description: '在线抖音视频去水印工具',
    version: '1.0.0',
    author: 'Third Party',
    permissions: ['network'],
  },

  // 常驻 Dock 应用
  demo_dock: {
    key: 'demo_dock',
    demo: true,
    featured: false,
    component: 'dock',
    title: '常驻 Dock 应用',
    icon: 'icon-MIS_bangongOA',
    iconColor: '#fff',
    iconBgColor: '#022732',
    width: 420,
    height: 350,
    keepInDock: true,
    category: 'utilities',
    description: '演示常驻 Dock 功能的应用',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ['dock', 'persistent'],
  },

  // 固定尺寸应用
  demo_unresize: {
    key: 'demo_unresize',
    demo: true,
    featured: false,
    component: 'unresize',
    title: '固定尺寸应用',
    icon: 'icon-smallscreen_fill',
    iconColor: '#fff',
    iconBgColor: '#1573fa',
    width: 600,
    height: 400,
    resizable: false,
    category: 'utilities',
    description: '演示固定窗口尺寸功能',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ['window', 'fixed-size'],
  },

  // 无法彻底关闭
  demo_unclose: {
    key: 'demo_unclose',
    demo: true,
    featured: false,
    component: 'unclose',
    title: '无法彻底关闭',
    icon: 'icon-wechat-fill',
    iconColor: '#fff',
    iconBgColor: '#24dc72',
    width: 610,
    height: 430,
    hideWhenClose: true,
    category: 'utilities',
    description: '演示关闭时隐藏而非退出的功能',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ['window', 'hide-on-close'],
  },

  // 不在桌面显示
  demo_hidedesktop: {
    key: 'demo_hidedesktop',
    demo: true,
    featured: false,
    component: 'hidedesktop',
    title: '不在桌面显示',
    icon: 'icon-shezhi',
    iconColor: '#333',
    iconBgColor: '#d4dbef',
    width: 500,
    height: 300,
    hideInDesktop: true,
    keepInDock: true,
    category: 'utilities',
    description: '演示仅在 Dock 显示的应用',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ['dock-only', 'hidden'],
  },

  // 花里胡哨
  demo_colorfull: {
    key: 'demo_colorfull',
    demo: true,
    featured: false,
    component: 'colorfull',
    title: '花里胡哨',
    icon: 'icon-changyongtubiao-mianxing-86',
    iconColor: '#fff',
    iconBgColor: '#ff4500',
    width: 420,
    height: 310,
    category: 'entertainment',
    description: '演示自定义窗口样式功能',
    version: '1.0.0',
    author: 'Demo Team',
    tags: ['colorful', 'custom-style'],
  },

  // Photo Booth
  demo_camera: {
    key: 'demo_camera',
    demo: true,
    featured: false,
    component: 'camera',
    title: 'Photo Booth',
    icon: 'icon-camera1',
    iconColor: '#fff',
    iconBgColor: '#E24637',
    width: 540,
    height: 540,
    resizable: false,
    category: 'graphics',
    description: '相机拍照应用演示',
    version: '1.0.0',
    author: 'Demo Team',
    permissions: ['camera'],
    tags: ['camera', 'photo'],
  },
}

// 导出数组格式供增强应用注册表使用
export const demoApps = Object.values(demoAppsConfig)

// 导出对象格式保持向后兼容
export const demoAppsMap = demoAppsConfig

export default demoApps