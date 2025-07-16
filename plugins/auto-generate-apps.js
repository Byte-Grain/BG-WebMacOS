import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import crypto from 'crypto'

/**
 * Vite插件：自动生成custom-apps.ts
 * 扫描指定目录，根据Vue文件中的appConfig自动生成应用配置
 * @param {Object} options - 插件配置选项
 * @param {string[]} options.scanDirs - 要扫描的目录数组，默认为 ['src/views/apps']
 * @param {string} options.outputFile - 输出文件路径，默认为 'src/config/apps/custom-apps.ts'
 */
export function autoGenerateApps(options = {}) {
  const {
    scanDirs,
    outputFile
  } = options

  return {
    name: 'auto-generate-apps',
    buildStart() {
      console.log('🔍 开始扫描应用文件...')
      generateCustomApps(scanDirs, outputFile)
    },
    configureServer(server) {
      // 开发模式下监听文件变化
      const watcher = server.watcher

      // 为每个扫描目录添加监听
      scanDirs.forEach(dir => {
        watcher.add(`${dir}/**/*.vue`)
      })

      const shouldRegenerate = (file) => {
        return scanDirs.some(dir => file.includes(dir)) && file.endsWith('.vue')
      }

      watcher.on('change', (file) => {
        if (shouldRegenerate(file)) {
          console.log('📝 检测到应用文件变化，重新生成配置...')
          generateCustomApps(scanDirs, outputFile)
        }
      })

      watcher.on('add', (file) => {
        if (shouldRegenerate(file)) {
          console.log('➕ 检测到新应用文件，重新生成配置...')
          generateCustomApps(scanDirs, outputFile)
        }
      })

      watcher.on('unlink', (file) => {
        if (shouldRegenerate(file)) {
          console.log('🗑️ 检测到应用文件删除，重新生成配置...')
          generateCustomApps(scanDirs, outputFile)
        }
      })
    }
  }
}

/**
 * 将字符串转换为驼峰命名
 * @param {string} str - 要转换的字符串
 * @returns {string} 驼峰命名的字符串
 */
function toCamelCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[^a-zA-Z_$]/, '_') // 确保以字母、下划线或$开头
    .replace(/[^a-zA-Z0-9_$]/g, '') // 移除无效字符
}

/**
 * 生成custom-apps.ts文件
 * @param {string[]} scanDirs - 要扫描的目录数组
 * @param {string} outputFilePath - 输出文件路径
 */
