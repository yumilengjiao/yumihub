/**
 * @module 此模块包含了所有自定义主题系统可能用到的操作函数
 */

import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ThemeMode } from "@/types/config";
import useConfigStore from "@/store/configStore";
import { open } from '@tauri-apps/plugin-shell';
import { toast } from "sonner";
import useGameStore from "@/store/gameStore";
import { Cmds } from "@/lib/enum";

// 定义 Action 的结构（对应你的文档）
interface ActionItem {
  command: string;
  params?: Record<string, any>;
}

export const useAppActions = () => {
  const navigate = useNavigate();
  const appWindow = getCurrentWindow()
  const { config, updateConfig } = useConfigStore()
  const { gameMetaList } = useGameStore()

  // action“映射表”
  const COMMAND_MAP: Record<string, (params: any) => void> = {
    // 路由跳转
    navigate: (params) => {
      if (params?.destination) navigate(params.destination);
    },

    // 控制窗口的缩放隐藏等
    windowManage: async (params) => {
      // 如果 params 没传或者没传 op(opration)，我们就走“智能切换”逻辑
      const op = params?.op;

      if (!op) {
        // 自行判断当前状态
        const isMaximized = await appWindow.isMaximized();
        if (isMaximized) {
          await appWindow.unmaximize();
        } else {
          await appWindow.maximize();
        }
        return;
      }

      // 如果传了具体参数，按参数执行
      switch (op) {
        case "maximize":
          await appWindow.maximize();
          break;
        case "unmaximize":
          await appWindow.unmaximize();
          break;
        case "minimize":
          await appWindow.minimize();
          break;
        case "close":
          await appWindow.close();
          break;
        case "hide":
          await appWindow.hide()
          break
        case "toggle": // 显式调用切换
          const maximized = await appWindow.isMaximized();
          maximized ? await appWindow.unmaximize() : await appWindow.maximize();
          break;
      }
    },

    // 暗色模式切换按钮点击：在 Night 和 Daytime 之间切换
    switchTheme: (_) => {
      let nextMode: ThemeMode

      // 如果当前是 System，点一下根据当前系统状态切到相反模式
      if (config.interface.themeMode === ThemeMode.System) {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        nextMode = isSystemDark ? ThemeMode.Daytime : ThemeMode.Night
      } else {
        // 否则在白天/黑夜间互切
        nextMode = config.interface.themeMode === ThemeMode.Night
          ? ThemeMode.Daytime
          : ThemeMode.Night
      }

      updateConfig(d => { d.interface.themeMode = nextMode })
    },


    // 弹窗逻辑 
    alert: (params) => {
      toast(params?.content);
    },

    // 执行 Tauri 后端命令
    invoke: async (params) => {
      try {
        await invoke(params.cmd, params.args || {});
      } catch (err) {
        console.error("Tauri Invoke Error:", err);
      }
    },

    // 打开外部浏览器
    openLink: (params) => {
      console.log("调用外部链接")
      if (params?.url) open(params.url);
    },

    // 启动上一次运行的游戏
    startUplastedGame: () => {
      // 使用 sort 时，需要处理 null/undefined 
      // 我们通常把没玩过的游戏排在最后面
      gameMetaList.sort((a, b) => {
        const timeA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
        const timeB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;

        return timeB - timeA;
      });

      // 排序完后，启动第一个
      if (gameMetaList.length > 0) {
        // 调用你启动游戏的逻辑
        invoke(Cmds.START_GAME, {
          game: gameMetaList[0]
        });
      }
    }
  };

  /**
   * 暴露给组件的执行入口
   * 支持传入单个 action 对象或 action 数组
   */
  const runActions = (actions: ActionItem | ActionItem[] | undefined) => {
    if (!actions) return;

    const actionList = Array.isArray(actions) ? actions : [actions];

    actionList.forEach((action) => {
      const exec = COMMAND_MAP[action.command];
      if (exec) {
        exec(action.params);
      } else {
        console.warn(`Unknown command: ${action.command}`);
      }
    });
  };

  return { runActions };
};
