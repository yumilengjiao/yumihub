/**
 * @module 此模块包含了所有自定义主题系统可能用到的操作函数
 */

import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 定义 Action 的结构（对应你的文档）
interface ActionItem {
  command: string;
  params?: Record<string, any>;
}

export const useAppActions = () => {
  const navigate = useNavigate();
  const appWindow = getCurrentWindow()

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

    // 弹窗逻辑 
    alert: (params) => {
      // 这里可以根据 params.style (success/error) 调用不同的 UI
      console.log(`[${params?.style || 'info'}] ${params?.content}`);
      alert(params?.content);
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
    open_link: (params) => {
      if (params?.url) window.open(params.url, "_blank");
    },
  };

  /**
   * 暴露给组件的执行入口
   * 支持传入单个 action 对象或 action 数组
   */
  const runActions = (actions: ActionItem | ActionItem[] | undefined) => {
    console.log("我请问了")
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
