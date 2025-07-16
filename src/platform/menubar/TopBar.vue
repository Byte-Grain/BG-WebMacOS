<template>
  <div class="top-bar">
    <!-- Apple Logo Dropdown -->
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
          <el-dropdown-item @click="openAppByKey('system_task')">
            <div>{{ $t('system.forceQuit') }}</div>
          </el-dropdown-item>
          <el-dropdown-item class="line"></el-dropdown-item>
          <el-dropdown-item @click="openAppByKey('composables_test')">
            <div>Composables Test</div>
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
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Menu Items -->
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

    <!-- Spacer -->
    <div class="space"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, shallowRef, watchEffect } from 'vue'
  import { useAppManager, useSystem } from '@/composables'

  // Composables
  const { openAppByKey, currentMenu } = useAppManager()
  const { userInfo, logout: systemLogout, lockScreen: systemLockScreen, shutdown: systemShutdown } = useSystem()

  // 优化：使用shallowRef和缓存优化菜单渲染
  const menu = shallowRef([])
  const userName = computed(() => userInfo.value?.name || '')
  
  // 使用watchEffect优化菜单更新
  watchEffect(() => {
    const newMenu = currentMenu.value
    if (JSON.stringify(menu.value) !== JSON.stringify(newMenu)) {
      menu.value = newMenu
    }
  })

  // Methods - 直接在组件内部处理系统功能
  const handleLockScreen = () => {
    // 直接调用系统锁屏功能
    systemLockScreen()
  }

  const handleShutdown = () => {
    // 直接调用系统关机功能
    systemShutdown()
  }

  const handleLogout = () => {
    // 直接调用系统退出登录功能
    systemLogout()
    // 可以直接跳转到登录页面或重新加载应用
    window.location.reload()
  }
</script>

<style scoped lang="scss">
  .top-bar {
    height: 28px;
    display: flex;
    flex-direction: row;
    font-size: 14px;
    align-items: center;
    justify-content: center;
    padding: 0px 5px;
    z-index: 100;

    .logo {
      height: 28px;
      color: white;
      align-items: center;
      justify-content: center;
      padding: 0px 16px;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      .iconfont {
        font-size: 16px;
      }

      .el-select {
        position: absolute;
        opacity: 0;
      }
    }

    .logo:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .space {
      flex-grow: 1;
    }

    .menu {
      display: flex;
      flex-direction: row;
      font-size: 13px;
      height: 100%;
      font-weight: 500;

      .item {
        font-size: 13px;
        padding: 0px 15px;
        display: inline-block;
        flex-grow: 1;
        cursor: pointer;
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .item:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    .status {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      height: 100%;

      .audio {
        cursor: pointer;
        padding: 0px 10px;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        position: relative;

        .iconfont {
          font-size: 20px;
        }

        .el-slider {
          position: absolute;
          top: 40px;
          height: 80px;
        }
      }

      .audio:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .datetime {
        cursor: pointer;
        padding: 0px 10px;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        position: relative;

        .el-calendar {
          color: #333;
          background: rgba(255, 255, 255, 0.98);
          position: fixed;
          top: 40px;
          right: 20px;
          width: 500px;
          border-radius: 10px;
        }
      }

      .datetime:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .notification {
        cursor: pointer;
        padding: 0px 10px;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;

        .iconfont {
          font-size: 20px;
        }

        .notification:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
</style>
