import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";

// 定义 Action 的结构（对应你的文档）
interface ActionItem {
  command: string;
  params?: Record<string, any>;
}

export const useAppActions = () => {
  const navigate = useNavigate();

  // action“映射表”
  const COMMAND_MAP: Record<string, (params: any) => void> = {
    // 路由跳转
    navigate: (params) => {
      if (params?.destination) navigate(params.destination);
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

    // 可以在这里继续扩展：播放音效、刷新配置、关闭窗口等
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
