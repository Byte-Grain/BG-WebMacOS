<template>
  <div class="config-manager">
    <div class="config-header">
      <h2>应用配置管理器</h2>
      <div class="config-info">
        <span class="config-mode">配置模式: {{ configInfo.mode }}</span>
        <span class="config-status" :class="{ valid: configInfo.isJsonValid, invalid: !configInfo.isJsonValid }">
          {{ configInfo.isJsonValid ? '✅ 配置有效' : '❌ 配置无效' }}
        </span>
      </div>
    </div>

    <div class="config-stats">
      <div class="stat-card">
        <div class="stat-number">{{ configInfo.totalApps }}</div>
        <div class="stat-label">总应用数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ configInfo.systemApps }}</div>
        <div class="stat-label">系统应用</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ configInfo.demoApps }}</div>
        <div class="stat-label">演示应用</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ configInfo.userApps }}</div>
        <div class="stat-label">用户应用</div>
      </div>
    </div>

    <div class="config-actions">
      <button @click="reloadConfiguration" class="btn btn-primary">
        🔄 重新加载配置
      </button>
      <button @click="exportConfig" class="btn btn-secondary">
        📤 导出配置
      </button>
      <button @click="validateConfig" class="btn btn-info">
        ✅ 验证配置
      </button>
    </div>

    <div class="app-list">
      <h3>应用列表</h3>
      <div class="app-categories">
        <div class="category" v-for="(apps, category) in categorizedApps" :key="category">
          <h4>{{ getCategoryName(category) }}</h4>
          <div class="app-grid">
            <div 
              v-for="app in apps" 
              :key="app.key" 
              class="app-card"
              @click="selectApp(app)"
              :class="{ selected: selectedApp?.key === app.key }"
            >
              <div class="app-icon" :style="{ color: app.iconColor, backgroundColor: app.iconBgColor }">
                {{ app.icon }}
              </div>
              <div class="app-info">
                <div class="app-title">{{ app.title }}</div>
                <div class="app-key">{{ app.key }}</div>
                <div class="app-version">v{{ app.version }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedApp" class="app-details">
      <h3>应用详情</h3>
      <div class="details-content">
        <div class="detail-group">
          <label>应用标识:</label>
          <span>{{ selectedApp.key }}</span>
        </div>
        <div class="detail-group">
          <label>应用名称:</label>
          <span>{{ selectedApp.title }}</span>
        </div>
        <div class="detail-group">
          <label>应用描述:</label>
          <span>{{ selectedApp.description || '无描述' }}</span>
        </div>
        <div class="detail-group">
          <label>应用版本:</label>
          <span>{{ selectedApp.version }}</span>
        </div>
        <div class="detail-group">
          <label>应用作者:</label>
          <span>{{ selectedApp.author || '未知' }}</span>
        </div>
        <div class="detail-group">
          <label>应用分类:</label>
          <span>{{ selectedApp.category }}</span>
        </div>
        <div class="detail-group">
          <label>窗口尺寸:</label>
          <span>{{ selectedApp.width }} × {{ selectedApp.height }}</span>
        </div>
        <div class="detail-group">
          <label>权限:</label>
          <span>{{ selectedApp.permissions?.join(', ') || '无特殊权限' }}</span>
        </div>
        <div class="detail-group">
          <label>标签:</label>
          <span>{{ selectedApp.tags?.join(', ') || '无标签' }}</span>
        </div>
      </div>
    </div>

    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  getAllApps, 
  enhancedAppRegistry
} from '../../config/apps'
import type { AppConfig } from '../../config/apps/types'

// 配置信息的替代实现
const configInfo = ref({
  mode: 'Enhanced',
  isJsonValid: true,
  totalApps: 0,
  systemApps: 0,
  demoApps: 0,
  userApps: 0
})
const selectedApp = ref<AppConfig | null>(null)
const message = ref('')
const messageType = ref('info')

const categorizedApps = computed(() => {
  return {
    system: enhancedAppRegistry.getAppsByCategory('system'),
    demo: enhancedAppRegistry.getAppsByCategory('demo'),
    user: enhancedAppRegistry.getAppsByCategory('custom')
  }
})

const getCategoryName = (category: string) => {
  const names = {
    system: '系统应用',
    demo: '演示应用',
    user: '用户应用'
  }
  return names[category as keyof typeof names] || category
}

