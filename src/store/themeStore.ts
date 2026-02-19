import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@tauri-apps/api/core';
import { ThemeIr, ThemeNode } from '@/types/node';
import { Cmds } from '@/lib/enum';

// 样式转换辅助函数
const transformStyles = (node: ThemeNode) => {
  if (node.style) {
    const newStyle: Record<string, any> = {};
    Object.keys(node.style).forEach((key) => {
      // 转换 font-size -> fontSize
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      newStyle[camelKey] = node.style[key];
    });
    node.style = newStyle;
  }
  // 递归处理子节点
  node.children?.forEach(transformStyles);
};

interface ThemeState {
  // 核心数据：当前活跃的主题
  theme?: ThemeIr;
  // UI 状态：当前正在查看哪一页
  currentPageKey: string;
  isLoading: boolean;

  // 操作
  fetchThemes: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
  immer((set) => ({
    currentPageKey: 'index', // 默认首页
    isLoading: false,

    // 从 Rust 后端拉取数据
    fetchThemes: async () => {
      const data = await invoke<ThemeIr>(Cmds.GET_THEMES);
      console.log(data)

      // 在这里一次性处理所有样式问题
      // 处理全局节点样式
      transformStyles(data.layout.global);
      // 处理所有页面的内容样式
      Object.values(data.layout.pages).forEach((page) => {
        transformStyles(page.content);
      });
      set(state => {
        state.theme = data;
        state.isLoading = false;
      })
    },
  }))
);

useThemeStore.getState().fetchThemes()
