//! 配置模块
//!
//! 职责：读写 `config.json`，维护内存中的全局配置，
//! 监听配置变更事件并分发到各子系统。

use std::{
    error::Error,
    path::PathBuf,
    sync::{OnceLock, RwLock},
};

use lazy_static::lazy_static;
use tauri::{AppHandle, Manager};

pub mod entity;
pub mod fs;
pub mod serve;

pub use entity::Config;

lazy_static! {
    /// 内存中的全局配置，使用 RwLock 保证线程安全
    pub static ref GLOBAL_CONFIG: RwLock<Config> = RwLock::new(Config::default());

    /// 配置文件的磁盘路径（程序启动后一次性写入，之后只读）
    pub static ref CONFIG_PATH: OnceLock<PathBuf> = OnceLock::new();
}

/// config 模块入口，在 life_cycle::init 中调用
pub fn init(app_handle: &AppHandle) -> Result<(), Box<dyn Error>> {
    // 设置路径
    CONFIG_PATH
        .set(app_handle.path().app_local_data_dir()?.join("config.json"))
        .expect("CONFIG_PATH 不能重复初始化");

    // 从磁盘加载（或写入默认值）
    fs::load(app_handle.clone())?;

    let config = GLOBAL_CONFIG.read().expect("读取配置失败");

    // 静默启动
    if config.basic.silent_start {
        if let Some(win) = app_handle.get_webview_window("main") {
            let _ = win.hide();
        }
    }

    // 日志等级
    serve::apply_log_level(
        app_handle,
        config.system.log_level.clone(),
        config.system.persist_log,
    );

    // 文件权限
    serve::apply_background_permission(app_handle, &config.interface.global_background.path);

    // 启动消息监听循环
    serve::start_listener(app_handle.clone());

    Ok(())
}
