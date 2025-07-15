<template>
  <div class="test-plugin">
    <h2>测试插件应用</h2>
    <p>这是一个位于 plugins 目录下的测试应用，用于演示多目录扫描功能。</p>
    <el-button type="primary" @click="showMessage">点击测试</el-button>
  </div>
</template>

<script lang="ts">
import type { AppConfig } from '@/types/app'

// 应用配置
export const appConfig: AppConfig = {
  key: 'test_plugin',
  title: '测试插件',
  icon: '🔌',
  iconColor: '#fff',
  iconBgColor: '#9C27B0',
  width: 500,
  height: 300,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  category: 'development',
  description: '用于测试多目录扫描功能的插件应用',
  version: '1.0.0',
  author: 'Plugin Developer',
  tags: ['plugin', 'test'],
  demo: true
}
</script>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const showMessage = () => {
  ElMessage.success('插件应用运行正常！')
}
</script>

<style scoped>
.test-plugin {
  padding: 20px;
  text-align: center;
}

.test-plugin h2 {
  color: #9C27B0;
  margin-bottom: 16px;
}

.test-plugin p {
  margin-bottom: 20px;
  color: #666;
}
</style>