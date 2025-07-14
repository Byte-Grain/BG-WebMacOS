/**
 * 应用包管理服务
 * 负责应用包的安装、卸载、更新等操作
 */

import { AppManifest, InstallResult, ValidationResult, UpdateResult } from '@/types/app-package'
import { AppConfig } from '@/types/app'
import { registerApp, unregisterApp, updateAppConfig } from '@/config/apps/app-registry'

export class AppPackageManager {
  private static readonly STORAGE_KEY = 'installed_apps'
  private static readonly PACKAGE_CACHE_KEY = 'app_packages_cache'

  /**
   * 安装应用包
   */
  static async installApp(packageData: Blob | File): Promise<InstallResult> {
    try {
      // 1. 验证应用包
      const validation = await this.validatePackage(packageData)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Package validation failed'
        }
      }

      // 2. 解析应用清单
      const manifest = await this.parseManifest(packageData)
      if (!manifest) {
        return {
          success: false,
          error: 'Failed to parse app manifest'
        }
      }

      // 3. 检查依赖
      const dependencyCheck = await this.checkDependencies(manifest)
      if (!dependencyCheck.satisfied) {
        return {
          success: false,
          error: `Missing dependencies: ${dependencyCheck.missing.join(', ')}`
        }
      }

      // 4. 检查是否已安装
      const existingApp = await this.getInstalledApp(manifest.key)
      if (existingApp) {
        return {
          success: false,
          error: `App ${manifest.key} is already installed`
        }
      }

      // 5. 提取应用文件
      const extractedFiles = await this.extractPackage(packageData)
      
      // 6. 创建应用配置
      const appConfig = await this.createAppConfig(manifest, extractedFiles)
      
      // 7. 执行安装脚本
      if (manifest.lifecycle?.install) {
        await this.executeLifecycleScript(manifest.lifecycle.install, 'install')
      }

      // 8. 注册应用
      registerApp(appConfig, 'user')

      // 9. 保存安装信息
      await this.saveInstalledApp(manifest, extractedFiles)

