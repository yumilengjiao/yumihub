/**
 * 配置
 */
export interface Config {
  basic: Basic
  interface: Interface
  system: System
  storage: Storage
  auth: Authorization
}

export interface Basic {
  autoStart: boolean
  silentStart: boolean
  autoCheckUpdate: boolean
  language: string
  gameDisplayOrder: string[]
}

export interface Interface {
  theme: string
  themeMode: ThemeMode
  themeColor: string
  fontFamily: string
  globalBackground: GlobalBackground
  commonCardOpacity: number
}

/** 全局背景图片设置 */
export interface GlobalBackground {
  path: string
  opacity: number
  blur: number
}

export enum ThemeMode {
  System = "System",
  Daytime = "Daytime",
  Night = "Night",
}

export interface Storage {
  backupSavePath: string
  metaSavePath: string
  screenshotPath: string
  galRootDir: string
  allowDownloadingResources: boolean
  autoBackup: boolean
}

export interface System {
  persistLog: boolean
  companion: boolean
  hotkeyActivation: boolean
  closeButtonBehavior: string
  logLevel: string
  downloadConcurrency: number
}

export interface Authorization {
  bangumiToken: string
}
