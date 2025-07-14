import { AppConfig } from "@/types/app";

interface AppModel {
  allAppList: AppConfig[];
}

const appModel: AppModel = {
  allAppList: [
    {
      key: "system_about",
      component: "SystemAbout",
      icon: "icon-question",
      title: "关于本站",
      iconColor: "#fff",
      iconBgColor: "#23282d",
      width: 400,
      height: 250,
      disableResize: true,
      hideInDesktop: true,
      menu: [
        {
          key: "about",
          title: "关于",
          sub: [
            {
              key: "close",
              title: "关闭",
            },
          ],
        },
        {
          key: "help",
          title: "帮助",
          sub: [
            {
              key: "send",
              title: "发送反馈",
            },
          ],
        },
      ],
    },
    {
      key: "system_finder",
      component: "SystemFinder",
      icon: "icon-MIS_chanpinshezhi",
      title: "访达",
      iconColor: "#fff",
      iconBgColor: "#db5048",
      width: 800,
      height: 600,
      keepInDock: true,
      menu: [
        {
          key: "finder",
          title: "访达",
          sub: [
            {
              key: "about",
              title: "关于 访达",
            },
            {
              isLine: true,
            },
            {
              key: "setting",
              title: "首选项",
            },
            {
              isLine: true,
            },
            {
              key: "close",
              title: "退出 访达",
            },
          ],
        },
        {
          key: "window",
          title: "窗口",
          sub: [
            {
              key: "min",
              title: "最小化",
            },
            {
              key: "max",
              title: "最大化",
            },
          ],
        },
        {
          key: "help",
          title: "帮助",
          sub: [
            {
              key: "send",
              title: "发送反馈",
            },
          ],
        },
      ],
    },
    // ... 其他应用配置
  ],
};

export default appModel;