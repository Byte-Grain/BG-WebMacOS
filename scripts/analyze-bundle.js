// 打包分析脚本
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 分析打包结果
function analyzeBundleSize() {
  const distPath = path.join(__dirname, '../dist')
  
  if (!fs.existsSync(distPath)) {
    log('red', '❌ 打包文件不存在，请先运行 npm run build')
    return
  }
  
  log('blue', '📊 分析打包结果...')
  console.log()
  
  // 获取所有 JS 文件
  const jsFiles = fs.readdirSync(path.join(distPath, 'assets'))
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(distPath, 'assets', file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2)
      }
    })
    .sort((a, b) => b.size - a.size)
  
  // 获取所有 CSS 文件
  const cssFiles = fs.readdirSync(path.join(distPath, 'assets'))
    .filter(file => file.endsWith('.css'))
    .map(file => {
      const filePath = path.join(distPath, 'assets', file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2)
      }
    })
    .sort((a, b) => b.size - a.size)
  
  // 计算总大小
  const totalJSSize = jsFiles.reduce((sum, file) => sum + file.size, 0)
  const totalCSSSize = cssFiles.reduce((sum, file) => sum + file.size, 0)
  const totalSize = totalJSSize + totalCSSSize
  
  // 输出分析结果
  log('bold', '📦 JavaScript 文件分析:')
  jsFiles.forEach(file => {
    const color = file.size > 500 * 1024 ? 'red' : file.size > 200 * 1024 ? 'yellow' : 'green'
    console.log(`  ${colors[color]}${file.name}: ${file.sizeKB} KB${colors.reset}`)
    
    // 分析文件类型
    if (file.name.includes('element')) {
      console.log(`    📋 Element Plus 相关文件`)
    } else if (file.name.includes('vue')) {
      console.log(`    🔧 Vue 核心文件`)
    } else if (file.name.includes('vendor')) {
      console.log(`    📚 第三方库文件`)
    } else if (file.name.includes('index')) {
      console.log(`    🏠 主应用文件`)
    }
  })
  
  console.log()
  log('bold', '🎨 CSS 文件分析:')
  cssFiles.forEach(file => {
    const color = file.size > 100 * 1024 ? 'red' : file.size > 50 * 1024 ? 'yellow' : 'green'
    console.log(`  ${colors[color]}${file.name}: ${file.sizeKB} KB${colors.reset}`)
  })
  
  console.log()
  log('bold', '📊 总体分析:')
  console.log(`  JavaScript 总大小: ${colors.blue}${(totalJSSize / 1024).toFixed(2)} KB${colors.reset}`)
  console.log(`  CSS 总大小: ${colors.blue}${(totalCSSSize / 1024).toFixed(2)} KB${colors.reset}`)
  console.log(`  总大小: ${colors.bold}${(totalSize / 1024).toFixed(2)} KB${colors.reset}`)
  
  // 优化建议
  console.log()
  log('bold', '💡 优化建议:')
  
  const largeJSFiles = jsFiles.filter(file => file.size > 500 * 1024)
  if (largeJSFiles.length > 0) {
    log('yellow', '⚠️  发现大型 JS 文件，建议进一步拆分:')
    largeJSFiles.forEach(file => {
      console.log(`    - ${file.name} (${file.sizeKB} KB)`)
    })
  }
  
  const elementFiles = jsFiles.filter(file => file.name.includes('element'))
  if (elementFiles.length > 0) {
    const elementTotalSize = elementFiles.reduce((sum, file) => sum + file.size, 0)
    console.log(`  📋 Element Plus 总大小: ${(elementTotalSize / 1024).toFixed(2)} KB`)
    if (elementTotalSize > 200 * 1024) {
      log('yellow', '⚠️  Element Plus 包较大，已应用按需导入优化')
    } else {
      log('green', '✅ Element Plus 包大小已优化')
    }
  }
  
  if (totalSize < 1024 * 1024) {
    log('green', '✅ 总包大小良好 (< 1MB)')
  } else if (totalSize < 2 * 1024 * 1024) {
    log('yellow', '⚠️  总包大小适中 (1-2MB)')
  } else {
    log('red', '❌ 总包大小较大 (> 2MB)，建议进一步优化')
  }
}

// 运行分析
if (require.main === module) {
  analyzeBundleSize()
}

module.exports = { analyzeBundleSize }