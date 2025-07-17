<template>
  <div class="app-registry-debug">
    <h1>应用注册表调试</h1>

    <div class="debug-section">
      <h2>注册表状态</h2>
      <div class="status-info">
        <p><strong>初始化状态:</strong> {{ registryStatus.initialized }}</p>
        <p><strong>总应用数:</strong> {{ registryStatus.totalApps }}</p>
        <p><strong>系统应用:</strong> {{ registryStatus.systemApps }}</p>
        <p><strong>演示应用:</strong> {{ registryStatus.demoApps }}</p>
        <p><strong>自定义应用:</strong> {{ registryStatus.customApps }}</p>
      </div>
    </div>

    <div class="debug-section">
      <h2>所有已注册应用</h2>
      <div class="app-list">
        <div v-for="app in allApps" :key="app.key" class="app-item">
          <div class="app-icon">{{ app.icon || '📱' }}</div>
          <div class="app-details">
            <h3>{{ app.title }} ({{ app.key }})</h3>
            <p><strong>分类:</strong> {{ app.category }}</p>
            <p><strong>组件路径:</strong> {{ app.componentPath || 'N/A' }}</p>
            <p><strong>桌面显示:</strong> {{ !app.hideInDesktop ? '是' : '否' }}</p>
            <p><strong>Dock显示:</strong> {{ app.keepInDock ? '是' : '否' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="debug-section">
      <h2>桌面应用列表</h2>
      <div class="app-list">
        <div v-for="app in desktopApps" :key="app.key" class="app-item">
          <div class="app-icon">{{ app.icon || '📱' }}</div>
          <div class="app-details">
            <h3>{{ app.title }} ({{ app.key }})</h3>
            <p><strong>分类:</strong> {{ app.category }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="debug-section">
      <h2>Dock应用列表</h2>
      <div class="app-list">
        <div v-for="app in dockApps" :key="app.key" class="app-item">
          <div class="app-icon">{{ app.icon || '📱' }}</div>
          <div class="app-details">
            <h3>{{ app.title }} ({{ app.key }})</h3>
            <p><strong>分类:</strong> {{ app.category }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="debug-section">
      <h2>操作</h2>
      <button @click="reloadRegistry" class="btn">重新加载注册表</button>
      <button @click="refreshData" class="btn">刷新数据</button>
    </div>
  </div>
</template>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'app_registry_debug',
  title: '应用注册表调试',
  icon: 'icon-bug',
  iconBgColor: '#FF6B6B',
  iconColor: '#FFFFFF',
  category: 'development',
  tags: ['debug', 'registry', 'development'],
  version: '1.0.0',
  description: '用于调试应用注册表状态的工具',
  width:600,
  height:700
}
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { enhancedAppRegistry, getRegistryStatus } from '@core/app-registry/enhanced-app-registry'
import { getDesktopApps, getDockApps, getAllApps } from '@core/app-registry'

  // 响应式数据
  const registryStatus = ref({
    initialized: false,
    totalApps: 0,
    systemApps: 0,
    demoApps: 0,
    customApps: 0
  })

  const allApps = ref([])
  const desktopApps = ref([])
  const dockApps = ref([])

  // 刷新数据
  const refreshData = () => {
    try {
      registryStatus.value = getRegistryStatus()
      allApps.value = getAllApps()
      desktopApps.value = getDesktopApps()
      dockApps.value = getDockApps()

      console.log('🔍 调试信息:')
      console.log('注册表状态:', registryStatus.value)
      console.log('所有应用:', allApps.value)
      console.log('桌面应用:', desktopApps.value)
      console.log('Dock应用:', dockApps.value)
    } catch (error) {
      console.error('刷新数据失败:', error)
    }
  }

  // 重新加载注册表
  const reloadRegistry = async () => {
    try {
      await enhancedAppRegistry.reload()
      refreshData()
      console.log('✅ 注册表重新加载完成')
    } catch (error) {
      console.error('❌ 重新加载注册表失败:', error)
    }
  }

  // 组件挂载时刷新数据
  onMounted(() => {
    refreshData()
  })
</script>

<style scoped lang="scss">
  .app-registry-debug {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

    h1 {
      color: #333;
      margin-bottom: 2rem;
      text-align: center;
    }

    .debug-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;

      h2 {
        color: #495057;
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }

      .status-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;

        p {
          margin: 0.5rem 0;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }
      }

      .app-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;

        .app-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          transition: box-shadow 0.2s ease;

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .app-icon {
            font-size: 2rem;
            width: 3rem;
            height: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border-radius: 8px;
            flex-shrink: 0;
          }

          .app-details {
            flex: 1;

            h3 {
              margin: 0 0 0.5rem 0;
              color: #333;
              font-size: 1rem;
            }

            p {
              margin: 0.25rem 0;
              font-size: 0.875rem;
              color: #666;
            }
          }
        }
      }

      .btn {
        padding: 0.75rem 1.5rem;
        margin-right: 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background-color 0.2s ease;

        &:hover {
          background: #0056b3;
        }
      }
    }
  }
</style>
