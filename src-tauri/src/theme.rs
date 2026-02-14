use custom_theme::schema::ir::ThemeIr;
use std::{fs, sync::Mutex};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error, info};

use crate::error::AppError;

pub fn init(app_handle: &AppHandle) -> Result<(), AppError> {
    info!("主题模块初始化开始");

    // 获取并确保本地数据目录存在
    let local_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|_| AppError::Generic("无法获取应用数据目录".to_string()))?;

    let theme_dir = local_dir.join("themes");

    if !theme_dir.exists() {
        fs::create_dir_all(&theme_dir).map_err(|e| AppError::File(e.to_string()))?;
    }

    // 读取目录并过滤出文件路径
    let entries = fs::read_dir(&theme_dir)
        .map_err(|e| AppError::Resolve(theme_dir.display().to_string(), e.to_string()))?;

    // 批量解析主题文件
    let mut theme_collection = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            match custom_theme::load(path.clone()) {
                Ok(theme) => theme_collection.push(theme),
                Err(errors) => {
                    for err in errors {
                        error!("文件 {:?} 解析失败: {}", path, err);
                    }
                }
            }
        }
    }

    // 将收集到的向量存入 Tauri 全局状态
    let state = app_handle.state::<Mutex<Vec<ThemeIr>>>();

    // 获取锁并更新数据
    if let Ok(mut themes) = state.try_lock().map_err(|e| AppError::Mutex(e.to_string())) {
        *themes = theme_collection;
        debug!("主题模块初始化成功，共缓存 {} 个主题", themes.len());
    }

    Ok(())
}
