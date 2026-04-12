//! 主题模块
//!
//! 扫描 `%APPDATA%/.../themes/` 目录，加载所有 `.json5` / `.json` 主题文件，
//! 将用户配置中指定的主题设为激活状态，并通过 Tauri State 提供给命令层。

use std::{fs, sync::Mutex};

use custom_theme::schema::ir::ThemeIr;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{error, info};

use crate::{config::GLOBAL_CONFIG, error::AppError};

/// Tauri 管理的主题状态
pub struct ThemeState {
    /// 当前激活的主题
    pub active: Mutex<Option<ThemeIr>>,
    /// 所有可用主题名称（用于前端下拉列表）
    pub all_names: Mutex<Vec<String>>,
}

/// 内置默认主题（随二进制打包，避免文件丢失导致崩溃）
const DEFAULT_THEME: &str = include_str!("../assets/themes/default.json5");

/// 主题模块初始化
pub fn init(handle: &AppHandle) -> Result<(), AppError> {
    info!("主题模块初始化");

    let target_name = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .interface
        .theme
        .clone();

    let theme_dir = handle
        .path()
        .app_local_data_dir()
        .map_err(|e| AppError::Generic(e.to_string()))?
        .join("themes");

    // 确保目录存在
    fs::create_dir_all(&theme_dir).map_err(AppError::from)?;

    // 默认主题文件缺失时自动恢复
    let default_path = theme_dir.join("default.json5");
    if !default_path.exists() {
        info!("默认主题文件缺失，正在恢复");
        fs::write(&default_path, DEFAULT_THEME).map_err(AppError::from)?;
    }

    // 扫描并加载所有主题
    let mut all_names = Vec::new();
    let mut active: Option<ThemeIr> = None;

    for entry in fs::read_dir(&theme_dir).map_err(AppError::from)?.flatten() {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        if !path.is_file() || (ext != "json" && ext != "json5") {
            continue;
        }

        match custom_theme::load(path.clone()) {
            Ok(theme) => {
                let name = theme.config.theme_name.clone();
                if name == target_name {
                    active = Some(theme);
                }
                all_names.push(name);
            }
            Err(errs) => error!("主题文件解析失败 {:?}: {:?}", path, errs),
        }
    }

    let state = handle.state::<ThemeState>();

    *state.active.lock().map_err(|e| AppError::Lock(e.to_string()))? = active;
    *state.all_names.lock().map_err(|e| AppError::Lock(e.to_string()))? = all_names;

    info!("主题模块初始化完成，激活主题: {}", target_name);
    Ok(())
}