const selectApp = (app: AppConfig) => {
  selectedApp.value = app
}

const reloadConfiguration = () => {
  try {
    // 使用新的增强应用注册表重新加载
    await enhancedAppRegistry.reload()
    updateConfigInfo()
    showMessage('配置重新加载成功', 'success')
  } catch (error) {
    showMessage(`配置重新加载失败: ${error}`, 'error')
  }
}

const exportConfig = () => {
  try {
    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      description: 'WebMacOS应用配置',
      system: {},
      demo: {},
      user: {},
      defaults: {
        width: 800,
        height: 600,
        resizable: true,
        draggable: true,
        closable: true,
        minimizable: true,
        maximizable: true,
        hideInDesktop: false,
        keepInDock: false,
        category: 'other',
        version: '1.0.0',
        author: 'WebMacOS',
        permissions: []
      }
    }

    // 填充应用数据
    enhancedAppRegistry.getAppsByCategory('system').forEach(app => {
      config.system[app.key] = app
    })
    enhancedAppRegistry.getAppsByCategory('demo').forEach(app => {
      config.demo[app.key] = app
    })
    enhancedAppRegistry.getAppsByCategory('custom').forEach(app => {
      config.user[app.key] = app
    })

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'webmacos-apps-config.json'
    a.click()
    URL.revokeObjectURL(url)
    
    showMessage('配置导出成功', 'success')
  } catch (error) {
    showMessage(`配置导出失败: ${error}`, 'error')
  }
}

const validateConfig = () => {
  try {
    // 简化的配置验证
    const allApps = getAllApps()
    const isValid = allApps.every(app => app.key && app.title && app.icon)
    if (isValid) {
      showMessage('配置验证通过', 'success')
    } else {
      showMessage('配置验证失败', 'error')
    }
    updateConfigInfo()
  } catch (error) {
    showMessage(`配置验证失败: ${error}`, 'error')
  }
}

const showMessage = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 更新配置信息的函数
const updateConfigInfo = () => {
  const systemApps = enhancedAppRegistry.getAppsByCategory('system')
  const demoApps = enhancedAppRegistry.getAppsByCategory('demo')
  const userApps = enhancedAppRegistry.getAppsByCategory('custom')
  
  configInfo.value = {
    mode: 'Enhanced',
    isJsonValid: true,
    totalApps: systemApps.length + demoApps.length + userApps.length,
    systemApps: systemApps.length,
    demoApps: demoApps.length,
    userApps: userApps.length
  }
}

onMounted(() => {
  updateConfigInfo()
})
</script>

<style scoped>
.config-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.config-header h2 {
  margin: 0;
  color: #333;
}

.config-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.config-mode {
  padding: 5px 10px;
  background: #f0f0f0;
  border-radius: 5px;
  font-size: 14px;
}

.config-status {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
}

.config-status.valid {
  background: #d4edda;
  color: #155724;
}

.config-status.invalid {
  background: #f8d7da;
  color: #721c24;
}

.config-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #007AFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.config-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007AFF;
  color: white;
}

.btn-primary:hover {
  background: #0056CC;
}

.btn-secondary {
  background: #6C757D;
  color: white;
}

.btn-secondary:hover {
  background: #545B62;
}

.btn-info {
  background: #17A2B8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.app-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.category {
  margin-bottom: 30px;
}

.category h4 {
  margin-bottom: 15px;
  color: #666;
  font-size: 16px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.app-card {
  background: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 15px;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.app-card.selected {
  border: 2px solid #007AFF;
  background: #F0F8FF;
}

.app-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.app-info {
  flex: 1;
}

.app-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.app-key {
  font-size: 12px;
  color: #666;
  font-family: monospace;
  margin-bottom: 3px;
}

.app-version {
  font-size: 12px;
  color: #999;
}

.app-details {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-details h3 {
  margin-bottom: 15px;
  color: #333;
}

.details-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.detail-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-group label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.detail-group span {
  color: #333;
  word-break: break-all;
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.message.info {
  background: #D1ECF1;
  color: #0C5460;
  border: 1px solid #BEE5EB;
}

.message.success {
  background: #D4EDDA;
  color: #155724;
  border: 1px solid #C3E6CB;
}

.message.error {
  background: #F8D7DA;
  color: #721C24;
  border: 1px solid #F5C6CB;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>