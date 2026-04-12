//! 连携程序启动与管理

use std::process::{Command, Stdio};

use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error};

use crate::{
    companion::{
        entity::{ActiveProcess, Companion},
        ACTIVE_PROCESSES, PROCESS_NAMES,
    },
    config::GLOBAL_CONFIG,
    error::AppError,
    infra::process::kill_by_name,
};

// ── 查询 ──────────────────────────────────────────────────────────────────────

/// 从数据库获取所有随 App 启动（trigger_mode = 'app'）且已启用的连携程序
pub async fn fetch_app_companions(pool: &SqlitePool) -> Result<Vec<Companion>, AppError> {
    sqlx::query_as::<_, Companion>(
        "SELECT * FROM companions \
         WHERE is_enabled = 1 AND trigger_mode = 'app' \
         ORDER BY sort_order ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::from)
}

/// 启动所有随游戏启动（trigger_mode = 'game'）的连携程序，
/// 返回进程名列表，供游戏退出时关闭用
pub async fn launch_game_companions(pool: &SqlitePool) -> Vec<String> {
    let companions = match sqlx::query_as::<_, Companion>(
        "SELECT * FROM companions \
         WHERE is_enabled = 1 AND trigger_mode = 'game' \
         ORDER BY sort_order ASC",
    )
    .fetch_all(pool)
    .await
    {
        Ok(c) => c,
        Err(e) => {
            error!("查询游戏连携程序失败: {}", e);
            return Vec::new();
        }
    };

    let mut names = Vec::new();
    for comp in companions {
        if let Some(name) = std::path::Path::new(&comp.path)
            .file_name()
            .and_then(|n| n.to_str())
        {
            names.push(name.to_string());
        }
        launch_one(comp);
    }
    names
}

// ── 刷新（配置变更 / 初始化时调用） ──────────────────────────────────────────

/// 清空已有进程后，按照当前配置重新拉起 app 级连携程序
pub async fn refresh_companions<R: tauri::Runtime>(
    handle: &AppHandle<R>,
    is_initial_start: bool,
) -> Result<(), AppError> {
    kill_all_active();

    let enabled = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .system
        .companion;

    if !enabled {
        debug!("连携功能已关闭");
        return Ok(());
    }

    // 非初始启动时不重复拉起（设置变更只清理，不重启）
    if !is_initial_start {
        return Ok(());
    }

    let pool = handle.state::<SqlitePool>();
    let companions = fetch_app_companions(&pool).await?;

    for comp in companions {
        launch_one(comp);
        tokio::time::sleep(std::time::Duration::from_millis(300)).await;
    }

    Ok(())
}

// ── 进程管理 ──────────────────────────────────────────────────────────────────

/// 启动单个连携程序并记录句柄
pub fn launch_one(comp: Companion) {
    if !GLOBAL_CONFIG.read().unwrap().system.companion || !comp.is_enabled {
        return;
    }

    let is_managed = comp.is_window_managed;

    // 记录进程名，用于退出时强杀
    if let Some(name) = std::path::Path::new(&comp.path)
        .file_name()
        .and_then(|n| n.to_str())
    {
        PROCESS_NAMES.lock().unwrap().push(name.to_string());
    }

    let args: Vec<&str> = comp
        .args
        .as_deref()
        .unwrap_or("")
        .split_whitespace()
        .collect();

    match Command::new(&comp.path)
        .args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(child) => {
            debug!("连携程序已启动: {} PID={}", comp.name, child.id());
            ACTIVE_PROCESSES.lock().unwrap().push(ActiveProcess {
                child,
                is_window_managed: is_managed,
            });
        }
        Err(e) => error!("连携程序启动失败: {} — {}", comp.name, e),
    }
}

/// 停止所有活跃连携进程
pub fn kill_all_active() {
    // 通过句柄 kill
    for mut p in ACTIVE_PROCESSES.lock().unwrap().drain(..) {
        let _ = p.child.kill();
    }
    // 通过进程名强杀（防止子进程残留）
    for name in PROCESS_NAMES.lock().unwrap().drain(..) {
        kill_by_name(&name);
    }
}

/// 返回所有"受窗口控制"的连携进程 PID（老板键用）
pub fn get_managed_pids() -> Vec<u32> {
    ACTIVE_PROCESSES
        .lock()
        .unwrap()
        .iter()
        .filter(|p| p.is_window_managed)
        .map(|p| p.child.id())
        .collect()
}
