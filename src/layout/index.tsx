import { toast, Toaster } from "sonner"
import { useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { debug, attachLogger } from "@tauri-apps/plugin-log"
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
import { useUpdateChecker } from "@/hooks/useUpdateChecker"
import { useLogStore, nextLogId, LogLevel } from "@/store/logStore"

const LEVEL_MAP: Record<number, LogLevel> = {
  1: 'trace', 2: 'debug', 3: 'info', 4: 'warn', 5: 'error',
}

export default function Layout() {
  const { setUser } = useUserStore()
  const { setGameMetaList } = useGameStore()
  const { updateConfig } = useConfigStore()
  const { fetchShortcuts } = useShortcutStore()
  const { fetchCompanions } = useCompanionStore()
  const { fetchTheme } = useThemeStore()
  const { addLog } = useLogStore()
  const fontFamily = useConfigStore(s => s.config.interface.fontFamily)
  const layoutTree = useThemeStore(t => t.theme?.layout.global)

  useThemeSync()
  useShortcutHandler()
  useUpdateChecker()

  // ── 启动时就挂载日志收集器，确保全程捕获 ─────────────────────────────────
  useEffect(() => {
    let unlisten: (() => void) | undefined
    attachLogger(entry => {
      // 过滤 tao 内部噪音日志（Windows 窗口事件循环的已知 warning，与业务无关）
      if (entry.message.includes('NewEvents emitted without explicit') ||
        entry.message.includes('RedrawEventsCleared emitted without') ||
        entry.message.includes('MainEventsCleared')) return

      const level = LEVEL_MAP[entry.level] ?? 'info'
      const now = new Date()
      addLog({
        id: nextLogId(),
        level,
        message: entry.message,
        time: now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })
    }).then(fn => { unlisten = fn })
    return () => { unlisten?.() }
  }, [])

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

        document.documentElement.classList.add(config.interface.themeColor)

        await Promise.all([fetchTheme(), fetchShortcuts(), fetchCompanions()])

        try {
          const [defaultUpdated, nonDefaultOutdated] = await Promise.all([
            invoke<boolean>(Cmds.GET_DEFAULT_THEME_UPDATED),
            invoke<boolean>(Cmds.GET_NON_DEFAULT_THEME_OUTDATED),
          ])

          // 用户使用的是 default 主题且它被更新了 → 提示导航有新入口
          if (defaultUpdated && !nonDefaultOutdated) {
            toast.info("默认主题已更新，导航栏新增了功能入口。", {
              id: "theme-updated",
              duration: 8000,
              dismissible: true,
            })
          }

          // 用户使用的是非 default 主题，且 default 有更新 → 提示去下载新版主题文件
          if (nonDefaultOutdated) {
            toast.warning("你使用的主题有新版本可用，建议前往 GitHub 下载最新主题文件以获得新功能入口。", {
              id: "theme-outdated",
              duration: 12000,
              dismissible: true,
            })
          }
        } catch (e) {
          // 非关键逻辑，静默忽略
        }
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
    <>
      <Toaster position="top-center" richColors />
      <div className="h-screen w-full flex flex-col bg-transparent overflow-hidden select-none">
        {layoutTree ? (
          <Surface node={layoutTree} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500 text-sm">
            Loading...
          </div>
        )}
      </div>
    </>
  )
}
