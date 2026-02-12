use std::fs;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::info;

use crate::error::AppError;

pub fn init(app_handle: &AppHandle) -> Result<(), AppError> {
    info!("主题模块初始化开始");
    let dir = app_handle.path().app_local_data_dir().unwrap();
    let theme_dir = dir.join("themes");
    let theme_dir_clone = theme_dir.clone();
    let files: Vec<_> = fs::read_dir(theme_dir)
        .map_err(|e| {
            AppError::Resolve(theme_dir_clone.to_string_lossy().to_string(), e.to_string())
        })?
        .filter_map(|entry| entry.ok()) // 过滤掉读取失败的 entry
        .map(|entry| entry.path()) // 获取路径
        .filter(|path| path.is_file()) // 只保留文件（排除子文件夹）
        .collect();
    println!("themecrate被执行了");
    for file_path in files {
        custom_theme::load(file_path)
            .map_err(|e| {
                for err in e {
                    println!("{}", err);
                }
            })
            .unwrap();
    }
    info!("主题模块初始化成功");
    Ok(())
}
