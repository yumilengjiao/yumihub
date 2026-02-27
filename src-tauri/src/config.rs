use std::{
    error::Error,
    path::PathBuf,
    sync::{OnceLock, RwLock},
};

use lazy_static::lazy_static;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::error;

use crate::config::{
    entity::{Config, LogLevel},
    fs::load_config,
};

pub mod entity;
pub mod fs;
mod serve;

lazy_static! {
    // config包下的全局变量: 配置文件变量
    pub static ref GLOBAL_CONFIG: RwLock<Config> = RwLock::new(Config::default());

    // config包下的全局变量: 配置文件路径,不可再更改
    pub static ref CONFIG_PATH: OnceLock<PathBuf> = OnceLock::new();
}

/// config模块初始化函数
pub fn init(app_handle: &AppHandle) -> Result<(), Box<dyn Error>> {
    set_path(app_handle);
    // 加载配置文件
    load_config(app_handle.clone())?;
    let config = GLOBAL_CONFIG.read().expect("读取配置变量出错");
    // 查看程序是否需要静默启动进行设置
    if config.basic.silent_start {
        if let Some(window) = app_handle.get_webview_window("main") {
            window.hide().unwrap();
        }
    }
    // 初始化日志等级
    set_log_level(app_handle, config.system.log_level.clone());
    // 初始化文件访问权限
    allow_permission(app_handle);
    serve::listening_loop(app_handle.clone());
    Ok(())
}

/// 设置所有config包下全局变量的路径
fn set_path(app_handler: &AppHandle) {
    // 设置配置文件路径
    CONFIG_PATH
        .set(
            app_handler
                .path()
                .app_local_data_dir()
                .unwrap()
                .join("config.json"),
        )
        .expect("设置配置文件路径失败");
}

/// 设置日志等级
///
/// * `level`: 日志等级
fn set_log_level(app_handle: &AppHandle, level: LogLevel) {
    let filter = match level {
        LogLevel::Trace => tauri_plugin_log::log::LevelFilter::Trace,
        LogLevel::Debug => tauri_plugin_log::log::LevelFilter::Debug,
        LogLevel::Warn => tauri_plugin_log::log::LevelFilter::Warn,
        LogLevel::Error => tauri_plugin_log::log::LevelFilter::Error,
        _ => tauri_plugin_log::log::LevelFilter::Info,
    };
    app_handle
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(filter) // 使用动态确定的等级
                .build(),
        )
        .expect("无法初始化日志系统");
}

/// 允许config中文件路径访问权限
///
/// * `app_handler`: app操纵句柄
fn allow_permission(app_handler: &AppHandle) {
    let background_path = &GLOBAL_CONFIG
        .read()
        .unwrap()
        .interface
        .global_background
        .path;
    let result = app_handler
        .asset_protocol_scope()
        .allow_file(background_path);
    if let Err(e) = result {
        error!("授予文件被访问的权限失败，错误: {}", e)
    }
}
