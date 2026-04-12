//! 存档备份与恢复逻辑

use std::path::PathBuf;

use sqlx::{Row, SqlitePool};
use tauri::async_runtime;
use tauri_plugin_log::log::error;

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    infra::archive::{extract_zip, zip_dir},
};

/// 备份单个游戏存档（通过游戏 ID）
pub async fn backup_by_game_id(pool: SqlitePool, game_id: String) -> Result<(), AppError> {
    let row = sqlx::query("SELECT save_data_path FROM games WHERE id = ?")
        .bind(&game_id)
        .fetch_one(&pool)
        .await
        .map_err(AppError::from)?;

    let save_path: Option<String> = row.get("save_data_path");
    let save_path = save_path.ok_or_else(|| {
        AppError::Resolve("none".into(), "该游戏未设置存档路径".into())
    })?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();
    let zip_dst = backup_root.join(format!("game_{}.zip", game_id));
    let src = PathBuf::from(save_path);

    async_runtime::spawn_blocking(move || zip_dir(&src, &zip_dst))
        .await
        .map_err(|e| AppError::Fs(e.to_string()))??;

    Ok(())
}

/// 备份所有已设置存档路径的游戏
pub async fn backup_all(pool: &SqlitePool) -> Result<(), AppError> {
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(pool)
        .await
        .map_err(AppError::from)?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();

    for row in games {
        let game_id: String = row.get("id");
        let save_path: Option<String> = row.get("save_data_path");

        let Some(sp) = save_path else {
            continue;
        };

        let src = PathBuf::from(sp);
        let zip_dst = backup_root.join(format!("game_{}.zip", game_id));
        let gid = game_id.clone();

        async_runtime::spawn_blocking(move || {
            if let Err(e) = zip_dir(&src, &zip_dst) {
                error!("备份游戏 {} 失败: {}", gid, e);
            }
        })
        .await
        .map_err(|e| AppError::Fs(e.to_string()))?;
    }

    Ok(())
}

/// 从备份恢复单个游戏存档
pub async fn restore_by_game_id(pool: &SqlitePool, game_id: &str) -> Result<(), AppError> {
    let row = sqlx::query("SELECT save_data_path FROM games WHERE id = ?")
        .bind(game_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::from)?;

    let save_path: Option<String> = row.get("save_data_path");
    let save_path = save_path
        .map(PathBuf::from)
        .ok_or_else(|| AppError::Resolve("none".into(), "该游戏未设置存档路径".into()))?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();
    let zip_src = backup_root.join(format!("game_{}.zip", game_id));

    if !zip_src.exists() {
        return Err(AppError::Fs(format!("未找到 ID 为 {} 的备份文件", game_id)));
    }

    async_runtime::spawn_blocking(move || extract_zip(&zip_src, &save_path).map(|_| ()))
        .await
        .map_err(|e| AppError::Fs(e.to_string()))??;

    Ok(())
}

/// 恢复所有有备份文件的游戏存档
pub async fn restore_all(pool: &SqlitePool) -> Result<(), AppError> {
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(pool)
        .await
        .map_err(AppError::from)?;

    let backup_root = GLOBAL_CONFIG.read().unwrap().storage.backup_save_path.clone();

    for row in games {
        let game_id: String = row.get("id");
        let save_path: Option<String> = row.get("save_data_path");
        let Some(sp) = save_path else { continue };

        let zip_src = backup_root.join(format!("game_{}.zip", game_id));
        if !zip_src.exists() {
            continue;
        }

        let dst = PathBuf::from(sp);
        let gid = game_id.clone();

        async_runtime::spawn_blocking(move || {
            if let Err(e) = extract_zip(&zip_src, &dst) {
                error!("恢复游戏 {} 失败: {}", gid, e);
            }
        })
        .await
        .map_err(|e| AppError::Fs(e.to_string()))?;
    }

    Ok(())
}
