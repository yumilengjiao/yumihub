use tauri::AppHandle;

use crate::shortcut::commands::refresh_shortcuts;

pub mod commands;
pub mod entity;

pub fn init(app_handle: &AppHandle) {
    let handle = app_handle.clone();

    // 异步加载并注册
    tauri::async_runtime::spawn(async move {
        if let Err(e) = refresh_shortcuts(&handle).await {
            eprintln!("初始化快捷键监听失败: {}", e);
        }
    });
}
