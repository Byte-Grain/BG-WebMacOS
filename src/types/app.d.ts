export interface AppMenu {
  key?: string;
  title?: string;
  sub?: AppMenu[];
  isLine?: boolean;
}

export interface AppConfig {
  key: string;
  component?: string;
  componentPath?: string;        // 组件路径（用于动态加载）
  icon: string;
  title: string;
  iconColor: string;
  iconBgColor: string;
  width?: number;
  height?: number;
  disableResize?: boolean;
  hideInDesktop?: boolean;
  keepInDock?: boolean;
  hideWhenClose?: boolean;
  menu?: AppMenu[];
  pid?: number;
  hide?: boolean;
  outLink?: boolean;
  url?: string;
  innerLink?: boolean;
  titleBgColor?: string;
  titleColor?: string;
  // 新增字段
  category?: 'system' | 'demo' | 'custom';  // 应用分类
  version?: string;              // 应用版本
  author?: string;               // 应用作者
  description?: string;          // 应用描述
  permissions?: string[];        // 应用权限
  resizable?: boolean;           // 是否可调整大小（替代 disableResize）
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