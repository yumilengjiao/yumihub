//! 备份相关命令

use std::path::PathBuf;

use sqlx::{Pool, Row, Sqlite};
use tauri::{async_runtime, State};
use tauri_plugin_log::log::error;

use crate::{
    backup::commands::backup_archive_by_game_id,
    config::GLOBAL_CONFIG,
    error::AppError,
    util::{extract_zip_sync, zip_directory_sync},
};

/// 备份所有已设置存档路径的游戏
#[tauri::command]
pub async fn backup_archive(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();

    for row in games {
        let save_path: Option<String> = row.get("save_data_path");
        let game_id: String = row.get("id");

        let Some(save_path_str) = save_path else {
            continue;
        };

        let save_path = PathBuf::from(save_path_str);
        let backup_dir = backup_root.clone();

        async_runtime::spawn_blocking(move || {
            let zip_file_path = backup_dir.join(format!("game_{}.zip", game_id));
            if let Err(e) = zip_directory_sync(&save_path, &zip_file_path) {
                error!("备份游戏 {} 失败: {}", game_id, e);
            }
        })
        .await
        .map_err(|e| AppError::File(e.to_string()))?;
    }

    Ok(())
}

/// 备份单个游戏存档
#[tauri::command]
pub async fn backup_archive_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<(), AppError> {
    backup_archive_by_game_id(pool.inner().clone(), id).await
}

/// 从备份恢复单个游戏存档
#[tauri::command]
pub async fn restore_archive_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<(), AppError> {
    let row = sqlx::query("SELECT save_data_path FROM games WHERE id = ?")
        .bind(&id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let save_path_str: Option<String> = row.get("save_data_path");
    let save_path = save_path_str
        .map(PathBuf::from)
        .ok_or_else(|| AppError::Resolve("none".into(), "该游戏未设置存档路径".into()))?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();
    let zip_file_path = backup_root.join(format!("game_{}.zip", id));

    if !zip_file_path.exists() {
        return Err(AppError::File(format!("未找到 ID 为 {} 的备份文件", id)));
    }

    async_runtime::spawn_blocking(move || {
        extract_zip_sync(&zip_file_path, &save_path).map_err(|e| AppError::File(e.to_string()))?;
        Ok(())
    })
    .await
    .map_err(|e| AppError::File(e.to_string()))??;

    Ok(())
}

/// 恢复所有有备份的游戏存档
#[tauri::command]
pub async fn restore_all_archives(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();

    for row in games {
        let id: String = row.get("id");
        let save_path_str: Option<String> = row.get("save_data_path");

        let Some(s_path) = save_path_str else {
            continue;
        };

        let save_path = PathBuf::from(s_path);
        let zip_file_path = backup_root.join(format!("game_{}.zip", id));

        if !zip_file_path.exists() {
            continue;
        }

        async_runtime::spawn_blocking(move || {
            if let Err(e) = extract_zip_sync(&zip_file_path, &save_path) {
                error!("全量恢复：备份游戏 {} 失败: {}", id, e);
            }
        })
        .await
        .map_err(|e| AppError::File(e.to_string()))?;
    }

    Ok(())
}
