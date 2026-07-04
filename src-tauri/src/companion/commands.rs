//! 连携程序启动与管理

use std::process::{Command, Stdio};

use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error};

use crate::{
        companion::{
                ACTIVE_PROCESSES, PROCESS_NAMES,
                entity::{ActiveProcess, Companion},
        },
        config::read_config,
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
                | Ok(c) => c,
                | Err(e) => {
                        error!("查询游戏连携程序失败: {}", e);
                        return Vec::new();
                },
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

        let enabled = read_config()?.system.companion;

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
        let companion_enabled = read_config()
                .map(|cfg| cfg.system.companion)
                .unwrap_or_else(|e| {
                        error!("读取连携配置失败: {}", e);
                        false
                });
        if !companion_enabled || !comp.is_enabled {
                return;
        }

        let is_managed = comp.is_window_managed;

        // 记录进程名，用于退出时强杀
        if let Some(name) = std::path::Path::new(&comp.path)
                .file_name()
                .and_then(|n| n.to_str())
        {
                match PROCESS_NAMES.lock() {
                        | Ok(mut names) => names.push(name.to_string()),
                        | Err(e) => error!("记录连携进程名失败: {}", e),
                }
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
                | Ok(child) => {
                        debug!("连携程序已启动: {} PID={}", comp.name, child.id());
                        match ACTIVE_PROCESSES.lock() {
                                | Ok(mut processes) => processes.push(ActiveProcess {
                                        child,
                                        is_window_managed: is_managed,
                                }),
                                | Err(e) => error!("记录连携进程失败: {}", e),
                        }
                },
                | Err(e) => error!("连携程序启动失败: {} — {}", comp.name, e),
        }
}

/// 停止所有活跃连携进程
pub fn kill_all_active() {
        // 通过句柄 kill
        match ACTIVE_PROCESSES.lock() {
                | Ok(mut processes) => {
                        for mut p in processes.drain(..) {
                                let _ = p.child.kill();
                        }
                },
                | Err(e) => error!("获取连携进程列表失败: {}", e),
        }
        // 通过进程名强杀（防止子进程残留）
        match PROCESS_NAMES.lock() {
                | Ok(mut names) => {
                        for name in names.drain(..) {
                                kill_by_name(&name);
                        }
                },
                | Err(e) => error!("获取连携进程名列表失败: {}", e),
        }
}

/// 返回所有"受窗口控制"的连携进程 PID（老板键用）
pub fn get_managed_pids() -> Vec<u32> {
        ACTIVE_PROCESSES
                .lock()
                .map(|processes| {
                        processes
                                .iter()
                                .filter(|p| p.is_window_managed)
                                .map(|p| p.child.id())
                                .collect()
                })
                .unwrap_or_else(|e| {
                        error!("获取受控连携进程失败: {}", e);
                        Vec::new()
                })
}
