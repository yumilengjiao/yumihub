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
    infra::fs::{detect_game_exe, dir_size},
    theme::ThemeState,
};

/// 根据游戏父目录推断启动程序路径
#[tauri::command]
pub fn get_start_up_path(parent_path: String) -> Result<String, AppError> {
    detect_game_exe(&parent_path)
}

/// 获取系统已安装字体（过滤掉 @ 开头的垂直字体）
#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
    let mut fonts = SystemSource::new().all_families().unwrap_or_default();
    fonts.sort();
    fonts.into_iter().filter(|n| !n.starts_with('@')).collect()
}

/// 获取游戏目录占用大小（字节）
#[tauri::command]
pub fn get_game_size(dir: String) -> u64 {
    dir_size(Path::new(&dir))
}

/// 获取系统磁盘挂载点列表
#[tauri::command]
pub fn get_disks() -> Vec<String> {
    Disks::new_with_refreshed_list()
        .iter()
        .map(|d| d.mount_point().to_string_lossy().to_string())
        .collect()
}

/// 获取指定磁盘的使用率（0.0 ~ 100.0）
#[tauri::command]
pub fn get_disk_usage(path: String) -> Result<f64, AppError> {
    let disks = Disks::new_with_refreshed_list();
    let disk = disks
        .iter()
        .find(|d| d.mount_point().to_string_lossy() == path)
        .ok_or_else(|| AppError::Generic("找不到指定磁盘".into()))?;

    let total = disk.total_space();
    let used = total - disk.available_space();
    Ok((used as f64 / total as f64) * 100.0)
}

/// 授权路径的文件访问权限，并持久化到数据库
#[tauri::command]
pub async fn authorize_path_access<R: Runtime>(
    app_handle: AppHandle<R>,
    pool: State<'_, SqlitePool>,
    path: String,
) -> Result<(), AppError> {
    app_handle
        .fs_scope()
        .allow_directory(&path, true)
        .map_err(|e| AppError::Auth(format!("FS 权限注入失败: {}", e)))?;

    app_handle
        .asset_protocol_scope()
        .allow_file(&path)
        .map_err(|e| AppError::Auth(format!("Asset 权限注入失败: {}", e)))?;

    sqlx::query("INSERT OR IGNORE INTO authorized_scopes (id, path) VALUES (?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind(&path)
        .execute(pool.inner())
        .await
        .map_err(AppError::from)?;

    Ok(())
}

/// 清空所有应用数据（数据库全表 + 资源目录）
#[tauri::command]
pub async fn clear_app_data(pool: State<'_, SqlitePool>) -> Result<(), AppError> {
    // 获取所有用户表名
    let tables: Vec<String> = sqlx::query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)?
    .into_iter()
    .map(|r| r.get("name"))
    .collect();

    sqlx::query("PRAGMA foreign_keys = OFF")
        .execute(&*pool)
        .await
        .map_err(AppError::from)?;

    for table in tables {
        sqlx::query(&format!("DELETE FROM \"{}\"", table))
            .execute(&*pool)
            .await
            .map_err(AppError::from)?;
    }

    // 重置自增序列
    let _ = sqlx::query("DELETE FROM sqlite_sequence")
        .execute(&*pool)
        .await;

    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&*pool)
        .await
        .map_err(AppError::from)?;

    // 回收物理空间
    let _ = sqlx::query("VACUUM").execute(&*pool).await;

    // 清空资源目录并重建
    let cfg = GLOBAL_CONFIG.read().unwrap();
    let dirs = [
        cfg.storage.meta_save_path.clone(),
        cfg.storage.backup_save_path.clone(),
        cfg.storage.screenshot_path.clone(),
    ];
    drop(cfg);

    for dir in dirs {
        if dir.exists() {
            let _ = std::fs::remove_dir_all(&dir);
            let _ = std::fs::create_dir_all(&dir);
        }
    }

    Ok(())
}

/// 获取当前激活的主题 IR
#[tauri::command]
pub fn get_theme(state: State<'_, ThemeState>) -> Result<ThemeIr, AppError> {
    state
        .active
        .lock()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .clone()
        .ok_or_else(|| AppError::Generic("当前无激活主题".into()))
}

/// 获取所有可用主题名称
#[tauri::command]
pub fn get_all_theme_names(state: State<'_, ThemeState>) -> Result<Vec<String>, AppError> {
    state
        .all_names
        .lock()
        .map(|n| n.clone())
        .map_err(|e| AppError::Lock(e.to_string()))
}

/// 查询本次启动时默认主题是否被自动更新（用于前端提示用户重载）
#[tauri::command]
pub fn get_default_theme_updated(state: State<'_, ThemeState>) -> Result<bool, AppError> {
    state
        .default_theme_updated
        .lock()
        .map(|v| *v)
        .map_err(|e| AppError::Lock(e.to_string()))
}

/// 获取日志文件目录路径（仅在持久化日志开启时有意义）
#[tauri::command]
pub async fn get_log_dir(app: tauri::AppHandle) -> Result<String, crate::error::AppError> {
    let path = app
        .path()
        .app_log_dir()
        .map_err(|e| crate::error::AppError::Fs(e.to_string()))?;
    Ok(path.to_string_lossy().into_owned())
}
