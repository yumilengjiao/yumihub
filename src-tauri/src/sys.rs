//! sys模块,用于监视cpu，内存等使用情况

use std::path::{Path};
use std::time::Duration;

use sqlx::SqlitePool;
use sysinfo::System;
use tauri::Manager;
use tauri::{AppHandle, Emitter};
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::log::{debug, error};

use crate::sys::entity::{AuthScope, SystemStats};

mod entity;

/// sys模块初始化函数
///
/// * `app_handle`: app句柄
pub fn init(app_handle: &AppHandle) {
    let handle = app_handle.clone();
    // 启动内存，cpu监视
    start_hardware_monitor(&handle);
    add_file_permissions(&handle);
}

/// 监视cpu和内存的使用情况
///
/// * `handle`: app句柄
fn start_hardware_monitor(handle: &AppHandle) {
    let handle = handle.clone();
    std::thread::spawn(move || {
        let mut sys = System::new_all();
        loop {
            // 刷新系统信息
            sys.refresh_cpu_usage();
            sys.refresh_memory();

            // 计算数据
            let cpu_usage = sys.global_cpu_usage() as f64;
            let used_mem = sys.used_memory() as f64;
            let total_mem = sys.total_memory() as f64;
            let memory_usage = (used_mem / total_mem) * 100.0;

            // 推送事件到所有窗口
            // 事件名称为 "sys-monitor"，载荷为 SystemStats 结构体
            let _ = handle.emit(
                "sys-monitor",
                SystemStats {
                    cpu_usage,
                    memory_usage,
                },
            );

            // 设置轮询间隔（例如 2 秒）
            std::thread::sleep(Duration::from_secs(2));
        }
    });
}

/// 将数据库中存储的路径全部授权
///
/// * `handle`: app句柄
fn add_file_permissions(handle: &AppHandle) {
    let handle = handle.clone();

    // 从 Tauri State 获取数据库连接池
    if let Some(pool) = handle.try_state::<SqlitePool>() {
        let pool_inner = pool.inner().clone();

        // 异步执行路径授权
        tauri::async_runtime::spawn(async move {
            // 使用 query_as 直接映射到 AuthScope 结构体
            let rows = sqlx::query_as::<_, AuthScope>(
                "SELECT id, path, authorized_at FROM authorized_scopes",
            )
            .fetch_all(&pool_inner)
            .await;

            match rows {
                Ok(scopes) => {
                    let scope_manager = handle.fs_scope();
                    let asset_scope = handle.asset_protocol_scope();
                    for auth in scopes {
                        debug!("要授予的路径是: {}", auth.path);
                        let path_to_auth = auth.path;
                        let path = Path::new(&path_to_auth);
                        if let Some(parent_dir) = path.parent() {
                            if let Err(e) = scope_manager.allow_directory(parent_dir, true) {
                                error!("无法授权路径 [{}]: {}", path_to_auth, e);
                            }
                            if let Err(e) = asset_scope.allow_directory(parent_dir, true) {
                                error!("无法授权路径 [{}]: {}", path_to_auth, e);
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("从数据库读取授权列表失败: {}", e);
                }
            }
        });
    } else {
        error!("警告: 未能从 State 获取 SqlitePool，跳过自动授权。");
    }
}
