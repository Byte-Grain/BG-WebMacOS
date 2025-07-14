<template>
  <div class="top-bar">
    <!-- Apple Logo Dropdown -->
    <div class="logo-section">
      <el-dropdown trigger="click">
        <div class="logo">
          <i class="iconfont icon-apple1"></i>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openAppByKey('system_about')">
              <div>{{ $t('system.about') }}</div>
            </el-dropdown-item>
            <el-dropdown-item class="line"></el-dropdown-item>
            <el-dropdown-item @click="openAppByKey('system_setting')">
              <div>{{ $t('system.settings') }}</div>
            </el-dropdown-item>
            <el-dropdown-item @click="openAppByKey('system_store')">
              <div>{{ $t('system.appStore') }}</div>
            </el-dropdown-item>
            <el-dropdown-item class="line"></el-dropdown-item>
            <el-dropdown-item @click="openAppByKey('system_task')">
              <div>{{ $t('system.forceQuit') }}</div>
            </el-dropdown-item>
            <el-dropdown-item class="line"></el-dropdown-item>
            <el-dropdown-item @click="handleShutdown">
              <div>{{ $t('system.shutdown') }}</div>
            </el-dropdown-item>
            <el-dropdown-item class="line"></el-dropdown-item>
            <el-dropdown-item @click="handleLockScreen">
              <div>{{ $t('system.lockScreen') }}</div>
            </el-dropdown-item>
            <el-dropdown-item @click="handleLogout">
              <div>{{ $t('system.logout', { username: userName }) }}</div>
            </el-dropdown-item>
            <el-dropdown-item class="line"></el-dropdown-item>
            <el-dropdown-item @click="openTestPage">
              <div>开发者工具</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Menu Items -->
    <div class="menu-section">
      <div class="menu" v-for="item in menu" :key="item.value">
        <el-dropdown trigger="click" placement="bottom-start">
          <div class="item">{{ item.title }}</div>
          <template #dropdown>
            <el-dropdown-menu>
              <template v-for="subItem in item.sub" :key="subItem.value">
                <el-dropdown-item class="line" v-if="subItem.isLine"></el-dropdown-item>
                <el-dropdown-item v-else @click="openAppByKey(subItem.key)">
                  <div>{{ subItem.title }}</div>
                </el-dropdown-item>
              </template>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Spacer -->
    <div class="space"></div>

    <!-- Status Bar -->
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppManager, useSystem } from '@/composables'
import StatusBar from './StatusBar.vue'

// Props and Emits
const emit = defineEmits(['lockScreen', 'shutdown', 'logout', 'openTestPage'])

// Composables
const { openAppByKey, currentMenu } = useAppManager()
const { userInfo } = useSystem()

// Computed
const menu = computed(() => currentMenu.value)
const userName = computed(() => userInfo.value?.name || '')

// Methods
const handleLockScreen = () => {
  emit('lockScreen')
}

const handleShutdown = () => {
  emit('shutdown')
}

const handleLogout = () => {
  emit('logout')
}

const openTestPage = () => {
  emit('openTestPage')
}
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  height: 30px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0 15px;
  position: relative;
  z-index: 1000;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.logo:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.logo i {
  font-size: 16px;
  color: #333;
}

.menu-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.menu {
  margin-right: 20px;
}

.menu .item {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s ease;
}

.menu .item:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.space {
  flex: 1;
}

/* Dropdown styles */
:deep(.el-dropdown-menu) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

:deep(.el-dropdown-menu__item) {
  color: #333;
  font-size: 14px;
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

:deep(.el-dropdown-menu__item.line) {
  height: 1px;
  padding: 0;
  margin: 4px 0;
  background-color: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style>