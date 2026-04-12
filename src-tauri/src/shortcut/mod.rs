//! 快捷键模块
pub mod commands;
pub mod entity;

use tauri::AppHandle;
use tauri_plugin_log::log::error;

pub fn init(handle: &AppHandle) {
    let h = handle.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = commands::refresh_shortcuts(&h).await {
            error!("快捷键初始化失败: {}", e);
        }
    });
}
