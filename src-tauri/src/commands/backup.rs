use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{backup::commands as bc, error::AppError};

#[tauri::command]
pub async fn backup_archive(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    bc::backup_all(&pool).await
}

#[tauri::command]
pub async fn backup_archive_by_id(pool: State<'_, Pool<Sqlite>>, id: String) -> Result<(), AppError> {
    bc::backup_by_game_id(pool.inner().clone(), id).await
}

#[tauri::command]
pub async fn restore_archive_by_id(pool: State<'_, Pool<Sqlite>>, id: String) -> Result<(), AppError> {
    bc::restore_by_game_id(&pool, &id).await
}

#[tauri::command]
pub async fn restore_all_archives(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    bc::restore_all(&pool).await
}
