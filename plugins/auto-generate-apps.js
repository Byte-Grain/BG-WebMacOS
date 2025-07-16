import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import crypto from 'crypto'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

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
    outDir
  } = options

  const outputFile = path.join(outDir, "default-apps.ts");

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
 * 生成custom-apps.ts文件
 * @param {string[]} scanDirs - 要扫描的目录数组
 * @param {string} outputFilePath - 输出文件路径
 */
function generateCustomApps(scanDirs, outputFilePath) {
  try {
    const outputFile = path.resolve(outputFilePath)

    const appConfigs = []
    const imports = []

    // 扫描每个目录
    scanDirs.forEach(scanDir => {
      const appsDir = path.resolve(scanDir)

      if (!fs.existsSync(appsDir)) {
        console.warn(`⚠️ 目录不存在: ${scanDir}`)
        return
      }

      console.log(`📁 扫描目录: ${scanDir}`)

      // 按照新的目录结构规则扫描：
      // 第一层为分类，第二层为分组或应用，第三层为应用（如果存在）
      // 只扫描index.vue文件，最多扫描四层（apps/分类/分组/应用）
      const indexFiles = glob.sync('**/index.vue', {
        cwd: appsDir,
        maxDepth: 4 // 增加到4层以支持 apps/builtIn/system/about 这样的结构
      })

      indexFiles.forEach((file) => {
        const filePath = path.join(appsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        // 解析Vue文件中的appConfig
        const appConfig = extractAppConfig(content, file)
        if (appConfig) {

          // 从filePath中截取src之后的路径，取md5后作为key，保证key的唯一性
          const srcDir = path.resolve('src')
          const relativePathFromSrc = path.relative(srcDir, filePath)
            .replace(/\\/g, '/')
            .replace(/\/index\.vue$/, '') // 移除/index.vue后缀

          appConfig._id = crypto.createHash('md5').update(relativePathFromSrc).digest('hex')

          // 解析目录结构生成组件名并提取分类和分组信息
          const pathParts = relativePathFromSrc.split('/')
          // 移除apps前缀
          const appPathParts = pathParts.slice(1) // 去掉'apps'

          // 提取分类名称、分组名称和应用名称
          let category, group, appName;

          if (appPathParts.length === 3) {
            // 三层：分类/子分类/应用 (如: builtIn/system/about)
            category = appPathParts[0]  // 分类名称 (builtIn)
            group = appPathParts[1]     // 分组名称 (system)
            appName = appPathParts[2]   // 应用名称 (about)
          } else if (appPathParts.length === 2) {
            // 两层：分类/应用
            category = appPathParts[0]  // 分类名称
            group = ""                // 无分组
            appName = appPathParts[1]       // 应用名称
          } else {
            console.log("找不到分类和分组信息，请检查路径是否正确", pathParts)
            return // 跳过无法解析的路径
          }

          const component = `${category}_${group}_${appName}`
          appConfig.key = component.toLowerCase();

          // 生成导入路径，指向index.vue文件
          imports.push(`import ${component} from '@/${relativePathFromSrc}/index.vue'`)

          appConfigs.push({
            ...appConfig,
            category,
            group,
            component,
          })
        }
      })
    })

    // 确保输出目录存在
    const outputDir = path.dirname(outputFile)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 生成统一的index.ts文件内容
    const indexContent = generateIndexContent(imports, appConfigs, scanDirs, outputDir)

    // 写入index.ts文件
    const indexFile = path.join(outputDir, 'index.ts')
    fs.writeFileSync(indexFile, indexContent, 'utf-8')

    console.log(`✅ 成功生成 ${appConfigs.length} 个应用配置和键值常量到 index.ts`)
    console.log(`📊 扫描目录: ${scanDirs.join(', ')}`)

  } catch (error) {
    console.error('❌ 生成应用配置失败:', error)
  }
}

/**
 * 从Vue文件内容中提取appConfig（使用AST静态解析）
 */
function extractAppConfig(content, filename) {
  try {
    // 提取所有script标签内容
    const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g)
    if (!scriptMatches) {
      return null
    }

    let appConfig = null

    // 遍历所有script标签
    for (const scriptTag of scriptMatches) {
      const scriptContent = scriptTag.replace(/<script[^>]*>([\s\S]*?)<\/script>/, '$1')

      try {
        // 使用Babel解析TypeScript/JavaScript代码
        const ast = parse(scriptContent, {
          sourceType: 'module',
          plugins: [
            'typescript',
            'decorators-legacy',
            'classProperties',
            'objectRestSpread'
          ]
        })

        // 遍历AST查找appConfig导出
        traverse.default(ast, {
          ExportNamedDeclaration(path) {
            const declaration = path.node.declaration
            if (
              declaration &&
              declaration.type === 'VariableDeclaration' &&
              declaration.declarations.length > 0
            ) {
              const declarator = declaration.declarations[0]
              if (
                declarator.id &&
                declarator.id.name === 'appConfig' &&
                declarator.init &&
                declarator.init.type === 'ObjectExpression'
              ) {
                appConfig = parseObjectExpression(declarator.init)
              }
            }
          }
        })

        // 如果找到了appConfig，跳出循环
        if (appConfig) {
          break
        }
      } catch (parseError) {
        // 忽略解析错误，继续下一个script标签
        continue
      }
    }

    if (!appConfig) {
      return null
    }

    // 验证必需字段
    if (!appConfig.key || !appConfig.title || !appConfig.icon) {
      console.warn(`⚠️ ${filename} 中的 appConfig 缺少必需字段 (key, title, icon)`)
      return null
    }

    return appConfig

  } catch (error) {
    console.warn(`⚠️ 解析 ${filename} 中的 appConfig 失败:`, error.message)
    return null
  }
}

