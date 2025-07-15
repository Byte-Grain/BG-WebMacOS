import type { AppConfig } from '@/types/app'

/**
 * 自定义应用配置
 * 这里可以定义用户自定义的应用
 */
export const customApps: AppConfig[] = [
  {
    key: 'app_registry_debug',
    component: 'AppRegistryDebug',
    componentPath: '@/views/apps/custom/AppRegistryDebug.vue',
    title: '应用注册表调试',
    icon: 'icon-bug',
    iconColor: '#FFFFFF',
    iconBgColor: '#FF6B6B',
    category: 'custom',
    width: 1000,
    height: 700,
    resizable: true,
    version: '1.0.0',
    author: 'System',
    description: '用于调试应用注册表状态的工具',
    permissions: []
  }
]

/**
 * 动态应用配置
 * 这些应用将通过文件扫描自动发现
 */
export const dynamicAppConfig = {
  // 自动扫描路径
  scanPaths: [
    '/src/views/apps/custom',
    '/src/components/apps/custom'
  ],
  
  // 默认配置
  defaultConfig: {
    category: 'custom' as const,
    iconColor: '#ffffff',
    iconBgColor: '#007AFF',
    width: 800,
    height: 600,
    resizable: true,
    version: '1.0.0',
    author: 'Auto-discovered',
    permissions: []
  }
}