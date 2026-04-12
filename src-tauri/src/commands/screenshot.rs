use sqlx::SqlitePool;
use tauri::State;

use crate::{error::AppError, screenshot::{commands as sc, entity::Screenshot}};

#[tauri::command]
pub async fn get_screenshots_by_year_month(
    pool: State<'_, SqlitePool>,
    year: i32,
    month: u8,
) -> Result<Vec<Screenshot>, AppError> {
    sqlx::query_as(
        "SELECT * FROM game_screenshots \
         WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ? \
         ORDER BY created_at DESC",
    )
    .bind(year.to_string())
    .bind(format!("{:02}", month))
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)
}

#[tauri::command]
pub async fn update_screenshot_by_id(
    pool: State<'_, SqlitePool>,
    screenshot_id: String,
    thoughts: Option<String>,
) -> Result<(), AppError> {
    let affected = sqlx::query("UPDATE game_screenshots SET thoughts = ? WHERE id = ?")
        .bind(thoughts)
        .bind(&screenshot_id)
        .execute(&*pool)
        .await
        .map_err(AppError::from)?
        .rows_affected();

    if affected == 0 {
        return Err(AppError::Generic(format!("截图 {} 不存在", screenshot_id)));
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_screenshot_by_id(
    pool: State<'_, SqlitePool>,
    screenshot_id: String,
) -> Result<(), AppError> {
    sc::delete(&pool, &screenshot_id).await
}