/**
 * 解析AST对象表达式为JavaScript对象
 */
function parseObjectExpression(node) {
  const obj = {}

  if (node.type !== 'ObjectExpression') {
    return obj
  }

  node.properties.forEach(prop => {
    if (prop.type === 'ObjectProperty' || prop.type === 'Property') {
      let key

      // 处理属性键
      if (prop.key.type === 'Identifier') {
        key = prop.key.name
      } else if (prop.key.type === 'StringLiteral') {
        key = prop.key.value
      } else {
        return // 跳过不支持的键类型
      }

      // 处理属性值
      const value = parseASTValue(prop.value)
      if (value !== undefined) {
        obj[key] = value
      }
    }
  })

  return obj
}

/**
 * 解析AST节点值
 */
function parseASTValue(node) {
  switch (node.type) {
    case 'StringLiteral':
      return node.value

    case 'NumericLiteral':
      return node.value

    case 'BooleanLiteral':
      return node.value

    case 'NullLiteral':
      return null

    case 'ArrayExpression':
      return node.elements.map(element => {
        if (element === null) return null
        return parseASTValue(element)
      }).filter(item => item !== undefined)

    case 'ObjectExpression':
      return parseObjectExpression(node)

    case 'TemplateLiteral':
      // 简单处理模板字符串，只支持纯字符串部分
      if (node.expressions.length === 0) {
        return node.quasis[0]?.value?.cooked || ''
      }
      return undefined // 不支持包含表达式的模板字符串

    case 'Identifier':
      // 对于标识符，我们无法在静态分析时确定其值
      // 但可以尝试处理一些常见的常量
      if (node.name === 'undefined') return undefined
      return undefined

    default:
      // 对于其他复杂表达式，返回undefined
      return undefined
  }
}

/**
 * 生成统一的index.ts文件内容
 * @param {string[]} imports - 导入语句数组
 * @param {Object[]} appConfigs - 应用配置数组
 * @param {string[]} scanDirs - 扫描的目录数组
 * @param {string} outputDir - 输出目录
 */
function generateIndexContent(imports, appConfigs, scanDirs, outputDir) {
  // 生成导入语句
  const importsStr = [
    "import type { AppConfig } from '@/types/app'",
    "import { simpleApps } from './simple-apps'",
    ...imports
  ].join('\n')

  // 生成应用键值常量
  const appKeys = appConfigs.map(config => {
    const upperKey = config.key.toUpperCase()
    return `  APPKEY_${upperKey}: '${config.key}'`
  }).join(',\n')

  // 生成应用配置数组
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
 * 应用键值常量
 * 此文件由 auto-generate-apps 插件自动生成，请勿手动修改
 * ${scanDirsComment}
 */
export const APP_KEYS = {
${appKeys}
} as const

export type AppKey = typeof APP_KEYS[keyof typeof APP_KEYS]

/**
 * 动态扫描的应用配置
 * 此文件由 auto-generate-apps 插件自动生成，请勿手动修改
 * ${scanDirsComment}
 * 要添加新应用，请在指定目录下创建 Vue 文件并导出 appConfig
 */
export const scanApps: AppConfig[] = [
${configsStr}
]

/**
 * 所有应用配置（合并动态扫描和手动配置）
 */
export const Apps: AppConfig[] = [...scanApps, ...simpleApps]
`
}