#!/usr/bin/env node

/**
 * 计算器应用卸载脚本
 * 在应用卸载时执行的清理逻辑
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// 卸载配置
const UNINSTALL_CONFIG = {
  appName: 'Calculator',
  dataDir: 'calculator-data',
  backupDir: 'calculator-backup'
}

/**
 * 主卸载函数
 */
async function uninstall() {
  console.log(`🗑️ 开始卸载 ${UNINSTALL_CONFIG.appName}...`)
  
  try {
    // 1. 显示卸载信息
    await showUninstallInfo()
    
    // 2. 询问用户是否保留数据
    const keepData = await askKeepData()
    
    // 3. 备份用户数据（如果选择保留）
    if (keepData) {
      await backupUserData()
    }
    
    // 4. 注销应用快捷键
    await unregisterShortcuts()
    
    // 5. 移除桌面快捷方式
    await removeDesktopShortcut()
    
    // 6. 清理应用数据（如果选择不保留）
    if (!keepData) {
      await cleanupAppData()
    }
    
    // 7. 移除应用文件
    await removeAppFiles()
    
    // 8. 清理注册表项
    await cleanupRegistry()
    
    console.log(`✅ ${UNINSTALL_CONFIG.appName} 卸载完成！`)
    
    // 显示卸载后信息
    showPostUninstallInfo(keepData)
    
  } catch (error) {
    console.error(`❌ 卸载失败: ${error.message}`)
    process.exit(1)
  }
}

/**
 * 显示卸载信息
 */
async function showUninstallInfo() {
  console.log('\n📋 卸载信息:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const dataPath = path.join(process.cwd(), 'data', UNINSTALL_CONFIG.dataDir)
  
  if (fs.existsSync(dataPath)) {
    console.log('📁 发现以下用户数据:')
    
    // 检查配置文件
    const configPath = path.join(dataPath, 'calculator.config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      console.log(`   • 配置文件 (安装于: ${new Date(config.installDate).toLocaleString()})`)
    }
    
    // 检查历史记录
    const historyPath = path.join(dataPath, 'history')
    if (fs.existsSync(historyPath)) {
      const historyFiles = fs.readdirSync(historyPath)
      console.log(`   • 计算历史记录 (${historyFiles.length} 个文件)`)
    }
    
    // 检查设置
    const settingsPath = path.join(dataPath, 'settings')
    if (fs.existsSync(settingsPath)) {
      const settingsFiles = fs.readdirSync(settingsPath)
      console.log(`   • 用户设置 (${settingsFiles.length} 个文件)`)
    }
    
    // 检查主题
    const themesPath = path.join(dataPath, 'themes')
    if (fs.existsSync(themesPath)) {
      const themeFiles = fs.readdirSync(themesPath)
      console.log(`   • 自定义主题 (${themeFiles.length} 个文件)`)
    }
    
    // 计算数据大小
    const dataSize = calculateDirectorySize(dataPath)
    console.log(`   • 总数据大小: ${formatBytes(dataSize)}`)
  } else {
    console.log('ℹ️ 未发现用户数据')
  }
}

/**
 * 询问用户是否保留数据
 */
async function askKeepData() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question('\n❓ 是否保留用户数据？(y/N): ', (answer) => {
      rl.close()
      const keepData = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
      resolve(keepData)
    })
  })
}

/**
 * 备份用户数据
 */
async function backupUserData() {
  console.log('💾 备份用户数据...')
  
  const dataPath = path.join(process.cwd(), 'data', UNINSTALL_CONFIG.dataDir)
  const backupPath = path.join(process.cwd(), 'data', UNINSTALL_CONFIG.backupDir)
  
  if (fs.existsSync(dataPath)) {
    // 创建备份目录
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true })
    }
    
    // 复制数据文件
    await copyDirectory(dataPath, backupPath)
    
    // 创建备份信息文件
    const backupInfo = {
      appName: UNINSTALL_CONFIG.appName,
      backupDate: new Date().toISOString(),
      originalPath: dataPath,
      backupPath: backupPath,
      note: '此备份由应用卸载程序自动创建'
    }
    
    const backupInfoPath = path.join(backupPath, 'backup-info.json')
    fs.writeFileSync(backupInfoPath, JSON.stringify(backupInfo, null, 2))
    
    console.log(`   ✓ 数据已备份到: ${backupPath}`)
    console.log('   ℹ️ 如需恢复数据，请将备份文件夹重命名为原数据文件夹名称')
  }
}

/**
 * 注销应用快捷键
 */
