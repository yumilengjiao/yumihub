use std::path::PathBuf;

use sqlx::{Row, SqlitePool};
use tauri::async_runtime;

use crate::{config::GLOBAL_CONFIG, error::AppError, util::zip_directory_sync};
use tauri_plugin_log::log::error;

/// 通过指定游戏id进行单个游戏的存档备份
///
/// * `pool`: 数据库连接池
/// * `id`: 游戏id
pub async fn backup_archive_by_game_id(pool: SqlitePool, id: String) -> Result<(), AppError> {
    let game = sqlx::query("SELECT save_data_path FROM games where id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 获取备份根目录
    let backup_root = {
        let config = GLOBAL_CONFIG.read().unwrap();
        config.storage.backup_save_path.clone()
    };

    let save_path: Option<String> = game.get("save_data_path");

    if save_path.is_none() {
        return Err(AppError::Resolve("none".into(), "没有设置存档路径".into()));
    }
    let save_path: PathBuf = save_path.unwrap().into();

    // 使用 spawn_blocking 将同步的压缩逻辑丢到后台线程池，不阻塞主异步流
    async_runtime::spawn_blocking(move || {
        let zip_file_path = backup_root.join(format!("game_{}.zip", id));
        if let Err(e) = zip_directory_sync(&save_path, &zip_file_path) {
            error!("备份游戏 {} 失败: {}", id, e);
        }
    })
    .await
    .map_err(|e| AppError::File(e.to_string()))?;

    Ok(())
}
