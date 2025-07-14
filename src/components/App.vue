<template>
  <div class="moveBg" @mousemove="mouseMove" @mouseup="mouseUp" @mouseleave.stop="mouseLeave" :style="{
    pointerEvents: isBoxResizing || isBoxMoving ? 'auto' : 'none',
    zIndex: isFullScreen ? 999 : app.isTop ? 98 : 88,
  }">
    <div class="box" :style="{
      left: nowRect.left + 'px',
      top: nowRect.top + 'px',
      bottom: nowRect.bottom + 'px',
      right: nowRect.right + 'px',
    }" :class="getExtBoxClasses">
      <div class="box-top">
        <div class="box-top-left" @mousedown="resizeMouseDown"></div>
        <div class="box-top-center" @mousedown="resizeMouseDown"></div>
        <div class="box-top-right" @mousedown="resizeMouseDown"></div>
      </div>
      <div class="box-center">
        <div class="box-center-left" @mousedown="resizeMouseDown"></div>
        <div class="box-center-center loader" @mousedown.stop="showThisApp">
          <div class="app-bar" :style="{ backgroundColor: app.titleBgColor }" @mousedown.stop="positionMouseDown"
            v-on:dblclick="appBarDoubleClicked">
            <div class="controll">
              <div class="close" @click.stop="closeApp"></div>
              <div class="min" @click.stop="hideApp"></div>
              <div class="full" :class="app.disableResize ? 'full-disabled' : ''" @click="switchFullScreen"></div>
            </div>
            <div class="title" :style="{ color: app.titleColor }">
              {{ appData.title || app.title }}
            </div>
          </div>
          <div class="app-body">
            <component :is="componentMap[app.component]" :app="app" @api="appEvent"></component>
          </div>
        </div>
        <div class="box-center-right" @mousedown="resizeMouseDown"></div>
      </div>
      <div class="box-bottom">
        <div class="box-bottom-left" @mousedown="resizeMouseDown"></div>
        <div class="box-bottom-center" @mousedown="resizeMouseDown"></div>
        <div class="box-bottom-right" @mousedown="resizeMouseDown"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineAsyncComponent, reactive, watch, onMounted, computed, ref, getCurrentInstance } from 'vue'
  import tool from '../helper/tool'

  const { proxy } = getCurrentInstance()
  const $store = proxy.$store

  // 组件注册
  const SystemAbout = defineAsyncComponent(() => import('@/view/system/about.vue'))
  const SystemFinder = defineAsyncComponent(() => import('@/view/system/finder.vue'))
  const SystemSetting = defineAsyncComponent(() => import('@/view/system/setting.vue'))
  const SystemStore = defineAsyncComponent(() => import('@/view/system/store.vue'))
  const SystemTask = defineAsyncComponent(() => import('@/view/system/task.vue'))
  const Demo = defineAsyncComponent(() => import('@/view/demo/demo.vue'))
  const DemoDock = defineAsyncComponent(() => import('@/view/demo/dock.vue'))
  const DemoUnResize = defineAsyncComponent(() => import('@/view/demo/unresize.vue'))
  const DemoUnClose = defineAsyncComponent(() => import('@/view/demo/unclose.vue'))
  const DemoHideDesktop = defineAsyncComponent(() => import('@/view/demo/hidedesktop.vue'))
  const DemoColorFull = defineAsyncComponent(() => import('@/view/demo/colorfull.vue'))
  const DemoCamera = defineAsyncComponent(() => import('@/view/demo/camera.vue'))
  const DemoMultiTask = defineAsyncComponent(() => import('@/view/demo/multitask.vue'))
  const DemoWeb = defineAsyncComponent(() => import('@/view/demo/web.vue'))

  // 组件映射对象
  const componentMap = {
    SystemAbout,
    SystemFinder,
    SystemSetting,
    SystemStore,
    SystemTask,
    Demo,
    DemoDock,
    DemoUnResize,
    DemoUnClose,
    DemoHideDesktop,
    DemoColorFull,
    DemoCamera,
    DemoMultiTask,
    DemoWeb
  }

  // Props
  const props = defineProps({
    app: Object
  })

  // 响应式数据
  const appData = reactive({
    title: ''
  })

  const defaultIndex = ref(10)
  const activeIndex = ref(20)
  const isBoxMoving = ref(false)
  const startPosition = reactive({ x: 0, y: 0 })
  const nowRect = reactive({
    left: 100,
    right: 100,
    top: 100,
    bottom: 100
  })
  const startRect = reactive({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  })
  const isBoxResizing = ref(false)
  const moveDirection = ref(false)
  const isMaxShowing = ref(false)
  const isFullScreen = ref(false)

  // 计算属性
  const getExtBoxClasses = computed(() => {
    let str = ''
    if (!isBoxResizing.value && !isBoxMoving.value) {
      str += 'box-animation '
    }
    if (isMaxShowing.value) {
      str += 'isMaxShowing '
    }
    if (isFullScreen.value) {
      str += 'isFullScreen '
    }
    if (props.app.disableResize) {
      str += 'resize-disabled '
    }
    if ($store.state.openAppList[$store.state.openAppList.length - 1].pid == props.app.pid) {
      str += 'isTop '
    }
    return str
  })

  // 监听器
  watch(() => props.app, () => {
    Object.assign(appData, { title: appData.title }, props.app)
  })

  // 方法
  const setReact = () => {
    if (props.app.width) {
      nowRect.left = nowRect.right = (document.body.clientWidth - props.app.width) / 2
    }
    if (props.app.height) {
      nowRect.bottom = (document.body.clientHeight - props.app.height) / 2
      nowRect.top = (document.body.clientHeight - props.app.height) / 2
    }
  }

  const appEvent = (e) => {
    switch (e.event) {
      case 'windowMaxSize':
        if (props.app.disableResize) {
          return
        }
        isMaxShowing.value = true
        isFullScreen.value = false
        break
      case 'windowNormalSize':
        if (props.app.disableResize) {
          return
        }
        isMaxShowing.value = false
        isFullScreen.value = false
        break
      case 'windowFullSize':
        if (props.app.disableResize) {
          return
        }
        isFullScreen.value = true
        isMaxShowing.value = true
        break
      case 'windowMinSize':
        hideApp()
        break
      case 'windowClose':
        closeApp()
        break
      case 'openApp':
        if (e.data && e.app) {
          $store.commit('openWithData', {
            app: tool.getAppByKey(e.app),
            data: e.data
          })
        } else {
          $store.commit('openApp', tool.getAppByKey(e.app))
        }
        break
      case 'closeApp':
        if (e.pid) {
          $store.commit('closeWithPid', e.pid)
        }
        if (e.app) {
          $store.commit('closeApp', tool.getAppByKey(e.app))
        }
        break
      case 'setWindowTitle':
        appData.title = e.title || props.app.title
        break
      default:
    }
  }

  const closeApp = () => {
    $store.commit('closeApp', props.app)
  }

  const hideApp = () => {
    $store.commit('hideApp', props.app)
  }

  const showThisApp = () => {
    $store.commit('showApp', props.app)
  }

  const switchFullScreen = () => {
    if (props.app.disableResize) {
      return
    }
    isFullScreen.value = !isFullScreen.value
    if (isFullScreen.value) {
      isMaxShowing.value = true
    } else {
      isMaxShowing.value = false
    }
  }

  const appBarDoubleClicked = () => {
    if (props.app.disableResize) {
      return
    }
    isMaxShowing.value = !isMaxShowing.value
    if (!isMaxShowing.value) {
      isFullScreen.value = false
    }
  }

  const positionMouseDown = (e) => {
    showThisApp()
    if (isFullScreen.value || isMaxShowing.value) {
      return
    }
    Object.assign(startRect, {
      left: nowRect.left,
      right: nowRect.right,
      top: nowRect.top,
      bottom: nowRect.bottom
    })
    startPosition.x = e.clientX
    startPosition.y = e.clientY
    isBoxMoving.value = true
  }

  const mouseUp = () => {
    isBoxMoving.value = false
    isBoxResizing.value = false
    moveDirection.value = false
  }

  const mouseLeave = () => {
    isBoxMoving.value = false
    isBoxResizing.value = false
    moveDirection.value = false
  }

  const mouseMove = (e) => {
    if (isBoxResizing.value) {
      isFullScreen.value = false
      isMaxShowing.value = false
      switch (moveDirection.value) {
        case 'box-top-left':
          nowRect.top = startRect.top + (e.clientY - startPosition.y)
          nowRect.left = startRect.left + (e.clientX - startPosition.x)
          break
        case 'box-top-center':
          nowRect.top = startRect.top + (e.clientY - startPosition.y)
          break
        case 'box-top-right':
          nowRect.top = startRect.top + (e.clientY - startPosition.y)
          nowRect.right = startRect.right - (e.clientX - startPosition.x)
          break
        case 'box-center-left':
          nowRect.left = startRect.left + (e.clientX - startPosition.x)
          break
        case 'box-bottom-left':
          nowRect.left = startRect.left + (e.clientX - startPosition.x)
          nowRect.bottom = startRect.bottom - (e.clientY - startPosition.y)
          break
        case 'box-bottom-center':
          nowRect.bottom = startRect.bottom - (e.clientY - startPosition.y)
          break
        case 'box-center-right':
          nowRect.right = startRect.right - (e.clientX - startPosition.x)
          break
        case 'box-bottom-right':
          nowRect.right = startRect.right - (e.clientX - startPosition.x)
          nowRect.bottom = startRect.bottom - (e.clientY - startPosition.y)
          break
        default:
      }
      return
    }
    if (isBoxMoving.value) {
      isFullScreen.value = false
      isMaxShowing.value = false
      nowRect.left = startRect.left + (e.clientX - startPosition.x)
      nowRect.right = startRect.right - (e.clientX - startPosition.x)
      nowRect.top = startRect.top + (e.clientY - startPosition.y)
      nowRect.bottom = startRect.bottom - (e.clientY - startPosition.y)
      return
    }
  }

  const resizeMouseDown = (e) => {
    if (props.app.disableResize) {
      return
    }
    showThisApp()
    if (isFullScreen.value || isMaxShowing.value) {
      return
    }
    Object.assign(startRect, {
      left: nowRect.left,
      top: nowRect.top,
      right: nowRect.right,
      bottom: nowRect.bottom
    })
    startPosition.x = e.clientX
    startPosition.y = e.clientY
    isBoxResizing.value = true
    moveDirection.value = e.target.className
  }

  // 在 script setup 中，导入的组件会自动注册

  // 生命周期
  onMounted(() => {
    Object.assign(appData, props.app)
    setReact()
  })
