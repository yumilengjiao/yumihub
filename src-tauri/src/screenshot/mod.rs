//! 截图模块
pub mod commands;
pub mod entity;

use tauri::{AppHandle, Runtime};
use crate::config::GLOBAL_CONFIG;

pub fn init<R: Runtime>(_handle: &AppHandle<R>) {
    // 确保截图目录存在
    let path = GLOBAL_CONFIG.read().unwrap().storage.screenshot_path.clone();
    let _ = std::fs::create_dir_all(&path);
}
