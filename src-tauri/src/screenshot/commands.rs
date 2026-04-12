//! 截图业务逻辑

use std::io::Cursor;

use screenshots::image::ImageFormat;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::{config::GLOBAL_CONFIG, error::AppError};

/// 截取主屏幕并存入数据库，返回本地文件路径
pub async fn capture(pool: &SqlitePool, game_id: Option<String>) -> Result<String, AppError> {
    let screens = screenshots::Screen::all().map_err(|e| AppError::Generic(e.to_string()))?;
    let screen = screens
        .first()
        .ok_or_else(|| AppError::Generic("未找到可用屏幕".into()))?;

    let image = screen
        .capture()
        .map_err(|e| AppError::Generic(e.to_string()))?;

    let save_dir = GLOBAL_CONFIG.read().unwrap().storage.screenshot_path.clone();
    let id = Uuid::new_v4().to_string();
    let file_path = save_dir.join(format!("{}.png", id));

    let mut buf = Cursor::new(Vec::new());
    image
        .write_to(&mut buf, ImageFormat::Png)
        .map_err(|e| AppError::Generic(format!("图片编码失败: {}", e)))?;

    tokio::fs::write(&file_path, buf.into_inner()).await?;

    let path_str = file_path.to_string_lossy().to_string();

    sqlx::query("INSERT INTO game_screenshots (id, game_id, file_path) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(game_id)
        .bind(&path_str)
        .execute(pool)
        .await
        .map_err(AppError::from)?;

    Ok(path_str)
}

/// 删除截图记录及其物理文件
pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
    let (file_path,): (String,) =
        sqlx::query_as("SELECT file_path FROM game_screenshots WHERE id = ?")
            .bind(id)
            .fetch_one(pool)
            .await
            .map_err(|_| AppError::Generic(format!("截图 {} 不存在", id)))?;

    sqlx::query("DELETE FROM game_screenshots WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(AppError::from)?;

    let path = std::path::Path::new(&file_path);
    if path.exists() {
        tokio::fs::remove_file(path).await?;
    }

    Ok(())
}
