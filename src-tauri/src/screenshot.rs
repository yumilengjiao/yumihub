use lazy_static::lazy_static;
use std::{path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Manager, Runtime};

pub mod commands;
pub mod entity;

lazy_static! {
    // 存储截图的物理路径
    pub static ref SCREENSHOT_DIR: Mutex<PathBuf> = Mutex::new(PathBuf::new());
}

/// 模块初始化：设置存储路径并确保文件夹存在
pub fn init<R: Runtime>(app_handle: &AppHandle<R>) {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("./data"));
    let screenshot_path = data_dir.join("screen_shots");

    // 确保目录存在
    if !screenshot_path.exists() {
        std::fs::create_dir_all(&screenshot_path).unwrap_or_else(|e| {
            eprintln!("创建截图目录失败: {}", e);
        });
    }

    // 存入全局变量
    let mut dir = SCREENSHOT_DIR.lock().unwrap();
    *dir = screenshot_path;
}
