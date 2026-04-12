//! 系统监控模块
//!
//! - 每 2 秒向前端推送 CPU / 内存使用率
//! - 启动时从数据库恢复所有已授权的路径权限

use std::{path::Path, time::Duration};

use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use sysinfo::System;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::log::{debug, error};

pub fn init(handle: &AppHandle) {
    start_monitor(handle);
    restore_permissions(handle);
}

// ── 硬件监控 ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    pub cpu_usage: f64,
    pub memory_usage: f64,
}

fn start_monitor(handle: &AppHandle) {
    let handle = handle.clone();
    std::thread::spawn(move || {
        let mut sys = System::new_all();
        loop {
            sys.refresh_cpu_usage();
            sys.refresh_memory();

            let stats = SystemStats {
                cpu_usage: sys.global_cpu_usage() as f64,
                memory_usage: (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0,
            };

            let _ = handle.emit("sys-monitor", stats);
            std::thread::sleep(Duration::from_secs(2));
        }
    });
}

// ── 权限恢复 ──────────────────────────────────────────────────────────────────

#[derive(FromRow, Debug)]
struct AuthScope {
    path: String,
}

fn restore_permissions(handle: &AppHandle) {
    let handle = handle.clone();

    let Some(pool) = handle.try_state::<SqlitePool>() else {
        error!("未能获取 SqlitePool，跳过权限恢复");
        return;
    };

    let pool = pool.inner().clone();

    tauri::async_runtime::spawn(async move {
        let scopes = match sqlx::query_as::<_, AuthScope>(
            "SELECT path FROM authorized_scopes",
        )
        .fetch_all(&pool)
        .await
        {
            Ok(s) => s,
            Err(e) => {
                error!("读取授权列表失败: {}", e);
                return;
            }
        };

        let fs_scope = handle.fs_scope();
        let asset_scope = handle.asset_protocol_scope();

        for scope in scopes {
            let path = Path::new(&scope.path);
            let dir = path.parent().unwrap_or(path);
            debug!("恢复路径权限: {:?}", dir);

            if let Err(e) = fs_scope.allow_directory(dir, true) {
                error!("FS 权限恢复失败 {:?}: {}", dir, e);
            }
            if let Err(e) = asset_scope.allow_directory(dir, true) {
                error!("Asset 权限恢复失败 {:?}: {}", dir, e);
            }
        }
    });
}
