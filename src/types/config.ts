/**
 * 全局配置类型
 */
export interface Config {
  basic: Basic;
  interface: Interface;
  system: System;
  storage: Storage;
}

// -----------------------------------------------------
// ------------------------基础配置---------------------
// -----------------------------------------------------

export interface Basic {
  autoStart: boolean;
  silentStart: boolean;
  autoCheckUpdate: boolean;
  language: string;
}

// -----------------------------------------------------
// ------------------------界面配置---------------------
// -----------------------------------------------------

export interface Interface {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  sidebarMode: SideBarMode;
  fontFamily: string;
}

export enum ThemeMode {
  Daytime = "Daytime",
  Night = "Night",
}

export enum ThemeColor {
  White = "White",
  Green = "Green",
  Orange = "Orange"
}

export enum SideBarMode {
  Trigger = "Trigger",
  NormalFixed = "NormalFixed",
  ShortFixed = "ShortFixed",
}

// -----------------------------------------------------
// ------------------------存储配置---------------------
// -----------------------------------------------------

export interface Storage {
  /** 游戏存档备份路径 */
  backupSavePath: string;
  /** 游戏资源下载路径 */
  metaSavePath: string;
}

// -----------------------------------------------------
// ------------------------系统配置---------------------
// -----------------------------------------------------

export interface System {
  /** 关闭按钮行为 (例如: "minimize" | "quit") */
  closeButtonBehavior: string;
  /** 日志级别 (例如: "info" | "debug" | "error") */
  logLevel: string;
  /** 下载并发量上限 */
  downloadConcurrency: number; // Rust 中的 i64 对应 TS 的 number
}