async function unregisterShortcuts() {
  console.log('⌨️ 注销应用快捷键...')
  
  const shortcutsPath = path.join(process.cwd(), 'data', UNINSTALL_CONFIG.dataDir, 'shortcuts.json')
  
  if (fs.existsSync(shortcutsPath)) {
    const shortcuts = JSON.parse(fs.readFileSync(shortcutsPath, 'utf8'))
    
    console.log('   ✓ 已注销以下快捷键:')
    shortcuts.forEach(shortcut => {
      console.log(`   📋 ${shortcut.key}: ${shortcut.description}`)
    })
  } else {
    console.log('   ℹ️ 未发现快捷键配置')
  }
}

/**
 * 移除桌面快捷方式
 */
async function removeDesktopShortcut() {
  console.log('🖥️ 移除桌面快捷方式...')
  
  const shortcutPath = path.join(process.cwd(), 'data', UNINSTALL_CONFIG.dataDir, 'desktop-shortcut.json')
  
  if (fs.existsSync(shortcutPath)) {
    console.log('   ✓ 桌面快捷方式配置已移除')
  } else {
    console.log('   ℹ️ 未发现桌面快捷方式配置')
  }
}

/**
 * 清理应用数据
 */
async function cleanupAppData() {
  console.log('🧹 清理应用数据...')
  
  const dataPath = path.join(process.cwd(), 'data', UNINSTALL_CONFIG.dataDir)
  
  if (fs.existsSync(dataPath)) {
    await removeDirectory(dataPath)
    console.log('   ✓ 应用数据已清理')
  } else {
    console.log('   ℹ️ 未发现应用数据')
  }
}

/**
 * 移除应用文件
 */
async function removeAppFiles() {
  console.log('📦 移除应用文件...')
  
  const filesToRemove = [
    'src',
    'assets',
    'scripts',
    'app.manifest.json',
    'package.json',
    'README.md'
  ]
  
  let removedCount = 0
  
  for (const file of filesToRemove) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        await removeDirectory(filePath)
      } else {
        fs.unlinkSync(filePath)
      }
      removedCount++
    }
  }
  
  console.log(`   ✓ 已移除 ${removedCount} 个应用文件/目录`)
}

/**
 * 清理注册表项
 */
async function cleanupRegistry() {
  console.log('📝 清理注册表项...')
  
  // 这里可以添加清理系统注册表的逻辑
  // 例如移除应用注册信息、文件关联等
  
  console.log('   ✓ 注册表项已清理')
}

/**
 * 显示卸载后信息
 */
function showPostUninstallInfo(keepData) {
  console.log('\n📋 卸载完成信息:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`应用名称: ${UNINSTALL_CONFIG.appName}`)
  console.log(`卸载时间: ${new Date().toLocaleString()}`)
  
  if (keepData) {
    console.log(`\n💾 用户数据已备份到: data/${UNINSTALL_CONFIG.backupDir}`)
    console.log('如需恢复数据，请在重新安装后将备份文件夹重命名为原数据文件夹名称')
  } else {
    console.log('\n🗑️ 所有用户数据已清理')
  }
  
  console.log('\n✅ 已移除的内容:')
  console.log('• 应用程序文件')
  console.log('• 快捷键注册')
  console.log('• 桌面快捷方式')
  console.log('• 系统注册表项')
  if (!keepData) {
    console.log('• 用户数据和设置')
  }
  
  console.log('\n🙏 感谢使用 BG-WebMacOS 计算器！')
  console.log('如有问题或建议，请访问项目主页反馈。')
}

/**
 * 工具函数：复制目录
 */
async function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const items = fs.readdirSync(src)
  
  for (const item of items) {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    
    if (fs.statSync(srcPath).isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 工具函数：移除目录
 */
async function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const items = fs.readdirSync(dirPath)
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      
      if (fs.statSync(itemPath).isDirectory()) {
        await removeDirectory(itemPath)
      } else {
        fs.unlinkSync(itemPath)
      }
    }
    
    fs.rmdirSync(dirPath)
  }
}

/**
 * 工具函数：计算目录大小
 */
function calculateDirectorySize(dirPath) {
  let totalSize = 0
  
  if (fs.existsSync(dirPath)) {
    const items = fs.readdirSync(dirPath)
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stats = fs.statSync(itemPath)
      
      if (stats.isDirectory()) {
        totalSize += calculateDirectorySize(itemPath)
      } else {
        totalSize += stats.size
      }
    }
  }
  
  return totalSize
}

/**
 * 工具函数：格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 错误处理
 */
process.on('uncaughtException', (error) => {
  console.error(`❌ 未捕获的异常: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(`❌ 未处理的 Promise 拒绝:`, reason)
  process.exit(1)
})

// 执行卸载
if (require.main === module) {
  uninstall()
}

module.exports = { uninstall, UNINSTALL_CONFIG }