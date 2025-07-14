// import AppModel from "@/model/App";
// import tool from "@/helper/tool";
// import eventBus from 'vue3-eventbus';
import { AppState, AppConfig } from "@/types/app";

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
  },
};