      return {
        success: true,
        appKey: manifest.key,
        version: manifest.version
      }
    } catch (error) {
      console.error('Failed to install app:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 卸载应用
   */
  static async uninstallApp(appKey: string): Promise<boolean> {
    try {
      // 1. 获取已安装应用信息
      const installedApp = await this.getInstalledApp(appKey)
      if (!installedApp) {
        throw new Error(`App ${appKey} is not installed`)
      }

      // 2. 执行卸载脚本
      if (installedApp.manifest.lifecycle?.uninstall) {
        await this.executeLifecycleScript(installedApp.manifest.lifecycle.uninstall, 'uninstall')
      }

      // 3. 从注册表中移除
      unregisterApp(appKey, 'user')

      // 4. 清理应用文件
      await this.cleanupAppFiles(installedApp.files)

      // 5. 移除安装记录
      await this.removeInstalledApp(appKey)

      return true
    } catch (error) {
      console.error('Failed to uninstall app:', error)
      return false
    }
  }

  /**
   * 更新应用
   */
  static async updateApp(appKey: string, packageData: Blob): Promise<UpdateResult> {
    try {
      // 1. 获取当前版本信息
      const currentApp = await this.getInstalledApp(appKey)
      if (!currentApp) {
        return {
          success: false,
          error: `App ${appKey} is not installed`
        }
      }

      // 2. 解析新版本清单
      const newManifest = await this.parseManifest(packageData)
      if (!newManifest) {
        return {
          success: false,
          error: 'Failed to parse new app manifest'
        }
      }

      // 3. 版本检查
      if (!this.isNewerVersion(newManifest.version, currentApp.manifest.version)) {
        return {
          success: false,
          error: 'New version is not newer than current version'
        }
      }

      // 4. 备份当前版本
      const backup = await this.createBackup(currentApp)

      try {
        // 5. 执行更新脚本
        if (newManifest.lifecycle?.update) {
          await this.executeLifecycleScript(newManifest.lifecycle.update, 'update')
        }

        // 6. 提取新文件
        const newFiles = await this.extractPackage(packageData)

        // 7. 更新应用配置
        const newAppConfig = await this.createAppConfig(newManifest, newFiles)
        updateAppConfig(appKey, newAppConfig, 'user')

        // 8. 更新安装记录
        await this.updateInstalledApp(appKey, newManifest, newFiles)

        // 9. 清理备份
        await this.cleanupBackup(backup)

        return {
          success: true,
          oldVersion: currentApp.manifest.version,
          newVersion: newManifest.version
        }
      } catch (error) {
        // 回滚到备份版本
        await this.restoreFromBackup(backup)
        throw error
      }
    } catch (error) {
      console.error('Failed to update app:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 验证应用包
   */
  static async validatePackage(packageData: Blob): Promise<ValidationResult> {
    try {
      // 1. 检查文件格式
      if (!packageData.type.includes('zip') && !packageData.name?.endsWith('.bgapp')) {
        return {
          valid: false,
          error: 'Invalid package format. Expected .bgapp file'
        }
      }

      // 2. 检查文件大小
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (packageData.size > maxSize) {
        return {
          valid: false,
          error: 'Package size exceeds maximum limit (100MB)'
        }
      }

      // 3. 解析并验证清单文件
      const manifest = await this.parseManifest(packageData)
      if (!manifest) {
        return {
          valid: false,
          error: 'Missing or invalid app.manifest.json'
        }
      }

      // 4. 验证必需字段
      const requiredFields = ['name', 'key', 'version', 'type', 'entry']
      for (const field of requiredFields) {
        if (!manifest[field as keyof AppManifest]) {
          return {
            valid: false,
            error: `Missing required field: ${field}`
          }
        }
      }

      // 5. 验证应用类型
      if (!['component', 'web', 'external'].includes(manifest.type)) {
        return {
          valid: false,
          error: 'Invalid app type. Must be component, web, or external'
        }
      }

      // 6. 验证权限声明
      if (manifest.permissions) {
        const validPermissions = [
          'filesystem', 'network', 'camera', 'microphone', 'location',
          'notifications', 'clipboard', 'fullscreen', 'storage', 'system'
        ]
        const invalidPermissions = manifest.permissions.filter(
          p => !validPermissions.includes(p)
        )
        if (invalidPermissions.length > 0) {
          return {
            valid: false,
            error: `Invalid permissions: ${invalidPermissions.join(', ')}`
          }
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }

  /**
   * 解析应用清单
   */
  static async parseManifest(packageData: Blob): Promise<AppManifest | null> {
    try {
      // 这里需要实现 ZIP 文件解析逻辑
      // 简化实现，实际需要使用 JSZip 等库
      const text = await packageData.text()
      
      // 假设包数据包含清单信息
      const manifestMatch = text.match(/"manifest":\s*({[^}]+})/)
      if (manifestMatch) {
        return JSON.parse(manifestMatch[1]) as AppManifest
      }
      
      return null
    } catch (error) {
      console.error('Failed to parse manifest:', error)
      return null
    }
  }

  /**
   * 检查依赖
   */
  private static async checkDependencies(manifest: AppManifest): Promise<{
    satisfied: boolean
    missing: string[]
  }> {
    const missing: string[] = []

    if (manifest.dependencies) {
      // 检查框架版本
      if (manifest.dependencies.framework) {
        const currentVersion = '1.0.0' // 从系统获取当前版本
        if (!this.satisfiesVersion(currentVersion, manifest.dependencies.framework)) {
          missing.push(`framework ${manifest.dependencies.framework}`)
        }
      }

      // 检查 API 可用性
      if (manifest.dependencies.apis) {
        const availableAPIs = ['storage', 'notification', 'filesystem', 'network']
        const missingAPIs = manifest.dependencies.apis.filter(
          api => !availableAPIs.includes(api)
        )
        missing.push(...missingAPIs.map(api => `API: ${api}`))
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    }
  }

  /**
   * 提取应用包文件
   */
  private static async extractPackage(packageData: Blob): Promise<Map<string, Blob>> {
    // 简化实现，实际需要使用 JSZip 等库来解压缩
    const files = new Map<string, Blob>()
    
    // 这里应该解压 ZIP 文件并返回文件映射
    // files.set('src/App.vue', appVueBlob)
    // files.set('public/icon.svg', iconBlob)
    
    return files
  }

  /**
   * 创建应用配置
   */
  private static async createAppConfig(
    manifest: AppManifest,
    files: Map<string, Blob>
  ): Promise<AppConfig> {
    // 将清单转换为应用配置
    const config: AppConfig = {
      key: manifest.key,
      title: manifest.name,
      icon: manifest.icon,
      iconColor: '#fff',
      iconBgColor: '#007AFF',
      component: manifest.entry.replace(/\.(vue|js|ts)$/, ''),
      width: manifest.window?.width || 800,
      height: manifest.window?.height || 600,
      resizable: manifest.window?.resizable !== false,
      closable: manifest.window?.closable !== false,
      category: manifest.category || 'other',
      description: manifest.description,
      version: manifest.version,
      author: manifest.author,
      permissions: manifest.permissions || [],
      tags: manifest.tags || []
    }

    return config
  }

  /**
   * 执行生命周期脚本
   */
  private static async executeLifecycleScript(
    scriptPath: string,
    phase: 'install' | 'uninstall' | 'update'
  ): Promise<void> {
    try {
      // 这里需要实现脚本执行逻辑
      // 可以使用 Web Workers 或其他沙箱机制
      console.log(`Executing ${phase} script: ${scriptPath}`)
      
      // 简化实现
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to execute ${phase} script:`, error)
      throw error
    }
  }

  /**
   * 保存已安装应用信息
   */
  private static async saveInstalledApp(
    manifest: AppManifest,
    files: Map<string, Blob>
  ): Promise<void> {
    const installedApps = await this.getInstalledApps()
    installedApps[manifest.key] = {
      manifest,
      files: Array.from(files.keys()),
      installedAt: Date.now()
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(installedApps))
  }

  /**
   * 获取已安装应用信息
   */
  private static async getInstalledApp(appKey: string) {
    const installedApps = await this.getInstalledApps()
    return installedApps[appKey] || null
  }

  /**
   * 获取所有已安装应用
   */
  private static async getInstalledApps(): Promise<Record<string, any>> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to get installed apps:', error)
      return {}
    }
  }

  /**
   * 移除已安装应用记录
   */
  private static async removeInstalledApp(appKey: string): Promise<void> {
    const installedApps = await this.getInstalledApps()
    delete installedApps[appKey]
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(installedApps))
  }

  /**
   * 更新已安装应用记录
   */
  private static async updateInstalledApp(
    appKey: string,
    manifest: AppManifest,
    files: Map<string, Blob>
  ): Promise<void> {
    const installedApps = await this.getInstalledApps()
    if (installedApps[appKey]) {
      installedApps[appKey].manifest = manifest
      installedApps[appKey].files = Array.from(files.keys())
      installedApps[appKey].updatedAt = Date.now()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(installedApps))
    }
  }

  /**
   * 清理应用文件
   */
  private static async cleanupAppFiles(filePaths: string[]): Promise<void> {
    // 实现文件清理逻辑
    console.log('Cleaning up app files:', filePaths)
  }

  /**
   * 版本比较
   */
  private static satisfiesVersion(current: string, required: string): boolean {
    // 简化的版本比较实现
    return current >= required.replace(/[^\d.]/g, '')
  }

  /**
   * 检查是否为更新版本
   */
  private static isNewerVersion(newVersion: string, currentVersion: string): boolean {
    return newVersion > currentVersion
  }

  /**
   * 创建备份
   */
  private static async createBackup(app: any): Promise<any> {
    return { ...app, backupId: Date.now() }
  }

  /**
   * 清理备份
   */
  private static async cleanupBackup(backup: any): Promise<void> {
    console.log('Cleaning up backup:', backup.backupId)
  }

  /**
   * 从备份恢复
   */
  private static async restoreFromBackup(backup: any): Promise<void> {
    console.log('Restoring from backup:', backup.backupId)
  }
}

export default AppPackageManager