<template>
  <div class="desktop">
    <div class="top">
      <TopBar></TopBar>
      <div class="space"></div>
      <div class="status">
        <div class="audio">
          <i class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-39" @click="showOrHideVolumn"></i>

          <transition name="fade">
            <el-slider v-show="isVolumnShow" v-model="volumn" :show-tooltip="false" vertical></el-slider>
          </transition>
        </div>
        <div class="datetime" @click.self="showOrHideCalendar">
          {{ timeString }}
          <transition name="fade">
            <el-calendar v-model="nowDate" v-if="isCalendarShow"></el-calendar>
          </transition>
        </div>
        <div class="notification">
          <i class="iconfont icon-changyongtubiao-xianxingdaochu-zhuanqu-25" @click="showOrHideWidget"></i>
        </div>
      </div>
    </div>
    <div class="body" @contextmenu.prevent.self="
      hideAllController();
    openMenu($event);
    " @click.stop="hideAllController()">
      <div class="desktop-app">
        <template v-for="item in deskTopAppList" :key="item.key">
          <div class="app-item" v-on:dblclick="openAppByKey(item.key)" v-if="!item.hideInDesktop">
            <div class="icon">
              <i :style="{
                backgroundColor: item.iconBgColor,
                color: item.iconColor,
              }" class="iconfont" :class="item.icon"></i>
            </div>
            <div class="title">{{ item.title }}</div>
          </div>
        </template>
      </div>
      <transition-group name="fade-window">
        <template v-for="item in openApps" :key="item.pid">
          <App v-if="!item.outLink" v-show="!item.hide" :app="item" :key="item.pid"></App>
        </template>
      </transition-group>
      <transition name="fade-menu">
        <div v-show="rightMenuVisible" :style="{ left: rightMenuLeft + 'px', top: rightMenuTop + 'px' }"
          class="contextmenu">
          <div @click="lockScreen">{{ $t('system.lockScreen') }}...</div>
          <hr />
          <div @click="openAppByKey('system_setting')">{{ $t('system.settings') }}...</div>
          <div @click="openAppByKey('system_task')">{{ $t('system.forceQuit') }}...</div>
          <hr />
          <div @click="$message.warning($t('system.comingSoon'))">{{ $t('system.setWallpaper') }}...</div>
          <div @click="openAppByKey('system_about')">{{ $t('system.aboutUs') }}</div>
        </div>
      </transition>
      <transition-group name="fade-widget">
        <div v-show="isWidgetShow" key="widget-container">
        </div>
      </transition-group>
    </div>
    <Dock></Dock>
  </div>
</template>
<script setup>
  import { ref, watch, onMounted, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useAppManager, useSystem, useUtils } from '@/composables'
  import { getDesktopApps } from '@/config/apps/app-registry'

  const $message = ElMessage
  const emit = defineEmits(['launchpad', 'lockScreen', 'shutdown', 'logout'])

  // 使用组合式函数
  const { openAppByKey, currentMenu, openApps } = useAppManager()
  const { volume, setVolume, logout: systemLogout } = useSystem()
  const { date, storage } = useUtils()

  // 响应式数据
  const isCalendarShow = ref(false)
  const nowDate = ref(new Date())
  const volumnDelayTimer = ref(null)
  const volumn = ref(volume.value)
  const isVolumnShow = ref(false)
  const rightMenuVisible = ref(false)
  const rightMenuLeft = ref(0)
  const rightMenuTop = ref(0)
  const userName = ref('')
  const timeString = ref('')
  const isWidgetShow = ref(false)
  const isTestPageShow = ref(false)

  const deskTopAppList = computed(() => getDesktopApps())

  // 监听器
  watch(volumn, (newValue) => {
    setVolume(newValue)
    clearTimeout(volumnDelayTimer.value)
    volumnDelayTimer.value = setTimeout(() => {
      isVolumnShow.value = false
    }, 3000)
  })

  // 同步音量值
  watch(volume, (newValue) => {
    volumn.value = newValue
  })

  // 方法
  const showOrHideCalendar = () => {
    isCalendarShow.value = !isCalendarShow.value
  }

  const showOrHideVolumn = () => {
    isVolumnShow.value = !isVolumnShow.value
    if (isVolumnShow.value) {
      clearTimeout(volumnDelayTimer.value)
      volumnDelayTimer.value = setTimeout(() => {
        isVolumnShow.value = false
      }, 3000)
    }
  }

  const hideAllController = () => {
    isVolumnShow.value = false
    rightMenuVisible.value = false
    isCalendarShow.value = false
  }

  const openMenu = (e) => {
    const menuMinWidth = 105
    const offsetLeft = e.currentTarget.getBoundingClientRect().left
    const offsetWidth = e.currentTarget.offsetWidth
    const maxLeft = offsetWidth - menuMinWidth
    const left = e.clientX - offsetLeft

    if (left > maxLeft) {
      rightMenuLeft.value = maxLeft
    } else {
      rightMenuLeft.value = left
    }

    rightMenuTop.value = e.clientY - 30
    rightMenuVisible.value = true
  }

  const startTimer = () => {
    setInterval(() => {
      timeString.value = date.format(new Date(), 'MM-dd HH:mm')
    }, 1000)
  }

  const lockScreen = () => {
    emit('lockScreen')
  }

  const shutdown = () => {
    emit('shutdown')
  }

  const logout = () => {
    systemLogout()
    emit('logout')
  }

  const showOrHideWidget = () => {
    isWidgetShow.value = !isWidgetShow.value
  }

  // 生命周期
  onMounted(() => {
    userName.value = storage.get('user_name', '') || ''
    startTimer()
  })
</script>
<style scoped lang="scss">
  .desktop {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    color: white;
    overflow: hidden;
    text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);

    .top {
      height: 28px;
      background-color: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: row;
      font-size: 14px;
      align-items: center;
      justify-content: center;
      padding: 0px 5px;
      z-index: 100;

      .space {
        flex-grow: 1;
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

    .body {
      flex-grow: 1;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      position: relative;

      .desktop-app {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-end;
        padding: 20px;
        flex-wrap: wrap-reverse;

        .app-item {
          padding: 10px 0px;
          flex-direction: column;
          text-align: center;
          text-shadow: 0px 0px 2px rgb(0 0 0 / 50%);
          cursor: pointer;
          border-radius: 10px;
          border: 2px solid transparent;
          justify-content: center;
          align-items: center;
          width: 80px;

          .icon {
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
          }

          .iconfont {
            font-size: 28px;
            border-radius: 10px;
            padding: 8px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .title {
            font-size: 12px;
            margin-top: 5px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }

        .app-item:hover {
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
      }

      .contextmenu {
        position: absolute;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 5px;
        box-shadow: 0px 0px 10px rgb(0 0 0 / 30%);
        color: #333;
        font-size: 14px;
        text-align: left;
        width: 200px;
        overflow: hidden;
        padding: 2px 0px;
        text-shadow: none;
        z-index: 100;

        hr {
          border: none;
          border-top: 1px solid #ddd;
        }

        div {
          cursor: pointer;
          font-size: 13px !important;
          color: #333;
          border-radius: 5px;
          line-height: 2;
          padding: 0px 12px;
          display: flex;
          align-items: center;
          margin: 3px 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        div:hover {
          background: #4b9efb;
          color: white;
          border-radius: 5px;
        }
      }
    }

    .footer {
      display: flex;
      z-index: 100;
    }
  }
</style>
