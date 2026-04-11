//! 截图相关命令

use sqlx::SqlitePool;
use tauri::State;

use crate::{
    error::AppError,
    screenshot::{commands::delete_game_screenshot, entity::Screenshot},
};

/// 根据年月份查询截图数据
#[tauri::command]
pub async fn get_screenshots_by_year_month(
    pool: State<'_, SqlitePool>,
    year: i32,
    month: u8,
) -> Result<Vec<Screenshot>, AppError> {
    let month_str = format!("{:02}", month);
    let year_str = year.to_string();

    let rows = sqlx::query_as::<_, Screenshot>(
        r#"SELECT *
           FROM game_screenshots
           WHERE strftime('%Y', created_at) = ?
             AND strftime('%m', created_at) = ?
           ORDER BY created_at DESC"#,
    )
    .bind(year_str)
    .bind(month_str)
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(rows)
}

/// 修改截图感想
#[tauri::command]
pub async fn update_screenshot_by_id(
    pool: State<'_, SqlitePool>,
    screenshot_id: String,
    thoughts: Option<String>,
) -> Result<(), AppError> {
    let result = sqlx::query(
        "UPDATE game_screenshots SET thoughts = ? WHERE id = ?",
    )
    .bind(thoughts)
    .bind(screenshot_id)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AppError::Generic("screenshot not found".into()));
    }

    Ok(())
}

/// 根据 id 删除截图及物理文件
#[tauri::command]
pub async fn delete_screenshot_by_id(
    pool: State<'_, SqlitePool>,
    screenshot_id: String,
) -> Result<(), AppError> {
    delete_game_screenshot(&pool, &screenshot_id).await
}
