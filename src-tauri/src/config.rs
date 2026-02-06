use std::{
    error::Error,
    path::PathBuf,
    sync::{OnceLock, RwLock},
};

use lazy_static::lazy_static;
use tauri::{AppHandle, Manager};

use crate::config::{entity::Config, fs::load_config};

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
pub fn init(app_handler: &AppHandle) -> Result<(), Box<dyn Error>> {
    set_path(app_handler);
    // 加载配置文件
    load_config(app_handler.clone())?;
    let config = GLOBAL_CONFIG.read().expect("读取配置变量出错");
    // 查看程序是否需要静默启动进行设置
    if config.basic.silent_start {
        if let Some(window) = app_handler.get_webview_window("main") {
            window.hide().unwrap();
        }
    }
    serve::listening_loop(app_handler.clone());
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
