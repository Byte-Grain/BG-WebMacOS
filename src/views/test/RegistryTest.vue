<template>
  <div class="registry-test">
    <h1>应用注册表测试</h1>
    <div class="test-section">
      <h2>测试结果</h2>
      <pre>{{ testResults }}</pre>
    </div>
    <div class="actions">
      <button @click="runTest">运行测试</button>
      <button @click="clearResults">清除结果</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { enhancedAppRegistry } from '@/config/apps/enhanced-app-registry'
import { getAllApps, getDesktopApps, getDockApps } from '@/config/apps'

const testResults = ref('')

const log = (message: string) => {
  testResults.value += `${new Date().toLocaleTimeString()}: ${message}\n`
  console.log(message)
}

const runTest = async () => {
  testResults.value = ''
  
  try {
    log('🔍 开始测试应用注册表...')
    
    // 测试注册表状态
    log(`注册表初始化状态: ${enhancedAppRegistry.isInitialized ? '已初始化' : '未初始化'}`)
    
    // 如果未初始化，尝试初始化
    if (!enhancedAppRegistry.isInitialized) {
      log('正在初始化注册表...')
      await enhancedAppRegistry.initialize()
      log('注册表初始化完成')
    }
    
    // 获取所有应用
    const allApps = getAllApps()
    log(`总应用数: ${allApps.length}`)
    
    // 按分类统计
    const systemApps = allApps.filter(app => app.category === 'system')
    const demoApps = allApps.filter(app => app.category === 'demo')
    const customApps = allApps.filter(app => app.category === 'custom')
    
    log(`系统应用: ${systemApps.length}`)
    log(`演示应用: ${demoApps.length}`)
    log(`自定义应用: ${customApps.length}`)
    
    // 列出自定义应用
    if (customApps.length > 0) {
      log('\n自定义应用列表:')
      customApps.forEach(app => {
        log(`  - ${app.key}: ${app.title} (${app.componentPath || 'N/A'})`)
      })
    } else {
      log('⚠️ 没有发现自定义应用')
    }
    
    // 检查特定应用
    const myTestApp = allApps.find(app => app.key === 'MyTestApp')
    const debugApp = allApps.find(app => app.key === 'app_registry_debug')
    
    log(`\nMyTestApp 存在: ${myTestApp ? '是' : '否'}`)
    if (myTestApp) {
      log(`  - 标题: ${myTestApp.title}`)
      log(`  - 桌面显示: ${!myTestApp.hideInDesktop ? '是' : '否'}`)
      log(`  - Dock显示: ${myTestApp.keepInDock ? '是' : '否'}`)
    }
    
    log(`\n调试应用存在: ${debugApp ? '是' : '否'}`)
    if (debugApp) {
      log(`  - 标题: ${debugApp.title}`)
      log(`  - 桌面显示: ${!debugApp.hideInDesktop ? '是' : '否'}`)
      log(`  - Dock显示: ${debugApp.keepInDock ? '是' : '否'}`)
    }
    
    // 测试桌面应用
    const desktopApps = getDesktopApps()
    log(`\n桌面应用数: ${desktopApps.length}`)
    
    // 测试Dock应用
    const dockApps = getDockApps()
    log(`Dock应用数: ${dockApps.length}`)
    
    log('\n✅ 测试完成')
    
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`)
    console.error('测试错误:', error)
  }
}

const clearResults = () => {
  testResults.value = ''
}

onMounted(() => {
  runTest()
})
</script>

<style scoped>
.registry-test {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  font-family: monospace;
}

.test-section {
  margin: 2rem 0;
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}

.actions {
  margin: 1rem 0;
}

button {
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}
</style>