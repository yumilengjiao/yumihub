use lazy_static::lazy_static;
use std::{path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Runtime};

use crate::config::GLOBAL_CONFIG;

pub mod commands;
pub mod entity;

lazy_static! {
    // 存储截图的物理路径
    pub static ref SCREENSHOT_DIR: Mutex<PathBuf> = Mutex::new(PathBuf::new());
}

/// 模块初始化：设置存储路径并确保文件夹存在
pub fn init<R: Runtime>(_app_handle: &AppHandle<R>) {
    let screenshot_path;
    {
        screenshot_path = GLOBAL_CONFIG
            .read()
            .unwrap()
            .storage
            .screenshot_path
            .clone();
    }

    // 存入全局变量
    let mut dir = SCREENSHOT_DIR.lock().unwrap();
    *dir = screenshot_path;
}
