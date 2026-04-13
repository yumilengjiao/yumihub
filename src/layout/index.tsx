import { Toaster } from "sonner"
import { useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { debug } from "@tauri-apps/plugin-log"
import { i18n } from "@lingui/core"
import { User } from "@/types/user"
import { GameMetaList } from "@/types/game"
import { Config } from "@/types/config"
import { Cmds } from "@/lib/enum"
import useUserStore from "@/store/userStore"
import useGameStore from "@/store/gameStore"
import useConfigStore from "@/store/configStore"
import useShortcutStore from "@/store/shortcutStore"
import useCompanionStore from "@/store/companionStore"
import { useThemeStore } from "@/store/themeStore"
import { useThemeSync } from "@/hooks/useTheme"
import { useShortcutHandler } from "@/hooks/useShortcuter"
import { Surface } from "@/components/custom/Surface"

export default function Layout() {
  const { setUser } = useUserStore()
  const { setGameMetaList } = useGameStore()
  const { updateConfig } = useConfigStore()
  const { fetchShortcuts } = useShortcutStore()
  const { fetchCompanions } = useCompanionStore()
  const { fetchTheme } = useThemeStore()
  const fontFamily = useConfigStore(s => s.config.interface.fontFamily)
  const layoutTree = useThemeStore(t => t.theme?.layout.global)

  // 主题 dark/light 同步
  useThemeSync()

  // 前端快捷键
  useShortcutHandler()

  // ── 启动时统一初始化 ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        debug("程序启动，开始初始化数据...")

        const [gameList, user, config] = await Promise.all([
          invoke<GameMetaList>(Cmds.GET_GAME_META_LIST),
          invoke<User>(Cmds.GET_USER_INFO),
          invoke<Config>(Cmds.GET_CONFIG),
        ])

        setGameMetaList(gameList)
        setUser(user)

        i18n.activate(config.basic.language)
        updateConfig(draft => Object.assign(draft, config))

        // 应用主题色
        document.documentElement.classList.add(config.interface.themeColor)

        // 并行加载其余数据
        await Promise.all([fetchTheme(), fetchShortcuts(), fetchCompanions()])
      } catch (err) {
        console.error("初始化失败:", err)
      }
    }
    init()
  }, [])

  // ── 动态字体注入 ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fontValue =
      fontFamily === "sys"
        ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : `"${fontFamily}"`

    let tag = document.getElementById("dynamic-font-style")
    if (!tag) {
      tag = document.createElement("style")
      tag.id = "dynamic-font-style"
      document.head.appendChild(tag)
    }
    tag.textContent = `:root { --main-font: ${fontValue} } body { font-family: var(--main-font) }`
  }, [fontFamily])

  return (
    <div className="h-screen w-full flex flex-col bg-transparent overflow-hidden select-none">
      <Toaster position="top-center" richColors />
      {layoutTree ? (
        <Surface node={layoutTree} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-500 text-sm">
          Loading...
        </div>
      )}
    </div>
  )
}
