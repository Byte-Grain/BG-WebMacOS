import { MenuConfig } from './types'

// 菜单配置
export const menuConfig: MenuConfig = {
  // 苹果菜单（左上角苹果图标）
  appleMenu: [
    {
      key: 'about',
      title: '关于本站',
      action: 'openApp:system_about',
    },
    {
      isLine: true,
      key: 'line1',
      title: '',
    },
    {
      key: 'settings',
      title: '系统偏好设置...',
      action: 'openApp:system_setting',
      shortcut: '⌘,',
    },
    {
      key: 'store',
      title: 'App Store...',
      action: 'openApp:system_store',
    },
    {
      isLine: true,
      key: 'line2',
      title: '',
    },
    {
      key: 'force_quit',
      title: '强制退出...',
      action: 'openApp:system_task',
      shortcut: '⌥⌘⎋',
    },
    {
      isLine: true,
      key: 'line3',
      title: '',
    },
    {
      key: 'shutdown',
      title: '关机...',
      action: 'system:shutdown',
    },
    {
      isLine: true,
      key: 'line4',
      title: '',
    },
    {
      key: 'lock_screen',
      title: '锁定屏幕',
      action: 'system:lockScreen',
      shortcut: '⌃⌘Q',
    },
    {
      key: 'logout',
      title: '退出登录...',
      action: 'system:logout',
      shortcut: '⇧⌘Q',
    },
  ],

  // 应用程序菜单
  applicationMenus: {
    finder: [
      {
        key: 'finder',
        title: '访达',
        sub: [
          {
            key: 'about_finder',
            title: '关于访达',
            action: 'app:about',
          },
          {
            isLine: true,
            key: 'line1',
            title: '',
          },
          {
            key: 'preferences',
            title: '偏好设置...',
            action: 'app:preferences',
            shortcut: '⌘,',
          },
          {
            isLine: true,
            key: 'line2',
            title: '',
          },
          {
            key: 'empty_trash',
            title: '清倒废纸篓...',
            action: 'finder:emptyTrash',
          },
        ],
      },
      {
        key: 'file',
        title: '文件',
        sub: [
          {
            key: 'new_finder_window',
            title: '新建访达窗口',
            action: 'finder:newWindow',
            shortcut: '⌘N',
          },
          {
            key: 'new_folder',
            title: '新建文件夹',
            action: 'finder:newFolder',
            shortcut: '⇧⌘N',
          },
          {
            isLine: true,
            key: 'line1',
            title: '',
          },
          {
            key: 'add_to_sidebar',
            title: '添加到边栏',
            action: 'finder:addToSidebar',
          },
        ],
      },
      {
        key: 'edit',
        title: '编辑',
        sub: [
          {
            key: 'undo',
            title: '撤销',
            action: 'edit:undo',
            shortcut: '⌘Z',
          },
          {
            key: 'redo',
            title: '重做',
            action: 'edit:redo',
            shortcut: '⇧⌘Z',
          },
          {
            isLine: true,
            key: 'line1',
            title: '',
          },
          {
            key: 'cut',
            title: '剪切',
            action: 'edit:cut',
            shortcut: '⌘X',
          },
          {
            key: 'copy',
            title: '拷贝',
            action: 'edit:copy',
            shortcut: '⌘C',
          },
          {
            key: 'paste',
            title: '粘贴',
            action: 'edit:paste',
            shortcut: '⌘V',
          },
        ],
      },
      {
        key: 'view',
        title: '显示',
        sub: [
          {
            key: 'as_icons',
            title: '作为图标',
            action: 'view:asIcons',
            shortcut: '⌘1',
          },
          {
            key: 'as_list',
            title: '作为列表',
            action: 'view:asList',
            shortcut: '⌘2',
          },
          {
            key: 'as_columns',
            title: '作为分栏',
            action: 'view:asColumns',
            shortcut: '⌘3',
          },
        ],
      },
      {
        key: 'go',
        title: '前往',
        sub: [
          {
            key: 'back',
            title: '后退',
            action: 'navigation:back',
            shortcut: '⌘[',
          },
          {
            key: 'forward',
            title: '前进',
            action: 'navigation:forward',
            shortcut: '⌘]',
          },
          {
            isLine: true,
            key: 'line1',
            title: '',
          },
          {
            key: 'applications',
            title: '应用程序',
            action: 'go:applications',
            shortcut: '⇧⌘A',
          },
          {
            key: 'desktop',
            title: '桌面',
            action: 'go:desktop',
            shortcut: '⇧⌘D',
          },
          {
            key: 'documents',
            title: '文稿',
            action: 'go:documents',
            shortcut: '⇧⌘O',
          },
          {
            key: 'downloads',
            title: '下载',
            action: 'go:downloads',
            shortcut: '⌥⌘L',
          },
        ],
      },
      {
        key: 'window',
        title: '窗口',
        sub: [
          {
            key: 'minimize',
            title: '最小化',
            action: 'window:minimize',
            shortcut: '⌘M',
          },
          {
            key: 'zoom',
            title: '缩放',
            action: 'window:zoom',
          },
          {
            isLine: true,
            key: 'line1',
            title: '',
          },
          {
            key: 'bring_all_to_front',
            title: '前置全部窗口',
            action: 'window:bringAllToFront',
          },
        ],
      },
      {
        key: 'help',
        title: '帮助',
        sub: [
          {
            key: 'macos_help',
            title: 'macOS 帮助',
            action: 'help:macosHelp',
          },
          {
            isLine: true,
            key: 'line1',
            title: '',
          },
          {
            key: 'keyboard_shortcuts',
            title: '键盘快捷键',
            action: 'help:keyboardShortcuts',
          },
        ],
      },
    ],
  },

  // 右键菜单
  contextMenu: [
    {
      key: 'lock_screen',
      title: '锁定屏幕...',
      action: 'system:lockScreen',
      icon: 'icon-lock',
    },
    {
      isLine: true,
      key: 'line1',
      title: '',
    },
    {
      key: 'settings',
      title: '系统偏好设置...',
      action: 'openApp:system_setting',
      icon: 'icon-setting',
    },
    {
      key: 'force_quit',
      title: '强制退出应用程序...',
      action: 'openApp:system_task',
      icon: 'icon-task',
    },
    {
      isLine: true,
      key: 'line2',
      title: '',
    },
    {
      key: 'set_wallpaper',
      title: '更改桌面背景...',
      action: 'desktop:setWallpaper',
      icon: 'icon-image',
    },
    {
      key: 'about',
      title: '关于我们',
      action: 'openApp:system_about',
      icon: 'icon-info',
    },
  ],
}

export default menuConfig