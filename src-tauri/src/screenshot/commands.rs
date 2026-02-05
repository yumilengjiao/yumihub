use std::io::Cursor;

use screenshots::image::ImageFormat;

use crate::{error::AppError, screenshot::SCREENSHOT_DIR};

/// 获取屏幕截图
///
/// * `pool`: 数据库连接池
/// * `game_id`: 游戏id
pub async fn capture_game_screenshot(
    pool: &sqlx::SqlitePool,
    game_id: Option<String>,
) -> Result<String, AppError> {
    let screens = screenshots::Screen::all().map_err(|e| AppError::Generic(e.to_string()))?;
    let screen = screens
        .first()
        .ok_or(AppError::Generic("未找到屏幕".to_string()))?;
    let image = screen
        .capture()
        .map_err(|e| AppError::Generic(e.to_string()))?;

    let save_dir = SCREENSHOT_DIR.lock().unwrap().clone();
    let file_id = uuid::Uuid::new_v4().to_string();
    let file_path = save_dir.join(format!("{}.png", file_id));

    let mut buffer = Cursor::new(Vec::new());
    image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| AppError::Generic(format!("图片转换失败: {}", e)))?;

    let contents = buffer.into_inner();
    tokio::fs::write(&file_path, &contents)
        .await
        .map_err(|e| AppError::File(format!("写入磁盘失败: {}", e)))?;

    let path_str = file_path.to_string_lossy().to_string();
    sqlx::query("INSERT INTO game_screenshots (id, game_id, file_path) VALUES (?, ?, ?)")
        .bind(&file_id)
        .bind(game_id)
        .bind(&path_str)
        .execute(pool)
        .await
        .map_err(|e| AppError::File(e.to_string()))?;

    Ok(path_str)
}