function generateCustomApps(scanDirs, outputFilePath) {
  try {
    const outputFile = path.resolve(outputFilePath)
    
    const appConfigs = []
    const imports = []
    const usedComponentNames = new Set() // 跟踪已使用的组件名
    let componentIndex = 0

    // 扫描每个目录
    scanDirs.forEach(scanDir => {
      const appsDir = path.resolve(scanDir)

      if (!fs.existsSync(appsDir)) {
        console.warn(`⚠️ 目录不存在: ${scanDir}`)
        return
      }

      console.log(`📁 扫描目录: ${scanDir}`)

      // 扫描当前目录下的所有Vue文件
      const vueFiles = glob.sync('**/*.vue', { cwd: appsDir })

      vueFiles.forEach((file) => {
        const filePath = path.join(appsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        // 解析Vue文件中的appConfig
        const appConfig = extractAppConfig(content, file)
        if (appConfig) {

          // 从filePath中截取src之后的路径，取md5后作为key，保证key的唯一性
          const srcDir = path.resolve('src')
          const relativePathFromSrc = path.relative(srcDir, filePath)
            .replace(/\\/g, '/')
            .replace(/\.vue$/, '')

          appConfig.key = crypto.createHash('md5').update(relativePathFromSrc).digest('hex')

          // 生成驼峰命名的组件名，并处理重复名称
          let baseComponentName = toCamelCase(path.basename(relativePathFromSrc))
          let componentName = baseComponentName
          let counter = 1
          
          // 处理重复名称
          while (usedComponentNames.has(componentName)) {
            componentName = `${baseComponentName}${counter++}`
          }
          usedComponentNames.add(componentName)

          imports.push(`import ${componentName} from '@/${relativePathFromSrc}.vue'`)

          appConfigs.push({
            ...appConfig,
            component: componentName,
          })
        }
      })
    })

    // 生成文件内容
    const fileContent = generateFileContent(imports, appConfigs, scanDirs)

    // 确保输出目录存在
    const outputDir = path.dirname(outputFile)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 写入文件
    fs.writeFileSync(outputFile, fileContent, 'utf-8')

    console.log(`✅ 成功生成 ${appConfigs.length} 个应用配置到 ${path.basename(outputFilePath)}`)
    console.log(`📊 扫描目录: ${scanDirs.join(', ')}`)

  } catch (error) {
    console.error('❌ 生成应用配置失败:', error)
  }
}

/**
 * 从Vue文件内容中提取appConfig
 */
function extractAppConfig(content, filename) {
  try {
    // 匹配 export const appConfig = { ... }
    const configMatch = content.match(/export\s+const\s+appConfig:\s*AppConfig\s*=\s*({[\s\S]*?\n\s*})/)

    if (!configMatch) {
      return null
    }

    const configStr = configMatch[1]

    // 简单的对象解析（支持基本的字符串、数字、布尔值）
    const config = parseSimpleObject(configStr)

    // 验证必需字段
    if (!config.key || !config.title || !config.icon) {
      console.warn(`⚠️ ${filename} 中的 appConfig 缺少必需字段 (key, title, icon)`)
      return null
    }

    return config

  } catch (error) {
    console.warn(`⚠️ 解析 ${filename} 中的 appConfig 失败:`, error.message)
    return null
  }
}

/**
 * 改进的对象解析器
 */
function parseSimpleObject(str) {
  const obj = {}

  // 移除外层大括号和注释
  let content = str.replace(/^{\s*/, '').replace(/\s*}$/, '')

  // 移除单行注释
  content = content.replace(/\/\/.*$/gm, '')

  // 移除多行注释
  content = content.replace(/\/\*[\s\S]*?\*\//g, '')

  // 分割属性，支持多行属性
  const properties = []
  let currentProp = ''
  let braceCount = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const prevChar = content[i - 1]

    if (!inString && (char === '"' || char === "'")) {
      inString = true
      stringChar = char
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false
      stringChar = ''
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        braceCount++
      } else if (char === '}' || char === ']') {
        braceCount--
      } else if (char === ',' && braceCount === 0) {
        if (currentProp.trim()) {
          properties.push(currentProp.trim())
        }
        currentProp = ''
        continue
      }
    }

    currentProp += char
  }

  if (currentProp.trim()) {
    properties.push(currentProp.trim())
  }

  properties.forEach(prop => {
    const colonIndex = prop.indexOf(':')
    if (colonIndex === -1) return

    const key = prop.substring(0, colonIndex).trim()
    let value = prop.substring(colonIndex + 1).trim()

    // 移除尾部的逗号
    value = value.replace(/,$/, '')

    // 处理不同类型的值
    if (value.startsWith("'") && value.endsWith("'")) {
      // 单引号字符串
      obj[key] = value.slice(1, -1)
    } else if (value.startsWith('"') && value.endsWith('"')) {
      // 双引号字符串
      obj[key] = value.slice(1, -1)
    } else if (value === 'true') {
      obj[key] = true
    } else if (value === 'false') {
      obj[key] = false
    } else if (/^\d+$/.test(value)) {
      obj[key] = parseInt(value)
    } else if (/^\d+\.\d+$/.test(value)) {
      obj[key] = parseFloat(value)
    } else if (value.startsWith('[') && value.endsWith(']')) {
      // 数组处理
      try {
        obj[key] = JSON.parse(value)
      } catch {
        obj[key] = []
      }
    } else {
      // 其他情况作为字符串处理（去掉引号）
      obj[key] = value.replace(/^['"]|['"]$/g, '')
    }
  })

  return obj
}

/**
 * 生成文件内容
 * @param {string[]} imports - 导入语句数组
 * @param {Object[]} appConfigs - 应用配置数组
 * @param {string[]} scanDirs - 扫描的目录数组
 */
function generateFileContent(imports, appConfigs, scanDirs) {
  const importsStr = [
    "import type { AppConfig } from '@/types/app'",
    ...imports
  ].join('\n')

  const configsStr = appConfigs.map(config => {
    const configObj = { ...config }
    delete configObj.component // component 字段单独处理
    delete configObj._sourceDir // 移除调试信息
    delete configObj._sourceFile // 移除调试信息

    const properties = Object.entries(configObj).map(([key, value]) => {
      if (typeof value === 'string') {
        return `    ${key}: '${value}'`
      } else if (Array.isArray(value)) {
        return `    ${key}: ${JSON.stringify(value)}`
      } else {
        return `    ${key}: ${value}`
      }
    }).join(',\n')

    return `  {\n${properties},\n    component: ${config.component}\n  }`
  }).join(',\n')

  const scanDirsComment = scanDirs.length > 1
    ? `扫描目录: ${scanDirs.join(', ')}`
    : `扫描目录: ${scanDirs[0]}`

  return `${importsStr}

/**
 * 自定义应用配置
 * 此文件由 auto-generate-apps 插件自动生成，请勿手动修改
 * ${scanDirsComment}
 * 要添加新应用，请在指定目录下创建 Vue 文件并导出 appConfig
 */
export const systemApps: AppConfig[] = [
${configsStr}
]
`
}