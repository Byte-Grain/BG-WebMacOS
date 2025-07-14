// import AppModel from "@/model/App";
// import tool from "@/helper/tool";
// import eventBus from 'vue3-eventbus';
import { AppState, AppConfig } from "@/types/app";
import AppModel from "@/model/App";

export default {
  state(): AppState {
    return {
      showLogin: false,
      nowApp: false,
      openAppList: [],
      dockAppList: [],
      openWidgetList: [],
      volumn: 80,
      launchpad: false,
    };
  },
  mutations: {
    setVolumn(state: AppState, volumn: number): void {
      state.volumn = volumn;
    },

    logout(state: AppState): void {
      state.nowApp = false;
      state.openAppList = [];
      state.showLogin = true;
    },

    login(state: AppState): void {
      state.showLogin = false;
    },

    openTheLastApp(state: AppState): void {
      for (let i = state.openAppList.length - 1; i >= 0; i--) {
        if (!state.openAppList[i].hide) {
          state.nowApp = state.openAppList[i];
          break;
        }
      }
    },

    hideApp(state: AppState, app: AppConfig): void {
      const targetApp = state.openAppList.find(item => item.pid === app.pid);
      if (targetApp) {
        targetApp.hide = true;
      }
      // Find and show the last non-hidden app
      for (let i = state.openAppList.length - 1; i >= 0; i--) {
        if (!state.openAppList[i].hide) {
          state.nowApp = state.openAppList[i];
          break;
        }
      }
    },

    closeWithPid(state: AppState, pid: number): void {
      const openIndex = state.openAppList.findIndex(item => item.pid === pid);
      if (openIndex !== -1) {
        state.openAppList.splice(openIndex, 1);
      }
      const dockIndex = state.dockAppList.findIndex(item => item.pid === pid && !item.keepInDock);
      if (dockIndex !== -1) {
        state.dockAppList.splice(dockIndex, 1);
      }
    },

    closeApp(state: AppState, app: AppConfig): void {
      if (app.hideWhenClose) {
        // Hide the app instead of closing it
        const targetApp = state.openAppList.find(item => item.pid === app.pid);
        if (targetApp) {
          targetApp.hide = true;
        }
        // Find and show the last non-hidden app
        for (let i = state.openAppList.length - 1; i >= 0; i--) {
          if (!state.openAppList[i].hide) {
            state.nowApp = state.openAppList[i];
            break;
          }
        }
      } else {
        const openIndex = state.openAppList.findIndex(item => 
          app.pid ? item.pid === app.pid : item.key === app.key
        );
        if (openIndex !== -1) {
          state.openAppList.splice(openIndex, 1);
        }
        if (!app.keepInDock) {
          const dockIndex = state.dockAppList.findIndex(item => 
            app.pid ? item.pid === app.pid : item.key === app.key
          );
          if (dockIndex !== -1) {
            state.dockAppList.splice(dockIndex, 1);
          }
        }
      }
      // Find and show the last non-hidden app
      for (let i = state.openAppList.length - 1; i >= 0; i--) {
        if (!state.openAppList[i].hide) {
          state.nowApp = state.openAppList[i];
          break;
        }
      }
    },

    getDockAppList(state: AppState): void {
      // Initialize dock app list with apps that have keepInDock: true
      state.dockAppList = AppModel.allAppList.filter(app => app.keepInDock);
    },

    openApp(state: AppState, app: AppConfig): void {
      // Check if app is already open
      const existingApp = state.openAppList.find(item => item.key === app.key);
      if (existingApp) {
        // If app is hidden, show it
        if (existingApp.hide) {
          existingApp.hide = false;
        }
        state.nowApp = existingApp;
        return;
      }

      // Create new app instance with unique pid
      const newApp = {
        ...app,
        pid: Date.now() + Math.random(),
        hide: false
      };

      // Add to open app list
      state.openAppList.push(newApp);
      state.nowApp = newApp;

      // Add to dock if not already there and not keepInDock
      if (!app.keepInDock && !state.dockAppList.find(item => item.key === app.key)) {
        state.dockAppList.push(newApp);
      }
    },

    openAppByKey(state: AppState, key: string): void {
      const app = AppModel.allAppList.find(item => item.key === key);
      if (app) {
        // Use openApp mutation to handle the opening logic
        const existingApp = state.openAppList.find(item => item.key === app.key);
        if (existingApp) {
          if (existingApp.hide) {
            existingApp.hide = false;
          }
          state.nowApp = existingApp;
          return;
        }

        const newApp = {
          ...app,
          pid: Date.now() + Math.random(),
          hide: false
        };

        state.openAppList.push(newApp);
        state.nowApp = newApp;

        if (!app.keepInDock && !state.dockAppList.find(item => item.key === app.key)) {
          state.dockAppList.push(newApp);
        }
      }
     },

    showApp(state: AppState, app: AppConfig): void {
      // Find the app in openAppList and show it
      const targetApp = state.openAppList.find(item => item.pid === app.pid);
      if (targetApp) {
        targetApp.hide = false;
        state.nowApp = targetApp;
      }
    },

    openMenu(state: AppState, menuKey: string): void {
      // Handle menu operations - this could be extended based on specific menu actions
      // For now, we'll just log the menu key or handle basic menu operations
      console.log('Menu opened:', menuKey);
      // Add specific menu handling logic here if needed
    },
  },
};