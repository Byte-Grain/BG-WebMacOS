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
              <div class="full" :class="app.disableResize ? 'full-disabled' : ''" @click="switchMaximize"></div>
            </div>
            <div class="title" :style="{ color: app.titleColor }">
              {{ appData.title || app.title }}
            </div>
          </div>
          <div class="app-body">
            <component 
              :is="getAppComponent(app)" 
              :app="app" 
              @api="appEvent"
              @error="handleComponentError"
            ></component>
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
  import { defineAsyncComponent, reactive, watch, onMounted, computed, ref, markRaw, onUnmounted } from 'vue'
  import { useAppManager } from '@/composables'
  import { enhancedAppRegistry, getAppByKey } from '@core/app-registry/enhanced-app-registry'
  import { useEventBus, EVENTS } from '@/composables'

  // 使用组合式函数
  const { closeApp: closeAppManager, hideApp: hideAppManager, showApp: showAppManager, openApp: openAppManager, openAppWithData, closeAppByPid, openApps } = useAppManager()
  const eventBus = useEventBus()

  // 动态组件映射
  const componentMap = ref({})
  const componentError = ref(null)
  const isRegistryInitialized = ref(false)

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

  // 事件监听器清理函数
  const eventCleanupFunctions = ref([])

  // 初始化
  onMounted(async () => {
    try {
      // 初始化增强的应用注册表
      await enhancedAppRegistry.initialize()
      
      // 获取组件映射 - 使用 markRaw 避免组件被转换为响应式对象
      const rawComponentMap = enhancedAppRegistry.getComponentMap()
      const markedComponentMap = {}
      for (const [key, component] of Object.entries(rawComponentMap)) {
        markedComponentMap[key] = markRaw(component)
      }
      componentMap.value = markedComponentMap
      isRegistryInitialized.value = true
      
      // 调试信息
      console.log('🔧 App.vue - Component map initialized:', {
        appKey: props.app.key,
        appTitle: props.app.title,
        componentMapKeys: Object.keys(componentMap.value),
        appComponent: props.app.component,
        foundComponent: componentMap.value[props.app.key]
      })
      
      // 设置窗口位置
      setReact()
      
      // 设置窗口事件监听器
      setupWindowEventListeners()
    } catch (error) {
      console.error('Failed to initialize app registry:', error)
      componentError.value = error
    }
  })
  
  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    eventCleanupFunctions.value.forEach(cleanup => cleanup())
    eventCleanupFunctions.value = []
  })
  
  // 设置窗口事件监听器
  const setupWindowEventListeners = () => {
    // 监听窗口标题变化事件
    const titleChangeId = eventBus.on('window:title-change', (data) => {
      if (data.appKey === props.app.key || data.pid === props.app.pid) {
        appData.title = data.title
      }
    })
    
    // 监听应用最大化事件
    const maximizeId = eventBus.on(EVENTS.APP_MAXIMIZE, (data) => {
      if (data.appKey === props.app.key || data.pid === props.app.pid) {
        if (!props.app.disableResize) {
          isMaxShowing.value = true
          isFullScreen.value = false
        }
      }
    })
    
    // 监听应用最小化事件
    const minimizeId = eventBus.on(EVENTS.APP_MINIMIZE, (data) => {
      if (data.appKey === props.app.key || data.pid === props.app.pid) {
        hideApp()
      }
    })
    
    // 监听窗口全屏事件
    const fullscreenId = eventBus.on(EVENTS.WINDOW_FULLSCREEN, (data) => {
      if (data.windowId === props.app.key) {
        if (!props.app.disableResize) {
          isFullScreen.value = data.enabled
          if (data.enabled) {
            isMaxShowing.value = false
          }
        }
      }
    })
    
    // 监听窗口调整大小事件
    const resizeId = eventBus.on(EVENTS.WINDOW_RESIZE, (data) => {
      if (data.windowId === props.app.key) {
        if (!props.app.disableResize) {
          isMaxShowing.value = false
          isFullScreen.value = false
          // 这里可以添加具体的窗口大小调整逻辑
        }
      }
    })
    
    // 监听应用移动事件
    const moveId = eventBus.on(EVENTS.APP_MOVE, (data) => {
      if (data.appKey === props.app.key || data.pid === props.app.pid) {
        // 更新窗口位置
        nowRect.left = data.x
        nowRect.right = document.body.clientWidth - data.x - (props.app.width || 600)
        nowRect.top = data.y
        nowRect.bottom = document.body.clientHeight - data.y - (props.app.height || 400)
      }
    })
    
    // 监听应用调整大小事件
    const appResizeId = eventBus.on(EVENTS.APP_RESIZE, (data) => {
      if (data.appKey === props.app.key || data.pid === props.app.pid) {
        if (!props.app.disableResize) {
          // 更新窗口大小
          const centerX = (nowRect.left + document.body.clientWidth - nowRect.right) / 2
          const centerY = (nowRect.top + document.body.clientHeight - nowRect.bottom) / 2
          
          nowRect.left = centerX - data.width / 2
          nowRect.right = centerX - data.width / 2
          nowRect.top = centerY - data.height / 2
          nowRect.bottom = centerY - data.height / 2
        }
      }
    })
    
    // 监听应用焦点事件
    const focusId = eventBus.on(EVENTS.APP_FOCUS, (data) => {
      if (data.appKey === props.app.key || data.pid === props.app.pid) {
        showThisApp()
      }
    })
    
    // 保存清理函数
    eventCleanupFunctions.value.push(
      () => eventBus.off('window:title-change', titleChangeId),
      () => eventBus.off(EVENTS.APP_MAXIMIZE, maximizeId),
      () => eventBus.off(EVENTS.APP_MINIMIZE, minimizeId),
      () => eventBus.off(EVENTS.WINDOW_FULLSCREEN, fullscreenId),
      () => eventBus.off(EVENTS.WINDOW_RESIZE, resizeId),
      () => eventBus.off(EVENTS.APP_MOVE, moveId),
      () => eventBus.off(EVENTS.APP_RESIZE, appResizeId),
      () => eventBus.off(EVENTS.APP_FOCUS, focusId)
    )
  }

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
    if (openApps.value.length > 0 && openApps.value[openApps.value.length - 1].pid == props.app.pid) {
      str += 'isTop '
    }
    return str
  })

  // 监听器
  watch(() => props.app, () => {
    Object.assign(appData, { title: appData.title }, props.app)
  })

  // 方法
  const getAppComponent = (app) => {
    if (!isRegistryInitialized.value) {
      return null
    }
    
    const componentKey = app.key // 使用 app.key 作为组件映射的键
    const component = componentMap.value[componentKey]
    
    if (!component) {
      console.warn(`Component not found for app: ${app.key}`, {
        availableComponents: Object.keys(componentMap.value),
        requestedKey: componentKey
      })
      return null
    }
    
    return component
  }

  const handleComponentError = (error) => {
    console.error('Component error:', error)
    componentError.value = error
  }

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
        isMaxShowing.value = false
        break
      case 'windowMinSize':
        hideApp()
        break
      case 'windowClose':
        closeApp()
        break
      case 'openApp':
        if (e.data && e.app) {
          const app = getAppByKey(e.app)
          if (app) {
            openAppWithData(app, e.data)
          }
        } else {
          const app = getAppByKey(e.app)
          if (app) {
            openAppManager(app)
          }
        }
        break
      case 'closeApp':
        if (e.pid) {
          closeAppByPid(e.pid)
        }
        if (e.app) {
          const app = getAppByKey(e.app)
          if (app) {
            closeAppManager(app)
          }
        }
        break
      case 'setWindowTitle':
        appData.title = e.title || props.app.title
        break
      default:
    }
  }

  const closeApp = () => {
    closeAppManager(props.app)
  }

  const hideApp = () => {
    hideAppManager(props.app)
  }

  const showThisApp = () => {
    showAppManager(props.app)
  }

  const switchFullScreen = () => {
    if (props.app.disableResize) {
      return
    }
    isFullScreen.value = !isFullScreen.value
    if (isFullScreen.value) {
      isMaxShowing.value = false
    } else {
      isMaxShowing.value = false
    }
  }

  const switchMaximize = () => {
    if (props.app.disableResize) {
      return
    }
    isMaxShowing.value = !isMaxShowing.value
    if (!isMaxShowing.value) {
      isFullScreen.value = false
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
