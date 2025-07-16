import { ShortcutConfig } from './types'

// 快捷键配置
export const shortcutConfig: ShortcutConfig = {
  // 全局快捷键
  global: {
    // 系统操作
    'cmd+shift+q': 'system:logout',
    'ctrl+cmd+q': 'system:lockScreen',
    'cmd+space': 'system:spotlight',
    'cmd+tab': 'system:appSwitcher',
    'cmd+`': 'system:windowSwitcher',
    
    // 应用程序
    'cmd+shift+a': 'openApp:system_launchpad',
    'cmd+comma': 'openApp:system_setting',
    'alt+cmd+esc': 'openApp:system_task',
    
    // 窗口管理
    'cmd+m': 'window:minimize',
    'cmd+w': 'window:close',
    'cmd+q': 'window:quit',
    'cmd+h': 'window:hide',
    'alt+cmd+h': 'window:hideOthers',
    
    // 编辑操作
    'cmd+z': 'edit:undo',
    'cmd+shift+z': 'edit:redo',
    'cmd+x': 'edit:cut',
    'cmd+c': 'edit:copy',
    'cmd+v': 'edit:paste',
    'cmd+a': 'edit:selectAll',
    
    // 文件操作
    'cmd+n': 'file:new',
    'cmd+o': 'file:open',
    'cmd+s': 'file:save',
    'cmd+shift+s': 'file:saveAs',
    'cmd+p': 'file:print',
    
    // 查找
    'cmd+f': 'search:find',
    'cmd+g': 'search:findNext',
    'cmd+shift+g': 'search:findPrevious',
    
    // 开发者工具
    'cmd+alt+i': 'dev:inspector',
    'cmd+alt+j': 'dev:console',
    'cmd+r': 'dev:refresh',
    'cmd+shift+r': 'dev:hardRefresh',
    
    // 音量控制
    'f10': 'audio:mute',
    'f11': 'audio:volumeDown',
    'f12': 'audio:volumeUp',
    
    // 亮度控制
    'f1': 'display:brightnessDown',
    'f2': 'display:brightnessUp',
    
    // Mission Control
    'f3': 'system:missionControl',
    'f4': 'system:launchpad',
    
    // 截图
    'cmd+shift+3': 'screenshot:fullScreen',
    'cmd+shift+4': 'screenshot:selection',
    'cmd+shift+5': 'screenshot:options',
  },
  
  // 应用程序特定快捷键
  application: {
    // 访达快捷键
    finder: {
      'cmd+shift+n': 'finder:newFolder',
      'cmd+shift+d': 'finder:desktop',
      'cmd+shift+o': 'finder:documents',
      'cmd+shift+a': 'finder:applications',
      'cmd+shift+u': 'finder:utilities',
      'cmd+shift+h': 'finder:home',
      'cmd+shift+i': 'finder:iCloud',
      'cmd+shift+k': 'finder:network',
      'cmd+shift+c': 'finder:computer',
      'cmd+1': 'finder:iconView',
      'cmd+2': 'finder:listView',
      'cmd+3': 'finder:columnView',
      'cmd+4': 'finder:galleryView',
      'cmd+[': 'finder:back',
      'cmd+]': 'finder:forward',
      'cmd+up': 'finder:parentFolder',
      'cmd+down': 'finder:openSelected',
      'space': 'finder:quickLook',
      'cmd+y': 'finder:quickLook',
      'cmd+i': 'finder:getInfo',
      'cmd+d': 'finder:duplicate',
      'cmd+l': 'finder:makeAlias',
      'cmd+r': 'finder:showOriginal',
      'cmd+t': 'finder:addToSidebar',
      'cmd+delete': 'finder:moveToTrash',
      'cmd+shift+delete': 'finder:emptyTrash',
      'cmd+k': 'finder:connectToServer',
      'cmd+shift+g': 'finder:goToFolder',
    },
    
    // 系统偏好设置快捷键
    system_setting: {
      'cmd+f': 'settings:search',
      'cmd+1': 'settings:general',
      'cmd+2': 'settings:desktop',
      'cmd+3': 'settings:dock',
      'cmd+4': 'settings:missionControl',
      'cmd+5': 'settings:language',
      'cmd+6': 'settings:security',
      'cmd+7': 'settings:spotlight',
      'cmd+8': 'settings:privacy',
    },
    
    // 应用商店快捷键
    system_store: {
      'cmd+r': 'store:refresh',
      'cmd+f': 'store:search',
      'cmd+1': 'store:discover',
      'cmd+2': 'store:create',
      'cmd+3': 'store:work',
      'cmd+4': 'store:play',
      'cmd+5': 'store:develop',
      'cmd+6': 'store:categories',
      'cmd+7': 'store:updates',
    },
    
    // 强制退出快捷键
    system_task: {
      'enter': 'task:forceQuit',
      'cmd+r': 'task:refresh',
      'space': 'task:toggle',
    },
  },
}

export default shortcutConfig
