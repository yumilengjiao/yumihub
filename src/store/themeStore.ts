import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { invoke } from "@tauri-apps/api/core"
import { ThemeIr, ThemeNode } from "@/types/node"
import { Cmds } from "@/lib/enum"

/** 将 kebab-case CSS 属性名转换为 camelCase，供 React style 使用 */
function toCamelCase(node: ThemeNode) {
  if (node.style) {
    const camel: Record<string, any> = {}
    for (const key of Object.keys(node.style)) {
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      camel[camelKey] = (node.style as any)[key]
    }
    node.style = camel as any
  }
  node.children?.forEach(toCamelCase)
}

interface ThemeState {
  theme?: ThemeIr
  isLoading: boolean
  fetchTheme: () => Promise<void>
}

export const useThemeStore = create<ThemeState>()(
  immer((set) => ({
    isLoading: false,

    fetchTheme: async () => {
      set(s => { s.isLoading = true })
      try {
        const data = await invoke<ThemeIr>(Cmds.GET_THEMES)
        toCamelCase(data.layout.global)
        Object.values(data.layout.pages).forEach(page => toCamelCase(page.content))
        set(s => {
          s.theme = data
          s.isLoading = false
        })
      } catch (e) {
        console.error("获取主题失败:", e)
        set(s => { s.isLoading = false })
      }
    },
  }))
)
