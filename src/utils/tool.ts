import { STORAGE_KEYS } from '@/constants'
import { getAppByKey as getAppByKeyFromConfig, getAllApps, getDockApps } from '@/config/apps/app-registry'
import type { AppConfig } from '@/types/app'

/**
 * 工具函数集合
 * @deprecated 建议使用 useUtils 组合式函数替代
 */
interface Tool {
  getAccessToken(): string;
  saveAccessToken(access_token: string): void;
  isAppInKeepList(app: AppConfig, dockAppList: AppConfig[]): boolean;
  isAppInOpenList(app: AppConfig, openAppList: AppConfig[]): boolean;
  getAppByKey(key: string): AppConfig | false;
  getDeskTopApp(): AppConfig[];
  formatTime(date: string | number | Date, format?: string): string;
}

const tool: Tool = {
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || "";
  },

  saveAccessToken(access_token: string) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
  },

  isAppInKeepList(app: AppConfig, dockAppList: AppConfig[]) {
    return dockAppList.some(item => item.key === app.key);
  },

  isAppInOpenList(app: AppConfig, openAppList: AppConfig[]) {
    return openAppList.some(item => item.key === app.key);
  },

  getAppByKey(key: string) {
    const app = getAppByKeyFromConfig(key);
    return app || false;
  },

  getDeskTopApp() {
    return getAllApps();
  },

  formatTime(date: string | number | Date, format: string = "yyyy-MM-dd") {
    if (!date) return "";
    
    let dateObj: Date;
    switch (typeof date) {
      case "string":
        dateObj = new Date(date.replace(/-/, "/"));
        break;
      case "number":
        dateObj = new Date(date);
        break;
      default:
        dateObj = date;
    }

    const dict: { [key: string]: number } = {
      "yyyy": dateObj.getFullYear(),
      "M": dateObj.getMonth() + 1,
      "d": dateObj.getDate(),
      "H": dateObj.getHours(),
      "m": dateObj.getMinutes(),
      "s": dateObj.getSeconds(),
      "MM": Number(("" + (dateObj.getMonth() + 101)).substr(1)),
      "dd": Number(("" + (dateObj.getDate() + 100)).substr(1)),
      "HH": Number(("" + (dateObj.getHours() + 100)).substr(1)),
      "mm": Number(("" + (dateObj.getMinutes() + 100)).substr(1)),
      "ss": Number(("" + (dateObj.getSeconds() + 100)).substr(1))
    };

    return format.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function(key: string) {
      return dict[key].toString();
    });
  }
};

export default tool;