import { SystemConfig } from './types'

// 系统基础配置
export const systemConfig: SystemConfig = {
  version: '2.0.0',
  buildTime: new Date().toISOString(),
  author: 'macOS Web UI Team',
  repository: 'https://github.com/HammCn/MacOS-Web-UI',
  license: 'MIT',
  
  // 功能开关
  features: {
    multiLanguage: true,
    darkMode: true,
    notifications: true,
    shortcuts: true,
    contextMenu: true,
    dragAndDrop: true,
    fileSystem: false, // 暂未实现
  },
  
  // 系统限制
  limits: {
    maxOpenWindows: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    sessionTimeout: 30 * 60 * 1000, // 30分钟
  },
  
  // 默认设置
  defaults: {
    language: 'zh-CN',
    theme: 'light',
    wallpaper: '/assets/images/wallpaper.jpg',
    volume: 50,
  },
}

export default systemConfig