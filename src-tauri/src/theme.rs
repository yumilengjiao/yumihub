//! 主题模块
//!
//! 扫描 `%APPDATA%/.../themes/` 目录，加载所有 `.json5` / `.json` 主题文件，
//! 将用户配置中指定的主题设为激活状态，并通过 Tauri State 提供给命令层。
//!
//! 默认主题版本管理：
//! 每次启动时比对磁盘上 default.json5 的 version 字段与内置版本，
//! 若内置版本更新则自动覆盖，保证导航等结构跟随程序升级。

use std::{fs, sync::Mutex};

use custom_theme::schema::ir::ThemeIr;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{error, info, warn};

use crate::{config::GLOBAL_CONFIG, error::AppError};

/// Tauri 管理的主题状态
pub struct ThemeState {
    /// 当前激活的主题
    pub active: Mutex<Option<ThemeIr>>,
    /// 所有可用主题名称（用于前端下拉列表）
    pub all_names: Mutex<Vec<String>>,
    /// 默认主题是否在本次启动时被自动更新了
    pub default_theme_updated: Mutex<bool>,
    /// 用户当前使用的不是 default 主题，且 default 主题有更新（提示用户去下载新版主题）
    pub non_default_theme_outdated: Mutex<bool>,
}

/// 内置默认主题（随二进制打包，避免文件丢失导致崩溃）
const DEFAULT_THEME: &str = include_str!("../assets/themes/default.json5");

/// 从 json5 文本中提取 version 字段值
/// 匹配形如 `version: "1.1"` 或 `"version": "1.1"` 的行，忽略注释部分
fn extract_version(content: &str) -> Option<String> {
    for line in content.lines() {
        // 去掉行内注释后再处理
        let line = if let Some(pos) = line.find("//") {
            &line[..pos]
        } else {
            line
        };
        let line = line.trim();

        // 必须包含 version 关键字
        if !line.contains("version") {
            continue;
        }

        // 找冒号后面的第一个 "..." 值
        if let Some(colon_pos) = line.find(':') {
            let after_colon = line[colon_pos + 1..].trim();
            if after_colon.starts_with('"') {
                let inner = &after_colon[1..];
                if let Some(end) = inner.find('"') {
                    return Some(inner[..end].to_string());
                }
            }
        }
    }
    None
}

/// 比较版本号大小，返回 a > b
fn version_gt(a: &str, b: &str) -> bool {
    let parse = |v: &str| -> Vec<u32> { v.split('.').filter_map(|s| s.parse().ok()).collect() };
    let va = parse(a);
    let vb = parse(b);
    for i in 0..va.len().max(vb.len()) {
        let a = va.get(i).copied().unwrap_or(0);
        let b = vb.get(i).copied().unwrap_or(0);
        if a != b {
            return a > b;
        }
    }
    false
}

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

    fs::create_dir_all(&theme_dir).map_err(AppError::from)?;

    let default_path = theme_dir.join("default.json5");
    let bundled_version = extract_version(DEFAULT_THEME).unwrap_or_else(|| "0.0".into());
    let mut default_theme_updated = false;

    if !default_path.exists() {
        // 文件不存在，直接写入
        info!("默认主题文件缺失，正在恢复 (v{})", bundled_version);
        fs::write(&default_path, DEFAULT_THEME).map_err(AppError::from)?;
        default_theme_updated = true;
    } else {
        // 文件存在，比对版本号
        match fs::read_to_string(&default_path) {
            Ok(disk_content) => {
                let disk_version = extract_version(&disk_content).unwrap_or_else(|| "0.0".into());
                if version_gt(&bundled_version, &disk_version) {
                    info!(
                        "默认主题已更新: {} → {}，覆盖写入",
                        disk_version, bundled_version
                    );
                    fs::write(&default_path, DEFAULT_THEME).map_err(AppError::from)?;
                    default_theme_updated = true;
                } else {
                    info!("默认主题版本 {} 已是最新，无需更新", disk_version);
                }
            }
            Err(e) => {
                warn!("读取默认主题文件失败: {}，将重新写入", e);
                fs::write(&default_path, DEFAULT_THEME).map_err(AppError::from)?;
                default_theme_updated = true;
            }
        }
    }

    // 扫描并加载所有主题
    let mut all_names = Vec::new();
    let mut active: Option<ThemeIr> = None;
    let mut active_theme_version: Option<String> = None;

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
                    active_theme_version = Some(theme.config.version.clone());
                    active = Some(theme);
                }
                all_names.push(name);
            }
            Err(errs) => error!("主题文件解析失败 {:?}: {:?}", path, errs),
        }
    }

    let state = handle.state::<ThemeState>();
    *state
        .active
        .lock()
        .map_err(|e| AppError::Lock(e.to_string()))? = active;
    *state
        .all_names
        .lock()
        .map_err(|e| AppError::Lock(e.to_string()))? = all_names;
    *state
        .default_theme_updated
        .lock()
        .map_err(|e| AppError::Lock(e.to_string()))? = default_theme_updated;

    // 用户使用的不是 default 主题，且当前主题版本低于内置 default 版本
    // → 说明有新功能入口等更新，提示去下载新版主题文件
    let non_default_outdated = if target_name != "default" {
        match active_theme_version {
            Some(ref v) => version_gt(&bundled_version, v),
            None => false,
        }
    } else {
        false
    };
    *state
        .non_default_theme_outdated
        .lock()
        .map_err(|e| AppError::Lock(e.to_string()))? = non_default_outdated;

    info!("主题模块初始化完成，激活主题: {}", target_name);
    Ok(())
}
