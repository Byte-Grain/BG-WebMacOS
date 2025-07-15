#!/usr/bin/env node

/**
 * 计算器应用安装脚本
 * 在应用安装时执行的自定义逻辑
 */

const fs = require('fs')
const path = require('path')

// 安装配置
const INSTALL_CONFIG = {
  appName: 'Calculator',
  version: '1.0.0',
  dataDir: 'calculator-data',
  configFile: 'calculator.config.json'
}

/**
 * 主安装函数
 */
async function install() {
  console.log(`🚀 开始安装 ${INSTALL_CONFIG.appName} v${INSTALL_CONFIG.version}...`)
  
  try {
    // 1. 创建应用数据目录
    await createDataDirectory()
    
    // 2. 初始化配置文件
    await initializeConfig()
    
    // 3. 设置默认权限
    await setupPermissions()
    
    // 4. 注册应用快捷键
    await registerShortcuts()
    
    // 5. 创建桌面快捷方式（可选）
    await createDesktopShortcut()
    
    console.log(`✅ ${INSTALL_CONFIG.appName} 安装完成！`)
    
    // 显示安装后信息
    showPostInstallInfo()
    
  } catch (error) {
    console.error(`❌ 安装失败: ${error.message}`)
    process.exit(1)
  }
}

/**
 * 创建应用数据目录
 */
async function createDataDirectory() {
  console.log('📁 创建应用数据目录...')
  
  const dataPath = path.join(process.cwd(), 'data', INSTALL_CONFIG.dataDir)
  
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
    console.log(`   ✓ 数据目录已创建: ${dataPath}`)
  } else {
    console.log(`   ℹ 数据目录已存在: ${dataPath}`)
  }
  
  // 创建子目录
  const subDirs = ['history', 'settings', 'themes']
  for (const subDir of subDirs) {
    const subPath = path.join(dataPath, subDir)
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true })
      console.log(`   ✓ 子目录已创建: ${subDir}`)
    }
  }
}

/**
 * 初始化配置文件
 */
async function initializeConfig() {
  console.log('⚙️ 初始化配置文件...')
  
  const configPath = path.join(process.cwd(), 'data', INSTALL_CONFIG.dataDir, INSTALL_CONFIG.configFile)
  
  const defaultConfig = {
    version: INSTALL_CONFIG.version,
    installDate: new Date().toISOString(),
    settings: {
      mode: 'standard', // standard | scientific
      theme: 'default',
      precision: 10,
      angleUnit: 'degree', // degree | radian
      autoSave: true,
      historyLimit: 100
    },
    shortcuts: {
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      clear: 'Escape',
      equals: 'Enter'
    },
    ui: {
      windowSize: {
        width: 320,
        height: 480
      },
      position: 'center',
      alwaysOnTop: false
    }
  }
  
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    console.log(`   ✓ 配置文件已创建: ${INSTALL_CONFIG.configFile}`)
  } else {
    // 合并现有配置
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const mergedConfig = { ...defaultConfig, ...existingConfig }
    mergedConfig.version = INSTALL_CONFIG.version // 更新版本号
    
    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2))
    console.log(`   ✓ 配置文件已更新: ${INSTALL_CONFIG.configFile}`)
  }
}

/**
 * 设置默认权限
 */
async function setupPermissions() {
  console.log('🔐 设置应用权限...')
  
  const permissions = {
    storage: {
      granted: true,
      description: '用于保存计算历史和设置'
    },
    clipboard: {
      granted: true,
      description: '用于复制计算结果'
    },
    notifications: {
      granted: false,
      description: '用于显示计算错误通知'
    }
  }
  
  const permissionsPath = path.join(process.cwd(), 'data', INSTALL_CONFIG.dataDir, 'permissions.json')
  fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2))
  
  console.log('   ✓ 权限配置已设置')
  
  // 显示权限信息
  Object.entries(permissions).forEach(([key, value]) => {
    const status = value.granted ? '✅' : '❌'
    console.log(`   ${status} ${key}: ${value.description}`)
  })
}

/**
 * 注册应用快捷键
 */
async function registerShortcuts() {
  console.log('⌨️ 注册应用快捷键...')
  
  const shortcuts = [
    {
      key: 'Ctrl+Alt+C',
      action: 'open-calculator',
      description: '打开计算器'
    },
    {
      key: 'Ctrl+Shift+C',
      action: 'quick-calculate',
      description: '快速计算模式'
    }
  ]
  
  const shortcutsPath = path.join(process.cwd(), 'data', INSTALL_CONFIG.dataDir, 'shortcuts.json')
  fs.writeFileSync(shortcutsPath, JSON.stringify(shortcuts, null, 2))
  
  console.log('   ✓ 快捷键已注册')
  shortcuts.forEach(shortcut => {
    console.log(`   📋 ${shortcut.key}: ${shortcut.description}`)
  })
}

/**
 * 创建桌面快捷方式
 */
async function createDesktopShortcut() {
  console.log('🖥️ 创建桌面快捷方式...')
  
  const shortcut = {
    name: INSTALL_CONFIG.appName,
    icon: './assets/icon.svg',
    description: '功能完整的科学计算器',
    category: 'utilities',
    keywords: ['calculator', 'math', 'utility']
  }
  
  const shortcutPath = path.join(process.cwd(), 'data', INSTALL_CONFIG.dataDir, 'desktop-shortcut.json')
  fs.writeFileSync(shortcutPath, JSON.stringify(shortcut, null, 2))
  
  console.log('   ✓ 桌面快捷方式配置已创建')
}

/**
 * 显示安装后信息
 */
function showPostInstallInfo() {
  console.log('\n📋 安装信息:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`应用名称: ${INSTALL_CONFIG.appName}`)
  console.log(`版本: ${INSTALL_CONFIG.version}`)
  console.log(`安装时间: ${new Date().toLocaleString()}`)
  console.log(`数据目录: data/${INSTALL_CONFIG.dataDir}`)
  
  console.log('\n🎯 功能特性:')
  console.log('• 标准计算器功能')
  console.log('• 科学计算器模式')
  console.log('• 计算历史记录')
  console.log('• 内存操作功能')
  console.log('• 键盘快捷键支持')
  console.log('• 自定义主题（即将推出）')
  
  console.log('\n⌨️ 快捷键:')
  console.log('• Ctrl+C: 复制结果')
  console.log('• Ctrl+V: 粘贴数值')
  console.log('• Escape: 清除输入')
  console.log('• Enter: 计算结果')
  console.log('• Ctrl+Alt+C: 打开计算器')
  
  console.log('\n🔧 配置文件:')
  console.log(`• ${INSTALL_CONFIG.configFile}: 主配置文件`)
  console.log('• permissions.json: 权限配置')
  console.log('• shortcuts.json: 快捷键配置')
  
  console.log('\n💡 使用提示:')
  console.log('• 点击历史按钮查看计算记录')
  console.log('• 使用 SCI/STD 按钮切换计算模式')
  console.log('• 支持键盘输入和鼠标点击')
  console.log('• 内存功能: MR(读取) MC(清除) M+(加) M-(减) MS(存储)')
  
  console.log('\n🎉 安装完成！享受使用 BG-WebMacOS 计算器！')
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

// 执行安装
if (require.main === module) {
  install()
}

module.exports = { install, INSTALL_CONFIG }