import AppModel from "@/model/App";
import { AppConfig } from "@/types/app";

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
    return localStorage.getItem('AcessToken') || "";
  },

  saveAccessToken(access_token: string) {
    localStorage.setItem('AcessToken', access_token);
  },

  isAppInKeepList(app: AppConfig, dockAppList: AppConfig[]) {
    for (let item of dockAppList) {
      if (item.key == app.key) {
        return true;
      }
    }
    return false;
  },

  isAppInOpenList(app: AppConfig, openAppList: AppConfig[]) {
    for (let item of openAppList) {
      if (item.key == app.key) {
        return true;
      }
    }
    return false;
  },

  getAppByKey(key: string) {
    let appList = AppModel.allAppList;
    for (let app of appList) {
      if (app.key == key) {
        return app;
      }
    }
    return false;
  },

  getDeskTopApp() {
    return AppModel.allAppList;
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