</script>
<style scoped lang="scss">
  .moveBg {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .isTop {
      .box-center-center {
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5) !important;
        filter: none !important;
      }
    }

    .isMaxShowing {
      left: -5px !important;
      right: -5px !important;
      top: 23px !important;
      bottom: 41px !important;
    }

    .isFullScreen {
      position: fixed !important;
      z-index: 999 !important;
      bottom: -5px !important;
      top: -5px !important;
    }

    .isMaxShowing .box-center-center,
    .isFullScreen .box-center-center {
      border-radius: 0px !important;
    }

    .box-animation {
      transition: width 0.1s, height 0.1s, left 0.1s, right 0.1s, top 0.1s,
        bottom 0.1s;
    }

    .resize-disabled {

      .box-top,
      .box-top-left,
      .box-top-center,
      .box-top-right,
      .box-left,
      .box-center-left,
      .box-center-right,
      .box-right,
      .box-bottom,
      .box-bottom-left,
      .box-bottom-center,
      .box-bottom-right {
        cursor: default !important;
      }
    }

    .box {
      --resize: 5px;
      --resize-bg: transparent;
      --resize-main: transparent;
      --resize-bg-main: transparent;
    }

    .box {
      display: flex;
      flex-direction: column;
      position: absolute;
      pointer-events: auto;

      .box-top {
        display: flex;
        flex-direction: row;

        .box-top-left {
          width: var(--resize);
          height: var(--resize);
          background: var(--resize-bg);
          cursor: nw-resize;
        }

        .box-top-center {
          height: var(--resize);
          background: var(--resize-bg-main);
          cursor: n-resize;
          flex-grow: 1;
        }

        .box-top-right {
          width: var(--resize);
          height: var(--resize);
          background: var(--resize-bg);
          cursor: ne-resize;
        }
      }

      .box-center {
        display: flex;
        flex-direction: row;
        flex-grow: 1;

        .loader {
          display: flex;
          flex-grow: 1;
          flex-direction: column;
          width: 100%;
        }

        .box-center-left {
          width: var(--resize);
          height: 100%;
          background: var(--resize-bg-main);
          cursor: w-resize;
        }

        .box-center-center {
          height: 100%;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          border-radius: 10px;
          box-shadow: 0px 0px 3px #999;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          overflow: hidden;
          filter: grayscale(1) brightness(0.9);

          .app-bar {
            height: 40px;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(20px);
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;

            .title {
              flex-grow: 1;
              text-align: center;
              margin-right: 84px;
              font-weight: 500;
              text-shadow: none;
              font-size: 13px;
              cursor: move;
              color: #333;
            }

            .controll {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-left: 15px;

              div {
                border-radius: 100%;
                height: 14px;
                width: 14px;
                margin-right: 8px;
                cursor: pointer;
              }

              .close {
                background: #fc605c;
              }

              .close:hover {
                background: #cc2c26;
              }

              .min {
                background: #fcbb40;
              }

              .min:hover {
                background: #c28719;
              }

              .full {
                background: #34c648;
              }

              .full:hover {
                background: #1f942e;
              }

              .full-disabled {
                background: #ccc !important;
              }
            }
          }

          .app-body {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 0;
          }
        }

        .box-center-right {
          width: var(--resize);
          height: 100%;
          background: var(--resize-bg-main);
          cursor: e-resize;
        }
      }

      .box-bottom {
        display: flex;
        flex-direction: row;

        .box-bottom-left {
          width: var(--resize);
          height: var(--resize);
          background: var(--resize-bg);
          cursor: sw-resize;
        }

        .box-bottom-center {
          height: var(--resize);
          background: var(--resize-bg-main);
          cursor: s-resize;
          flex-grow: 1;
        }

        .box-bottom-right {
          width: var(--resize);
          height: var(--resize);
          background: var(--resize-bg);
          cursor: se-resize;
        }
      }
    }
  }
</style>
