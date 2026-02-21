import { Cmds } from "@/lib/enum"
import { Config, ThemeMode } from "@/types/config"
import { invoke } from "@tauri-apps/api/core"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface ConfigStore {
  config: Config
  updateConfig: (fn: (config: Config) => void) => void
}

const useConfigStore = create<ConfigStore>()(immer((set, get) => ({
  config: {
    basic: {
      autoStart: false,
      silentStart: false,
      autoCheckUpdate: false,
      gameDisplayOrder: [],
      language: "zh-cn",
    },
    interface: {
      theme: "default",
      themeMode: ThemeMode.Daytime,
      themeColor: "Emerald",
      fontFamily: "sys",
      globalBackground: { path: "", opacity: 0.8, blur: 0 },
      commonCardOpacity: 0.9
    },
    system: {
      companion: false,
      hotkeyActivation: false,
      closeButtonBehavior: "quit", // 假设默认行为
      logLevel: "info",
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
      bangumiToken: ""
    }
  },
  updateConfig(fn: (config: Config) => void) {
    set(state => {
      fn(state.config)
    })
    try {
      invoke(Cmds.UPDATE_CONFIG, { config: get().config })
    } catch (error) {
      console.error("更新配置信息失败", error)
    }
  },
})))

export default useConfigStore
