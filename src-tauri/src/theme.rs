use custom_theme::schema::ir::ThemeIr;
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error, info};

use crate::{config::GLOBAL_CONFIG, error::AppError};

pub struct ThemeState {
    pub active: Mutex<Option<ThemeIr>>,
    pub all_names: Mutex<Vec<String>>,
}

const DEFAULT_THEME_CONTENT: &str = include_str!("../assets/themes/default.json5");

pub fn init(app_handle: &AppHandle) -> Result<(), AppError> {
    info!("主题模块初始化开始");

    // 获取配置的目标主题名
    let target_theme_name = {
        let config = GLOBAL_CONFIG
            .read()
            .map_err(|e| AppError::Generic(e.to_string()))?;
        config.interface.theme.clone()
    };

    // 路径准备
    let app_local_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|_| AppError::Generic("无法获取应用数据目录".to_string()))?;

    let theme_dir = app_local_dir.join("themes");
    let default_theme_path = theme_dir.join("default.json5");

    // --- 核心逻辑补全：创建目录与恢复默认文件 ---

    // 如果 themes 目录不存在，直接递归创建
    if !theme_dir.exists() {
        info!("未检测到主题目录，正在创建: {:?}", theme_dir);
        fs::create_dir_all(&theme_dir).map_err(|e| AppError::File(e.to_string()))?;
    }

    // 如果 default.json5 不存在，从内存中写出一个
    if !default_theme_path.exists() {
        info!("默认主题文件缺失，正在恢复至: {:?}", default_theme_path);
        fs::write(&default_theme_path, DEFAULT_THEME_CONTENT)
            .map_err(|e| AppError::File(format!("写入默认主题失败: {}", e)))?;
    }

    // --- 逻辑恢复结束 ---

    // 扫描目录并加载
    let entries = fs::read_dir(&theme_dir)
        .map_err(|e| AppError::Resolve(theme_dir.display().to_string(), e.to_string()))?;

    let mut all_names = Vec::new();
    let mut active_theme: Option<ThemeIr> = None;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file()
            && path
                .extension()
                .map_or(false, |ext| ext == "json" || ext == "json5")
        {
            match custom_theme::load(path.clone()) {
                Ok(theme) => {
                    let name = theme.config.theme_name.clone();
                    all_names.push(name.clone());

                    // 匹配当前激活的主题
                    if name == target_theme_name {
                        active_theme = Some(theme);
                    }
                }
                Err(errors) => {
                    error!("文件 {:?} 格式错误: {:?}", path, errors);
                }
            }
        }
    }

    // 将结果存入全局 State
    let state = app_handle.state::<ThemeState>();

    if let Ok(mut active_lock) = state.active.lock() {
        *active_lock = active_theme;
    } else {
        return Err(AppError::Mutex("无法获取 active_theme 锁".to_string()));
    }

    if let Ok(mut names_lock) = state.all_names.lock() {
        *names_lock = all_names;
    } else {
        return Err(AppError::Mutex("无法获取 all_names 锁".to_string()));
    }

    debug!(
        "主题模块初始化成功。已加载激活主题: {:?}，记录了 {} 个可选名称",
        target_theme_name,
        state.all_names.lock().unwrap().len()
    );

    Ok(())
}
