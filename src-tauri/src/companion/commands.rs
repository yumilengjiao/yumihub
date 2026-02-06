use sqlx::SqlitePool;
use std::{
    path::Path,
    process::{Command, Stdio},
};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_log::log::debug;

use crate::{
    companion::{
        entity::{ActiveProcess, Companion},
        ACTIVE_PROCESSES, PROCESS_NAMES,
    },
    config::GLOBAL_CONFIG,
    error::AppError,
};

/// 从数据库获取所有需要随 App 启动的程序
pub async fn fetch_enabled_app_companions<R: Runtime>(
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

/// 获取所有活跃的、且启用了“受窗口控制”的连携程序 PID
pub fn get_controlled_pids() -> Vec<u32> {
    let processes = ACTIVE_PROCESSES.lock().unwrap();
    processes
        .iter()
        .filter(|p| p.is_window_managed)
        .map(|p| p.child.id())
        .collect()
}

/// 获取所有连携程序的 PID (不管受不受控)
#[allow(dead_code)]
pub fn get_all_pids() -> Vec<u32> {
    let processes = ACTIVE_PROCESSES.lock().unwrap();
    processes.iter().map(|p| p.child.id()).collect()
}

/// 动态刷新连携程序状态
pub async fn refresh_companions<R: Runtime>(
    handle: &AppHandle<R>,
    is_initial_start: bool,
) -> Result<(), AppError> {
    // 无论如何先清理，防止状态冲突
    clear_all_active_processes();

    let is_enabled = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Mutex(e.to_string()))?
        .system
        .companion;

    if !is_enabled {
        debug!("连携功能已关闭，清理完毕后直接退出");
        return Ok(());
    }

    if !is_initial_start {
        debug!("总开关已开启，但非初始启动，不重复拉起程序");
        return Ok(());
    }

    // 注意：如果是 App 启动触发的刷新，我们只拉起 trigger_mode = 'app' 的程序
    // 游戏连携的程序，由你专门的“游戏启动监听函数”去调用
    match fetch_enabled_app_companions(handle).await {
        Ok(apps) => {
            for app in apps {
                launch_companion(app);
                tokio::time::sleep(std::time::Duration::from_millis(300)).await;
            }
            Ok(())
        }
        Err(e) => Err(AppError::DB(e.to_string())),
    }
}

/// 清除所有活动的连携进程
fn clear_all_active_processes() {
    // 杀掉所有句柄
    let mut processes = ACTIVE_PROCESSES.lock().unwrap();
    for mut p in processes.drain(..) {
        let _ = p.child.kill();
    }

    // 强制清理进程名
    let mut names = PROCESS_NAMES.lock().unwrap();
    for name in names.drain(..) {
        #[cfg(target_os = "windows")]
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/IM", &name, "/T"])
            .spawn();
    }
}

/// 启动单个程序并将其句柄存入全局列表
pub fn launch_companion(comp: Companion) {
    let global_enabled = GLOBAL_CONFIG.read().unwrap().system.companion;
    if !global_enabled {
        debug!("总开关已关闭，拒绝启动连携程序: {}", comp.name);
        return;
    }

    // 检查程序个体开关
    if !comp.is_enabled {
        debug!("程序 {} 自身未启用，跳过启动", comp.name);
        return;
    } // 记录受控状态
    let is_managed = comp.is_window_managed;

    if let Some(file_name) = Path::new(&comp.path).file_name() {
        if let Some(name_str) = file_name.to_str() {
            PROCESS_NAMES.lock().unwrap().push(name_str.to_string());
        }
    }

    let args_str = comp.args.as_deref().unwrap_or("");
    let args: Vec<&str> = args_str.split_whitespace().collect();

    // 启动程序
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
