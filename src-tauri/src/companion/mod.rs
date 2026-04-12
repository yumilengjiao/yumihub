//! 连携程序模块
//!
//! 管理随 App / 随游戏启动的外部程序。

use std::sync::Mutex;

use lazy_static::lazy_static;
use tauri::{AppHandle, Runtime};

use crate::companion::{commands::refresh_companions, entity::ActiveProcess};

pub mod commands;
pub mod entity;

lazy_static! {
    static ref ACTIVE_PROCESSES: Mutex<Vec<ActiveProcess>> = Mutex::new(Vec::new());
    static ref PROCESS_NAMES: Mutex<Vec<String>> = Mutex::new(Vec::new());
}

/// 模块初始化：拉起所有 app 级连携程序
pub fn init<R: Runtime>(handle: &AppHandle<R>) {
    let h = handle.clone();
    tauri::async_runtime::spawn(async move {
        let _ = refresh_companions(&h, true).await;
    });
}

/// 模块退出：强制关闭所有连携进程
pub fn exit() {
    commands::kill_all_active();
}
