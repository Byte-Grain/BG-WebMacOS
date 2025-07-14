export interface AppMenu {
  key?: string;
  title?: string;
  sub?: AppMenu[];
  isLine?: boolean;
}

export interface AppConfig {
  key: string;
  component: string;
  icon: string;
  title: string;
  iconColor: string;
  iconBgColor: string;
  width: number;
  height: number;
  disableResize?: boolean;
  hideInDesktop?: boolean;
  keepInDock?: boolean;
  hideWhenClose?: boolean;
  menu?: AppMenu[];
  pid?: number;
  hide?: boolean;
}

export interface AppState {
  showLogin: boolean;
  nowApp: AppConfig | false;
  openAppList: AppConfig[];
  dockAppList: AppConfig[];
  openWidgetList: any[];
  volumn: number;
  launchpad: boolean;
}

export interface AppMutations {
  setVolumn(state: AppState, volumn: number): void;
  logout(state: AppState): void;
  login(state: AppState): void;
  openTheLastApp(state: AppState): void;
  hideApp(state: AppState, app: AppConfig): void;
  closeWithPid(state: AppState, pid: number): void;
  closeApp(state: AppState, app: AppConfig): void;
}