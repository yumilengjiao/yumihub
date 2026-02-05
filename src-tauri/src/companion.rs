//! 此模块用于管理程序的连携程序，也就是游戏启动时会连带着一起启动的程序

use lazy_static::lazy_static;
use std::{
    path::Path,
    process::{Command, Stdio},
    sync::Mutex,
};
use tauri_plugin_log::log::debug;

use sqlx::SqlitePool;
use tauri::{AppHandle, Manager, Runtime};

use crate::companion::entity::{ActiveProcess, Companion};

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
        match fetch_enabled_app_companions(&handle).await {
            Ok(apps) => {
                for app in apps {
                    // SQL 已经排好序了，这里的循环会从 sort_order 最大的开始启动
                    launch_companion(app);

                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            }
            Err(e) => eprintln!("加载连携程序失败: {}", e),
        }
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

// --- 辅助函数 ---

/// 从数据库获取所有需要随 App 启动的程序
async fn fetch_enabled_app_companions<R: Runtime>(
    handle: &AppHandle<R>,
) -> Result<Vec<Companion>, sqlx::Error> {
    let pool = handle.state::<SqlitePool>();

    // DESC 保证了 sort_order 数值最大的排在结果集的第一个
    sqlx::query_as::<_, Companion>(
        "SELECT * FROM companions WHERE is_enabled = 1 AND trigger_mode = 'app' ORDER BY sort_order DESC"
    )
    .fetch_all(&*pool)
    .await
}

/// 启动单个程序并将其句柄存入全局列表
pub fn launch_companion(comp: Companion) {
    // 记录受控状态
    let is_managed = comp.is_window_managed;

    if let Some(file_name) = Path::new(&comp.path).file_name() {
        if let Some(name_str) = file_name.to_str() {
            PROCESS_NAMES.lock().unwrap().push(name_str.to_string());
        }
    }

    let args_str = comp.args.as_deref().unwrap_or("");
    let args: Vec<&str> = args_str.split_whitespace().collect();

    let result = Command::new(&comp.path)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn();

    match result {
        Ok(child) => {
            debug!("启动连携程序 PID: {}, 受控: {}", child.id(), is_managed);
            let mut processes = ACTIVE_PROCESSES.lock().unwrap();
            // 存入 child 句柄和受控标记
            processes.push(ActiveProcess {
                child,
                is_window_managed: is_managed,
            });
        }
        Err(e) => {
            eprintln!("无法启动程序 {}: {} (路径: {})", comp.name, e, comp.path);
        }
    }
}
