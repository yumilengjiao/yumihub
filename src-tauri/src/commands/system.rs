//! 系统工具类命令

use std::path::Path;

use custom_theme::schema::ir::ThemeIr;
use font_kit::source::SystemSource;
use sqlx::{Row, SqlitePool};
use sysinfo::Disks;
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_fs::FsExt;
use uuid::Uuid;

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    theme::ThemeState,
    util::{get_dir_size, get_start_up_program},
};

/// 从父目录推断游戏启动文件路径
#[tauri::command]
pub fn get_start_up_path(parent_path: String) -> Result<String, AppError> {
    get_start_up_program(parent_path)
}

/// 获取系统已安装字体列表
#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
    let mut fonts = SystemSource::new().all_families().unwrap_or_default();
    fonts.sort();
    // 过滤掉 Windows 垂直字体（以 @ 开头）
    fonts.into_iter().filter(|name| !name.starts_with('@')).collect()
}

/// 获取游戏目录占用大小（字节）
#[tauri::command]
pub fn get_game_size(dir: String) -> u64 {
    get_dir_size(Path::new(&dir))
}

/// 获取系统所有磁盘挂载点
#[tauri::command]
pub fn get_disks() -> Vec<String> {
    Disks::new_with_refreshed_list()
        .iter()
        .map(|disk| disk.mount_point().to_string_lossy().to_string())
        .collect()
}

/// 获取指定挂载点的磁盘使用率（百分比）
#[tauri::command]
pub fn get_disk_usage(path: String) -> Result<f64, AppError> {
    let disks = Disks::new_with_refreshed_list();
    let disk = disks
        .iter()
        .find(|d| d.mount_point().to_string_lossy() == path)
        .ok_or_else(|| AppError::Generic("找不到指定的磁盘挂载点".to_string()))?;

    let total = disk.total_space();
    let used = total - disk.available_space();
    Ok((used as f64 / total as f64) * 100.0)
}

/// 授权指定路径的文件访问权限，并持久化到数据库
#[tauri::command]
pub async fn authorize_path_access<R: Runtime>(
    app_handle: AppHandle<R>,
    pool: State<'_, SqlitePool>,
    path: String,
) -> Result<(), AppError> {
    app_handle
        .fs_scope()
        .allow_directory(&path, true)
        .map_err(|e| AppError::Auth(format!("Tauri 权限注入失败: {}", e)))?;

    app_handle
        .asset_protocol_scope()
        .allow_file(&path)
        .map_err(|e| AppError::Auth(format!("Tauri 权限注入失败: {}", e)))?;

    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT OR IGNORE INTO authorized_scopes (id, path) VALUES (?, ?)")
        .bind(&id)
        .bind(&path)
        .execute(pool.inner())
        .await
        .map_err(|e| AppError::DB(format!("数据库记录权限失败: {}", e)))?;

    Ok(())
}

/// 清空所有应用数据（数据库 + 资源文件）
#[tauri::command]
pub async fn clear_app_data(pool: State<'_, SqlitePool>) -> Result<(), AppError> {
    // 获取所有用户表名
    let rows = sqlx::query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query("PRAGMA foreign_keys = OFF;")
        .execute(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    for row in rows {
        let table_name: String = row.get("name");
        sqlx::query(&format!("DELETE FROM \"{}\"", table_name))
            .execute(&*pool)
            .await
            .map_err(|e| AppError::DB(e.to_string()))?;
    }

    // 重置自增序列
    sqlx::query("DELETE FROM sqlite_sequence").execute(&*pool).await.ok();

    sqlx::query("PRAGMA foreign_keys = ON;").execute(&*pool).await.ok();

    // VACUUM 回收物理空间
    sqlx::query("VACUUM;").execute(&*pool).await.ok();

    // 清空资源目录并重建
    let config = GLOBAL_CONFIG.read().unwrap();
    let target_dirs = vec![
        config.storage.meta_save_path.clone(),
        config.storage.backup_save_path.clone(),
        config.storage.screenshot_path.clone(),
    ];
    drop(config);

    for path in target_dirs {
        if path.exists() {
            let _ = std::fs::remove_dir_all(&path);
            let _ = std::fs::create_dir_all(&path);
        }
    }

    Ok(())
}

/// 获取当前激活主题
#[tauri::command]
pub fn get_theme(state: State<'_, ThemeState>) -> Result<ThemeIr, AppError> {
    state
        .active
        .lock()
        .map_err(|e| AppError::Mutex(e.to_string()))?
        .clone()
        .ok_or_else(|| AppError::Generic("当前没有已激活的主题".to_string()))
}

/// 获取所有可用主题名称列表
#[tauri::command]
pub fn get_all_theme_names(state: State<'_, ThemeState>) -> Result<Vec<String>, AppError> {
    state
        .all_names
        .lock()
        .map(|names| names.clone())
        .map_err(|e| AppError::Mutex(e.to_string()))
}
