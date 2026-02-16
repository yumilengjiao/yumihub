import { useNavigate } from "react-router";
import { invoke } from "@tauri-apps/api/core";

// 定义 Action 的结构（对应你的文档）
interface ActionItem {
  command: string;
  props?: Record<string, any>;
}

export const useAppActions = () => {
  const navigate = useNavigate();

  // action“映射表”
  const COMMAND_MAP: Record<string, (props: any) => void> = {
    // 路由跳转
    navigate: (props) => {
      if (props?.destination) navigate(props.destination);
    },

    // 弹窗逻辑 
    alert: (props) => {
      // 这里可以根据 props.style (success/error) 调用不同的 UI
      console.log(`[${props?.style || 'info'}] ${props?.content}`);
      alert(props?.content);
    },

    // 执行 Tauri 后端命令
    invoke: async (props) => {
      try {
        await invoke(props.cmd, props.args || {});
      } catch (err) {
        console.error("Tauri Invoke Error:", err);
      }
    },

    // 打开外部浏览器
    open_link: (props) => {
      if (props?.url) window.open(props.url, "_blank");
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
        exec(action.props);
      } else {
        console.warn(`Unknown command: ${action.command}`);
      }
    });
  };

  return { runActions };
};
