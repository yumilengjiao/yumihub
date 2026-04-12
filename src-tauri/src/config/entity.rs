//! 配置数据结构定义

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

use crate::message::traits::{MessageEvent, MessageHub};

// ── 顶层配置 ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub basic: Basic,
    pub interface: Interface,
    pub system: System,
    pub storage: Storage,
    pub auth: Authorization,
}

impl PartialEq for Config {
    fn eq(&self, other: &Self) -> bool {
        self.basic == other.basic
            && self.interface == other.interface
            && self.system == other.system
            && self.storage == other.storage
            && self.auth == other.auth
    }
}

// ── 基础设置 ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Basic {
    pub auto_start: bool,
    pub silent_start: bool,
    pub auto_check_update: bool,
    pub language: String,
    /// 首页游戏展示顺序（游戏 ID 列表）
    pub game_display_order: Vec<String>,
}

impl Default for Basic {
    fn default() -> Self {
        Self {
            auto_start: false,
            silent_start: false,
            auto_check_update: false,
            language: "zh".into(),
            game_display_order: Vec::new(),
        }
    }
}

// ── 界面设置 ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Interface {
    pub theme_mode: ThemeMode,
    pub theme_color: String,
    pub theme: String,
    pub font_family: String,
    pub global_background: Background,
    pub common_card_opacity: f32,
}

impl Default for Interface {
    fn default() -> Self {
        Self {
            theme_mode: ThemeMode::System,
            theme_color: "theme-emerald".into(),
            theme: "default".into(),
            font_family: "sys".into(),
            global_background: Background {
                path: PathBuf::new(),
                opacity: 0.8,
                blur: 0,
            },
            common_card_opacity: 0.9,
        }
    }
}

#[derive(Serialize, Default, Deserialize, Debug, Clone, PartialEq)]
pub struct Background {
    pub path: PathBuf,
    pub opacity: f32,
    pub blur: u8,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone, PartialEq)]
pub enum ThemeMode {
    #[default]
    System,
    Daytime,
    Night,
}

// ── 系统设置 ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct System {
    pub companion: bool,
    pub hotkey_activation: bool,
    pub close_button_behavior: CloseBehavior,
    pub log_level: LogLevel,
    pub download_concurrency: i64,
}

impl Default for System {
    fn default() -> Self {
        Self {
            companion: true,
            hotkey_activation: true,
            close_button_behavior: CloseBehavior::Exit,
            log_level: LogLevel::Info,
            download_concurrency: 5,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum CloseBehavior {
    Exit,
    Hide,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

// ── 存储设置 ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Storage {
    pub backup_save_path: PathBuf,
    pub meta_save_path: PathBuf,
    pub screenshot_path: PathBuf,
    pub gal_root_dir: PathBuf,
    pub allow_downloading_resources: bool,
    pub auto_backup: bool,
}

impl Default for Storage {
    fn default() -> Self {
        Self {
            backup_save_path: PathBuf::new(),
            meta_save_path: PathBuf::new(),
            screenshot_path: PathBuf::new(),
            gal_root_dir: PathBuf::new(),
            allow_downloading_resources: true,
            auto_backup: false,
        }
    }
}

// ── 权限设置 ──────────────────────────────────────────────────────────────────

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, PartialOrd)]
#[serde(rename_all = "camelCase")]
pub struct Authorization {
    pub bangumi_token: String,
}

// ── 消息事件 ──────────────────────────────────────────────────────────────────

#[derive(Clone, Debug)]
pub enum ConfigEvent {
    Basic { base: Basic },
    Storage { storage: Storage },
    System { sys: System },
    Interface { interface: Interface },
    Authorization { auth: Authorization },
}

impl MessageEvent for ConfigEvent {}

pub struct ConfigMessageHub {
    pub tx: broadcast::Sender<ConfigEvent>,
}

impl MessageHub<ConfigEvent> for ConfigMessageHub {
    fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { tx }
    }
    fn subscribe(&self) -> broadcast::Receiver<ConfigEvent> {
        self.tx.subscribe()
    }
    fn publish(&self, event: ConfigEvent) {
        let _ = self.tx.send(event);
    }
}
