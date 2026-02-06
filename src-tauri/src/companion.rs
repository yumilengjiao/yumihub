//! 此模块用于管理程序的连携程序，也就是游戏启动时会连带着一起启动的程序

use lazy_static::lazy_static;
use std::{process::Stdio, sync::Mutex};

use tauri::{AppHandle, Runtime};

use crate::companion::{commands::refresh_companions, entity::ActiveProcess};

pub mod commands;
pub mod entity;

lazy_static! {
    // 存储子进程的句柄
    static ref ACTIVE_PROCESSES: Mutex<Vec<ActiveProcess>> = Mutex::new(Vec::new());
    // 存储子进程的名字,由于添加的进程可能是多个连携启动导致程序退出的时候不正确关闭应用
    static ref PROCESS_NAMES: Mutex<Vec<String>> = Mutex::new(Vec::new());
}

/// 初始化入口-负责调度
pub fn init<R: Runtime>(app_handle: &AppHandle<R>) {
    let handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let _ = refresh_companions(&handle, true).await;
    });
}

/// 退出入口：负责清理所有进程
pub fn exit() {
    // 处理句柄
    let mut processes = ACTIVE_PROCESSES.lock().unwrap();
    for p in processes.drain(..) {
        let mut child = p.child;
        let _ = child.kill(); // 尝试正常关闭
    }

    // 处理进程名（针对那些可能产生子进程的情况，强制清理）
    let mut names = PROCESS_NAMES.lock().unwrap();
    for name in names.drain(..) {
        #[cfg(target_os = "windows")]
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/IM", &name, "/T"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        #[cfg(target_os = "macos")]
        let _ = std::process::Command::new("pkill")
            .args(["-9", "-x", &name])
            .spawn();
    }
}
