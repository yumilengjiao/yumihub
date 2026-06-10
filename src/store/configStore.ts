import { Cmds } from "@/lib/enum"
import { Config, ThemeMode } from "@/types/config"
import { t } from "@lingui/core/macro"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface ConfigStore {
  config: Config
  updateConfig: (fn: (config: Config) => void) => void
}

const DEFAULT_CONFIG: Config = {
  basic: {
    autoStart: false,
    silentStart: false,
    autoCheckUpdate: true,
    gameDisplayOrder: [],
    language: "zh",
  },
  interface: {
    theme: "default",
    themeMode: ThemeMode.Daytime,
    themeColor: "theme-emerald",
    fontFamily: "sys",
    globalBackground: { path: "", opacity: 0.8, blur: 0 },
    commonCardOpacity: 0.9,
  },
  system: {
    persistLog: false,
    companion: false,
    hotkeyActivation: false,
    closeButtonBehavior: "Exit",
    logLevel: "Info",
    downloadConcurrency: 3,
  },
  storage: {
    backupSavePath: "",
    metaSavePath: "",
    screenshotPath: "",
    allowDownloadingResources: true,
    galRootDir: "",
    autoBackup: false,
  },
  auth: {
    bangumiToken: "",
  },
}

const useConfigStore = create<ConfigStore>()(
  immer((set, get) => ({
    config: DEFAULT_CONFIG,

    updateConfig(fn) {
      const previous = structuredClone(get().config)
      set(state => { fn(state.config) })
      invoke(Cmds.UPDATE_CONFIG, { config: get().config }).catch(err => {
        set(state => { state.config = previous })
        toast.error(t`同步配置到后端失败`)
        console.error("同步配置到后端失败:", err)
      })
    },
  }))
)

export default useConfigStore
